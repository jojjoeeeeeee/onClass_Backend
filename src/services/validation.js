const Joi = require("@hapi/joi");

const registerValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(6).required(),
    email: Joi.string().email().required(),
    optional_contact: Joi.string().allow("").required(),
    name: Joi.object({
      firstname: Joi.string().max(128).required(),
      lastname: Joi.string().max(128).required(),
    }).required(),
    profile_pic: Joi.string().allow("").required(),
  });
  return schema.validate(data);
};

const classDetailValidation = (data) => {
  const schema = Joi.object({
    class_name: Joi.string().min(6).max(512).required(),
    class_description: Joi.string().max(1024).allow("").required(),
    class_section: Joi.string().max(512).allow("").required(),
    class_room: Joi.string().max(512).allow("").required(),
    class_subject: Joi.string().max(512).allow("").required(),
  });
  return schema.validate(data);
};

const classValidation = (data) => {
  const schema = Joi.object({
    class_name: Joi.string().min(6).max(512).required(),
    class_description: Joi.string().max(1024).allow("").required(),
    class_section: Joi.string().max(512).allow("").required(),
    class_room: Joi.string().max(512).allow("").required(),
    class_subject: Joi.string().max(512).allow("").required(),
    class_thumbnail: Joi.string().allow("").required(),
    firstname: Joi.string().max(32).required(),
    lastname: Joi.string().max(32).required(),
    optional_name: Joi.string().max(32).allow("").required(),
  });
  return schema.validate(data);
};

const classClassCodeValidation = (data) => {
  const schema = Joi.object({
    class_code: Joi.string().required(),
  });
  return schema.validate(data);
};

const classNicknameValidation = (data) => {
  const schema = Joi.object({
    class_code: Joi.string().required(),
    firstname: Joi.string().max(32).required(),
    lastname: Joi.string().max(32).required(),
    optional_name: Joi.string().max(32).allow("").required(),
  });
  return schema.validate(data);
};

const classEditRoleValidation = (data) => {
  const schema = Joi.object({
    class_code: Joi.string().required(),
    data: Joi.object({
      user_id: Joi.string().required(),
      role: Joi.string().max(7).required()
    })
  })
  return schema.validate(data);
}

const assignmentValidation = (data) => {
  const schema = Joi.object({
    assignment_name: Joi.string().min(6).max(512).required(),
    assignment_description: Joi.string().max(1024).allow("").required(),
    turnin_late: Joi.boolean().required(),
    is_symbol_score: Joi.boolean().required(),
    symbol_score: Joi.array().items(Joi.string()).required(),
    score: Joi.number().required(),
    assignment_optional_file: Joi.array().items(Joi.string()).required(),
    assignment_end_date: Joi.date().iso().required(),
  });
  return schema.validate(data);
};

const classAssignmentValidation = (data) => {
  const schema = Joi.object({
    class_code: Joi.string().required(),
    assignment_id: Joi.string().required(),
  });
  return schema.validate(data);
};

const classPostValidation = (data) => {
  const schema = Joi.object({
    class_code: Joi.string().required(),
    post_id: Joi.string().required(),
  });
  return schema.validate(data);
};

const classPostCommentValidation = (data) => {
  const schema = Joi.object({
    class_code: Joi.string().required(),
    id: Joi.string().required(),
    data: Joi.object({
      content: Joi.string().required(),
    }).required(),
  });
  return schema.validate(data);
};

const classPostPollVoteValidation = (data) => {
  const schema = Joi.object({
    class_code: Joi.string().required(),
    post_id: Joi.string().required(),
    choice_name: Joi.string().required(),
  });
  return schema.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.classValidation = classValidation;
module.exports.classDetailValidation = classDetailValidation;
module.exports.classClassCodeValidation = classClassCodeValidation;
module.exports.classNicknameValidation = classNicknameValidation;
module.exports.classEditRoleValidation = classEditRoleValidation;
module.exports.assignmentValidation = assignmentValidation;
module.exports.classAssignmentValidation = classAssignmentValidation;
module.exports.classPostValidation = classPostValidation;
module.exports.classPostCommentValidation = classPostCommentValidation;
module.exports.classPostPollVoteValidation = classPostPollVoteValidation;
