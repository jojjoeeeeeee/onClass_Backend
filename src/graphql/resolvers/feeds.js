const { feeds, singlePost, singleAssignment } = require('./merge_feed');

module.exports = {
    feeds: async (parent, args, req) => feeds(parent, args, req),
    singlePost: async (parent, args, req) => singlePost(parent, args, req),
    singleAssignment: async (parent, args, req) => singleAssignment(parent, args, req),
}