const express = require('express');
const router = express.Router();
const jwt = require('../jwt');

const ClassController = require('../controllers/ClassController');

router.get('/get', jwt.verify, ClassController.get);
router.post('/create', jwt.verify, ClassController.create);
router.patch('/join', jwt.verify, ClassController.join);
router.patch('/leave', jwt.verify, ClassController.leave);
router.patch('/nickname', jwt.verify, ClassController.nickname);

module.exports = router;