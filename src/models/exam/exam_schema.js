const mongoose = require('mongoose');

const objective_schema = mongoose.Schema({
    question: String,
    type: String, //multiple answer or one answer
    image: String,
    choice: [String],
    answer: [String],
    score: Number
});

const subjective_schema = mongoose.Schema({
    question: String,
    type: String, //short answer or paragraph
    image: String,
    score: Number
});

module.exports.objective_schema = objective_schema;
module.exports.subjective_schema = subjective_schema;
