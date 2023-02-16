const DataLoader = require('dataloader');

const Users = require('../../models/user_schema');
const Classes = require('../../models/class_schema');
const Posts = require('../../models/post_schema');
const Assignments = require('../../models/assignment/assignment_schema');
const Files = require('../../models/file_schema');

const moment = require('moment');

const feeds = async (parent, args, req) => {
    const username = req.username;

    try {
        const users = await Users.findOne({ username: username })
        if (!users) return [];
        const user_id = users._id;
        const class_data = await Classes.findOne({ class_code: args.class_code })
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return [];

        const posts = await Posts.find({ class_code: args.class_code });
        const post_arr = posts.map(post => {
            return transformPost(username, users, post, class_data);
        });

        const assignments = []
        for (let i = 0 ; i < class_data.class_assignment_id.length ; i++) {
            const assignment = await Assignments.findById(class_data.class_assignment_id[i])
            if (!assignment) return [];
            assignments.push(assignment);
        }

        const assignment_arr = assignments.map(assignment => {
            return transformAssignment(assignment);
        })


        const feed_data = []
        for (let i = 0 ; i < assignment_arr.length ; i++) {
            const feed_details = {
                type: 'assignment',
                data: assignment_arr[i]
            }
            feed_data.push(feed_details)
        }
        
        for (let i = 0 ; i < post_arr.length ; i++) {
            const feed_details = {
                type: post_arr[i].type === "poll" ? "poll" : "post",
                data: post_arr[i]
            }
            feed_data.push(feed_details)
        }

        const sorted_feed_data = feed_data.sort(async (a, b) => {
            const current = await a.data
            const next = await b.data
            return current.moment_sort.valueOf() - next.moment_sort.valueOf();
        })
        return sorted_feed_data.reverse();
    } catch (err) {
        throw err;
    }
}

const singlePost = async (parent, args, req) => {
    const username = req.username;

    try {
        const users = await Users.findOne({ username: username })
        if (!users) return [];
        const user_id = users._id;
        const class_data = await Classes.findOne({ class_code: args.class_code })
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return [];

        const post = await Posts.findById(args.post_id)

        return transformSinglePost(post, class_data)
    } catch (err) {
        throw err;
    }
};

const singleAssignment = async (parent, args, req) => {
    const username = req.username;

    try {
        const users = await Users.findOne({ username: username })
        if (!users) return [];
        const user_id = users._id;
        const class_data = await Classes.findOne({ class_code: args.class_code })
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return [];

        const assignment = await Assignments.findById(args.assignment_id)

        return transformSingleAssignment(assignment, class_data)
    } catch (err) {
        throw err;
    }
};


const transformPost = async (username, users, post, class_data) => {
    const user_id = users._id

    const file_arr = [];
    for(let j = 0; j < post.post_optional_file.length; j++){
        const file_data = await Files.findById(post.post_optional_file[j]);
        if(!file_data) return [];
        const file_obj = {
            file_name: file_data.file_name,
            file_extension: file_data.filename_extension,
            file_path: `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api/file/download/${file_data._id}`
        }
        file_arr.push(file_obj)
    }

    const vote_author = []
    for (let i = 0 ; i < class_data.nickname.length ; i++) {
        for (let j = 0 ; j < post.vote_author.length ; j ++) {
            if (class_data.nickname[i].user_id === post.vote_author[j].user_id) {
                const this_user = await Users.findById(post.vote_author[j].user_id)
                vote_author.push(Object.assign({}, {
                    username: this_user.username,
                    vote: post.vote_author[j].vote
                }))
            }
        }
    }

    const details = {
        id: post._id,
        post_author: null,
        profile_pic: null,
        type: post.type,
        post_content: post.post_content,
        post_optional_file: file_arr,
        poll: post.poll,
        vote_author: vote_author,
        comment: post.comment.length,
        created: post.created,
        moment_sort: moment(post.created)
    }

    class_data.nickname.map(nickKey => {
        if (nickKey.user_id == post.post_author_id) {
            details.post_author = nickKey;
        }
    })

    const post_author_user = await Users.findById(post.post_author_id)
    const profile_pic = await Files.findById(post_author_user.profile_pic);
    if (profile_pic !== null && profile_pic !== '') {
        details.profile_pic = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${profile_pic.file_path}`
    }

    return details
};

const transformAssignment = async ( assignment ) => {

    const file_arr = []
    for(let j = 0; j < assignment.assignment_optional_file.length; j++){
        const file_data = await Files.findById(assignment.assignment_optional_file[j]);
        if(!file_data) return [];
        const file_obj = {
            file_name: file_data.file_name,
            file_extension: file_data.filename_extension,
            file_path: `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api/file/download/${file_data._id}`
        }
        file_arr.push(file_obj)
    }

    const details = {
        id: assignment._id,
        assignment_name: assignment.assignment_name,
        assignment_description: assignment.assignment_description,
        turnin_late: assignment.turnin_late,
        is_symbol_score: assignment.is_symbol_score,
        symbol_score: assignment.symbol_score,
        score: assignment.score,
        assignment_optional_file: file_arr,
        comment: assignment.comment.length,
        assignment_start_date: assignment.assignment_start_date,
        assignment_end_date: assignment.assignment_end_date,
        moment_sort: moment(assignment.created)
    }

    return details
};

const transformSinglePost = async (post, class_data) => {

    const file_arr = [];
    for(let j = 0; j < post.post_optional_file.length; j++){
        const file_data = await Files.findById(post.post_optional_file[j]);
        if(!file_data) return [];
        const file_obj = {
            file_name: file_data.file_name,
            file_extension: file_data.filename_extension,
            file_path: `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api/file/download/${file_data._id}`
        }
        file_arr.push(file_obj)
    }

    const vote_author = []
    for (let i = 0 ; i < class_data.nickname.length ; i++) {
        for (let j = 0 ; j < post.vote_author.length ; j ++) {
            if (class_data.nickname[i].user_id === post.vote_author[j].user_id) {
                const this_user = await Users.findById(post.vote_author[j].user_id)
                vote_author.push(Object.assign({}, {
                    username: this_user.username,
                    vote: post.vote_author[j].vote
                }))
            }
        }
    }

    const details = {
        id: post._id,
        class_code: post.class_code,
        post_author: null,
        profile_pic: null,
        type: post.type,
        post_content: post.post_content,
        post_optional_file: file_arr,
        poll: post.poll,
        vote_author: vote_author,
        comment: [],
        created: new Date(post.created).toISOString()
    }

    class_data.nickname.map(nickKey => {
        if (nickKey.user_id == post.post_author_id) {
            details.post_author = nickKey;
        }
    })

    const post_author_user = await Users.findById(post.post_author_id)
    const profile_pic = await Files.findById(post_author_user.profile_pic);
    if (profile_pic !== null && profile_pic !== '') {
        details.profile_pic = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${profile_pic.file_path}`
    }

    const postComment = []
        for (let i = 0 ; i < post.comment.length ; i++) {
            const commentSchema = {
                comment_author: null,
                profile_pic: null,
                content: post.comment[i].content,
                create: new Date(post.comment[i].created).toISOString()
            }

            class_data.nickname.map(nickKey => {
                if (nickKey.user_id == post.comment[i].comment_author_id) {
                    commentSchema.comment_author = nickKey;
                }
            })

            const query = await Users.findById(post.comment[i].comment_author_id);
            const comment_profile_pic = await Files.findById(query.profile_pic);
            if (comment_profile_pic !== null && comment_profile_pic !== '') {
                commentSchema.profile_pic = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${comment_profile_pic.file_path}`
            }
            postComment.push(commentSchema);
        }

        details.comment = postComment;

    return details
};

const transformSingleAssignment = async (assignment, class_data) => {

    const details = {
        id: assignment.id,
        comment: [],
    }

    const assignmentComment = []
        for (let i = 0 ; i < assignment.comment.length ; i++) {
            const commentSchema = {
                comment_author: null,
                profile_pic: null,
                content: assignment.comment[i].content,
                create: new Date(assignment.comment[i].created).toISOString()
            }

            class_data.nickname.map(nickKey => {
                if (nickKey.user_id == assignment.comment[i].comment_author_id) {
                    commentSchema.comment_author = nickKey;
                }
            })

            const query = await Users.findById(assignment.comment[i].comment_author_id);
            const comment_profile_pic = await Files.findById(query.profile_pic);
            if (comment_profile_pic !== null && comment_profile_pic !== '') {
                commentSchema.profile_pic = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${comment_profile_pic.file_path}`
            }
            assignmentComment.push(commentSchema);
        }

        details.comment = assignmentComment;

    return details
};

exports.feeds = feeds;
exports.singlePost = singlePost;
exports.singleAssignment = singleAssignment;