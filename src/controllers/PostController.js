const Users = require('../models/user_schema');
const Classes = require('../models/class_schema');
const Posts = require('../models/post_schema');
const Files = require('../models/file_schema');

exports.get = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const post_id = req.body.post_id;
    if (!classcode||!post_id) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        if (!class_data.class_post_id.includes(post_id)) return res.status(404).json({result: 'Not found', message: ''});
        const post_data = await Posts.findById(post_id);
        if (!post_data) return res.status(404).json({result: 'Not found', message: ''});

        const file_id = post_data.post_optional_file.map(key => {
            return key
        })

        const file_arr = []
        for(let i = 0; i < file_id.length; i++){
            const file_data = await Files.findById(file_id[i]);
            if(!file_data) return res.status(404).json({result: 'Not found', message: ''});
            const file_obj = {
                file_name: file_data.file_name,
                file_extension: file_data.filename_extension,
                file_path: `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/file/download/${file_data._id}`
            }
            file_arr.push(file_obj)
        }


        const postSchema = {
            id: post_data._id,
            class_code: post_data.classcode,
            post_author: {},
            profile_pic: '',
            type: post_data.type,
            post_content: post_data.post_content,
            post_optional_file: file_arr,
            poll: post_data.poll,
            comment: [],
            created: post_data.created
        }

        const author = await Users.findById(post_data.post_author_id);
        const profile_pic = await Files.findById(author.profile_pic);
        postSchema.profile_pic = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${profile_pic.file_path}`

        class_data.nickname.map(nickKey => {
            if (nickKey.user_id == post_data.post_author_id) {
                postSchema.post_author = nickKey;
            }
        })

        const postComment = []
        for (let i = 0 ; i < post_data.comment.length ; i++) {
            const commentSchema = {
                comment_author: {},
                profile_pic: '',
                content: post_data.comment[i].content,
                create: post_data.comment[i].created
            }

            class_data.nickname.map(nickKey => {
                if (nickKey.user_id == post_data.comment[i].comment_author_id) {
                    commentSchema.comment_author = nickKey;
                }
            })

            const query = await Users.findById(post_data.comment[i].comment_author_id);
            const comment_profile_pic = await Files.findById(query.profile_pic);
            commentSchema.profile_pic = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${comment_profile_pic.file_path}`
            postComment.push(commentSchema);
        }

        postSchema.comment = postComment;

        res.status(200).json({result: 'OK', message: '', data: postSchema});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.publish = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const post_data = req.body.data;

    if (!classcode||!post_data) return res.status(400).json({result: 'Bad request', message: ''});

    //Post validation
    if (!post_data.type||!post_data.post_content||!post_data.post_optional_file) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        const postSchema = {
            class_code: classcode,
            post_author_id: user_id,
            type: post_data.type,
            post_content: post_data.post_content,
            post_optional_file: post_data.post_optional_file,
            poll: [],
            comment: [],
        }

        if (post_data.type == 'poll') {
            postSchema.poll = post_data.poll
        }
        else if (post_data.type != 'normal') return res.status(400).json({result: 'Bad request', message: ''});

        const post_created = await Posts.create(postSchema);
        class_data.class_post_id.push(post_created._id);

        await Classes.findOneAndUpdate({class_code: classcode}, class_data);
        res.status(200).json({result: 'OK', message: 'success publish post'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.deletePost = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const post_id = req.body.post_id;

    if (!classcode||!post_id) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        if (!class_data.class_post_id.includes(post_id)) return res.status(404).json({result: 'Not found', message: ''});
        const post_data = await Posts.findById(post_id);
        if (!post_data) return res.status(404).json({result: 'Not found', message: ''});

        if (post_data.post_author_id != user_id) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        const post_index = class_data.class_post_id.indexOf(post_id);
        class_data.class_post_id.splice(post_index,1);

        await Posts.findByIdAndDelete(post_id);
        await Classes.findOneAndUpdate({class_code: classcode}, class_data);
        res.status(200).json({result: 'OK', message: 'success delete post'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.comment = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const post_id = req.body.post_id;
    const comment_data = req.body.data;
    if (!classcode||!post_id||!comment_data) return res.status(400).json({result: 'Bad request', message: ''});

    //Comment validation
    if (!comment_data.content) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        if (!class_data.class_post_id.includes(post_id)) return res.status(404).json({result: 'Not found', message: ''});
        const post_data = await Posts.findById(post_id);
        if (!post_data) return res.status(404).json({result: 'Not found', message: ''});

        const Comment = require('../models/comment_model');
        Comment.comment_author_id = user_id;
        Comment.content = comment_data.content;

        post_data.comment.push(Comment);

        await Posts.findByIdAndUpdate(post_id, post_data);
        res.status(200).json({result: 'OK', message: 'success add comment'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.deleteComment = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const post_id = req.body.post_id;
    const comment_index = req.body.comment_index;
    if (!classcode||!post_id||!comment_index) return res.status(400).json({result: 'Bad request', message: ''});


    try {
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        if (!class_data.class_post_id.includes(post_id)) return res.status(404).json({result: 'Not found', message: ''});
        const post_data = await Posts.findById(post_id);
        if (!post_data) return res.status(404).json({result: 'Not found', message: ''});

        if (post_data.comment[comment_index].comment_author_id != user_id) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        post_data.comment.splice(comment_index,1);

        await Posts.findByIdAndUpdate(post_id, post_data);
        res.status(200).json({result: 'OK', message: 'success delete comment'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};
