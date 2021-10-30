const express = require('express');
const router = express.Router();
const jwt = require('../jwt');

const ExamController = require('../controllers/ExamController');

router.post('/details', jwt.verify, ExamController.details);
router.post('/create', jwt.verify, ExamController.create);

module.exports = router;