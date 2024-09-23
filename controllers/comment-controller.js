const {prisma} = require('../prisma/prisma-client');

const CommentController = {
    createComment: async (req, res) => {
        try {
            const {postId, content} = req.body;
            const userId = req.user.userId;

            if (!postId || !content) {
                return res.status(400).json({error: 'Все поля обязательны'});
            }
            const comment = await prisma.comment.create({
                data: {
                    postId,
                    userId,
                    content
                }
            })
            res.json(comment)
        } catch (err) {
            console.error('Creating comment error', err);
            res.status(500).json({error: 'Internal Server Error'});
        }
    },
    deleteComment: async (req, res) => {
        const {id} = req.params;
        const userId = req.user.userId;

        try {
            const comment = await prisma.comment.findUnique({where: {id}})
            if (!comment) {
                return res.status(400).json({error: 'Комментарий не найден'});
            }
            if (comment.userId !== userId) {
                return res.status(400).json({error: 'Нет доступа'});
            }
            await prisma.comment.delete({where: {id}})
            res.json(comment)
        } catch (err) {
            console.error('Delete comment error', err);
            res.status(500).json({error: 'Internal Server Error'});
        }
    }
}
module.exports = CommentController;