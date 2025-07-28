const Joi = require('joi');

const validateRegistration = (fdata) => {
    const schma = Joi.object({
        username: Joi.string().min(3).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required()
    });

    return schma.validate(fdata);
}

module.exports = {validateRegistration}