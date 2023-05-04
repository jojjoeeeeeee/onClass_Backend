const mongoose = require('mongoose');

const schema = mongoose.Schema({
    teacher_id: String,
    student_id: String,
    class_code: String,
    created: { type: Date, default: Date.now }
});


module.exports = mongoose.model('chats', schema)
