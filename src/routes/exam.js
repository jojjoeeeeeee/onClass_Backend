const express = require('express');
const router = express.Router();
const jwt = require('../jwt');

const ExamController = require('../controllers/ExamController');

router.post('/details', jwt.verify, ExamController.details);
router.patch('/submit', jwt.verify, ExamController.stdSubmit);
router.patch('/result/teacher', jwt.verify, ExamController.getResultForTeacher); //คิดคะแนน objective ทุกครั้ง, subjectiveต้องมี route เซฟคะแนนแยก
router.post('/create', jwt.verify, ExamController.create);
router.delete('/delete', jwt.verify, ExamController.delete);

module.exports = router;