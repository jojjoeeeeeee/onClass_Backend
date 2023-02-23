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
    id: ID!
    type: String!
    title: String!
    score: Float!
    max_score: Float!
    percentage: Float!
}

type GradeStudent {
    id: ID!
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
    grades(class_code: String!): [GradeStudent]
}

type singlePost {
    singlePost: Post!
}

type singleAssignment {
    singleAssignment: AssignmentComment!
}

type Subscription {
    feeds(class_code: String!): [Feed!]!
    onPostUpdate(class_code: String!, post_id: String!): singlePost!
    onAssignmentUpdate(class_code: String!, assignment_id: String!): singleAssignment!
}
`

exports.typeDefs = typeDefs;