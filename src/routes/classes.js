const express = require('express');
const router = express.Router();
const jwt = require('../jwt');

const ClassController = require('../controllers/ClassController');

router.get('/get/all', jwt.verify, ClassController.getAll);
router.get('/get/:class_code', jwt.verify, ClassController.get);
router.post('/create', jwt.verify, ClassController.create);
router.patch('/edit/details', jwt.verify, ClassController.editDetails);
router.patch('/edit/roles', jwt.verify, ClassController.editRoles);
router.patch('/join', jwt.verify, ClassController.join);
router.patch('/leave', jwt.verify, ClassController.leave);
router.patch('/nickname', jwt.verify, ClassController.nickname);

router.use('/post', require('./post'));
router.use('/assignment', require('./assignment'));

module.exports = router;