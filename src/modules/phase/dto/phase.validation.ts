import Joi from 'joi';

export const createPhaseSchema = Joi.object({
        projectId : Joi.string().required().messages({
            'any.required' : 'Trường projectId là bắt buộc',
            'string.empty' : 'Trường projectId là bắt buộc',
        }),
        name : Joi.string().required().messages({
            'any.required' : 'Trường name là bắt buộc',
            'string.empty' : 'Trường name là bắt buộc',
        }),
        description : Joi.string().optional().messages({
            'string.empty' : 'Trường description là bắt buộc',
        }),
        startDate : Joi.date().required().messages({
            'any.required' : 'Trường startDate là bắt buộc',
            'date.base' : 'Trường startDate là bắt buộc',
        }),
});

export const createManyPhaseSchema = Joi.object({
        projectId : Joi.string().required().messages({
            'any.required' : 'Trường projectId là bắt buộc',
            'string.empty' : 'Trường projectId là bắt buộc',
        }),
});

export const updatePhaseSchema = Joi.object({
        _id : Joi.string().optional(),
        name : Joi.string().required().messages({
            'any.required' : 'Trường name là bắt buộc',
            'string.empty' : 'Trường name là bắt buộc',
        }),
        description : Joi.string().optional().messages({
            'string.empty' : 'Trường description là bắt buộc',
        }),
        startDate : Joi.date().required().messages({
            'any.required' : 'Trường startDate là bắt buộc',
            'date.base' : 'Trường startDate là bắt buộc',
        }),
});

export const updateManyPhaseSchema = Joi.object({
        phases : Joi.array().items(updatePhaseSchema).required().messages({
            'any.required' : 'Trường phases là bắt buộc',
            'array.empty' : 'Trường phases là bắt buộc',
        }),
});
