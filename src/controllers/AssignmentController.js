const Users = require('../models/user_schema');
const Classes = require('../models/class_schema');
const Assignments = require('../models/assignment/assignment_schema');
const AssignmentResults = require('../models/assignment/assignment_result_schema');

const moment = require('moment');

exports.get = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const assignment_id = req.body.assignment_id;
    if (!classcode||!assignment_id) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});
        
        if (!class_data.class_assignment_id.includes(assignment_id)) res.status(404).json({result: 'Not found', message: ''});
        const assignment_data = await Assignments.findById(assignment_id);
        if (!assignment_data) res.status(404).json({result: 'Not found', message: ''}); 

        if(class_data.student_id.includes(user_id)) {
            //Validate time
            const now = moment();
            const end = moment(assignment_data.exam_end_date);
            var can_submit = (now.isAfter(end) && assignment_data.turnin_late);

            //File download path
            const file_id = assignment_data.assignment_optional_file.map(key => {
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

            //Already submit validate
            const assignmentResultData = await AssignmentResults.findOne({ assignment_id : assignment_id});
            var already = false
            assignmentResultData.student_result.map((assignmentKey) => {
                if (assignmentKey.student_id == user_id) return already = true
            });
            //if already submit cant re submit
            can_submit = !already


            const std_submitResult = {
                file_result: [],
                answer_result: '',
                isLate: false
            }

            if (already) {
                const std_result_index = assignmentResultData.student_result.map((assignmentKey,index) => {
                    if (assignmentKey.student_id == user_id) return index
                });

                const std_file_id = assignmentResultData.student_result[std_result_index].map(key => {
                    return key.file_result
                })

                const std_file_arr = []
                for(let i = 0; i < std_file_id.length; i++){
                    const std_file_data = await Files.findById(std_file_id[i]);
                    if(!std_file_data) return res.status(404).json({result: 'Not found', message: ''});
                    const std_file_obj = {
                        file_name: std_file_data.file_name,
                        file_extension: std_file_data.filename_extension,
                        file_path: `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/file/download/${std_file_data._id}`
                    }
                    std_file_arr.push(std_file_obj)
                }

                std_submitResult.file_result = std_file_arr;
                std_submitResult.answer_result = assignmentResultData.student_result[std_result_index].answer_result;
                std_submitResult.isLate = assignmentResultData.student_result[std_result_index].isLate;
            }

            const res_assignment_data = {
                id:assignment_data._id,
                assignment_name: assignment_data.assignment_name,
                assignment_description: assignment_data.assignment_description,
                score: assignment_data.score,
                assignment_optional_file: file_arr,
                assignment_start_date: assignment_data.assignment_start_date,
                assignment_end_date: assignment_data.assignment_end_date,
                can_submit: can_submit,
                submit_result: std_submitResult,
                comment: [],
                role: 'student'
            }

            const assignmentComment = []
            for (let i = 0 ; i < assignment_data.comment.length ; i++) {
                const commentSchema = {
                    comment_author: {},
                    profile_pic: '',
                    content: assignment_data.comment[i].content,
                    create: assignment_data.comment[i].created
                }

                class_data.nickname.map(nickKey => {
                    if (nickKey.user_id == assignment_data.comment[i].comment_author_id) {
                        commentSchema.comment_author = nickKey;
                    }
                })

                const query = await Users.findById(assignment_data.comment[i].comment_author_id);
                const comment_profile_pic = await Files.findById(query.profile_pic);
                commentSchema.profile_pic = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${comment_profile_pic.file_path}`
                assignmentComment.push(commentSchema);
            }

            res_assignment_data.comment = assignmentComment;

            res.status(200).json({result: 'OK', message: '', data: res_assignment_data});
        }
        else {
            //File download path
            const file_id = assignment_data.assignment_optional_file.map(key => {
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

            const res_assignment_data = {
                id:assignment_data._id,
                assignment_name: assignment_data.assignment_name,
                assignment_description: assignment_data.assignment_description,
                score: assignment_data.score,
                assignment_optional_file: file_arr,
                assignment_start_date: assignment_data.assignment_start_date,
                assignment_end_date: assignment_data.assignment_end_date,
                comment: [],
                role: 'teacher'
            }

            const assignmentComment = []
            for (let i = 0 ; i < assignment_data.comment.length ; i++) {
                const commentSchema = {
                    comment_author: {},
                    profile_pic: '',
                    content: assignment_data.comment[i].content,
                    create: assignment_data.comment[i].created
                }

                class_data.nickname.map(nickKey => {
                    if (nickKey.user_id == assignment_data.comment[i].comment_author_id) {
                        commentSchema.comment_author = nickKey;
                    }
                })

                const query = await Users.findById(assignment_data.comment[i].comment_author_id);
                const comment_profile_pic = await Files.findById(query.profile_pic);
                commentSchema.profile_pic = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${comment_profile_pic.file_path}`
                assignmentComment.push(commentSchema);
            }

            res_assignment_data.comment = assignmentComment;
            res.status(200).json({result: 'OK', message: '', data: res_assignment_data});
        }
        
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.getAll = async (req,res) => {

};

exports.getAllFromNotification = async (req,res) => {

};

exports.create = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const assignment_data = req.body.data;

    if (!classcode||!assignment_data) return res.status(400).json({result: 'Bad request', message: ''});

    //Assignment validation
    if (!assignment_data.assignment_name||!assignment_data.assignment_description||!assignment_data.score||!assignment_data.assignment_optional_file||!assignment_data.assignment_end_date) return res.status(400).json({result: 'Bad request', message: ''});

    if (typeof assignment_data.turnin_late != 'boolean') return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        const assignmentSchema = {
            class_code: classcode,
            assignment_name: assignment_data.assignment_name,
            assignment_description: assignment_data.assignment_description,
            turnin_late: assignment_data.turnin_late,
            score: assignment_data.score,
            assignment_optional_file: assignment_data.assignment_optional_file,
            comment: [],
            assignment_end_date: assignment_data.assignment_end_date
        }

        const assignment = await Assignments.create(assignmentSchema);
        class_data.class_assignment_id.push(assignment._id);

        const notificationSchema = {
            class_code: classcode,
            type: 'assignment',
            message: `You're not turn in ${assignment_data.assignment_name}`,
            todo_id: assignment._id
        }

        const user = await Users.findById(user_id);
        user.notification.push(notificationSchema);

        const resultSchema = {
            assignment_id: assignment._id,
            class_code: classcode,
            student_result: [],
            student_score: [],
        }
        
        await AssignmentResults.create(resultSchema);
        await Users.findByIdAndUpdate(user_id, user);
        await Classes.findOneAndUpdate({class_code: classcode}, class_data);
        res.status(200).json({result: 'OK', message: 'success create assignment'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.delete = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const assignment_id = req.body.assignment_id;

    if (!classcode||!assignment_id) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        if (!class_data.class_assignment_id.includes(assignment_id)) res.status(404).json({result: 'Not found', message: ''});
        const assignment_data = await Posts.findById(assignment_id);
        if (!assignment_data) return res.status(404).json({result: 'Not found', message: ''});

        const assignment_index = class_data.class_assignment_id.indexOf(assignment_id);
        class_data.class_assignment_id.splice(assignment_index,1);

        const user = await Users.findById(user_id);
        const user_assignment_index = user.notification.map( (key,index) => {
            if (key.todo_id == assignment_id && key.class_code == classcode) return index
        });

        user.notification.splice(user_assignment_index,1);

        await Assignments.findByIdAndDelete(assignment_id);
        await Classes.findOneAndUpdate({class_code: classcode}, class_data);
        await Users.findByIdAndUpdate(user_id, user);
        res.status(200).json({result: 'OK', message: 'success delete assignment'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.stdSubmit = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const assignment_id = req.body.assignment_id;
    const submitResult = req.body.data;

    if (!classcode||!assignment_id||!submitResult) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        if (!class_data.class_assignment_id.includes(assignment_id)) res.status(404).json({result: 'Not found', message: ''});
        const assignment_data = await Posts.findById(assignment_id);
        if (!assignment_data) return res.status(404).json({result: 'Not found', message: ''});

        const now = moment();
        const end = moment(assignment_data.exam_end_date);
        if (now.isAfter(end) && assignment_data.turnin_late) return res.status(200).json({result: 'nOK', message: 'You cannot turn in late in this assignment'});

        const isLate = now.isAfter(end);

        const assignmentResultData = await AssignmentResults.findOne({ assignment_id: assignment_id });

        const resultSchema = {
            student_id: user_id,
            file_result: submitResult.file_result,
            answer_result: submitResult.answer_result,
            isLate: isLate
        }

        assignmentResultData.student_result.push(resultSchema);
        await AssignmentResults.findByIdAndUpdate(assignmentResultData._id, assignmentResultData);

        const user = await Users.findById(user_id);
        const user_assignment_index = user.notification.map( (key,index) => {
            if (key.todo_id == assignment_id && key.class_code == classcode) return index
        });

        user.notification.splice(user_assignment_index,1);
        await Users.findByIdAndUpdate(user_id, user);
        res.status(200).json({result: 'OK', message: 'success submit assignment result'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.scoreSubmit = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const assignment_id = req.body.assignment_id;
    const score_data = req.body.data;

    if (!classcode||!assignment_id||!score_data) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const class_data = await Classes.findOne({ class_code: classcode });
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        if (!class_data.class_assignment_id.includes(assignment_id)) return res.status(404).json({result: 'Not found', message: ''});

        const assignment_data = await Assignments.findById(assignment_id);
        if (!assignment_data) return res.status(404).json({result: 'Not found', message: ''});
        const assignment_result_data = await AssignmentResults.findOne({ assignment_id : assignment_id });

        const alreadyScoreStdArr = assignment_result_data.student_score.map((score) => {
            return score.student_id
        });

        score_data.map(key => {
            alreadyScoreStdArr.map(alreadyVal => {
                if (alreadyVal == key.student_id) {
                    assignment_result_data.student_score.map((std,index) => {
                        if (std.student_id == key.student_id) {
                            assignment_result_data.student_score.splice(index,1)
                        }
                    });
                }
            });
            assignment_result_data.student_score.push(key);
        });

        await AssignmentResults.findOneAndUpdate({ assignment_id : assignment_id }, assignment_result_data); 
        res.status(200).json({result: 'OK', message: 'success add student assignment score'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.comment = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const assignment_id = req.body.post_id;
    const comment_data = req.body.data;
    if (!classcode||!assignment_id||!comment_data) return res.status(400).json({result: 'Bad request', message: ''});

    //Comment validation
    if (!comment_data.content) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        if (!class_data.class_assignment_id.includes(assignment_id)) res.status(404).json({result: 'Not found', message: ''});
        const assignment_data = await Assignments.findById(assignment_id);
        if (!assignment_data) res.status(404).json({result: 'Not found', message: ''});

        const Comment = require('../models/comment_model');
        Comment.comment_author_id = user_id;
        Comment.content = comment_data.content;

        assignment_data.comment.push(Comment);

        await Assignments.findByIdAndUpdate(assignment_id, assignment_data);
        res.status(200).json({result: 'OK', message: 'success add comment'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.deleteComment = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const assignment_id = req.body.post_id;
    const comment_index = req.body.comment_index;
    if (!classcode||!assignment_id||!comment_index) return res.status(400).json({result: 'Bad request', message: ''});


    try {
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        if (!class_data.class_assignment_id.includes(assignment_id)) res.status(404).json({result: 'Not found', message: ''});
        const assignment_data = await Posts.findById(assignment_id);
        if (!assignment_data) res.status(404).json({result: 'Not found', message: ''});

        if (assignment_data.comment[comment_index].comment_author_id != user_id) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        assignment_data.comment.splice(comment_index,1);

        await Assignments.findByIdAndUpdate(post_id, post_data);
        res.status(200).json({result: 'OK', message: 'success delete comment'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};
