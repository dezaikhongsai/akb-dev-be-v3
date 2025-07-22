import Joi from 'joi';
import { ICreateUser, IProfile, IUpdateUser } from './user.type';

export const createUserSchema = Joi.object<ICreateUser>({
    email : Joi.string().required().email().messages({
        'string.empty' : 'Vui lòng nhập email !',
        'string.email' : 'Vui lòng nhập email đúng định dạng !'
    }),
    password : Joi.string().required().min(6).messages({
        'string.empty' : 'Vui lòng nhập mật khẩu !',
        'string.min' : 'Mật khẩu có ít nhất 6 ký tự !',
    }),
    role : Joi.string().optional(),
    profile : Joi.object<IProfile>({
        name : Joi.string().required().messages({
            'string.empty' : 'Vui lòng nhập tên !',
        }),
        emailContact : Joi.string().required().email().messages({
            'string.empty' : 'Vui lòng nhập email !',
            'string.email' : 'Vui lòng nhập email đúng định dạng !',
        }),
        phoneContact : Joi.string().required().messages({
            'string.empty' : 'Vui lòng nhập số điện thoại !',
        }),
        companyName : Joi.string().optional(),
        dob : Joi.date().optional(),
        address : Joi.string().optional(),
        note : Joi.string().optional(),
    }).optional()
})

export const updateUserSchema = Joi.object<IUpdateUser>({
    role : Joi.string().optional(),
    isActive : Joi.boolean().optional(),
    profile : Joi.object<IProfile>({
        name : Joi.string().required().messages({
            'string.empty' : 'Vui lòng nhập tên !',
        }),
        emailContact : Joi.string().required().email().messages({
            'string.empty' : 'Vui lòng nhập email !',
            'string.email' : 'Vui lòng nhập email đúng định dạng !',
        }),
        phoneContact : Joi.string().required().messages({
            'string.empty' : 'Vui lòng nhập số điện thoại !',
        }),
        companyName : Joi.string().optional(),
        dob : Joi.date().optional(),
        address : Joi.string().optional(),
        note : Joi.string().optional(),
    })
})