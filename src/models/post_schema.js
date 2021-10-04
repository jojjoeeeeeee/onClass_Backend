const mongoose = require("mongoose");
const File = require("../models/file_schema");

const comment_schema = mongoose.Schema({
    comment_author_id: String,
    content: String,
    created: { type: Date, default: Date.now }
}, { _id : false });

const poll_schema = mongoose.Schema({
    choice_name: String,
    vote: Number
}, { _id : false });

const schema = mongoose.Schema({
    class_code: String,
    post_author_id: String,
    type: String, //poll or normal
    post_content: String,
    post_optional_file: [File],
    poll: [poll_schema],
    comment: [comment_schema],
    created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('post', schema)
