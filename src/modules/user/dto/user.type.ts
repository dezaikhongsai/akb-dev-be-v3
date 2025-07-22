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