const express = require('express');
const router = express.Router();
const jwt = require('../jwt');

const ExamController = require('../controllers/ExamController');

router.post('/details', jwt.verify, ExamController.details);
router.patch('/submit', jwt.verify, ExamController.stdSubmit);
router.patch('/score/subjective', jwt.verify, ExamController.scoreSubjective)
router.patch('/result/teacher', jwt.verify, ExamController.getResultForTeacher); //คิดคะแนน objective ทุกครั้ง, subjectiveต้องมี route เซฟคะแนนแยก
router.post('/create', jwt.verify, ExamController.create);
router.patch('/edit', jwt.verify, ExamController.edit);
router.delete('/delete', jwt.verify, ExamController.delete);
router.delete('/delete/result', jwt.verify, ExamController.deleteResult);


module.exports = router;