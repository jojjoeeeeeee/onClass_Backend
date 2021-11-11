const express = require('express');
const router = express.Router();
const jwt = require('../jwt');

const AssignmentController = require('../controllers/AssignmentController');

router.post('/get', jwt.verify, AssignmentController.get);
router.post('/create', jwt.verify, AssignmentController.create);

module.exports = router;