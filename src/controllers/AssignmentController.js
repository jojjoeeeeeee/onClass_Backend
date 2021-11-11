const Users = require('../models/user_schema');
const Classes = require('../models/class_schema');
const Assignments = require('../models/assignment/assignment_schema');
const AssignmentResults = require('../models/assignment/assignment_result_schema');

exports.get = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    if (!classcode) return res.status(400).json({result: 'Bad request', message: ''});

    try {

    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};


exports.create = async (req,res) => {

};