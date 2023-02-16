const { buildSchema } = require("graphql");

const typeDefs = `
type Poll {
    choice_name: String
    vote: Int
}

type Comment {
    comment_author_id: String
    content: String
    created: String
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
    post_author: PostAuthor
    profile_pic: String
    type: String!
    post_content: String
    post_optional_file: [String]
    poll: [Poll]
    vote_author: VoteAuthor
    comment: [Comment]
    created: String
}

type Assignment {
    id: ID!
    assignment_name: String!
    assignment_description: String!
    turnin_late: Boolean!
    is_symbol_score: Boolean!
    symbol_score: [String]
    score: Float,
    assignment_optional_file: [File],
    comment: Int,
    assignment_start_date: String,
    assignment_end_date: String,
}

scalar JSON

type Feed {
    type: String!
    data: JSON
}

type Query {
    feeds(class_code: String!): [Feed!]!
}

type Subscription {
    feeds(class_code: String!): [Feed!]!
}
`

exports.typeDefs = typeDefs;