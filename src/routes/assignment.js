const express = require('express');
const router = express.Router();
const jwt = require('../jwt');

const AssignmentController = require('../controllers/AssignmentController');

router.post('/get', jwt.verify, AssignmentController.get);
router.post('/get/all', jwt.verify, AssignmentController.getAll);
router.get('/get/all/notification', jwt.verify, AssignmentController.getAllFromNotification);

router.post('/create', jwt.verify, AssignmentController.create);
router.patch('/submit', jwt.verify, AssignmentController.stdSubmit);
router.patch('/score/submit', jwt.verify, AssignmentController.scoreSubmit);
router.delete('/delete', jwt.verify, AssignmentController.delete);

router.patch('/comment', jwt.verify, AssignmentController.comment);
router.delete('/comment/delete', jwt.verify, AssignmentController.deleteComment);

module.exports = router;