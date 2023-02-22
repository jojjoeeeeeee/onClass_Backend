const { grades } = require('./merge_grade');


module.exports = {
    grades: async (parent, args, req) => grades(parent, args, req),
}