import { ApiResponse, HTTP_STATUS } from '../../common/constants';
import { ICreateUser, IUpdateUser } from './dto';
import {
    createUser, 
    deleteUser, 
    getUserPagination,
    me,
    statisticUser,
    updateUser,
    autoSearchUser
} from './user.service';
import {Request , Response , NextFunction} from 'express';

export const createUserController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {email , password , role , profile} = req.body;
        const userData : ICreateUser = {
            email : email,
            password,
            role,
            alias : '',
            isActive : profile ? true : false,
            createdBy: req.user?._id as string,
            updatedBy: req.user?._id as string,
            ...(profile && {
                profile: {
                    name : profile.name,
                    emailContact : profile.emailContact,
                    phoneContact : profile.phoneContact,
                    companyName : profile.companyName,
                    dob : profile.dob ? new Date(profile.dob) : undefined,
                    address : profile.address,
                    note : profile.note,
                }
            })
        }
        const newUser = await createUser(req, userData);
        const response : ApiResponse<typeof newUser> = {
            status : 'success',
            message : req.t('createUser.success', {ns: 'user'}),
            data : newUser
        }
        res.status(HTTP_STATUS.SUCCESS.CREATED).json(response);
    } catch (error) {
        next(error)
    }
}

export const getUserPaginationController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {limit , page , search , role , sort , isActive} = req.query;
        const userData = await getUserPagination(req, Number(limit) , Number(page) , String(search) , String(role) as 'admin' | 'customer' | 'pm' , String(sort) as 'asc' | 'desc' , String(isActive));
        const response : ApiResponse<typeof userData> = {
            status : 'success',
            message : req.t('getUser.success', {ns: 'user'}),
            data : userData
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export const updateUserController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {userId} = req.params;
        const {role  , profile} = req.body;
        const userRole = req.user?.role;
        const userData : IUpdateUser = {
            role : userRole === 'customer' ? 'customer' : role as 'admin' | 'pm',
            isActive : profile ? true : false,
            updatedBy: req.user?._id as string,
            ...(profile && {
                profile: {
                    name : profile.name,
                    emailContact : profile.emailContact,
                    phoneContact : profile.phoneContact,
                    companyName : profile.companyName,
                    dob : profile.dob ? new Date(profile.dob) : undefined,
                    address : profile.address,
                    note : profile.note,
                }
            })
        }
        const updatedUser = await updateUser(req , userId , userData);
        const response : ApiResponse<typeof updatedUser> = {
            status : 'success',
            message : req.t('updateUser.success', {ns: 'user'}),
            data : updatedUser
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export const deleteUserController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {userId} = req.params;
        const deletedUser = await deleteUser(req, userId);
        const response : ApiResponse<typeof deletedUser> = {
            status : 'success',
            message : req.t('deleteUser.success', {ns: 'user'}),
            data : deletedUser
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export const statisticUserController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const statisticData = await statisticUser();
        const response : ApiResponse<typeof statisticData> = {
            status : 'success',
            message : req.t('getUser.success', {ns: 'user'}),
            data : statisticData
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export const meController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const user = await me(req);
        const response : ApiResponse<typeof user> = {
            status : 'success',
            message : req.t('me.success', {ns: 'user'}),
            data : user
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export const autoSearchUserController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const { search, roles, limit } = req.query;
        const roleArray = roles ? String(roles).split(',') as ('admin' | 'customer' | 'pm')[] : undefined;
        
        const users = await autoSearchUser(
            req,
            String(search),
            roleArray,
            limit ? Number(limit) : undefined
        );

        const response : ApiResponse<typeof users> = {
            status : 'success',
            message : req.t('searchUser.success', {ns: 'user'}),
            data : users
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}
