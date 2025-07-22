import { Schema , model } from 'mongoose';
import { IDocument , IContent , IFile } from './dto/document.type';

const fileSchema = new Schema<IFile>({
    originalName : {type : String, required : true},
    path : {type : String, required : true},
    size : {type : Number, required : true},
    type : {type : String, required : true},
});

const contentSchema = new Schema<IContent>({
    content : {type : String, required : true},
    files : {type : [fileSchema]},
});

const documentSchema = new Schema<IDocument>({
    projectId : {type : Schema.Types.ObjectId, ref : 'Project', required : true},
    type : {type : String, enum : ['document' , 'report' , 'request'], required : true},
    name : {type : String, required : true},
    isCompleted : {type : Boolean, default : false},
    contents : {type : [contentSchema], required : true},
    createdBy : {type : Schema.Types.ObjectId, ref : 'User'},
    updatedBy : {type : Schema.Types.ObjectId, ref : 'User'},
} , {timestamps : true});

export const Document = model<IDocument>('Document', documentSchema);

export const Content = model<IContent>('Content', contentSchema);

export const File = model<IFile>('File', fileSchema);