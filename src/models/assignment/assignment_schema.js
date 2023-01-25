const mongoose = require('mongoose');
const Comment = require('../../models/comment_model');
const File = require('../file_model');


const schema = mongoose.Schema({
    class_code: String,
    assignment_name: String,
    assignment_description: String,
    turnin_late: Boolean,
    is_symbol_score: Boolean,
    symbol_score: [String],
    score: Number,
    assignment_optional_file: [String],
    comment: [Comment],
    assignment_start_date: { type: Date, default: Date.now },
    assignment_end_date: Date,
    created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('assignment', schema)