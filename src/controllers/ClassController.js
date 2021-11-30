const Users = require('../models/user_schema');
const Classes = require('../models/class_schema');
const Exams = require('../models/exam/examination_schema')
const Posts = require('../models/post_schema');
const Assignments = require('../models/assignment/assignment_schema');
const Files = require('../models/file_schema');

const { generateClasscode } = require('../services/function');
const { classValidation, classNicknameValidation } = require('../services/validation');

const moment = require('moment');

exports.getAll = async (req,res) => {
    const user_id = req.userId;

    try {
        const user = await Users.findById(user_id);
        if (user.class.length == 0) return res.status(200).json({result: 'OK', message: 'No class', data: []});

        const res_class_data = []
        for(let i = 0 ; i < user.class.length ; i++) {
            const data = await Classes.findOne({ class_code: user.class[i].class_code });

            const query_first_teacher = await Users.findById(data.teacher_id[0]);
            

            const first_teacher_details = {
                user_id: query_first_teacher._id,
                username: query_first_teacher.username,
                email: query_first_teacher.email,
                name: query_first_teacher.name,
                optional_contact: query_first_teacher.optional_contact,
                profile_pic: ''
            }

            const profile_pic = await Files.findById(query_first_teacher.profile_pic);
            first_teacher_details.profile_pic = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${profile_pic.file_path}`

            const class_details = {
                class_code: data.class_code,
                class_name: data.class_name,
                class_description: data.class_description,
                class_section: data.class_section,
                class_room: data.class_room,
                class_subject: data.class_subject,
                class_thumbnail: '',
                teacher: first_teacher_details
            }

            const thumbnail = await Files.findById(data.class_thumbnail);
            class_details.class_thumbnail = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${thumbnail.file_path}`

            res_class_data.push(class_details);
        }

        res.status(200).json({result: 'OK', message: '', data: res_class_data});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.get = async (req,res) => {
    const user_id = req.userId;

    const classcode = req.params.class_code;
    if (!classcode) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const data = await Classes.findOne({ class_code: classcode });
        if (!data) return res.status(404).json({result: 'Not found', message: ''});
        if (!data.teacher_id.includes(user_id) && !data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        const teacher_data = []
        for(let i = 0 ; i < data.teacher_id.length ; i++) {
            // console.log(data.teacher_id[i])
            const query = await Users.findById(data.teacher_id[i]);
            const details = {
                user_id: query._id,
                username: query.username,
                email: query.email,
                name: query.name,
                optional_contact: query.optional_contact,
                profile_pic: ''
            }

            const profile_pic = await Files.findById(query.profile_pic);
            details.profile_pic = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${profile_pic.file_path}`
            teacher_data.push(details);
            
        }

        const student_data = []
        for(let i = 0 ; i < data.student_id.length ; i++) {
            // console.log(data.teacher_id[i])
            const query = await Users.findById(data.student_id[i]);
            const details = {
                user_id: query._id,
                username: query.username,
                email: query.email,
                name: query.name,
                optional_contact: query.optional_contact,
                profile_pic: ''
            }

            const profile_pic = await Files.findById(query.profile_pic);
            details.profile_pic = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${profile_pic.file_path}`
            student_data.push(details);
        }

        const assignment_data = []
        for(let i = 0 ; i < data.class_assignment_id.length ; i++) {
            const query = await Assignments.findById(data.class_assignment_id[i]);

            const file_arr = []
            for(let j = 0; j < query.assignment_optional_file.length; j++){
                const file_data = await Files.findById(query.assignment_optional_file[j]);
                if(!file_data) return res.status(404).json({result: 'Not found', message: ''});
                const file_obj = {
                    file_name: file_data.file_name,
                    file_extension: file_data.filename_extension,
                    file_path: `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/file/download/${file_data._id}`
                }
                file_arr.push(file_obj)
            }

            const details = {
                id: query._id,
                assignment_name: query.assignment_name,
                assignment_description: query.assignment_description,
                turnin_late: query.turnin_late,
                score: query.score,
                assignment_optional_file: file_arr,
                comment: query.comment.length,
                assignment_start_date: query.assignment_start_date,
                assignment_end_date: query.assignment_end_date,
                moment_sort: moment(query.created)
            }
            assignment_data.push(details);
        }

        const post_data = []
        for(let i = 0 ; i < data.class_post_id.length ; i++) {
            const query = await Posts.findById(data.class_post_id[i]);
            const user_query = await Users.findById(query.post_author_id);

            const file_arr = []
            for(let j = 0; j < query.post_optional_file.length; j++){
                const file_data = await Files.findById(query.post_optional_file[j]);
                if(!file_data) return res.status(404).json({result: 'Not found', message: ''});
                const file_obj = {
                    file_name: file_data.file_name,
                    file_extension: file_data.filename_extension,
                    file_path: `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/file/download/${file_data._id}`
                }
                file_arr.push(file_obj)
            }

            const details = {
                id: query._id,
                post_author: [{}],
                profile_pic: '',
                type: query.type,
                post_content: query.post_content,
                post_optional_file: file_arr,
                poll: query.poll,
                comment: query.comment.length,
                created: query.created,
                moment_sort: moment(query.created)
            }

            const profile_pic = await Files.findById(user_query.profile_pic);
            details.profile_pic = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${profile_pic.file_path}`

            data.nickname.map(nickKey => {
                if (nickKey.user_id == query.post_author_id) {
                    details.post_author = [nickKey];
                }
            })
            post_data.push(details);
        }
       

        const feed_data = []
        for (let i = 0 ; i < assignment_data.length ; i++) {
            const feed_details = {
                type: 'assignment',
                data: assignment_data[i]
            }
            feed_data.push(feed_details)
        }
        for (let i = 0 ; i < post_data.length ; i++) {
            const feed_details = {
                type: 'post',
                data: post_data[i]
            }
            feed_data.push(feed_details)
        }

        const sorted_feed_data = feed_data.sort((a, b) => a.data.moment_sort.valueOf() - b.data.moment_sort.valueOf())

        const exam_data = []
        for(let i = 0 ; i < data.class_exam_id.length ; i++) {
            const query = await Exams.findById(data.class_exam_id[i]);
            const details = {
                id: query._id,
                name: query.exam_name,
                description: query.exam_description,
                start_date: query.exam_start_date,
                end_date: query.exam_end_date
            }
            exam_data.push(details);
        }
        

        const res_data = {
            class_code: classcode,
            class_name: data.class_name,
            class_description: data.class_description,
            class_section: data.class_section,
            class_room: data.class_room,
            class_subject: data.class_subject,
            class_thumbnail: '',
            teacher: teacher_data,
            student: student_data,
            class_assignment: assignment_data,
            class_post: post_data,
            class_exam: exam_data,
            class_feed: sorted_feed_data.reverse(),
            nickname: data.nickname
        }

        const thumbnail = await Files.findById(data.class_thumbnail);
        res_data.class_thumbnail = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${thumbnail.file_path}`

        res.status(200).json({result: 'OK', message: '', data: [res_data]});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.create = async (req,res) => {
    const user_id = req.userId;

    const { error } = classValidation(req.body);
    if (error) return res.status(200).json({result: 'nOK', message: error.details[0].message});

    var classcode = generateClasscode();
    var classcodeExist = await Classes.findOne({ class_code : classcode });
    while (classcodeExist) {
        classcode = generateClasscode();
        classcodeExist = await Classes.findOne({ class_code : classcode });
    }
    
    try {
        const teacher_id = [user_id];
        req.body.class_code = classcode;
        req.body.teacher_id = teacher_id;
        const data = await Classes.create(req.body);

        const query_user = await Users.findById(user_id);
        var user_class = query_user.class
        const form = {
            role: "teacher",
            class_code: classcode
        }
        user_class.push(form)

        const new_data_user = query_user;
        new_data_user.class = user_class;

        const data_user = await Users.findByIdAndUpdate(user_id, new_data_user);
        res.status(200).json({result: 'OK', message: 'success create class', data: classcode});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }

};

exports.editDetails = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    if (!classcode) return res.status(400).json({result: 'Bad request', message: ''});

    const { error } = classValidation(req.body.data);
    if (error) return res.status(200).json({result: 'nOK', message: error.details[0].message});

    const data = req.body.data;

    try {
        const query = await Classes.findOne({ class_code: classcode })
        if (!query) return res.status(404).json({result: 'Not found', message: ''});
        if (!query.teacher_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        query.class_name = data.class_name;
        query.class_description = data.class_description;
        query.class_section = data.class_section;
        query.class_room = data.class_room;
        query.class_subject = data.class_subject;
        query.class_thumbnail = data.class_thumbnail;

        const updated_class_data = await Classes.findOneAndUpdate({ class_code : classcode }, query);
        res.status(200).json({result: 'OK', message: 'success edit class details'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.editRoles = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const data = req.body.data;

    if (!classcode||!data) return res.status(400).json({result: 'Bad request', message: ''});
    if (!data.teacher_id||!data.student_id) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const query = await Classes.findOne({ class_code: classcode })
        if (!query) return res.status(404).json({result: 'Not found', message: ''});
        if (!query.teacher_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        const user_idArr = []
        for(let i = 0 ; i < data.student_id.length ; i++) {
            user_idArr.push(data.student_id[i]);
        }

        for(let i = 0 ; i < data.teacher_id.length ; i++) {
            user_idArr.push(data.teacher_id[i]);
        }

        user_idArr.map(usrid => {
            if(!query.teacher_id.includes(usrid) && !query.student_id.includes(usrid)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});
        });

        if (data.teacher_id.length >= 1 ) {
            for(let i = 0 ; i < data.teacher_id.length ; i++){
                const usr = await Users.findById(data.teacher_id[i]);
                for(let j = 0 ; j < usr.class.length ; j++) {
                    usr.class[j].role = 'teacher'
                    await Users.findByIdAndUpdate(data.teacher_id[i], usr);
                }
            }

            for(let i = 0 ; i < data.student_id.length ; i++){
                const usr = await Users.findById(data.student_id[i]);
                for(let j = 0 ; j < usr.class.length ; j++) {
                    usr.class[j].role = 'student'
                    await Users.findByIdAndUpdate(data.student_id[i], usr);
                }
            }

            query.teacher_id = data.teacher_id;
            query.student_id = data.student_id;
            const updated_class_data = await Classes.findOneAndUpdate({ class_code : classcode }, query);
        }
        else {
            return res.status(403).json({result: 'Forbiden', message: 'access is denied'});
        }

        res.status(200).json({result: 'OK', message: 'success edit class details'});
        
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.join = async (req,res) => {
    const user_id = req.userId;
    const classcode  = req.body.class_code;
    if (!classcode) return res.status(400).json({result: 'Bad request', message: ''});
    
    try {
        const query = await Classes.findOne({ class_code: classcode })
        if (!query) return res.status(404).json({result: 'Not found', message: ''});
        if (query.teacher_id.includes(user_id) || query.student_id.includes(user_id)) return res.status(200).json({result: 'nOK', message: 'failed you already joned'});

        var student_id = query.student_id;
        student_id.push(user_id);
        
        const new_data = query;
        new_data.student_id = student_id;

        const data = await Classes.findOneAndUpdate({ class_code: classcode }, new_data);
        

        const query_user = await Users.findById(user_id);
        
        const form = {
            role: "student",
            class_code: classcode
        }
        query_user.class.push(form)

        for(let i = 0 ; i < data.class_assignment_id.length; i++) {
            const assignment_id = data.class_assignment_id[i];
            const assignment_data = await Assignments.findById(assignment_id);
            const notificationSchema = {
                class_code: classcode,
                type: 'assignment',
                message: `You're not turn in ${assignment_data.assignment_name}`,
                todo_id: assignment_id
            }
            query_user.notification.push(notificationSchema);
        }
        
        const data_user = await Users.findByIdAndUpdate(user_id, query_user);
        res.status(200).json({result: 'OK', message: 'success join class'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.nickname = async (req,res) => {
    const user_id = req.userId;

    const { error } = classNicknameValidation(req.body);
    if (error) return res.status(200).json({result: 'nOK', message: error.details[0].message});

    const classcode = req.body.class_code;
    
    try {
        const query = await Classes.findOne({ class_code: classcode })
        if (!query) return res.status(404).json({result: 'Not found', message: ''});
        if (!query.teacher_id.includes(user_id) && !query.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        var nickname = query.nickname;
        var alreadyNicknamed = false
        const form = {
            user_id: user_id,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            optional_name: req.body.optional_name
        }

        query.nickname.map((key,index) => {
            if (key.user_id == user_id) {
                nickname[index] = form
                alreadyNicknamed = true
            }
        })
        
        if (!alreadyNicknamed) {
            nickname.push(form)
        }
        
        const new_data = query;
        new_data.nickname = nickname;

        const data = await Classes.findOneAndUpdate({ class_code: classcode }, new_data);
        res.status(200).json({result: 'OK', message: 'success change class nickname'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.leave = async (req,res) => {
    const user_id = req.userId;

    const classcode  = req.body.class_code;
    if (!classcode) return res.status(400).json({result: 'Bad request', message: ''});
    
    try {
        const query = await Classes.findOne({ class_code: classcode })
        if (!query) return res.status(404).json({result: 'Not found', message: ''});
        if (!query.teacher_id.includes(user_id) && !query.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        if (query.teacher_id.includes(user_id)) return res.status(200).json({result: 'nOK', message: 'failed you are class teacher'});

        const student_id = query.student_id;
        const student_id_index = student_id.indexOf(user_id)
        student_id.splice(student_id_index,1)

        const data = await Classes.findOneAndUpdate({ class_code: classcode }, query);


        const query_user = await Users.findById(user_id);
        var user_class = query_user.class
        const user_class_index = user_class.indexOf(classcode)
        user_class.splice(user_class_index,1)

        const new_data_user = query_user;
        new_data_user.class = user_class;
        
        const data_user = await Users.findByIdAndUpdate(user_id, new_data_user);
        res.status(200).json({result: 'OK', message: 'success leave class'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};