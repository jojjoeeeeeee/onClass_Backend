const mongoose = require('mongoose');

const comment_model = mongoose.Schema({
    comment_author_id: String,
    content: String,
    created: { type: Date, default: Date.now }
}, { _id : false });


module.exports = comment_model;