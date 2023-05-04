const mongoose = require('mongoose');

//86400000
const schema = mongoose.Schema({
    conversation_id: String,
    content: String,
    sender_id: String,
    created: { type: Date, expires: 86400000, default: Date.now }
})

module.exports = mongoose.model('messages', schema)