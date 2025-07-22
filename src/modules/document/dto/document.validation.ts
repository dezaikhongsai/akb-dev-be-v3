import Joi from 'joi';

// Validation schema cho file
export const fileSchema = Joi.object({
    originalName: Joi.string().required(),
    path: Joi.string().required(),
    size: Joi.number().required(),
    type: Joi.string().required(),
    index: Joi.number().required()
});

// Validation schema cho content trong request
export const createContentSchema = Joi.object({
    content: Joi.string().required().messages({
        'string.empty': 'Nội dung không được để trống',
        'any.required': 'Nội dung là bắt buộc'
    }),
    fileIndexes: Joi.array().items(
        Joi.number().min(0)
    ).default([]).messages({
        'array.base': 'File indexes must be an array of numbers'    
    }).optional()
});

// Validation schema cho create document request
export const createDocumentSchema = Joi.object({
    projectId: Joi.string().required().messages({
        'string.empty': 'Dự án không được để trống',
        'any.required': 'Dự án là bắt buộc'
    }),
    type: Joi.string().valid('document', 'report', 'request').required().messages({
        'any.only': 'Loại phải là document, report, hoặc request',
        'any.required': 'Loại là bắt buộc'
    }),
    name: Joi.string().required().min(1).messages({
        'string.empty': 'Tên document không được để trống',
        'any.required': 'Tên document là bắt buộc'
    }),
    contents: Joi.array().items(createContentSchema).min(1).required().messages({
        'array.min': 'Document phải có ít nhất một nội dung',
        'any.required': 'Nội dung là bắt buộc'
    })
});


