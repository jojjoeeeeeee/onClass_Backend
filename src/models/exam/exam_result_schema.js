const mongoose = require('mongoose');

const result_schema = mongoose.Schema({
    student_id: String,
    part_id: String,
    part_type: String,
    answer: [String]
}, { _id : false });

const score_schema = mongoose.Schema({
    student_id: String,
    part_score: [Number],
    sum_score: Number
}, { _id : false });

const schema = mongoose.Schema({
    exam_id: String,
    class_code: String,
    student_result: [result_schema],
    student_score: [score_schema],
    created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('exam_result', schema)