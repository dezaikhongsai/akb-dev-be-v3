import { ApiError, HTTP_STATUS } from '../../common/constants';
import System, { ISystem, ISystemUpdate } from './system.model';
import { Request } from 'express';
export const createSystem = async (req : Request , data : ISystem) => {
    try {
        const role = req.user?.role;
        if(role !== 'admin') throw new ApiError(HTTP_STATUS.ERROR.FORBIDDEN , 'Bạn không có quyền tạo hệ thống !'); 
        const userId = req.user?._id.toString();
        const newSystem = await System.create(data);
        return newSystem;
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const getSystem = async () => {
    try {
        const getAll = await System.find();
        return getAll;
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const getSystemBykey = async (key : string) => {
    try {
        const getByKey = await System.findOne({key});
        return getByKey;
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const updateSystem = async (key : string , data : ISystemUpdate) => {
    try {       
        const updated = await System.findOneAndUpdate({key}, data, {new : true});
        return updated;
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const deleteSystem = async (key : string) => {
    try {
        const deleted = await System.findOneAndDelete({key});
        return deleted;
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}