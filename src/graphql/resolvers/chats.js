const { sendPrivateMessage, getPrivateMessages } = require('./merge_chat');

module.exports = {
    sendPrivateMessage: async (parent, args, req) => sendPrivateMessage(parent, args, req),
    getPrivateMessages: async (parent, args, req) => getPrivateMessages(parent, args, req)
}