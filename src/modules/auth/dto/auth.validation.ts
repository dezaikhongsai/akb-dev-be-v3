import Joi from 'joi';

export const loginSchema = Joi.object({
    email : Joi.string().required().email().messages({
        'string.empty' : 'Vui lòng nhập email !',
        'string.email' : 'Vui lòng nhập đúng định dạng email !',
    }),
    password : Joi.string().min(6).required().messages({
        'string.empty' : 'Vui lòng nhập mật khẩu !',
        'string.min' : 'Mật khẩu cần có ít nhất 6 ký tự !'
    })
})