const Joi = require('@hapi/joi');

const registerValidation = (data) => {
    const schema = Joi.object({
        username: Joi.string()
                .min(6)
                .required(),
        email: Joi.string()
                .email()
                .required(),
        optional_contact: Joi.string()
                .allow('')
                .required(),
        name: {
            firstname: Joi.string()
                    .max(128)
                    .required(),
            lastname: Joi.string()
                    .max(128)
                    .required()
        },
        profile_pic: Joi.string()
                .allow('')
                .required()
    });
    return schema.validate(data);
};

const classValidation = data => {
    const schema = Joi.object({
        class_name: Joi.string()
                .min(6)
                .max(512)
                .required(),
        class_description: Joi.string()
                .max(1024)
                .allow('')
                .required(),
        class_section: Joi.string()
                .max(512)
                .allow('')
                .required(),
        class_room: Joi.string()
                .max(512)
                .allow('')
                .required(),
        class_subject: Joi.string()
                .max(512)
                .allow('')
                .required(),
        class_thumbnail: Joi.string()
                .allow('')
                .required(), 
        firstname: Joi.string()
                .max(32)
                .required(),
        lastname: Joi.string()
                .max(32)
                .required(),
        optional_name: Joi.string()
                .max(32)
                .allow('')
                .required()
    });
    return schema.validate(data);
}

const classNicknameValidation = data => {
    const schema = Joi.object({
        class_code: Joi.string()
                .required(),
        firstname: Joi.string()
                .max(32)
                .required(),
        lastname: Joi.string()
                .max(32)
                .required(),
        optional_name: Joi.string()
                .max(32)
                .allow('')
                .required()
    });
    return schema.validate(data);
}

module.exports.registerValidation = registerValidation;
module.exports.classValidation = classValidation;
module.exports.classNicknameValidation = classNicknameValidation;