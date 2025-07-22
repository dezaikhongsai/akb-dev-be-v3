import { IPhase, IPhaseUpdate } from './dto';
import Phase from './phase.model';
import { ApiError } from '../../common/constants/ApiError';
import { HTTP_STATUS } from '../../common/constants/HttpStatus';
import Project from '../project/project.model';

export const createPhase = async (data: IPhase) => {
    try {
        const newPhase = await Phase.create(data);
        
        // Update project's total phases
        const totalPhases = await Phase.countDocuments({ projectId: data.projectId });
        await Project.findByIdAndUpdate(
            data.projectId,
            { currentPhase: totalPhases },
            { new: true }
        );

        return newPhase;
    } catch (error: any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const createManyPhase = async (data: IPhase[]) => {
    try {
        const newPhases = await Phase.insertMany(data);
        
        if (data.length > 0) {
            // Get projectId from first phase (all phases should have same projectId)
            const projectId = data[0].projectId;
            
            // Update project's total phases
            // const totalPhases = await Phase.countDocuments({ projectId });
            // await Project.findByIdAndUpdate(
            //     projectId,
            //     { currentPhase: totalPhases },
            //     { new: true }
            // );
        }

        return newPhases;
    } catch (error: any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const getPhaseByProjectId = async (projectId : string) => {
    try {
        return Phase.find({projectId}).sort({startDate : 1});
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const updatePhase = async (phaseId : string , data : IPhaseUpdate) => {
    try {
        const updatedPhase = await Phase.findByIdAndUpdate(phaseId, data, {new : true});
        return updatedPhase;
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const updateManyPhase = async (data: IPhaseUpdate[]) => {
    try {
        const updatePromises = data.map(phase => {
            const { _id, ...updateData } = phase;
            return Phase.findByIdAndUpdate(_id, updateData, { new: true });
        });
        const updatedPhases = await Promise.all(updatePromises);
        return updatedPhases;
    } catch (error: any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const deletePhase = async (phaseId: string) => {
    try {
        const phase = await Phase.findById(phaseId);
        if (!phase) {
            throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND, 'Phase not found');
        }

        const projectId = phase.projectId;
        const deletedPhase = await Phase.findByIdAndDelete(phaseId);

        // Update project's total phases
        const totalPhases = await Phase.countDocuments({ projectId });
        await Project.findByIdAndUpdate(
            projectId,
            { currentPhase: totalPhases },
            { new: true }
        );

        return deletedPhase;
    } catch (error: any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const deleteAllPhaseByProjectId = async (projectId: string) => {
    try {
        const deletedPhases = await Phase.deleteMany({ projectId });

        // Reset project's currentPhase to 0
        await Project.findByIdAndUpdate(
            projectId,
            { currentPhase: 0 },
            { new: true }
        );

        return deletedPhases;
    } catch (error: any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const countPhasesByProjectId = async (projectId: string): Promise<number> => {
    try {
        return await Phase.countDocuments({ projectId: projectId });
    } catch (error: any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

