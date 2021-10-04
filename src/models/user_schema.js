const mongoose = require("mongoose");

const class_schema = mongoose.Schema({
    role: String,
    class_code: String 
}, { _id : false});

const notification_schema = mongoose.Schema({
    noti_id: String,
    class_code: String,
    type: String,
    message: String,
    todo_id: String
    
}, { _id : false});

const schema = mongoose.Schema({
    username: String,
    password: String,
    email: String,
    profile_pic: String,
    name: {
        firstname: String,
        lastname: String
    },
    class: [class_schema],
    notification: [notification_schema],
    created: { type: Date, default: Date.now }
});

schema.index({ username: 1}, { unique: true });
module.exports = mongoose.model('users', schema)
