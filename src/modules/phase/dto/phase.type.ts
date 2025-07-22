import { ObjectId } from "mongoose";

export interface IPhase {
    _id? : string;
    projectId : string | ObjectId;
    name : string;
    description : string;
    startDate : Date ;
    createdAt : Date;
    updatedAt : Date;
    createdBy : string | ObjectId;
    updatedBy : string | ObjectId;
}

export interface IPhaseUpdate {
    _id ?: string | ObjectId;
    name  : string;
    description : string;
    startDate : Date;
    updatedBy : string | ObjectId;
    updatedAt : Date;
}

