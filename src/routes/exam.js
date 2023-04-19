const express = require('express');
const router = express.Router();
const jwt = require('../jwt');
const schedule = require('node-schedule');

const pubsub = require('../graphql/pubsub');

const ExamController = require('../controllers/ExamController');

const temp_schedule_exam_id = [];

router.get('/test', jwt.verify, async (req,res) => {
    const date = new Date('2023-04-05T19:43:00+00:00'); // get date from end of examination
    const id = 1
    if (!temp_schedule_exam_id.includes(id)) {
        const job = schedule.scheduleJob(date, (y) => {
            console.log('SCHEDULE JOB DONE');
            temp_schedule_exam_id.splice(temp_schedule_exam_id.indexOf(id), 1)
            pubsub.publish('EXAMINATION_TIMEOUT', {
                onExaminationTimeout: {
                    exam_id: '1',
                    status: 'TIMEOUT'
                },
            });
        })
        temp_schedule_exam_id.push(1)
    }
    res.status(200).json({data: `DATE ${date}`});
})
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