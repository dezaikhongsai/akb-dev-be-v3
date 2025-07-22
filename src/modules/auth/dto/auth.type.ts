import { ObjectId } from "mongoose";

export interface IUserAuth{
    _id : string | ObjectId;
    alias : string;
    email : string;
    role? : 'admin' | 'pm' | 'customer';
    isActive? : boolean;
    profile? : any;
}

export interface ILogin {
    email : string;
    password : string;
}