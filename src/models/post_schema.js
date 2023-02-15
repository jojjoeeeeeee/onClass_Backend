const mongoose = require('mongoose');
const File = require('../models/file_model');
const Comment = require('../models/comment_model');

// const comment_schema = mongoose.Schema({
//     comment_author_id: String,
//     content: String,
//     created: { type: Date, default: Date.now }
// }, { _id : false });

const vote_schema = mongoose.Schema({
    user_id: String,
    vote: Number,
}, { _id : false })

const poll_schema = mongoose.Schema({
    choice_name: String,
    vote: Number
}, { _id : false });

const schema = mongoose.Schema({
    class_code: String,
    post_author_id: String,
    type: String, //poll or normal
    post_content: String,
    post_optional_file: [String],
    poll: [poll_schema],
    vote_author: [vote_schema],
    comment: [Comment],
    created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('posts', schema)
