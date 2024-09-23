const express = require('express');
const router = express.Router();
const multer = require("multer");
const {UserController, PostController, CommentController, LikeController, FollowController} = require("../controllers");
const authenticateToken = require("../middleware/auth");

const uploadDestination = 'uploads'
//Показываем, где хранить файлы
const storage = multer.diskStorage({
    destination: uploadDestination,
    filename: (req, file, callback) => {
        callback(null, file.originalname);
    }
});
//Создаем хранилище, в которое передаем конфигурацию
const uploads = multer({ storage: storage });

//Роутеры пользователя
router.post('/register', UserController.register)
router.post('/login', UserController.login)
router.get('/current', authenticateToken, UserController.currentUser)
router.get('/users/:id', authenticateToken, UserController.getUserByID)
router.put('/users/:id', authenticateToken, uploads.single('avatar'), UserController.updateUser)

//Роутеры постов
router.post('/posts', authenticateToken, PostController.createPost)
router.get('/posts', authenticateToken, PostController.getAllPosts)
router.get('/posts/:id', authenticateToken, PostController.getPostById)
router.delete('/posts/:id', authenticateToken, PostController.deletePost)

//Роутеры комментариев
router.post('/comments', authenticateToken, CommentController.createComment)
router.delete('/comments/:id', authenticateToken, CommentController.deleteComment)

//Роутеры лайков
router.post('/likes', authenticateToken, LikeController.likePost)
router.delete('/likes/:id', authenticateToken, LikeController.unlikePost)

//Роутеры подписчиков
router.post('/follow', authenticateToken, FollowController.followUser)
router.delete('/unfollow/:id', authenticateToken, FollowController.unfollowUser)

module.exports = router;