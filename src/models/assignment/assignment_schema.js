const mongoose = require('mongoose');
const File = require('../file_model');

const comment_schema = mongoose.Schema({
    comment_author_id: String,
    content: String,
    created: { type: Date, default: Date.now }
}, { _id : false });

const schema = mongoose.Schema({
    assignment_name: String,
    assignment_description: String,
    turnin_late: Boolean,
    score: Number,
    assignment_optional_file: [String],
    comment: [comment_schema],
    assignment_start_date: { type: Date, default: Date.now },
    assignment_end_date: Date,
    created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('assignment', schema)