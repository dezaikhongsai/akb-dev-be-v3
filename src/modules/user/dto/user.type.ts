import { ObjectId } from "mongoose";

export interface IProfile {
    name: string;
    emailContact: string;
    phoneContact: string;
    companyName?: string;
    dob?: Date;
    address?: string;
    note?: string;
}

export interface IUser {
    _id?: string;
    email: string;
    password: string;
    role: 'admin' | 'customer' | 'pm';
    alias: string;
    isActive: boolean;
    profile?: IProfile;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICreateUser extends Omit<IUser, '_id'> {}

export interface IUpdateUser extends Partial<Omit<IUser, '_id' | 'email' | 'password' | 'alias' | 'createdBy' | 'createdAt'>> {}

export interface IProjectStatistics {
    totalProjects: number;
    pendingProjects: number;
    processingProjects: number;
    completedProjects: number;
    percentPending: number;
    percentProcessing: number;
    percentCompleted: number;
}

export interface ICompletedProject {
    _id: string;
    name: string;
    alias: string;
    status: 'completed';
    startDate?: Date;
    endDate?: Date;
    createdAt: Date;
    pm: {
        _id: string;
        alias: string;
        profile?: {
            name: string;
        };
    };
    customer: {
        _id: string;
        alias: string;
        profile?: {
            name: string;
        };
    };
}

export interface IUserProjectStatistic {
    user: {
        _id: string;
        alias: string;
        email: string;
        role: 'admin' | 'customer' | 'pm';
        profile?: IProfile;
        createdBy?: {
            _id: string;
            email: string;
            profile?: {
                name: string;
            };
        };
        updatedBy?: {
            _id: string;
            email: string;
            profile?: {
                name: string;
            };
        };
    };
    projectStatistics: IProjectStatistics;
    completedProjectsList: ICompletedProject[];
}

export interface IStatisticUserProjectResponse {
    totalUsers: number;
    statistics: IUserProjectStatistic[];
}