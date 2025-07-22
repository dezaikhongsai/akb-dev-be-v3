import Joi from 'joi';

export const createMailConfigSchema = Joi.object({
    serviceName : Joi.string().required().messages({
        'string.empty' : 'Tên dịch vụ không được để trống',
        'any.required' : 'Tên dịch vụ là bắt buộc'
    }),
    host : Joi.string().required().messages({
        'string.empty' : 'Host không được để trống',
        'any.required' : 'Host là bắt buộc'
    }),
    port : Joi.number().required().messages({
        'number.empty' : 'Port không được để trống',
        'any.required' : 'Port là bắt buộc'
    }),
    encryptMethod : Joi.string().required().messages({
        'string.empty' : 'Phương thức mã hóa không được để trống',
        'any.required' : 'Phương thức mã hóa là bắt buộc'
    }),
    user : Joi.string().email().required().messages({
        'string.empty' : 'Tài khoản không được để trống',
        'any.required' : 'Tài khoản là bắt buộc',
        'string.email' : 'Tài khoản phải là email'
    }),
    pass : Joi.string().required().messages({
        'string.empty' : 'Mật khẩu không được để trống',
        'any.required' : 'Mật khẩu là bắt buộc'
    }),
    secure : Joi.boolean().required().messages({
        'boolean.empty' : 'Secure không được để trống',
        'any.required' : 'Secure là bắt buộc'
    }),
    senderName : Joi.string().required().messages({
        'string.empty' : 'Tên người gửi không được để trống',
        'any.required' : 'Tên người gửi là bắt buộc'
    }),
    isActive : Joi.boolean().required().messages({
        'boolean.empty' : 'Trạng thái không được để trống',
        'any.required' : 'Trạng thái là bắt buộc'
    })
})