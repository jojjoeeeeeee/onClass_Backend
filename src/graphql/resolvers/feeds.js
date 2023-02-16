const { feeds } = require('./merge_feed');

module.exports = {
    feeds: async (parent, args, req) => feeds(parent, args, req),
}