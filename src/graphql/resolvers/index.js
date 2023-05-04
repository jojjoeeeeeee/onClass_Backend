const feedsResolver = require('./feeds');
const gradesResolver = require('./grades');
const chatResolver = require('./chats');
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
        },
        onExaminationTimeout: {
          subscribe: withFilter(
            () => pubsub.asyncIterator(['EXAMINATION_TIMEOUT']),
            (payload, variables) => {
              return (
                payload.onExaminationTimeout.exam_id.toString() === variables.exam_id
              );
            }
          )
        },
        onNewMessage: {
          subscribe: withFilter(
            () => pubsub.asyncIterator(['NEW_MESSAGE']),
            (payload, variables) => {
              return (
                payload.onNewMessage.participants.includes(variables.user_id.toString()) && payload.onNewMessage.class_code.toString() === variables.class_code.toString()
              )
            }
          )
        }
      },
    Query: {
        feeds: async (parent, args, req) => feedsResolver.feeds(parent, args, req),
        singlePost: async (parent, args, req) => feedsResolver.singlePost(parent, args, req),
        singleAssignment: async (parent, args, req) => feedsResolver.singleAssignment(parent, args, req),
        grades: async (parent, args, req) => await gradesResolver.grades(parent, args, req),
        getPrivateMessages: async (parent, args, req) => await chatResolver.getPrivateMessages(parent, args, req)
    },
    Mutation: {
      sendPrivateMessage: async (parent, args, req) =>  chatResolver.sendPrivateMessage(parent, args, req),
    }
};

exports.resolvers = resolvers;