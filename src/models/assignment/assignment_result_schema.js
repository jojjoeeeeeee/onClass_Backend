const mongoose = require('mongoose');
const File = require('../file_schema');

const result_schema = mongoose.Schema({
    student_id: String,
    file_result: [File],
    answer_result: String,
    isLate: Boolean
}, { _id : false });

const score_schema = mongoose.Schema({
    student_id: String,
    score: Number
}, { _id : false });


const schema = mongoose.Schema({
    assignment_id: String,
    class_code: String,
    std_result: [result_schema],
    std_score: [score_schema],
    created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('assignment_result', schema)