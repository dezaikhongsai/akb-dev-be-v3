import { Model, Schema, model } from "mongoose";
import { IProject } from "./dto";

const projectSchema  = new Schema<IProject>({
    name : {type : String , required : true},
    alias : {type : String , required : true},
    pm : {type : Schema.Types.ObjectId , ref : 'User' , required : true},
    customer : {type : Schema.Types.ObjectId , ref : 'User' , required : true},
    status : {type : String , enum : ['pending' , 'processing' , 'completed'] , required : true},
    startDate : {type : Date , required : false},
    endDate : {type : Date , required : false},
    isActive : {type : Boolean , default : true},
    currentPhase: {type: Number, default: 0},
    createdBy : {type : Schema.Types.ObjectId , ref : 'User' , required : true},
    updatedBy : {type : Schema.Types.ObjectId , ref : 'User' , required : true},
} , {timestamps : true});

const Project : Model<IProject> = model<IProject>('Project' , projectSchema);

export default Project;