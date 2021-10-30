const Users = require('../models/user_schema');
const Classes = require('../models/class_schema');
const Exams = require('../models/exam/examination_schema');
const ExamResults = require('../models/exam/exam_result_schema');

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
            if (now.isBefore(start) || now.isAfter(end)) return res.status(403).json({result: 'Forbiden', message: 'Its not the time when you can take the exam'});

           //Already submit validate
            const examResultData = await ExamResults.findOne({ exam_id : exam_id});
            var already = false
            examResultData.student_result.map((examKey) => {
                if (examKey.student_id == user_id) return already = true
            });
            if (already) return res.status(403).json({result: 'Forbiden', message: 'You already submit this exam'});


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

exports.stdSubmit = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const exam_id = req.body.examId;
    const submitResult = req.body.data;

    //submit result validation
    if (!classcode||!exam_id||!submitResult||submitResult.length == 0) return res.status(400).json({result: 'Bad request', message: ''});

    var resultNotValid = false
    submitResult.map((key) => {
        if (!key.part_id||!key.part_type||!key.answer||key.answer.length == 0) return resultNotValid = true
    });

    if (resultNotValid) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const class_data = await Classes.findOne({ class_code: classcode });
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});
        
        if (!class_data.class_exam_id.includes(exam_id)) return res.status(404).json({result: 'Not found', message: ''});

        const exam_data = await Exams.findById(exam_id);
        if (!exam_data) return res.status(404).json({result: 'Not found', message: ''});

        //Validate time
        const now = moment()
        const start = moment(exam_data.exam_start_date);
        const end = moment(exam_data.exam_end_date);
        if (now.isBefore(start) || now.isAfter(end)) return res.status(403).json({result: 'Forbiden', message: 'Its not the time when you can take the exam'});
        
        //Already submit validate
        const examResultData = await ExamResults.findOne({ exam_id : exam_id});
        var already = false
        examResultData.student_result.map((examKey) => {
            submitResult.map((resultKey) => {
                if (examKey.student_id == user_id && examKey.part_id == resultKey.part_id) return already = true
            });
        });
        if (already) return res.status(403).json({result: 'Forbiden', message: 'You already submit this exam'});

        //Create result schema
        submitResult.map( async (key,index) => {
            const stdResultData = await ExamResults.findOne({ exam_id : exam_id});
            const resultSchema = {
                student_id: user_id,
                part_id: key.part_id,
                part_type: key.part_type,
                answer: key.answer
            }
            stdResultData.student_result.push(resultSchema);
            const stdResultSaveData = await ExamResults.findOneAndUpdate({ exam_id: exam_id}, stdResultData);
        });
        res.status(200).json({result: 'OK', message: 'success sumbit exam result'});

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
    //part_list should have validation || this method just create empty teacher edit add choice then edit the model later
    
    try {
        const class_data = await Classes.findOne({ class_code: classcode });
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});
        const data = await Exams.create(exam);
        const examId = data._id
        class_data.class_exam_id.push(examId);
        const new_class_data = await Classes.findOneAndUpdate({ class_code: classcode }, class_data);        
        
        const resultSchema = {
            exam_id: examId,
            class_code: classcode,
            student_result: [],
            student_score: [],
        }
        
        const examResultData = await ExamResults.create(resultSchema);
        res.status(200).json({result: 'OK', message: 'success created exam'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.delete = async (req,res) => {

};