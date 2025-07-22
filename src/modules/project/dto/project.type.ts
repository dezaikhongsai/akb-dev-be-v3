import { ObjectId } from "mongoose";

export interface IProject {
    _id ? : string | ObjectId;
    alias : string ;
    name : string;
    pm : string | ObjectId;
    customer : string | ObjectId;
    status : 'pending' | 'processing' | 'completed';
    startDate ?: Date;
    endDate ?: Date;
    isActive : boolean;
    currentPhase: number;
    createdAt? : Date;
    updatedAt? : Date;
    createdBy? : string | ObjectId;
    updatedBy? : string | ObjectId;
}

export interface IProjectQuery {
    page ?: number;
    limit ?: number;
    sort ?: 'asc' | 'desc';
    search ?: string;
    status ?: 'pending' | 'processing' | 'completed' | undefined;
    startDate ?: Date;
    pm ?: string ;
    customer ?: string ;
    isActive ?: string;
    monthYearStart?: string; // Format: MM/YYYY
    monthYearEnd?: string; // Format: MM/YYYY
    quarterYearStart?: string; // Format: Q1/YYYY, Q2/YYYY, Q3/YYYY, Q4/YYYY
    quarterYearEnd?: string; // Format: Q1/YYYY, Q2/YYYY, Q3/YYYY, Q4/YYYY
}

export interface IProjectUpdate {
    name ?: string;
    status ?: 'pending' | 'processing' | 'completed';
    startDate ?: Date;
    endDate ?: Date;
    isActive ?: boolean;
    currentPhase?: number;
    createdAt? : Date;
    updatedAt? : Date;
    updatedBy? : string | ObjectId;
}

export interface IProjectStatisticsQuery {
    monthYearStart?: string; // Format: MM/YYYY
    monthYearEnd?: string; // Format: MM/YYYY
    quarterYearStart?: string; // Format: Q1/YYYY, Q2/YYYY, Q3/YYYY, Q4/YYYY
    quarterYearEnd?: string; // Format: Q1/YYYY, Q2/YYYY, Q3/YYYY, Q4/YYYY
}

export interface IProjectStatisticsMetric {
    current: number;
    previous: number;
    percentageChange: number;
}

export interface IProjectProgress {
    projectId: string;
    name: string;
    alias: string;
    timeProgress: number; // % progress based on endDate
    phaseProgress: number; // % progress based on phases
    totalPhases: number;
    currentPhase: number;
    startDate?: Date | null;
    endDate?: Date | null;
    pm: {
        _id: string;
        name: string;
    };
    customer: {
        _id: string;
        name: string;
    };
}

export interface IProjectStatistics {
    totalActiveProjects: IProjectStatisticsMetric;
    totalPendingProjects: IProjectStatisticsMetric;
    totalProcessingProjects: IProjectStatisticsMetric;
    totalCompletedProjects: IProjectStatisticsMetric;
    activeProjectsProgress: IProjectProgress[];
    timeRange: {
        current: {
            start: Date;
            end: Date;
        };
        previous: {
            start: Date;
            end: Date;
        };
    };
}