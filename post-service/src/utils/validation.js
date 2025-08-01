const Joi = require('joi');

const validateCreatePost = (fdata) => {
    const schma = Joi.object({
        content: Joi.string().min(3).max(500000).required(),
        mediaIds: Joi.array()
       
    });

    return schma.validate(fdata);
}


module.exports = {validateCreatePost}



// 