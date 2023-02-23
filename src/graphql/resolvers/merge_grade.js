
const Users = require('../../models/user_schema');
const Classes = require('../../models/class_schema');
const Assignments = require('../../models/assignment/assignment_schema');
const AssignmentResults = require('../../models/assignment/assignment_result_schema');
const Exams = require('../../models/exam/examination_schema');
const ExamResults = require('../../models/exam/exam_result_schema');
const Files = require('../../models/file_schema');

const grades = async (parent, args, req) => {
    const username = req.username;

    try {
        const users = await Users.findOne({ username: username })
        if (!users) return [];
        const user_id = users._id;
        const class_data = await Classes.findOne({ class_code: args.class_code })
        if (!class_data.teacher_id.includes(user_id)) return [];

        const gradeData = []

        for (let i = 0 ; i < class_data.student_id.length ; i++) {
            const student = {
                id: class_data.student_id[i],
                firstname: null,
                lastname: null,
                optional_name: null,
                assignment: [],
                exam: [],
            }

            const studentData = await transformStudent(class_data, class_data.student_id[i]);
            student.firstname = studentData.firstname;
            student.lastname = studentData.lastname;
            student.optional_name = studentData.optional_name;

            const assignmentData = await transformAssignment(class_data, class_data.student_id[i]);
            student.assignment = assignmentData;

            const examData = await transformExam(class_data, class_data.student_id[i]);
            student.exam = examData;

            gradeData.push(student);
        }

        return gradeData;

    } catch (err) {
        throw err;
    }
}

const transformStudent = async (class_data, student_id) => {

    const studentData = {
        firstname: null,
        lastname: null,
        optional_name: null,
    }
    class_data.nickname.map(nickKey => {
        if (nickKey.user_id === student_id) {
            studentData.firstname = nickKey.firstname
            studentData.lastname = nickKey.lastname
            studentData.optional_name = nickKey.optional_name
        }
    })

    return studentData
};

const transformAssignment = async (class_data, student_id) => {

    try {
        const assignmentData = []
        // console.log(student_id);
        for(let i = 0 ; i < class_data.class_assignment_id.length ; i++) {
            const query = await Assignments.findById(class_data.class_assignment_id[i]);

            const assignmentResultData = await AssignmentResults.findOne({ assignment_id : query._id});

            let score = 0
            for (let j = 0 ; j < assignmentResultData.student_score.length ; j++) {
                if (assignmentResultData.student_score[j].student_id === student_id) {
                    score = assignmentResultData.student_score[j].score
                    break;
                } else {
                    score = 0
                }
            }
            const details = {
                id: query._id,
                type: 'assignment',
                title: query.assignment_name,
                score: score,
                max_score: query.score,
                percentage: score/query.score*100,
            }

            assignmentData.push(details);
        }
        return assignmentData;
    } catch (err) {
        throw err
    }

};

const transformExam = async (class_data, student_id) => {

    try {
        const examData = []
        for(let i = 0 ; i < class_data.class_exam_id.length ; i++) {
            const query = await Exams.findById(class_data.class_exam_id[i]);

            const examResultData = await ExamResults.findOne({ exam_id : query._id});

            const score = 0
            for (let j = 0 ; j < examResultData.student_score.length ; j++) {
                if (examResultData.student_score[i].student_id === student_id) {
                    score = examResultData.student_score[i].sum_score
                }
            }

            const details = {
                id: query._id,
                type: 'exam',
                title: query.exam_name,
                score: score,
                max_score: query.score,
                percentage: score/query.score*100,
            }

            examData.push(details);
        }
        return examData;
    } catch (err) {
        throw err
    }

};


exports.grades = grades;