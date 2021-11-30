const Users = require('../models/user_schema');
const bcrypt = require('bcryptjs');
const jwt = require('../jwt');
const Files = require('../models/file_schema');

const { loginValidation, registerValidation } = require('../services/validation');

exports.register = async (req,res) => {
    const { error } = registerValidation(req.body);
    if (error) return res.status(200).json({result: 'nOK', message: error.details[0].message});

    const usernameExist = await Users.findOne({username: req.body.username});
    if (usernameExist) return res.status(200).json({result: 'nOK', message: 'Username already exists'});

    const emailExist = await Users.findOne({email: req.body.email});
    if (emailExist) return res.status(200).json({result: 'nOK', message: 'Email already exists'});

    try {
        req.body.password = await bcrypt.hash(req.body.password, 8);
        const data = await Users.create(req.body);
        res.status(200).json({result: 'OK', message: 'success create account'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.login = async (req,res) => {
    const { error } = loginValidation(req.body);
    if (error) return res.status(200).json({result: 'nOK', message: error.details[0].message});

    try {
        const { username, password } = req.body;

        const data = await Users.findOne(({$or: [
            {username: username},
            {email: username}
        ]}));
      
        if (data) {
            const isPasswordValid = await bcrypt.compare(password, data.password);
            if (isPasswordValid) {
                const payload = {
                    id: data._id
                };

                const userSchema = {
                    username: data.username,
                    email: data.email,
                    profile_pic: '',
                    name: data.name
                }
                const profile_pic = await Files.findById(data.profile_pic);
                userSchema.profile_pic = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${profile_pic.file_path}`

                const token = jwt.sign(payload, '24h');
                res.status(200).header('Authorization', `Bearer ${token}`).json({ result: 'OK', message: 'success sign in', data: userSchema });
            } else {
                res.status(200).json({ result: 'nOK', message: 'invalid username or password' });
            }
        } else {
            res.status(200).json({ result: 'nOK', message: 'invalid username or password' });
        }
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};
//เอา isAuth มาเช็คใน header ทุกหน้า
exports.isAuth = async (req,res) => {
    const user_id = req.userId;
    try {
        const data = await Users.findById(user_id);
        const userSchema = {
            username: data.username,
            email: data.email,
            profile_pic: '',
            name: data.name,
            class: data.class
        }
        const profile_pic = await Files.findById(data.profile_pic);
        userSchema.profile_pic = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/${profile_pic.file_path}`

        res.status(200).json({ result: 'OK', message: 'success token provided', data: [userSchema] });
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
}