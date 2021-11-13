const express = require('express');
const router = express.Router();
const jwt = require('../jwt');

const ExamController = require('../controllers/ExamController');

router.post('/get', jwt.verify, ExamController.get);
router.post('/get/all', jwt.verify, ExamController.getAll);
router.patch('/submit', jwt.verify, ExamController.stdSubmit);
router.patch('/score/subjective', jwt.verify, ExamController.scoreSubjective) //อาจารย์ส่งคะแนนพาร์ท subjective
router.patch('/result/teacher', jwt.verify, ExamController.getResultForTeacher); //คิดคะแนน objective ทุกครั้ง
router.post('/create', jwt.verify, ExamController.create);
router.patch('/edit', jwt.verify, ExamController.edit);
router.delete('/delete', jwt.verify, ExamController.delete);
router.delete('/delete/result', jwt.verify, ExamController.deleteResult);


module.exports = router;