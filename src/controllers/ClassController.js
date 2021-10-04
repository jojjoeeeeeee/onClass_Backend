const Users = require('../models/user_schema');
const Classes = require('../models/class_schema');

const { generateClasscode } = require('../services/classServices');
const { classValidation, classNicknameValidation } = require('../services/validation');

exports.get = async (req,res) => {

    const user_id = req.userId

    const classcode = req.body.class_code;
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
                username: query.username,
                email: query.email,
                name: query.name,
                profile_pic: query.profile_pic
            }
            teacher_data.push(details);
            
        }

        const student_data = []
        for(let i = 0 ; i < data.student_id.length ; i++) {
            // console.log(data.teacher_id[i])
            const query = await Users.findById(data.student_id[i]);
            const details = {
                username: query.username,
                email: query.email,
                name: query.name,
                profile_pic: query.profile_pic
            }
            student_data.push(details);
        }
        

        const res_data = {
            class_code: classcode,
            class_name: data.class_name,
            class_description: data.class_description,
            class_section: data.class_section,
            class_room: data.class_room,
            class_subject: data.class_subject,
            class_thumbnail: data.class_thumbnail,
            teacher: teacher_data,
            student: student_data,
            class_assignment_id: data.class_assignment_id,
            class_post_id: data.class_post_id,
            class_exam_id: data.class_exam_id,
            nickname: data.nickname
        }

        res.status(200).json({result: 'OK', message: '', data: res_data});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.create = async (req,res) => {
    const user_id = req.userId;

    const { error } = classValidation(req.body);
    if (error) return res.status(400).json({result: 'Bad request', message: error.details[0].message});

    var classcode = generateClasscode;
    var classcodeExist = await Classes.findOne({ class_code : classcode });
    while (classcodeExist) {
        classcode = generateClasscode;
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
        res.status(200).json({result: 'OK', message: 'success created class'});
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
        if (query.teacher_id.includes(user_id) || query.student_id.includes(user_id)) return res.status(200).json({result: 'OK', message: 'failed you already joned'});

        var student_id = query.student_id;
        student_id.push(user_id);
        
        const new_data = query;
        new_data.student_id = student_id;

        const data = await Classes.findOneAndUpdate({ claass_code: classcode }, new_data);

        const query_user = await Users.findById(user_id);
        var user_class = query_user.class
        const form = {
            role: "student",
            class_code: classcode
        }
        user_class.push(form)

        const new_data_user = query_user;
        new_data_user.class = user_class;
        
        const data_user = await Users.findByIdAndUpdate(user_id, new_data_user);
        res.status(200).json({result: 'OK', message: 'success joined class'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.nickname = async (req,res) => {
    const user_id = req.userId;

    const { error } = classNicknameValidation(req.body);
    if (error) return res.status(400).json({result: 'Bad request', message: error.details[0].message});

    const classcode = req.body.class_code;
    
    try {
        const query = await Classes.findOne({ class_code: classcode })
        if (!query) return res.status(404).json({result: 'Not found', message: ''});
        if (!query.teacher_id.includes(user_id) && !query.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        var nickname = query.nickname;
        const form = {
            user_id: user_id,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            optional_name: req.body.optional_name
        }
        nickname.push(form)
        
        const new_data = query;
        new_data.nickname = nickname;

        const data = await Classes.findOneAndUpdate({ claass_code: classcode }, new_data);
        res.status(200).json({result: 'OK', message: 'success changed class nickname'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.leave = async (req,res) => {

};