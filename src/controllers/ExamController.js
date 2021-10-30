const Users = require('../models/user_schema');
const Classes = require('../models/class_schema');
const Exams = require('../models/exam/examination_schema.js');
const moment = require('moment');

exports.details = async (req,res) => {

    const user_id = req.userId;
    const classcode = req.body.class_code;
    const exam_id = req.body.examId;

    if (!classcode||!exam_id) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const class_data = await Classes.findOne({ class_code: classcode });
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'You not in this class'});

        if (!class_data.class_exam_id.includes(exam_id)) return res.status(404).json({result: 'Not found', message: ''});

        const exam_data = await Exams.findById(exam_id);
        if (!exam_data) return res.status(404).json({result: 'Not found', message: ''});

        if(class_data.student_id.includes(user_id)) {
            //Validate time
            const now = moment()
            const start = moment(exam_data.exam_start_date);
            const end = moment(exam_data.exam_end_date);
            if (now.isBefore(start) || now.isAfter(end)) return res.status(403).json({result: 'Forbiden', message: 'Its not the time when you can take the exam.'})

            const res_part = []
            exam_data.part_list.map((key) => {
                const item = []
                key.item.map((value) => {
                    const q_details = {
                        question: value.question,
                        type: value.type,
                        image: value.image,
                        choice: value.choice
                    }
                    item.push(q_details)
                })
                const details = {
                    part_id: key.part_id,
                    type: key.type,
                    part_name: key.part_name,
                    part_description: key.part_description,
                    start_date: key.start_date,
                    end_date: key.end_date,
                    score: key.score,
                    item: item
                }
                res_part.push(details)
            });
            exam_data.part_list = res_part;

            res.status(200).json({result: 'OK', message: '', data: exam_data});
        }
        else {
            res.status(200).json({result: 'OK', message: '', data: exam_data});
        }
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
    
};

exports.create = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;

    //exam validation
    const exam = req.body.exam;
    if (!classcode||!exam) return res.status(400).json({result: 'Bad request', message: ''});
    if (!exam.exam_name||!exam.part_list||!exam.exam_start_date||!exam.exam_end_date) return res.status(400).json({result: 'Bad request', message: ''})
    //part_list should have validation
    
    try {
        const class_data = await Classes.findOne({ class_code: classcode });
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});
        const data = await Exams.create(exam);
        class_data.class_exam_id.push(data._id);
        const new_class_data = await Classes.findOneAndUpdate({ class_code: classcode }, class_data);        

        res.status(200).json({result: 'OK', message: 'success created exam'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};