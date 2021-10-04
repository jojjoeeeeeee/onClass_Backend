const mongoose = require("mongoose");

const nickname_schema = mongoose.Schema({
    user_id: String,
    firstname: String,
    lastname: String,
    optional_name: String
}, { _id : false });

const schema = mongoose.Schema({
    class_code: String,
    class_name: String,
    class_description: String,
    class_section: String,
    class_room: String,
    class_subject: String,
    class_thumbnail: String,
    teacher_id: [String],
    student_id: [String],
    nickname: [nickname_schema],
    class_assignment_id: [String],
    class_post_id: [String],
    class_exam_id: [String],
    created: { type: Date, default: Date.now }
});

schema.index({ class_code: 1}, { unique: true });
module.exports = mongoose.model('classroom', schema)
