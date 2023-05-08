const mongoose = require('mongoose');

//86400
const schema = mongoose.Schema({
    conversation_id: String,
    content: String,
    sender_id: String,
    created: { type: Date, expires: 86400, default: Date.now }
})

module.exports = mongoose.model('messages', schema)