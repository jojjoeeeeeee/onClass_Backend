const feedsResolver = require('./feeds');
const gradesResolver = require('./grades');
const pubsub = require('../pubsub');
const withFilter = require('graphql-subscriptions').withFilter;

const resolvers = {
    Subscription: {
        feeds: {
          subscribe: () => pubsub.asyncIterator(['FEED_UPDATED'])
        },
        onPostUpdate: {
          subscribe: withFilter(
            () => pubsub.asyncIterator(['POST_UPDATED']),
            (payload, variables) => {
                return (
                    payload.onPostUpdate.singlePost.id.toString() === variables.post_id
                );
            }
          )
        },
        onAssignmentUpdate: {
          subscribe: withFilter(
            () => pubsub.asyncIterator(['ASSIGNMENT_UPDATED']),
            (payload, variables) => {
                return (
                    payload.onAssignmentUpdate.singleAssignment.id.toString() === variables.assignment_id
                );
            }
          )
        }
      },
    Query: {
        feeds: async (parent, args, req) => feedsResolver.feeds(parent, args, req),
        singlePost: async (parent, args, req) => feedsResolver.singlePost(parent, args, req),
        singleAssignment: async (parent, args, req) => feedsResolver.singleAssignment(parent, args, req),
        grades: async (parent, args, req) => await gradesResolver.grades(parent, args, req),
    }
};

exports.resolvers = resolvers;