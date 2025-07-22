import mongoose from 'mongoose';

export interface ISystem {
    key : string;
    value : {
        name : string;
        value : any;
    };
    description : string;
    createdAt : Date;
    updatedAt : Date;
    createdBy : string | mongoose.Types.ObjectId;
    updatedBy : string | mongoose.Types.ObjectId;
}

export interface ISystemUpdate {
    value : {
        name : string;
        value : any;
    };
    description : string;
    updatedBy : string | mongoose.Types.ObjectId;
    updatedAt : Date;
}

const systemSchema = new mongoose.Schema({
    key : {type : String , required : true , unique : true},
    value : {type: mongoose.Schema.Types.Mixed, required: true },
    description : {type : String , required : false},
    createdAt : {type : Date , default : Date.now},
    updatedAt : {type : Date , default : Date.now},
    createdBy : {type : mongoose.Schema.Types.ObjectId , ref : 'User'},
    updatedBy : {type : mongoose.Schema.Types.ObjectId , ref : 'User'},
})

const System = mongoose.model('System' , systemSchema);

export default System;