const express = require('express');
const router = express.Router();
const jwt = require('../jwt');

const ExamController = require('../controllers/ExamController');

router.post('/details', jwt.verify, ExamController.details);
router.patch('/submit', jwt.verify, ExamController.stdSubmit);
router.post('/create', jwt.verify, ExamController.create);
router.delete('/delete', jwt.verify, ExamController.delete);

module.exports = router;