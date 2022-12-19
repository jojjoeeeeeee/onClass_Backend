const Users = require('../models/user_schema');
const Files = require('../models/file_schema');

const { registerValidation } = require('../services/validation');

exports.register = async (req,res) => {
    const { error } = registerValidation(req.body);
    if (error) return res.status(200).json({ result: 'nOK', message: error.details[0].message, data: [] });

    const usernameExist = await Users.findOne({username: req.body.username});
    if (usernameExist) return res.status(200).json({ result: 'nOK', message: 'Username already exists', data: [] });

    const emailExist = await Users.findOne({email: req.body.email});
    if (emailExist) return res.status(200).json({ result: 'nOK', message: 'Email already exists', data: [] });

    try {
        req.body.username = req.body.username.toLowerCase();
        const data = await Users.create(req.body);
        res.status(200).json({ result: 'OK', message: 'success create account', data: [] });
    } catch (e) {
        res.status(500).json({ result: 'Internal Server Error', message: '', data: [] });
    }
};

//เอา isAuth มาเช็คใน header ทุกหน้า
exports.loginSession = async (req,res) => {
    const username = req.username;

    try {
        const users = await Users.findOne({username: username});
        if (!users) return res.status(404).json({ result: 'Not found', message: '', data: [] });
        const user_id = users._id;
        const data = await Users.findById(user_id);
        const userSchema = {
            username: data.username,
            email: data.email,
            profile_pic: null,
            name: data.name,
            class: data.class
        }

        const profile_pic = await Files.findById(data.profile_pic);
        if (profile_pic !== null) {
            userSchema.profile_pic = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${profile_pic.file_path ?? '/public/img/1638125882758-Asset 4@1.png'}`
        }

        res.status(200).json({ result: 'OK', message: 'success token provided', data: [userSchema] });
    } catch (e) {
        res.status(500).json({ result: 'Internal Server Error', message: '', data: [] });
    }
}