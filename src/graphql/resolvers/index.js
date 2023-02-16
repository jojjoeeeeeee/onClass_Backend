const feedsResolver = require('./feeds');
const pubsub = require('../pubsub');

const resolvers = {
    Subscription: {
        feeds: {
          subscribe: () => pubsub.asyncIterator(['FEED_UPDATED'])
        },
      },
    Query: {
        feeds: async (parent, args, req) => feedsResolver.feeds(parent, args, req),
    }
};

exports.resolvers = resolvers;