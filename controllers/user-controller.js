const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require('fs');
const {prisma} = require("../prisma/prisma-client");
const Jdenticon = require('jdenticon');
const jwt = require("jsonwebtoken");

const UserController = {
    register: async (req, res) => {
        const {email, password, name} = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({error: 'Все поля обязательны!'});
        }
        try {
            //проверяем есть ли пользователь
            const existingUser = await prisma.user.findUnique({where: {email: email}});
            if (existingUser) {
                return res.status(200).json({error: 'Пользователь уже существует'});
            }

            //хешируем пароль
            const hashedPassword = await bcrypt.hash(password, 10)

            //генерируем рандомную аватарку
            const png = Jdenticon.toPng(name, 200);
            const avatarName = `${name}_${Date.now()}.png`;
            const avatarPath = path.join(__dirname, '/../uploads', avatarName);
            fs.writeFileSync(avatarPath, png);

            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    avatarUrl: `/uploads/${avatarName}`,
                }
            })
            res.json(user)
        } catch (error) {
            console.error("Error in registering user", error);
            res.status(500).json({error: 'Internal Server Error'});
        }
    },
    login: async (req, res) => {
        const {email, password} = req.body;
        if (!email || !password) {
            return req.status(400).json({error: 'Все поля обязательны!'})
        }
        try {
            const user = await prisma.user.findUnique({where: {email}});
            if (!user) {
                return res.status(400).json({error: 'Неверный логин или пароль'})
            }

            const valid = await bcrypt.compare(password, user.password)
            if (!valid) {
                return res.status(400).json({error: 'Неверный логин или пароль'})
            }

            //генерируем jwt токен - шифруем id пользователя
            const token = jwt.sign(({userId: user.id}), process.env.JWT_SECRET)
            res.json({token})
        } catch (err) {
            console.error('Login error', err);
            res.status(500).json({error: 'Internal Server Error'});
        }
    },
    getUserByID: async (req, res) => {
        const {id} = req.params;
        const userId = req.user.id;

        try {
            const user = await prisma.user.findUnique({
                where: {id},
                include: {
                    followers: true,
                    following: true
                }
            });
            if (!user) {
                return res.status(404).json({error: 'Пользователь не найден'})
            }
            const isFollowing = await prisma.follows.findFirst({
                where: {
                    AND: [
                        {followerId: userId},
                        {followingId: id}
                    ]
                }
            });
            res.json({...user, isFollowing: Boolean(isFollowing)});
        } catch (err) {
            console.error('Get current error', err);
            res.status(500).json({error: 'Internal Server Error'});
        }
    },
    updateUser: async (req, res) => {
        const {id} = req.params;
        const {email, name, dateOfBirth, bio, location} = req.body;

        let filePath;

        if (req.file && req.file.path) { //изменение картинки пользователем
            filePath = req.file.path;
        }
        if (id !== req.user.userId) {
            return res.status(403).json({error: 'Нет доступа'})
        }

        try {
            if(email) {
                const existingUser = await prisma.user.findFirst({where: {email}});
                if (existingUser && existingUser.id !== id) {
                    return res.status(400).json({error: 'Почта уже используется'})
                }
            }
            const user = await prisma.user.update({
                where: {id},
                data: {
                    email: email || undefined,
                    name: name || undefined,
                    avatarUrl: filePath ? `/${filePath}` : undefined,
                    dateOfBirth: dateOfBirth || undefined,
                    bio: bio || undefined,
                    location: location || undefined
                }
            });
            res.json(user)
        } catch (error) {
            console.error('Update user error', error);
            res.status(500).json({error: 'Internal Server Error'});
        }
    },
    currentUser: async (req, res) => {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    id: req.user.userId
                },
                include: {
                    followers: {
                        include: {
                            follower: true
                        }
                    },
                    following: {
                        include: {
                            following: true
                        }
                    }
                }
            });
            if (!user) {
                return res.status(400).json({error: 'Не удалось найти пользователя'})
            }
            res.json(user)
        } catch (err) {
            console.error('Get current error', err);
            res.status(500).json({error: 'Internal Server Error'});
        }
    },
}

module.exports = UserController