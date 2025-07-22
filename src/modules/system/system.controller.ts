import { Request , Response , NextFunction } from 'express';
import {
    createSystem,
    getSystem,
    getSystemBykey,
    updateSystem,
    deleteSystem,
} from './system.service';
import { ApiResponse } from '../../common/constants/ApiResponse';
import { HTTP_STATUS } from '../../common/constants/HttpStatus';
import { ISystem, ISystemUpdate } from './system.model';

export const createSystemController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {key , value , description} = req.body;
        const userId = req.user?._id.toString();
        const data : ISystem = {
            key : key,
            value : value,
            description : description,
            createdBy : userId || '',
            updatedBy : userId || '',
            createdAt : new Date(),
            updatedAt : new Date(),
        }
        const newSystem = await createSystem(req , data);
        const response : ApiResponse<typeof newSystem> = {
            status : 'success',
            message : req.t('system:messages.create_success', {ns : 'system'}),
            data : newSystem,
        }
        res.status(HTTP_STATUS.SUCCESS.CREATED).json(response);
    } catch (error : any) {
        next(error);
    }
}

export const getAllSystemController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const getAll = await getSystem();
        const response : ApiResponse<typeof getAll> = {
            status : 'success',
            message : req.t('system:messages.get_all_success', {ns : 'system'}),
            data : getAll,
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error : any) {
        next(error);
    }
}

export const getSystemByKeyController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {key} = req.params;
        const getByKey = await getSystemBykey(key);
        const response : ApiResponse<typeof getByKey> = {
            status : 'success',
            message : req.t('system:messages.get_by_key_success', {ns : 'system'}),
            data : getByKey,
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error : any) {
        next(error);
    }
}

export const updateSystemController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const userId = req.user?._id.toString();
        const {key} = req.params;
        const {value , description} = req.body;
        const data : ISystemUpdate = {
            description : description,
            value : value,
            updatedBy : userId || '',
            updatedAt : new Date(),
        }
        const updated = await updateSystem(key , data);
        const response : ApiResponse<typeof updated> = {
            status : 'success',
            message : req.t('system:messages.update_success', {ns : 'system'}),
            data : updated,
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error : any) {
        next(error);
    }
}

export const deleteSystemController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {key} = req.params;
        const deleted = await deleteSystem(key);
        const response : ApiResponse<typeof deleted> = {
            status : 'success',
            message : req.t('system:messages.delete_success', {ns : 'system'}),
            data : deleted,
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error : any) {
        next(error);
    }
}