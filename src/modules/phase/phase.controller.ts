import {
    createPhase,
    getPhaseByProjectId,
    updatePhase,
    deletePhase,
    deleteAllPhaseByProjectId,
    createManyPhase,
    updateManyPhase,
} from './phase.service';
import { IPhase, IPhaseUpdate } from './dto';
import { Request, Response, NextFunction } from 'express';
import { ApiResponse ,HTTP_STATUS } from '../../common/constants';

export const createPhaseController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {projectId , name , description , startDate} = req.body;
        const userId = req.user?._id.toString() || '';
        const data : IPhase = {
            projectId : projectId,
            name : name,
            description : description,
            startDate : startDate,
            createdBy : userId,
            updatedBy : userId,
            createdAt : new Date(),
            updatedAt : new Date(),
        }
        const newPhase = await createPhase(data);
        const response : ApiResponse<typeof newPhase> = {
            status : 'success',
            message : req.t('phase:messages.create_success', {ns : 'phase'}),
            data : newPhase,
        }
        res.status(HTTP_STATUS.SUCCESS.CREATED).json(response);
    } catch (error : any) {
        next(error);
    }
}

export const createManyPhaseController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {projectId , phases} = req.body;
        const userId = req.user?._id.toString() || '';
        const data : IPhase[] = phases.map((phase : IPhase) => ({
            ...phase,
            projectId : projectId,
            createdBy : userId,
            updatedBy : userId,
            createdAt : new Date(),
            updatedAt : new Date(),
        }));
        const newPhases = await createManyPhase(data);
        const response : ApiResponse<typeof newPhases> = {
            status : 'success',
            message : req.t('phase:messages.create_many_success', {ns : 'phase'}),
            data : newPhases,
        }
        res.status(HTTP_STATUS.SUCCESS.CREATED).json(response);
    } catch (error : any) {
        next(error);
    }
}

export const getPhaseByProjectIdController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {projectId} = req.params;
        const phases = await getPhaseByProjectId(projectId);
        const response : ApiResponse<typeof phases> = {
            status : 'success',
            message : req.t('phase:messages.get_by_project_id_success', {ns : 'phase'}),
            data : phases,
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error : any) {
        next(error);
    }
}

export const updatePhaseController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {phaseId} = req.params;
        const {name , description , startDate} = req.body;
        const userId = req.user?._id.toString() || '';
        const data : IPhaseUpdate = {
            name : name,
            description : description,
            startDate : startDate,
            updatedBy : userId,
            updatedAt : new Date(),
        }
        const updatedPhase = await updatePhase(phaseId, data);
        const response : ApiResponse<typeof updatedPhase> = {
            status : 'success',
            message : req.t('phase:messages.update_success', {ns : 'phase'}),
            data : updatedPhase,
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error : any) {
        next(error);
    }
}

export const updateManyPhaseController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {phases} = req.body;
        const userId = req.user?._id.toString() || '';
        const data : IPhaseUpdate[] = phases.map((phase : IPhase) => ({
            ...phase,
            updatedBy : userId,
            updatedAt : new Date(),
        }));
        const updatedPhases = await updateManyPhase(data);
        const response : ApiResponse<typeof updatedPhases> = {
            status : 'success',
            message : req.t('phase:messages.update_many_success', {ns : 'phase'}),
            data : updatedPhases,
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error : any) {
        next(error);
    }
}

export const deletePhaseController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {phaseId} = req.params;
        const deletedPhase = await deletePhase(phaseId);
        const response : ApiResponse<typeof deletedPhase> = {
            status : 'success',
            message : req.t('phase:messages.delete_success', {ns : 'phase'}),
            data : deletedPhase,
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error : any) {
        next(error);
    }
}

export const deleteAllPhaseByProjectIdController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {projectId} = req.params;
        const deletedPhases = await deleteAllPhaseByProjectId(projectId);
        const response : ApiResponse<typeof deletedPhases> = {
            status : 'success',
            message : req.t('phase:messages.delete_all_by_project_id_success', {ns : 'phase'}),
            data : deletedPhases,
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error : any) {
        next(error);
    }
}