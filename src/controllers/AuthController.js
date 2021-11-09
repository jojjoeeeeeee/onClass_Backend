const Users = require('../models/user_schema');
const bcrypt = require('bcryptjs');
const jwt = require('../jwt');

const { loginValidation, registerValidation } = require('../services/validation');

exports.register = async (req,res) => {
    const { error } = registerValidation(req.body);
    if (error) return res.status(400).json({result: 'Bad request', message: error.details[0].message});

    const usernameExist = await Users.findOne({username: req.body.username});
    if (usernameExist) return res.status(400).json({result: 'Bad request', message: 'Username already exists'});

    const emailExist = await Users.findOne({email: req.body.email});
    if (emailExist) return res.status(400).json({result: 'Bad request', message: 'Email already exists'});

    try {
        req.body.password = await bcrypt.hash(req.body.password, 8);
        const data = await Users.create(req.body);
        res.status(200).json({result: 'OK', message: 'success created account'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.login = async (req,res) => {
    const { error } = loginValidation(req.body);
    if (error) return res.status(400).json({result: 'Bad request', message: error.details[0].message});

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
                    profile_pic: data.profile_pic,
                    name: data.name
                }
                const token = jwt.sign(payload, '24h');
      
                res.status(200).header('Authorization', `Bearer ${token}`).json({ result: 'OK', message: 'success signed in', data: userSchema });
            } else {
                res.status(400).json({ result: 'Bad request', message: 'invalid username or password' });
            }
        } else {
            res.status(400).json({ result: 'Bad request', message: 'invalid username or password' });
        }
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};