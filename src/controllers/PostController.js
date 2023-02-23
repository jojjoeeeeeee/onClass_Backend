const Users = require('../models/user_schema');
const Classes = require('../models/class_schema');
const Posts = require('../models/post_schema');
const Files = require('../models/file_schema');

const pubsub = require('../graphql/pubsub');
const { feeds, singlePost } = require('../graphql/resolvers/merge_feed');

const { classPostValidation, classPostCommentValidation, classPostPollVoteValidation } = require('../services/validation');

exports.get = async (req,res) => {
    const username = req.username;
    const { error } = classPostValidation(req.body);
    if (error) return res.status(200).json({result: 'nOK', message: error.details[0].message, data: null});

    const classcode = req.body.class_code;
    const { post_id } = req.body;

    try {
        const users = await Users.findOne({ username: username })
        if (!users) return res.status(404).json({result: 'Not found', message: '', data: null});
        const user_id = users._id;
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: '', data: null});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbidden', message: 'access is denied', data: null});

        if (!class_data.class_post_id.includes(post_id)) return res.status(404).json({result: 'Not found', message: '', data: null});
        const post_data = await Posts.findById(post_id);
        if (!post_data) return res.status(404).json({result: 'Not found', message: '', data: null});

        const file_id = post_data.post_optional_file.map(key => {
            return key
        })

        const file_arr = []
        for(let i = 0; i < file_id.length; i++){
            const file_data = await Files.findById(file_id[i]);
            if(!file_data) return res.status(404).json({result: 'Not found', message: '', data: null});
            const file_obj = {
                file_name: file_data.file_name,
                file_extension: file_data.filename_extension,
                file_path: `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api/file/download/${file_data._id}`
            }
            file_arr.push(file_obj)
        }

        const vote_author = []
        
        post_data.vote_author.map(voteAuthor => {
            if (voteAuthor.user_id == user_id) {
                const vote_data = {
                    username: username,
                    vote: voteAuthor.vote
                }
                vote_author.push(vote_data)
            }
        })
        const author = await Users.findById(post_data.post_author_id);

        const poll_arr = []
        let sum = 0
        for (const poll of post_data.poll) {
            sum += poll.vote
        }
        
        for (let i = 0 ; i < post_data.poll.length ; i++) {
            const poll_data = {
                id: i,
                choice_name: post_data.poll[i].choice_name,
                vote: post_data.poll[i].vote,
                percentage: sum === 0 ? 0 : Math.round((post_data.poll[i].vote / sum) * 100)
            }
            poll_arr.push(poll_data)
        }

        const postSchema = {
            id: post_data._id,
            class_code: post_data.class_code,
            post_author: null,
            profile_pic: author.profile_pic,
            type: post_data.type,
            post_content: post_data.post_content,
            post_optional_file: file_arr,
            poll: poll_arr,
            vote_author: vote_author,
            comment: [],
            created: post_data.created
        }

        // const profile_pic = await Files.findById(author.profile_pic);
        // if (profile_pic !== null && profile_pic !== '') {
        //     postSchema.profile_pic = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${profile_pic.file_path}`
        // }
       
        class_data.nickname.map(nickKey => {
            if (nickKey.user_id == post_data.post_author_id) {
                postSchema.post_author = nickKey;
            }
        })

        const postComment = []
        for (let i = 0 ; i < post_data.comment.length ; i++) {
            const commentSchema = {
                comment_author: null,
                profile_pic: null,
                content: post_data.comment[i].content,
                create: post_data.comment[i].created
            }

            class_data.nickname.map(nickKey => {
                if (nickKey.user_id == post_data.comment[i].comment_author_id) {
                    commentSchema.comment_author = nickKey;
                }
            })

            const query = await Users.findById(post_data.comment[i].comment_author_id);
            // const comment_profile_pic = await Files.findById(query.profile_pic);
            // if (comment_profile_pic !== null && comment_profile_pic !== '') {
            //     commentSchema.profile_pic = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${comment_profile_pic.file_path}`
            // }
            commentSchema.profile_pic = query.profile_pic;
            postComment.push(commentSchema);
        }

        postSchema.comment = postComment;

        res.status(200).json({result: 'OK', message: '', data: postSchema});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: '', data: null});
    }
};

exports.publish = async (req,res) => {
    const username = req.username;
    const classcode = req.body.class_code;
    const post_data = req.body.data;

    if (!classcode||!post_data) return res.status(400).json({result: 'Bad request', message: ''});

    //Post validation
    if (!post_data.type||!post_data.post_content||!post_data.post_optional_file) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const users = await Users.findOne({ username: username })
        if (!users) return res.status(404).json({result: 'Not found', message: ''});
        const user_id = users._id;
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbidden', message: 'access is denied'});

        const postSchema = {
            class_code: classcode,
            post_author_id: user_id,
            type: post_data.type,
            post_content: post_data.post_content,
            post_optional_file: post_data.post_optional_file,
            poll: [],
            vote_author: [],
            comment: [],
        }

        if (post_data.type == 'poll') {
            if (!post_data.poll) return res.status(400).json({result: 'Bad request', message: ''});
            if (!post_data.poll.length > 0) return res.status(400).json({result: 'Bad request', message: ''});
            const poll_arr = [] 
            for (let i = 0 ; i < post_data.poll.length ; i++) {
                const choice = {
                    choice_name: post_data.poll[i],
                    vote: 0
                }
                poll_arr.push(choice);
            }
            postSchema.poll = poll_arr;
        }
        else if (post_data.type != 'normal') return res.status(400).json({result: 'Bad request', message: ''});

        const post_created = await Posts.create(postSchema);
        class_data.class_post_id.push(post_created._id);

        await Classes.findOneAndUpdate({class_code: classcode}, class_data);

        const feed_data = await feeds('', { class_code: classcode }, { username: username })
        pubsub.publish('FEED_UPDATED', {
            feeds: feed_data,
          });

        res.status(200).json({result: 'OK', message: 'success publish post'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.deletePost = async (req,res) => {
    const username = req.username;
    const classcode = req.body.class_code;
    const post_id = req.body.post_id;

    if (!classcode||!post_id) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const users = await Users.findOne({ username: username })
        if (!users) return res.status(404).json({result: 'Not found', message: ''});
        const user_id = users._id;
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbidden', message: 'access is denied'});

        if (!class_data.class_post_id.includes(post_id)) return res.status(404).json({result: 'Not found', message: ''});
        const post_data = await Posts.findById(post_id);
        if (!post_data) return res.status(404).json({result: 'Not found', message: ''});

        if (post_data.post_author_id != user_id) return res.status(403).json({result: 'Forbidden', message: 'access is denied'});

        const post_index = class_data.class_post_id.indexOf(post_id);
        class_data.class_post_id.splice(post_index,1);

        await Posts.findByIdAndDelete(post_id);
        await Classes.findOneAndUpdate({class_code: classcode}, class_data);
        res.status(200).json({result: 'OK', message: 'success delete post'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.pollVote = async (req,res) => {
    const username = req.username;

    const { error } = classPostPollVoteValidation(req.body);
    if (error) return res.status(200).json({result: 'nOK', message: error.details[0].message});

    const classcode = req.body.class_code;
    const { post_id, choice_name } = req.body;

    try {
        const users = await Users.findOne({ username: username })
        if (!users) return res.status(404).json({result: 'Not found', message: ''});
        const user_id = users._id;
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbidden', message: 'access is denied'});

        if (!class_data.class_post_id.includes(post_id)) return res.status(404).json({result: 'Not found', message: ''});
        const post_data = await Posts.findById(post_id);
        if (!post_data) return res.status(404).json({result: 'Not found', message: ''});

        for (let i = 0 ; i < post_data.poll.length ; i++) {
            if (post_data.poll[i].choice_name === choice_name) {
                
                post_data.poll[i].vote = post_data.poll[i].vote + 1;
                const vote_data = {
                    user_id: user_id,
                    vote: i
                }
                
                const filtered_vote_author = post_data.vote_author.filter((val, index) => {
                    if (val.user_id === user_id) {
                        post_data.poll[index].vote = post_data.poll[index].vote - 1;
                    }
                    return val.user_id !== user_id;
                })
                filtered_vote_author.push(vote_data);
                post_data.vote_author = filtered_vote_author;
            }
        }
        

        await Posts.findByIdAndUpdate(post_id, post_data);


        const feed_data = await feeds('', { class_code: classcode }, { username: username })
        pubsub.publish('FEED_UPDATED', {
            feeds: feed_data,
          });

        const singlePost_data = await singlePost('', { class_code: classcode, post_id }, { username: username })
        pubsub.publish('POST_UPDATED', {
            onPostUpdate: {
                singlePost: singlePost_data
            },
        });
        res.status(200).json({result: 'OK', message: 'success post vote poll'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.comment = async (req,res) => {
    const username = req.username;

    const { error } = classPostCommentValidation(req.body);
    if (error) return res.status(200).json({result: 'nOK', message: error.details[0].message});

    const classcode = req.body.class_code;
    const post_id = req.body.id;
    const comment_data = req.body.data;

    try {
        const users = await Users.findOne({ username: username })
        if (!users) return res.status(404).json({result: 'Not found', message: ''});
        const user_id = users._id;
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbidden', message: 'access is denied'});

        if (!class_data.class_post_id.includes(post_id)) return res.status(404).json({result: 'Not found', message: ''});
        const post_data = await Posts.findById(post_id);
        if (!post_data) return res.status(404).json({result: 'Not found', message: ''});

        const Comment = require('../models/comment_model');
        Comment.comment_author_id = user_id;
        Comment.content = comment_data.content;

        post_data.comment.push(Comment);

        await Posts.findByIdAndUpdate(post_id, post_data);

        const feed_data = await feeds('', { class_code: classcode }, { username: username })
        pubsub.publish('FEED_UPDATED', {
            feeds: feed_data,
          });
        const singlePost_data = await singlePost('', { class_code: classcode, post_id }, { username: username })
        pubsub.publish('POST_UPDATED', {
            onPostUpdate: {
                singlePost: singlePost_data
            },
          });
        res.status(200).json({result: 'OK', message: 'success add comment'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.deleteComment = async (req,res) => {
    const username = req.username;
    const classcode = req.body.class_code;
    const post_id = req.body.post_id;
    const comment_index = req.body.comment_index;
    if (!classcode||!post_id||!comment_index) return res.status(400).json({result: 'Bad request', message: ''});


    try {
        const users = await Users.findOne({ username: username })
        if (!users) return res.status(404).json({result: 'Not found', message: ''});
        const user_id = users._id;
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbidden', message: 'access is denied'});

        if (!class_data.class_post_id.includes(post_id)) return res.status(404).json({result: 'Not found', message: ''});
        const post_data = await Posts.findById(post_id);
        if (!post_data) return res.status(404).json({result: 'Not found', message: ''});

        if (post_data.comment[comment_index].comment_author_id != user_id) return res.status(403).json({result: 'Forbidden', message: 'access is denied'});

        post_data.comment.splice(comment_index,1);

        await Posts.findByIdAndUpdate(post_id, post_data);
        res.status(200).json({result: 'OK', message: 'success delete comment'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};
