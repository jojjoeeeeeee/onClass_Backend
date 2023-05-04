const Chats = require("../../models/chat_schema");
const Messages = require("../../models/message_schema");
const Classes = require("../../models/class_schema");
const pubsub = require("../../graphql/pubsub");

const sendPrivateMessage = async (parent, args, req) => {
  const teacher_id = args.teacher_id;
  const student_id =
    args.sender_id === args.teacher_id ? args.receiver_id : args.sender_id; //condition to determine student id
  const { content, class_code } = args;

  try {
    const conversation_data = await Chats.findOne({
      teacher_id,
      student_id,
      class_code,
    });
    const class_data = await Classes.findOne({ class_code });
    if (!class_data) return "FAIL: sendPrivateMessage";
    if (conversation_data) {
      const msg = {
        conversation_id: conversation_data._id,
        content,
        sender_id: args.sender_id,
      };
      const msg_data = await Messages.create(msg);
      for (let j = 0; j < class_data.nickname.length; j++) {
        if (args.sender_id == class_data.nickname[j].user_id) {
          pubsub.publish("NEW_MESSAGE", {
            onNewMessage: {
              message: {
                id: msg_data._id,
                content: msg_data.content,
                conversation_id: msg_data.conversation_id,
                sender_id: msg_data.sender_id,
                sender_name: `${class_data.nickname[j].firstname} ${class_data.nickname[j].lastname}`,
                created: new Date(msg_data.created).toISOString(),
              },
              class_code,
              participants: [teacher_id, student_id],
            },
          });
          break;
        }
      }
    } else {
      const new_conversation_data = await Chats.create({
        teacher_id,
        student_id,
        class_code,
      });
      const msg = {
        conversation_id: new_conversation_data._id,
        content,
        sender_id: args.sender_id,
      };
      const msg_data = await Messages.create(msg);
      for (let j = 0; j < class_data.nickname.length; j++) {
        if (args.sender_id == class_data.nickname[j].user_id) {
          pubsub.publish("NEW_MESSAGE", {
            onNewMessage: {
              message: {
                id: msg_data._id,
                content: msg_data.content,
                conversation_id: msg_data.conversation_id,
                sender_id: msg_data.sender_id,
                sender_name: `${class_data.nickname[j].firstname} ${class_data.nickname[j].lastname}`,
                created: new Date(msg_data.created).toISOString(),
              },
              class_code,
              participants: [teacher_id, student_id],
            },
          });
          break;
        }
      }
    }
    return `SUCCESS: sendPrivateMessage ${content}`;
  } catch (err) {
    throw err;
  }
};

const getPrivateMessages = async (parent, args, req) => {
  const { teacher_id, student_id, class_code } = args;
  try {
    const conversation_data = await Chats.findOne({
      teacher_id,
      student_id,
      class_code,
    });
    if (!conversation_data) return [];

    const msg_data = await Messages.find({
      conversation_id: conversation_data._id,
    });

    const class_data = await Classes.findOne({ class_code });
    if (!class_data) return [];

    const mapped_converstaion_data = [];
    for (let i = 0; i < msg_data.length; i++) {
      for (let j = 0; j < class_data.nickname.length; j++) {
        if (msg_data[i].sender_id == class_data.nickname[j].user_id) {
          const mapped = {
            id: msg_data[i]._id,
            content: msg_data[i].content,
            conversation_id: msg_data[i].conversation_id,
            sender_id: msg_data[i].sender_id,
            sender_name: `${class_data.nickname[j].firstname} ${class_data.nickname[j].lastname}`,
            created: new Date(msg_data[i].created).toISOString(),
          };
          mapped_converstaion_data.push(mapped);
        }
      }
    }

    return mapped_converstaion_data;
  } catch (err) {
    throw err;
  }
};

exports.sendPrivateMessage = sendPrivateMessage;
exports.getPrivateMessages = getPrivateMessages;
