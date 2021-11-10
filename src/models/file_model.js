const mongoose = require('mongoose');

const file_model = mongoose.Schema({
    file_name: String,
    filename_extension: String,
    file_path: String,
    file_author_id: String,
    created: { type: Date, default: Date.now }
});


module.exports = file_model;
