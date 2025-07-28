import { ApiResponse, HTTP_STATUS, ApiError } from '../../common/constants';
import { IProject, IProjectQuery, IProjectUpdate, IProjectStatisticsQuery } from './dto';
import {
    createProject,
    deleteProject,
    getAutoSearchProject,
    getProjectPagination,
    updateProject,
    getProjectStatistics,
    getProjectById,
    activeProject,
    projectDetailStatistics,
    statisticsRequestInProject
} from './project.service';
import { Request, Response , NextFunction } from 'express';

export const createProjectController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const { name , pm , customer , startDate , endDate } = req.body;
        const projectData : IProject = {
            alias : '',
            name : name,
            pm : pm,
            customer : customer,
            status : 'pending',
            startDate : startDate,
            endDate : endDate? endDate : undefined,
            isActive : false,
            createdBy : req.user?._id,
            updatedBy : req.user?._id,
            currentPhase : 0,
        }

        const project = await createProject(req , projectData);
       const response  : ApiResponse<typeof project> = {
        status :'success',
        message : req.t('project:messages.create_success' , {ns : 'project'}),
        data : project,
       }
       res.status(HTTP_STATUS.SUCCESS.CREATED).json(response);
    } catch (error) {
        next(error);
    }
}

export const getProjectPaginationController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {
            page,
            limit,
            search,
            sort,
            status,
            startDate,
            pm,
            customer,
            isActive,
            monthYearStart,
            monthYearEnd,
            quarterYearStart,
            quarterYearEnd
        } = req.query;

        // Validate status if provided
        if (status && !['pending', 'processing', 'completed'].includes(status as string)) {
            throw new ApiError(
                HTTP_STATUS.ERROR.BAD_REQUEST,
                'Status không hợp lệ. Chỉ chấp nhận: pending, processing, completed'
            );
        }

        // Validate date format for monthYear
        const validateMonthYear = (monthYear: string | undefined): boolean => {
            if (!monthYear) return true;
            const regex = /^(0[1-9]|1[0-2])\/\d{4}$/;
            return regex.test(monthYear);
        };

        // Validate date format for quarterYear
        const validateQuarterYear = (quarterYear: string | undefined): boolean => {
            if (!quarterYear) return true;
            const regex = /^Q[1-4]\/\d{4}$/;
            return regex.test(quarterYear);
        };

        // Validate monthYear format
        if (!validateMonthYear(monthYearStart as string)) {
            throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'Định dạng monthYearStart không hợp lệ. Sử dụng định dạng MM/YYYY (ví dụ: 01/2024)');
        }
        if (!validateMonthYear(monthYearEnd as string)) {
            throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'Định dạng monthYearEnd không hợp lệ. Sử dụng định dạng MM/YYYY (ví dụ: 12/2024)');
        }

        // Validate quarterYear format
        if (!validateQuarterYear(quarterYearStart as string)) {
            throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'Định dạng quarterYearStart không hợp lệ. Sử dụng định dạng Q[1-4]/YYYY (ví dụ: Q1/2024)');
        }
        if (!validateQuarterYear(quarterYearEnd as string)) {
            throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'Định dạng quarterYearEnd không hợp lệ. Sử dụng định dạng Q[1-4]/YYYY (ví dụ: Q4/2024)');
        }

        // Validate that start date is not after end date for monthYear
        if (monthYearStart && monthYearEnd) {
            const [startMonth, startYear] = (monthYearStart as string).split('/');
            const [endMonth, endYear] = (monthYearEnd as string).split('/');
            const startDate = new Date(parseInt(startYear), parseInt(startMonth) - 1);
            const endDate = new Date(parseInt(endYear), parseInt(endMonth) - 1);
            
            if (startDate > endDate) {
                throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'monthYearStart không thể sau monthYearEnd');
            }
        }

        // Validate that start date is not after end date for quarterYear
        if (quarterYearStart && quarterYearEnd) {
            const [startQ, startYear] = (quarterYearStart as string).split('/');
            const [endQ, endYear] = (quarterYearEnd as string).split('/');
            const startQuarter = parseInt(startQ.substring(1));
            const endQuarter = parseInt(endQ.substring(1));
            
            if (parseInt(startYear) > parseInt(endYear) || 
                (parseInt(startYear) === parseInt(endYear) && startQuarter > endQuarter)) {
                throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'quarterYearStart không thể sau quarterYearEnd');
            }
        }

        const query : IProjectQuery = {
            page : page ? Number(page) : 1,
            limit : limit ? Number(limit) : 10,
            search : search ? String(search) : '',
            sort : sort ? (sort as 'asc' | 'desc') : 'asc',
            status : status ? (status as 'pending' | 'processing' | 'completed') : undefined,
            startDate : startDate ? new Date(String(startDate)) : undefined,
            pm : pm ? String(pm) : undefined,
            customer : customer ? String(customer) : undefined,
            isActive : isActive ? String(isActive) : undefined,
            monthYearStart: monthYearStart ? String(monthYearStart) : undefined,
            monthYearEnd: monthYearEnd ? String(monthYearEnd) : undefined,
            quarterYearStart: quarterYearStart ? String(quarterYearStart) : undefined,
            quarterYearEnd: quarterYearEnd ? String(quarterYearEnd) : undefined
        };

        const project = await getProjectPagination(req , query);
        const response : ApiResponse<typeof project> = {
            status : 'success',
            message : req.t('project:messages.get_success' , {ns : 'project'}),
            data : project,
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export const updateProjectController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {projectId} = req.params;
        const {name , startDate , endDate , status , currentPhase } = req.body;
        const projectDate : IProjectUpdate = {
            name : name,
            status : status,
            startDate : startDate,
            endDate : status === 'completed' ? new Date() : endDate,
            currentPhase : currentPhase,
            isActive : status === 'pending' ? false : true,
            updatedBy : req.user?._id,
        }
        const project = await updateProject(req , projectId , projectDate);
        const response : ApiResponse<typeof project> = {
            status : 'success',
            message : req.t('project:messages.update_success' , {ns : 'project'}),
            data : project,
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export const deleteProjectController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {projectId} = req.params;
        const deletedProject = await deleteProject(req , projectId);
        const response : ApiResponse<typeof deletedProject> = {
            status : 'success',
            message : req.t('project:messages.delete_success' , {ns : 'project'}),
            data : deletedProject,
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export const getAutoSearchProjectController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {search} = req.query; 
        const projects = await getAutoSearchProject(req , search as string);
        const response : ApiResponse<typeof projects> = {
            status : 'success',
            message : req.t('project:messages.get_success' , {ns : 'project'}),
            data : projects,
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export const getProjectStatisticsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            monthYearStart,
            monthYearEnd,
            quarterYearStart,
            quarterYearEnd
        } = req.query;

        // Only validate if parameters are provided
        if (monthYearStart || monthYearEnd || quarterYearStart || quarterYearEnd) {
            // Validate that either monthYear or quarterYear parameters are provided, but not both
            if ((monthYearStart || monthYearEnd) && (quarterYearStart || quarterYearEnd)) {
                throw new ApiError(
                    HTTP_STATUS.ERROR.BAD_REQUEST,
                    'Vui lòng chỉ cung cấp một loại khoảng thời gian (monthYear hoặc quarterYear)'
                );
            }

            // Validate monthYear format
            if (monthYearStart || monthYearEnd) {
                const validateMonthYear = (monthYear: string | undefined): boolean => {
                    if (!monthYear) return true;
                    const regex = /^(0[1-9]|1[0-2])\/\d{4}$/;
                    return regex.test(monthYear);
                };

                if (!validateMonthYear(monthYearStart as string)) {
                    throw new ApiError(
                        HTTP_STATUS.ERROR.BAD_REQUEST,
                        'Định dạng monthYearStart không hợp lệ. Sử dụng định dạng MM/YYYY (ví dụ: 01/2024)'
                    );
                }
                if (!validateMonthYear(monthYearEnd as string)) {
                    throw new ApiError(
                        HTTP_STATUS.ERROR.BAD_REQUEST,
                        'Định dạng monthYearEnd không hợp lệ. Sử dụng định dạng MM/YYYY (ví dụ: 12/2024)'
                    );
                }
            }

            // Validate quarterYear format
            if (quarterYearStart || quarterYearEnd) {
                const validateQuarterYear = (quarterYear: string | undefined): boolean => {
                    if (!quarterYear) return true;
                    const regex = /^Q[1-4]\/\d{4}$/;
                    return regex.test(quarterYear);
                };

                if (!validateQuarterYear(quarterYearStart as string)) {
                    throw new ApiError(
                        HTTP_STATUS.ERROR.BAD_REQUEST,
                        'Định dạng quarterYearStart không hợp lệ. Sử dụng định dạng Q[1-4]/YYYY (ví dụ: Q1/2024)'
                    );
                }
                if (!validateQuarterYear(quarterYearEnd as string)) {
                    throw new ApiError(
                        HTTP_STATUS.ERROR.BAD_REQUEST,
                        'Định dạng quarterYearEnd không hợp lệ. Sử dụng định dạng Q[1-4]/YYYY (ví dụ: Q4/2024)'
                    );
                }
            }
        }

        const query: IProjectStatisticsQuery = {
            monthYearStart: monthYearStart ? String(monthYearStart) : undefined,
            monthYearEnd: monthYearEnd ? String(monthYearEnd) : undefined,
            quarterYearStart: quarterYearStart ? String(quarterYearStart) : undefined,
            quarterYearEnd: quarterYearEnd ? String(quarterYearEnd) : undefined
        };

        const statistics = await getProjectStatistics(req, query);
        
        const response: ApiResponse<typeof statistics> = {
            status: 'success',
            message: req.t('project:messages.get_statistics_success', { ns: 'project' }),
            data: statistics
        };

        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
};

export const getProjectByIdController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {projectId} = req.params;
        const project = await getProjectById(projectId);
        const response : ApiResponse<typeof project> = {
            status : 'success',
            message : req.t('project:messages.get_success' , {ns : 'project'}),
            data : project,
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export const activeProjectController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {projectId} = req.params;
        const project = await activeProject(req , projectId);
        const response : ApiResponse<typeof project> = {
            status : 'success',
            message : req.t('project:messages.active_success' , {ns : 'project'}),
            data : project,
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export const projectDetailStatisticsController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {projectId} = req.params;
        const data = await projectDetailStatistics(req ,projectId);
        res.status(HTTP_STATUS.SUCCESS.OK).json({
            status : 'success',
            message : 'Lấy thống kê chi tiết dự án thành công !',
            data : data
        } as ApiResponse<typeof data>)
    } catch (error) {
        next(error);
    }
}

export const statisticsRequestInProjectController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        // Lấy query parameters
        let { monthYearStart, monthYearEnd } = req.query as { monthYearStart?: string; monthYearEnd?: string };
        
        // Nếu không có monthYearStart và monthYearEnd, tự động set tháng năm hiện tại
        if (!monthYearStart && !monthYearEnd) {
            const now = new Date();
            const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
            const currentYear = now.getFullYear().toString();
            const currentMonthYear = `${currentMonth}/${currentYear}`;
            
            monthYearStart = currentMonthYear;
            monthYearEnd = currentMonthYear;
        } else if (!monthYearStart && monthYearEnd) {
            // Nếu chỉ có monthYearEnd, set monthYearStart = monthYearEnd
            monthYearStart = monthYearEnd;
        } else if (monthYearStart && !monthYearEnd) {
            // Nếu chỉ có monthYearStart, set monthYearEnd = monthYearStart
            monthYearEnd = monthYearStart;
        }

        // Đảm bảo cả hai giá trị đều có sau khi xử lý
        if (!monthYearStart || !monthYearEnd) {
            throw new ApiError(
                HTTP_STATUS.ERROR.BAD_REQUEST,
                'Vui lòng cung cấp đầy đủ thông tin thời gian'
            );
        }

        // Validate monthYear format
        const validateMonthYear = (monthYear: string): boolean => {
            const regex = /^(0[1-9]|1[0-2])\/\d{4}$/;
            return regex.test(monthYear);
        };

        if (!validateMonthYear(monthYearStart)) {
            throw new ApiError(
                HTTP_STATUS.ERROR.BAD_REQUEST,
                'Định dạng monthYearStart không hợp lệ. Sử dụng định dạng MM/YYYY (ví dụ: 01/2024)'
            );
        }
        if (!validateMonthYear(monthYearEnd)) {
            throw new ApiError(
                HTTP_STATUS.ERROR.BAD_REQUEST,
                'Định dạng monthYearEnd không hợp lệ. Sử dụng định dạng MM/YYYY (ví dụ: 12/2024)'
            );
        }

        // Validate that start date is not after end date
        const [startMonth, startYear] = monthYearStart.split('/');
        const [endMonth, endYear] = monthYearEnd.split('/');
        const startDate = new Date(parseInt(startYear), parseInt(startMonth) - 1);
        const endDate = new Date(parseInt(endYear), parseInt(endMonth) - 1);
        
        if (startDate > endDate) {
            throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'monthYearStart không thể sau monthYearEnd');
        }

        // Cập nhật req.query với giá trị đã xử lý
        req.query.monthYearStart = monthYearStart;
        req.query.monthYearEnd = monthYearEnd;

        const data = await statisticsRequestInProject(req);
        res.status(HTTP_STATUS.SUCCESS.OK).json({
            status : 'success',
            message : req.t('project:statisticsRequest.success', {ns : 'project'}),
            data : data
        } as ApiResponse<typeof data>)
    } catch (error) {
        next(error);
    }
}