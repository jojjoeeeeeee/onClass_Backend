const mongoose = require('mongoose');
// const File = require('../file_model');

const part_schema = mongoose.Schema({
    part_id: String,
    type: String, //part type objective || subjective
    part_name: String,
    part_description: String,
    start_date: Date,
    end_date: Date,
    score: Number,
    item: [mongoose.SchemaTypes.Mixed] //Objective and Subjective Array
}, { _id : false });

const schema = mongoose.Schema({
    exam_name: String,
    exam_description: {type: String, default: ''},
    author: String,
    optional_setting: {
        random_question: {type: Boolean, default: false},
        random_choice: {type: Boolean, default: false},
        std_getResult: {type: Boolean, default: false},
    },
    part_list: [part_schema],
    exam_optional_file: [String],
    exam_start_date: Date,
    exam_end_date: Date,
    created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('exam', schema)