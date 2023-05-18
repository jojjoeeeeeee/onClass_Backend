const { buildSchema } = require("graphql");

const typeDefs = `
type Poll {
    id: Int
    choice_name: String
    vote: Int
    percentage: Int
}

type CommentAuthor {
    user_id: String
    firstname: String
    lastname: String
    optional_name: String
}

type Comment {
    comment_author: CommentAuthor
    profile_pic: String
    content: String
    create: String
}

type VoteAuthor {
    username: String
    vote: Int
}

type PostAuthor {
    user_id: String
    firstname: String
    lastname: String
    optional_name: String
}

type File {
    file_name: String
    file_extension: String
    file_path: String
}

type Post {
    id: ID!
    class_code: String
    post_author: PostAuthor
    profile_pic: String
    type: String!
    post_content: String
    post_optional_file: [File]
    poll: [Poll]
    vote_author: [VoteAuthor]
    comment: [Comment]
    created: String
}

type Assignment {
    id: ID!
    class_code: String!
    assignment_name: String!
    assignment_description: String!
    turnin_late: Boolean!
    is_symbol_score: Boolean!
    symbol_score: [String]
    score: Float,
    assignment_optional_file: [File],
    comment: [Comment],
    assignment_start_date: String,
    assignment_end_date: String,
}

scalar JSON

type Feed {
    type: String!
    data: JSON
}

type AssignmentComment {
    id: ID!
    comment: [Comment]
}

type GradeScore {
    grade_id: String!
    type: String!
    title: String!
    score: Float
    max_score: Float!
    percentage: Float!
}

type GradeStudent {
    student_id: ID!
    firstname: String!
    lastname: String!
    optional_name: String!
    assignment: [GradeScore]
    exam: [GradeScore]
}

type Query {
    feeds(class_code: String!): [Feed!]!
    singlePost(class_code: String!, post_id: String!): Post!
    singleAssignment(class_code: String!, assignment_id: String!): Assignment!
    grades(class_code: String!): [GradeStudent!]!
    getPrivateMessages(teacher_id: String!, student_id: String!, class_code: String!): [Message!]
}

type singlePost {
    singlePost: Post!
}

type singleAssignment {
    singleAssignment: AssignmentComment!
}

type examinationTimeout {
    exam_id: String!
    status: String!
}

type Message {
    id: ID!
    content: String!
    conversation_id: ID!
    sender_id: ID!
    sender_name: String!
    created: String!
}

type subMessage {
    message: Message!
    class_code: String!
    participants: [ID!]
}

type Subscription {
    feeds(class_code: String!): [Feed!]!
    onPostUpdate(class_code: String!, post_id: String!): singlePost!
    onAssignmentUpdate(class_code: String!, assignment_id: String!): singleAssignment!
    onExaminationTimeout(class_code: String!, exam_id: String!): examinationTimeout!
    onNewMessage(class_code: String!, user_id: String!): subMessage!
}

type Mutation {
    sendPrivateMessage(receiver_id: String!, sender_id: String!, teacher_id: String!, content: String!, class_code: String!): String!
}
`

exports.typeDefs = typeDefs;