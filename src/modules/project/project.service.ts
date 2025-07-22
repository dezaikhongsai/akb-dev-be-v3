import { Request } from "express";
import { IProject, IProjectQuery, IProjectUpdate, IProjectStatisticsQuery, IProjectStatistics, IProjectProgress } from "./dto";
import Project from "./project.model";
import { ApiError, HTTP_STATUS } from "../../common/constants";
import { SortOrder } from "mongoose";
import { genAlias } from "../../common/utils/alias.util";
import { deleteAllPhaseByProjectId, getPhaseByProjectId } from "../phase/phase.service";
import { deleteAllDocumentByProjectId, getDocumentInProject } from "../document/document.service";
import { countPhasesByProjectId } from "../phase/phase.service";
import { IGetDocumentInProjectQuery } from "../document/dto";

const parseDateString = (dateStr: string): Date => {
    // Try DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
        const year = parseInt(parts[2], 10);
        
        const date = new Date(year, month, day);
        
        // Validate if the date is valid
        if (!isNaN(date.getTime()) && 
            date.getDate() === day && 
            date.getMonth() === month && 
            date.getFullYear() === year) {
            return date;
        }
    }
    // Try ISO format (YYYY-MM-DD)
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
        return isoDate;
    }

    throw new Error('Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng DD/MM/YYYY hoặc YYYY-MM-DD');
};

export const createProject = async (req : Request,project : IProject) => {
    try {
        if (!req.user?._id) {
            throw new ApiError(HTTP_STATUS.ERROR.UNAUTHORIZED, 'Bạn chưa đăng nhập !');
        }

        const userId = req.user._id.toString();
        const userRole = req.user?.role;

        // Validate required fields
        if (!project.name) {
            throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'Tên dự án là bắt buộc !');
        }
        if (!project.pm) {
            throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'PM là bắt buộc !');
        }
        if (!project.customer) {
            throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'Khách hàng là bắt buộc !');
        }

        if(userRole === 'customer' && project.customer !== userId){
          throw new ApiError(HTTP_STATUS.ERROR.FORBIDDEN , 'Bạn không có quyền tạo dự án này !');
        }

        // Parse dates if provided
        try {
            if (project.startDate && typeof project.startDate === 'string') {
                project.startDate = parseDateString(project.startDate);
            }
            if (project.endDate && typeof project.endDate === 'string') {
                project.endDate = parseDateString(project.endDate);
            }

            // Validate endDate is after startDate
            if (project.startDate && project.endDate && project.endDate < project.startDate) {
                throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'Ngày kết thúc phải sau ngày bắt đầu !');
            }
        } catch (error: any) {
            throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, `Lỗi định dạng ngày: ${error.message}`);
        }

        // Get all existing project aliases
        const existingProjects = await Project.find({}, { alias: 1 }).lean();
        const existingAliases = existingProjects.map(p => p.alias);
        
        // Generate new alias using utility function
        project.alias = genAlias('project', existingAliases);
        
        // Set default values
        project.status = project.status || 'pending';
        project.isActive = project.isActive ?? true;
        project.createdBy = userId;
        project.updatedBy = userId;

        const newProject = await Project.create(project);
        return newProject;
    } catch (error : any) {
        console.error('Create project error:', error);
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err : any) => err.message);
            throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, `Lỗi validation: ${validationErrors.join(', ')}`);
        }
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'Dự án với thông tin này đã tồn tại !');
        }

        // If it's already an ApiError, throw it directly
        if (error instanceof ApiError) {
            throw error;
        }

        // For any other unexpected errors
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, `Lỗi khi tạo dự án: ${error.message}`);
    }
}

export const getProjectPagination = async (req : Request , query : IProjectQuery) => {
    try {
        const userRole = req.user?.role;
        const userId = req.user?._id.toString();
        const {
            page = 1,
            limit = 10,
            search = '',
            sort = 'asc',
            status,
            startDate,
            pm,
            customer,
            isActive,
            monthYearStart,
            monthYearEnd,
            quarterYearStart,
            quarterYearEnd
        } = query;

        // Build filter conditions
        const filter : any = {};
        
        // Add status filter only if status is provided
        if (status) {
            filter.status = status;
        }
        
        // Handle isActive as string
        if (isActive) {
            if (isActive === 'true' || isActive === 'false') {
                filter.isActive = isActive === 'true';
            }
        }

        // Handle date filters
        const dateFilter: any = {};

        // Process monthYear filter
        if (monthYearStart || monthYearEnd) {
            const processMonthYear = (monthYear: string) => {
                const [month, year] = monthYear.split('/');
                const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
                const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
                return { startOfMonth, endOfMonth };
            };

            if (monthYearStart) {
                const { startOfMonth } = processMonthYear(monthYearStart);
                dateFilter.$gte = startOfMonth;
            }

            if (monthYearEnd) {
                const { endOfMonth } = processMonthYear(monthYearEnd);
                dateFilter.$lte = endOfMonth;
            }
        }
        // Process quarterYear filter
        if (quarterYearStart || quarterYearEnd) {
            const processQuarterYear = (quarterYear: string) => {
                const [quarter, year] = quarterYear.split('/');
                const quarterNumber = parseInt(quarter.substring(1));
                const startMonth = (quarterNumber - 1) * 3;
                const startOfQuarter = new Date(parseInt(year), startMonth, 1);
                const endOfQuarter = new Date(parseInt(year), startMonth + 3, 0, 23, 59, 59);
                return { startOfQuarter, endOfQuarter };
            };

            if (quarterYearStart) {
                const { startOfQuarter } = processQuarterYear(quarterYearStart);
                if (!dateFilter.$gte || startOfQuarter > dateFilter.$gte) {
                    dateFilter.$gte = startOfQuarter;
                }
            }

            if (quarterYearEnd) {
                const { endOfQuarter } = processQuarterYear(quarterYearEnd);
                if (!dateFilter.$lte || endOfQuarter < dateFilter.$lte) {
                    dateFilter.$lte = endOfQuarter;
                }
            }
        }

        // Apply date filters to both startDate and endDate if they exist
        if (Object.keys(dateFilter).length > 0) {
            filter.$or = [
                { startDate: dateFilter },
                { endDate: dateFilter }
            ];
        } else if (startDate) {
            filter.startDate = {
                $gte: new Date(startDate)
            };
        }

        // Handle PM filter
        if (pm) {
            filter.pm = pm;
        }

        // Handle customer filter based on user role
        if (userRole === 'customer') {
            filter.customer = userId;
            
            if (customer && customer !== userId) {
                throw new ApiError(HTTP_STATUS.ERROR.FORBIDDEN, 'Bạn không có quyền xem dự án của khách hàng khác !');
            }
        } else {
            if (customer) {
                filter.customer = customer;
            }
        }

        // Add search condition
        if (search) {
            filter.name = {
                $regex: search,
                $options: 'i'
            };
        }

        // Calculate skip value for pagination
        const skip = (Number(page) - 1) * Number(limit);

        // Build sort condition for P001 format
        const sortCondition: { [key: string]: SortOrder } = {
            alias: sort === 'asc' ? 1 : -1
        };

        // Execute query with pagination and populate
        const projects = await Project.find(filter)
            .sort(sortCondition)
            .skip(skip)
            .limit(Number(limit))
            .populate('pm', 'alias profile.name')
            .populate('customer', 'alias profile.name')
            .lean();

        // Get total count for pagination
        const total = await Project.countDocuments(filter);

        return {
            data: projects,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total
            }
        };

    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const updateProject = async (req : Request , projectId : string , projectData : IProjectUpdate) => {
    try {
        const userId  = req.user?._id.toString();
        const userRole = req.user?.role;
        const project = await Project.findById(projectId);
        if(userRole === 'customer' && project?.customer != userId) throw new ApiError(HTTP_STATUS.ERROR.FORBIDDEN , 'Bạn không có quyền cập nhật dự án này !');
        if(!project) throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND , 'Dự án không tồn tại !');
        const updatedProject = await Project.findByIdAndUpdate(projectId , projectData , {new : true});
        return updatedProject;
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
} 

export const deleteProject = async (req : Request , projectId : string) => {
    try {
        const userId = req.user?._id.toString();
        const userRole = req.user?.role;
        const validProject = await Project.findById(projectId);
        if(userRole === 'customer' && validProject?.customer !== userId) throw new ApiError(HTTP_STATUS.ERROR.FORBIDDEN , 'Bạn không có quyền xóa dự án này !');
        if(!validProject) throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND , 'Dự án không tồn tại !');
        const deletedProject = await Project.findByIdAndDelete(projectId);
        // Can them 1 buoc trigger xoa cac phase du an + document trong dung an + feedback trong dung an se lam sau
        await deleteAllPhaseByProjectId(projectId);
        await deleteAllDocumentByProjectId(projectId);
        return deletedProject;
    } catch (error : any    ) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const getAutoSearchProject = async (req: Request, search: string) => {
    try {
        const userRole = req.user?.role;
        const userId = req.user?._id.toString();

        // Base filter condition
        const baseFilter: any = {  };

        // Add customer filter if user is a customer
        if (userRole === 'customer') {
            baseFilter.customer = userId;
        }

        // If search is empty, return latest projects
        if (!search) {
            return await Project.find(baseFilter)
                .select('name alias')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();
        }

        // Create search conditions
        const searchFilter = {
            ...baseFilter,
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { alias: { $regex: search, $options: 'i' } }
            ]
        };

        // First find exact matches
        const exactMatches = await Project.find({
            ...searchFilter,
            alias: search.toUpperCase()
        })
            .select('name alias')
            .lean();

        // Then find partial matches
        const partialMatches = await Project.find({
            ...searchFilter,
            alias: { $ne: search.toUpperCase() }
        })
            .select('name alias')
            .sort({ alias: 1 })
            .limit(10 - exactMatches.length)
            .lean();

        // Combine results
        return [...exactMatches, ...partialMatches];
    } catch (error: any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const getProjectStatistics = async (req: Request, query: IProjectStatisticsQuery): Promise<IProjectStatistics> => {
    try {
        const userRole = req.user?.role;
        const userId = req.user?._id.toString() || '';

        // Helper function to calculate percentage change
        const calculatePercentageChange = (current: number, previous: number): number => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        // Helper function to calculate time progress
        const calculateTimeProgress = (startDate: Date | undefined, endDate: Date | undefined): number => {
            if (!startDate || !endDate) return 0;
            
            const now = new Date();
            
            // If project hasn't started yet
            if (now < startDate) return 0;
            
            // If project is completed or past end date
            if (now > endDate) return 100;
            
            // Calculate total duration and elapsed time
            const totalDuration = endDate.getTime() - startDate.getTime();
            const elapsedTime = now.getTime() - startDate.getTime();
            
            // Calculate progress percentage
            const progress = (elapsedTime / totalDuration) * 100;
            
            // Ensure progress is between 0 and 100
            return Math.min(100, Math.max(0, progress));
        };

        // Helper function to get current month/year
        const getCurrentMonthYear = () => {
            const now = new Date();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const year = now.getFullYear().toString();
            return `${month}/${year}`;
        };

        // Helper function to get current quarter/year
        const getCurrentQuarterYear = () => {
            const now = new Date();
            const quarter = Math.floor(now.getMonth() / 3) + 1;
            const year = now.getFullYear().toString();
            return `Q${quarter}/${year}`;
        };

        // Helper function to process date ranges
        const processDateRange = (monthYearStart?: string, monthYearEnd?: string, quarterYearStart?: string, quarterYearEnd?: string) => {
            let startDate: Date;
            let endDate: Date;

            // If no date range is provided, use current month
            if (!monthYearStart && !monthYearEnd && !quarterYearStart && !quarterYearEnd) {
                const currentMonthYear = getCurrentMonthYear();
                const [month, year] = currentMonthYear.split('/');
                startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            } else if (monthYearStart && monthYearEnd) {
                const [startMonth, startYear] = monthYearStart.split('/');
                const [endMonth, endYear] = monthYearEnd.split('/');
                startDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, 1);
                endDate = new Date(parseInt(endYear), parseInt(endMonth), 0, 23, 59, 59);
            } else if (quarterYearStart && quarterYearEnd) {
                const [startQ, startYear] = quarterYearStart.split('/');
                const [endQ, endYear] = quarterYearEnd.split('/');
                const startQuarter = parseInt(startQ.substring(1));
                const endQuarter = parseInt(endQ.substring(1));
                
                startDate = new Date(parseInt(startYear), (startQuarter - 1) * 3, 1);
                endDate = new Date(parseInt(endYear), endQuarter * 3, 0, 23, 59, 59);
            } else {
                // If only one date is provided, use it for both start and end
                const monthYear = monthYearStart || monthYearEnd;
                const quarterYear = quarterYearStart || quarterYearEnd;

                if (monthYear) {
                    const [month, year] = monthYear.split('/');
                    startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                    endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
                } else if (quarterYear) {
                    const [quarter, year] = quarterYear.split('/');
                    const quarterNum = parseInt(quarter.substring(1));
                    startDate = new Date(parseInt(year), (quarterNum - 1) * 3, 1);
                    endDate = new Date(parseInt(year), quarterNum * 3, 0, 23, 59, 59);
                } else {
                    throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'Vui lòng cung cấp khoảng thời gian hợp lệ');
                }
            }

            return { startDate, endDate };
        };

        // Get current time range
        const currentRange = processDateRange(
            query.monthYearStart,
            query.monthYearEnd,
            query.quarterYearStart,
            query.quarterYearEnd
        );

        // Calculate previous time range
        const previousRange = (() => {
            const duration = currentRange.endDate.getTime() - currentRange.startDate.getTime();
            const startDate = new Date(currentRange.startDate.getTime() - duration);
            const endDate = new Date(currentRange.endDate.getTime() - duration);
            return { startDate, endDate };
        })();

        // Base filter for user role
        const baseFilter: any = {};
        if (userRole === 'customer') {
            baseFilter.customer = userId;
        }

        // Helper function to get project counts
        const getProjectCounts = async (timeRange: { startDate: Date; endDate: Date }) => {
            const dateFilter = {
                $or: [
                    {
                        startDate: {
                            $gte: timeRange.startDate,
                            $lte: timeRange.endDate
                        }
                    },
                    {
                        endDate: {
                            $gte: timeRange.startDate,
                            $lte: timeRange.endDate
                        }
                    }
                ]
            };

            const filter = { ...baseFilter, ...dateFilter };

            const [
                activeProjects,
                pendingProjects,
                processingProjects,
                completedProjects
            ] = await Promise.all([
                Project.countDocuments({ ...filter, isActive: true }),
                Project.countDocuments({ ...filter, isActive: false }),
                Project.countDocuments({ ...filter, status: 'processing' }),
                Project.countDocuments({ ...filter, status: 'completed' })
            ]);

            return {
                activeProjects,
                pendingProjects,
                processingProjects,
                completedProjects
            };
        };

        // Get active projects with progress details
        const getActiveProjectsProgress = async (timeRange: { startDate: Date; endDate: Date }): Promise<IProjectProgress[]> => {
            const dateFilter = {
                $or: [
                    {
                        startDate: {
                            $gte: timeRange.startDate,
                            $lte: timeRange.endDate
                        }
                    },
                    {
                        endDate: {
                            $gte: timeRange.startDate,
                            $lte: timeRange.endDate
                        }
                    }
                ]
            };

            const filter = { 
                ...baseFilter, 
                ...dateFilter,
                isActive: true 
            };

            const activeProjects = await Project.find(filter)
                .select('_id name alias currentPhase startDate endDate pm customer')
                .populate('pm', 'profile.name')
                .populate('customer', 'profile.name')
                .lean();

            const projectsProgress = await Promise.all(
                activeProjects.map(async (project: any) => {
                    try {
                        if (!project || !project._id) {
                            console.error('Invalid project data:', project);
                            return null;
                        }

                        const totalPhases = await countPhasesByProjectId(project._id.toString());
                        
                        const progressData: IProjectProgress = {
                            projectId: project._id.toString(),
                            name: project.name || 'Untitled Project',
                            alias: project.alias || '',
                            timeProgress: calculateTimeProgress(project.startDate, project.endDate),
                            phaseProgress: totalPhases > 0 ? ((project.currentPhase || 0) / totalPhases) * 100 : 0,
                            totalPhases,
                            currentPhase: project.currentPhase || 0,
                            startDate: project.startDate,
                            endDate: project.endDate,
                            pm: {
                                _id: project.pm?._id?.toString() || '',
                                name: project.pm?.profile?.name || 'Unknown PM'
                            },
                            customer: {
                                _id: project.customer?._id?.toString() || '',
                                name: project.customer?.profile?.name || 'Unknown Customer'
                            }
                        };

                        return progressData;
                    } catch (error) {
                        console.error('Error processing project:', project, error);
                        return null;
                    }
                })
            );

            // Filter out any null values from failed processing
            return projectsProgress.filter((project): project is IProjectProgress => project !== null);
        };

        // Get counts for both time ranges
        const [currentCounts, previousCounts, activeProjectsProgress] = await Promise.all([
            getProjectCounts(currentRange),
            getProjectCounts(previousRange),
            getActiveProjectsProgress(currentRange)
        ]);

        // Build response
        const statistics: IProjectStatistics = {
            totalActiveProjects: {
                current: currentCounts.activeProjects,
                previous: previousCounts.activeProjects,
                percentageChange: calculatePercentageChange(
                    currentCounts.activeProjects,
                    previousCounts.activeProjects
                )
            },
            totalPendingProjects: {
                current: currentCounts.pendingProjects,
                previous: previousCounts.pendingProjects,
                percentageChange: calculatePercentageChange(
                    currentCounts.pendingProjects,
                    previousCounts.pendingProjects
                )
            },
            totalProcessingProjects: {
                current: currentCounts.processingProjects,
                previous: previousCounts.processingProjects,
                percentageChange: calculatePercentageChange(
                    currentCounts.processingProjects,
                    previousCounts.processingProjects
                )
            },
            totalCompletedProjects: {
                current: currentCounts.completedProjects,
                previous: previousCounts.completedProjects,
                percentageChange: calculatePercentageChange(
                    currentCounts.completedProjects,
                    previousCounts.completedProjects
                )
            },
            activeProjectsProgress,
            timeRange: {
                current: {
                    start: currentRange.startDate,
                    end: currentRange.endDate
                },
                previous: {
                    start: previousRange.startDate,
                    end: previousRange.endDate
                }
            }
        };

        return statistics;
    } catch (error: any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
};

export const getProjectById = async (projectId : string) => {
    try {
        const project = await Project.findById(projectId).populate('pm' , 'profile.name profile.emailContact').populate('customer' , 'profile.name profile.emailContact');
        if(!project) throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND , 'Không tìm thấy dự án !');
        const phase = await getPhaseByProjectId(projectId);
        const query : IGetDocumentInProjectQuery = {
            page : 1,
            limit : 10,
            sort : 'asc',
            search : '',            type : '',
            name : '',
        }
        if(!phase) throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND , 'Không tìm thấy giai đoạn !');
        const documents = await getDocumentInProject(projectId , query);
        const projectData = {
            project : project,
            phases : phase,
            documents : documents
        }
        return projectData;
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}