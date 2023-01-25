const express = require('express');
const router = express.Router();
const jwt = require('../jwt');

const PostController = require('../controllers/PostController');

router.post('/get', jwt.verify, PostController.get);
router.post('/publish', jwt.verify, PostController.publish);
router.delete('/delete', jwt.verify, PostController.deletePost);
router.patch('/poll/vote', jwt.verify, PostController.pollVote);

router.patch('/comment', jwt.verify, PostController.comment);
router.delete('/comment/delete', jwt.verify, PostController.deleteComment);

module.exports = router;