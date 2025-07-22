import Joi from 'joi';

export const projectValidation = Joi.object({
    name : Joi.string().required().messages({
        'string.empty' : "Tên dự án là bắt buộc !",
    }),
    pm : Joi.string().required().messages({
        'string.empty' : "PM là bắt buộc !",
    }),
    customer : Joi.string().required().messages({
        'string.empty' : "Khách hàng là bắt buộc !",
    }),
    status : Joi.string().required().messages({
        'string.empty' : "Trạng thái là bắt buộc !",
    }),
    startDate : Joi.date().optional().messages({
        'date.base': "Ngày bắt đầu phải là định dạng ngày hợp lệ !",
    }),
    endDate : Joi.date().optional().when('startDate', {
        is: Joi.date().required(),
        then: Joi.date().greater(Joi.ref('startDate')).messages({
            'date.greater': "Ngày kết thúc phải sau ngày bắt đầu !",
            'date.base': "Ngày kết thúc phải là định dạng ngày hợp lệ !",
        })
    }),
    isActive : Joi.boolean().required().messages({
        'boolean.empty' : "Trạng thái là bắt buộc !",
    }),
})

export const projectUpdateValidation = Joi.object({
    startDate : Joi.date().optional().messages({
        'date.base': "Ngày bắt đầu phải là định dạng ngày hợp lệ !",
    }),
    endDate : Joi.date().optional().when('startDate', {
        is: Joi.date().required(),
        then: Joi.date().greater(Joi.ref('startDate')).messages({
            'date.greater': "Ngày kết thúc phải sau ngày bắt đầu !",
            'date.base': "Ngày kết thúc phải là định dạng ngày hợp lệ !",
        })
    }),
})
