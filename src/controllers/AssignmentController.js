const Users = require('../models/user_schema');
const Classes = require('../models/class_schema');
const Assignments = require('../models/assignment/assignment_schema');
const AssignmentResults = require('../models/assignment/assignment_result_schema');
const Files = require('../models/file_schema');

const moment = require('moment');

const turnIn_status = ['ส่งแล้ว','ส่งช้า','ยังไม่ส่ง','เลยกำหนดส่ง']

exports.get = async (req,res) => {
    const user_email = req.userEmail;
    const classcode = req.body.class_code;
    const assignment_id = req.body.assignment_id;
    if (!classcode||!assignment_id) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const users = await Users.findOne({ email: user_email })
        if (!users) return res.status(404).json({result: 'Not found', message: ''});
        const user_id = users._id;
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});
        
        if (!class_data.class_assignment_id.includes(assignment_id)) return res.status(404).json({result: 'Not found', message: ''});
        const assignment_data = await Assignments.findById(assignment_id);
        if (!assignment_data) return res.status(404).json({result: 'Not found', message: ''}); 

        if(class_data.student_id.includes(user_id)) {
            //Validate time
            const now = moment();
            const end = moment(assignment_data.assignment_end_date);
            //ส่งได้ก็ต่อเมื่อ ก่อนเวลาที่กำหนด หรือถ้าเลยเวลาแล้ว turnin_late จะต้องเป็นจริง
            var can_submit = false
            if (now.isBefore(end)) {
                can_submit = true
            }
            else {
                can_submit = (now.isAfter(end) && assignment_data.turnin_late);
            }

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
                    file_path: `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api/file/download/${file_data._id}`
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
                var std_result_index = -1
                for(let i = 0; i < assignmentResultData.student_result.length; i++){
                    if (assignmentResultData.student_result[i].student_id === user_id) {
                        std_result_index = i
                    }
                }

                const std_file_id = assignmentResultData.student_result[std_result_index].file_result;

                const std_file_arr = []
                for(let i = 0; i < std_file_id.length; i++){

                    const std_file_data = await Files.findById(std_file_id[i]);
                    if(!std_file_data) return res.status(404).json({result: 'Not found', message: ''});
                    const std_file_obj = {
                        file_name: std_file_data.file_name,
                        file_extension: std_file_data.filename_extension,
                        file_path: `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api/file/download/${std_file_data._id}`
                    }
                    std_file_arr.push(std_file_obj)
                }


                std_submitResult.file_result = std_file_arr;
                std_submitResult.answer_result = assignmentResultData.student_result[std_result_index].answer_result;
                std_submitResult.isLate = assignmentResultData.student_result[std_result_index].isLate;
            }

            //Status validate
            var status = ''

            if(already && !std_submitResult.isLate) {
                status = turnIn_status[0] //ส่งแล้ว
            }
            else if(already && std_submitResult.isLate) {
                status = turnIn_status[1] //ส่งช้า
            }

            if (!already && (now.isBefore(end) || assignment_data.turnin_late)) {
                status = turnIn_status[2] //ยังไม่ส่ง
            }
            else if(!already && now.isAfter(end) && !assignment_data.turnin_late) {
                status = turnIn_status[3] //เลยกำหนดส่ง
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
                status: status,
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

            res.status(200).json({result: 'OK', message: '', data: [res_assignment_data]});
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
                    file_path: `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api/file/download/${file_data._id}`
                }
                file_arr.push(file_obj)
            }

            const student_result = []
            const res_assignment_data = {
                id:assignment_data._id,
                assignment_name: assignment_data.assignment_name,
                assignment_description: assignment_data.assignment_description,
                score: assignment_data.score,
                assignment_optional_file: file_arr,
                assignment_start_date: assignment_data.assignment_start_date,
                assignment_end_date: assignment_data.assignment_end_date,
                assignment_student_result: student_result,
                comment: [],
                role: 'teacher'
            }

            const assignmentResultData = await AssignmentResults.findOne({ assignment_id : assignment_id});

            assignmentResultData.student_result.map(async key => {
                const result_file_arr = []
                for (let i = 0 ; i < key.file_result.length ; i++) {
                    const result_file_data = await Files.findById(key.file_result[i]);
                    if(!result_file_data) return res.status(404).json({result: 'Not found', message: ''});
                    const result_file_obj = {
                        file_name: result_file_data.file_name,
                        file_extension: result_file_data.filename_extension,
                        file_path: `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api/file/download/${result_file_data._id}`
                    }
                    result_file_arr.push(result_file_obj)
                }

                const std_submitResult = {
                    student_id: key.student_id,
                    file_result: result_file_arr,
                    answer_result: key.answer_result,
                    isLate: key.isLate
                }
                student_result.push(std_submitResult)
            });

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
            res.status(200).json({result: 'OK', message: '', data: [res_assignment_data]});
        }
        
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.getAll = async (req,res) => {
    const user_email = req.userEmail;
    const classcode = req.body.class_code;
    if (!classcode) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const users = await Users.findOne({ email: user_email })
        if (!users) return res.status(404).json({result: 'Not found', message: ''});
        const user_id = users._id;
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        const assignment_data = []
        if (class_data.student_id.includes(user_id)) {
            for(let i = 0 ; i < class_data.class_assignment_id.length ; i++) {
                const query = await Assignments.findById(class_data.class_assignment_id[i]);

                var status = ''

                //Status validate

                const assignmentResultData = await AssignmentResults.findOne({ assignment_id : query._id});
                var already = false
                var isLate = false
                for(let i = 0 ; i < assignmentResultData.student_result.length; i++){
                    if (assignmentResultData.student_result[i].student_id == user_id) {
                        already = true
                        isLate = assignmentResultData.student_result[i].isLate
                    }
                }

                if(already && !isLate) {
                    status = turnIn_status[0] //ส่งแล้ว
                }
                else if(already && isLate) {
                    status = turnIn_status[1] //ส่งช้า
                }

                const now = moment();
                const end = moment(query.assignment_end_date);
                if (!already && (now.isBefore(end) || query.turnin_late)) {
                    status = turnIn_status[2] //ยังไม่ส่ง
                }
                else if(!already && now.isAfter(end) && !query.turnin_late) {
                    status = turnIn_status[3] //เลยกำหนดส่ง
                }

                const details = {
                    id: query._id,
                    assignment_name: query.assignment_name,
                    assignment_description: query.assignment_description,
                    score: query.score,
                    assignment_start_date: query.assignment_start_date,
                    assignment_end_date: query.assignment_end_date,
                    created: moment(query.created),
                    status: status
                }
                
                assignment_data.push(details);
            }
            const sorted_feed_data = assignment_data.sort((a, b) => a.created.valueOf() - b.created.valueOf())
            res.status(200).json({result: 'OK', message: '', data: sorted_feed_data.reverse()});
        }
        else {
            for(let i = 0 ; i < class_data.class_assignment_id.length ; i++) {
                const query = await Assignments.findById(class_data.class_assignment_id[i]);

                //Submit Amount Validate
                const assignmentResultData = await AssignmentResults.findOne({ assignment_id : query._id});
                const student_submit_amont = assignmentResultData.student_result.length
                const student_amount = class_data.student_id.length;
                const status = `${student_submit_amont}/${student_amount}`
    
                const details = {
                    id: query._id,
                    assignment_name: query.assignment_name,
                    assignment_description: query.assignment_description,
                    score: query.score,
                    assignment_start_date: query.assignment_start_date,
                    assignment_end_date: query.assignment_end_date,
                    created: moment(query.created),
                    status: status
                }

                assignment_data.push(details);
            }
            const sorted_feed_data = assignment_data.sort((a, b) => a.created.valueOf() - b.created.valueOf())
            res.status(200).json({result: 'OK', message: '', data: sorted_feed_data.reverse()});
        }
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.getAllFromNotification = async (req,res) => {
    const user_email = req.userEmail;

    try {
        const users = await Users.findOne({ email: user_email })
        if (!users) return res.status(404).json({result: 'Not found', message: ''});
        const user_id = users._id;
        const data = await Users.findById(user_id);

        const res_data = []
        for(let i = 0 ; i < data.notification.length ; i++) {
            if (data.notification[i].type == 'assignment') {
                const query = await Assignments.findById(data.notification[i].todo_id);
                const class_data = await Classes.findOne({ class_code: data.notification[i].class_code});

                var status = ''

                //Status validate

                const now = moment();
                const end = moment(query.assignment_end_date);
                if (now.isBefore(end) || query.turnin_late) {
                    status = turnIn_status[2] //ยังไม่ส่ง
                }
                else if(now.isAfter(end) && !query.turnin_late) {
                    status = turnIn_status[3] //เลยกำหนดส่ง
                }

                const details = {
                    id: query._id,
                    class_name: class_data.class_name,
                    assignment_name: query.assignment_name,
                    assignment_description: query.assignment_description,
                    score: query.score,
                    assignment_start_date: query.assignment_start_date,
                    assignment_end_date: query.assignment_end_date,
                    message: data.notification[i].message,
                    created: moment(query.created),
                    status: status
                }

                res_data.push(details);
            }
        }
        const sorted_feed_data = res_data.sort((a, b) => a.created.valueOf() - b.created.valueOf())
        res.status(200).json({result: 'OK', message: '', data: res_data.reverse()});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.create = async (req,res) => {
    const user_email = req.userEmail;
    const classcode = req.body.class_code;
    const assignment_data = req.body.data;

    if (!classcode||!assignment_data) return res.status(400).json({result: 'Bad request', message: ''});

    //Assignment validation
    if (!assignment_data.assignment_name||!assignment_data.assignment_description||!assignment_data.score||!assignment_data.assignment_optional_file||!assignment_data.assignment_end_date) return res.status(400).json({result: 'Bad request', message: ''});

    if (typeof assignment_data.turnin_late != 'boolean') return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const users = await Users.findOne({ email: user_email })
        if (!users) return res.status(404).json({result: 'Not found', message: ''});
        const user_id = users._id;
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});
        console.log('TEST1',assignment_data);
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

        for(let i = 0; i < class_data.student_id.length; i++) {
            const user = await Users.findById(class_data.student_id[i]);
            user.notification.push(notificationSchema);
            await Users.findByIdAndUpdate(class_data.student_id[i], user);
        }

        const resultSchema = {
            assignment_id: assignment._id,
            class_code: classcode,
            student_result: [],
            student_score: [],
        }
        
        await AssignmentResults.create(resultSchema);
        await Classes.findOneAndUpdate({class_code: classcode}, class_data);
        res.status(200).json({result: 'OK', message: 'success create assignment'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.delete = async (req,res) => {
    const user_email = req.userEmail;
    const classcode = req.body.class_code;
    const assignment_id = req.body.assignment_id;

    if (!classcode||!assignment_id) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const users = await Users.findOne({ email: user_email })
        if (!users) return res.status(404).json({result: 'Not found', message: ''});
        const user_id = users._id;
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        if (!class_data.class_assignment_id.includes(assignment_id)) return res.status(404).json({result: 'Not found', message: ''});
        const assignment_data = await Assignments.findById(assignment_id);
        if (!assignment_data) return res.status(404).json({result: 'Not found', message: ''});

        const assignment_index = class_data.class_assignment_id.indexOf(assignment_id);
        class_data.class_assignment_id.splice(assignment_index,1);

        for(let i = 0; i < class_data.student_id.length; i++) {
            const user = await Users.findById(class_data.student_id[i]);
            var user_assignment_index = -1

            for(let j = 0; j < user.notification.length; j++) {
                if (user.notification[j].todo_id === assignment_id && user.notification[j].class_code === classcode) {
                    user_assignment_index = j
                }
            }

            user.notification.splice(user_assignment_index,1);
            await Users.findByIdAndUpdate(class_data.student_id[i], user);
        }

        await Assignments.findByIdAndDelete(assignment_id);
        await AssignmentResults.findOneAndDelete({ assignment_id : assignment_id});
        await Classes.findOneAndUpdate({class_code: classcode}, class_data);
        res.status(200).json({result: 'OK', message: 'success delete assignment'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.stdSubmit = async (req,res) => {
    const user_email = req.userEmail;
    const classcode = req.body.class_code;
    const assignment_id = req.body.assignment_id;
    const submitResult = req.body.data;

    if (!classcode||!assignment_id||!submitResult) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const users = await Users.findOne({ email: user_email })
        if (!users) return res.status(404).json({result: 'Not found', message: ''});
        const user_id = users._id;
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        if (!class_data.class_assignment_id.includes(assignment_id)) return res.status(404).json({result: 'Not found', message: ''});
        const assignment_data = await Assignments.findById(assignment_id);
        if (!assignment_data) return res.status(404).json({result: 'Not found', message: ''});

        const now = moment();
        const end = moment(assignment_data.assignment_end_date);
        if (now.isAfter(end) && !assignment_data.turnin_late) return res.status(200).json({result: 'nOK', message: 'You cannot turn in late in this assignment'});

        const isLate = now.isAfter(end);

        const assignmentResultData = await AssignmentResults.findOne({ assignment_id: assignment_id });

        //Cannot submit twice
        for(let i = 0; i < assignmentResultData.student_result.length; i++){
            if(assignmentResultData.student_result[i].student_id === user_id) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});
        }

        const resultSchema = {
            student_id: user_id,
            file_result: submitResult.file_result,
            answer_result: submitResult.answer_result,
            isLate: isLate
        }

        assignmentResultData.student_result.push(resultSchema);
        await AssignmentResults.findByIdAndUpdate(assignmentResultData._id, assignmentResultData);


        const user = await Users.findById(user_id);
        var user_assignment_index = -1
        for(let i = 0; i < user.notification.length; i++) {
            if (user.notification[i].todo_id === assignment_id && user.notification[i].class_code === classcode) {
                user_assignment_index = i
            }
        }

        user.notification.splice(user_assignment_index,1);
        await Users.findByIdAndUpdate(user_id, user);
        res.status(200).json({result: 'OK', message: 'success submit assignment result'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.scoreSubmit = async (req,res) => {
    const user_email = req.userEmail;
    const classcode = req.body.class_code;
    const assignment_id = req.body.assignment_id;
    const score_data = req.body.data;

    if (!classcode||!assignment_id||!score_data) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const users = await Users.findOne({ email: user_email })
        if (!users) return res.status(404).json({result: 'Not found', message: ''});
        const user_id = users._id;
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
    const user_email = req.userEmail;
    const classcode = req.body.class_code;
    const assignment_id = req.body.id;
    const comment_data = req.body.data;
    if (!classcode||!assignment_id||!comment_data) return res.status(400).json({result: 'Bad request', message: ''});

    //Comment validation
    if (!comment_data.content) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const users = await Users.findOne({ email: user_email })
        if (!users) return res.status(404).json({result: 'Not found', message: ''});
        const user_id = users._id;
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        if (!class_data.class_assignment_id.includes(assignment_id)) return res.status(404).json({result: 'Not found', message: ''});
        const assignment_data = await Assignments.findById(assignment_id);
        if (!assignment_data) return res.status(404).json({result: 'Not found', message: ''});

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
    const user_email = req.userEmail;
    const classcode = req.body.class_code;
    const assignment_id = req.body.assignment_id;
    const comment_index = req.body.comment_index;
    if (!classcode||!assignment_id||!comment_index) return res.status(400).json({result: 'Bad request', message: ''});


    try {
        const users = await Users.findOne({ email: user_email })
        if (!users) return res.status(404).json({result: 'Not found', message: ''});
        const user_id = users._id;
        const class_data = await Classes.findOne({ class_code: classcode })
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        if (!class_data.class_assignment_id.includes(assignment_id)) return res.status(404).json({result: 'Not found', message: ''});
        const assignment_data = await Assignments.findById(assignment_id);
        if (!assignment_data) return res.status(404).json({result: 'Not found', message: ''});

        if (assignment_data.comment[comment_index].comment_author_id != user_id) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        assignment_data.comment.splice(comment_index,1);

        await Assignments.findByIdAndUpdate(assignment_id, assignment_data);
        res.status(200).json({result: 'OK', message: 'success delete comment'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};
