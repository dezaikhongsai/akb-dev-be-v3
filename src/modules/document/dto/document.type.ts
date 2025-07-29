import { ObjectId } from "mongoose";

// Interface cho Document trong DB
export interface IDocument {
    _id : string;
    projectId : string | ObjectId;
    type : 'document' | 'report' | 'request';
    name : string;
    isCompleted? : boolean;
    contents : IContent[];
    createdAt : Date;
    updatedAt : Date;
    createdBy : string | ObjectId;
    updatedBy : string | ObjectId;
}

// Interface cho Content trong DB
export interface IContent {
    _id?: string | ObjectId;
    content: string;
    files: Array<IFile>;  // Make files required
} 

// Interface cho File trong DB
export interface IFile {
    _id?: string | ObjectId;
    originalName: string;
    path: string;
    size: number;
    type: string;
    fileIndex?: number; // Thêm field này để đánh dấu file mới
}

// Interface cho request tạo document
export interface ICreateDocumentRequest {
    projectId: string;
    type: 'document' | 'report' | 'request';
    name: string;
    contents: ICreateContentRequest[];
}

// Interface cho request tạo content
export interface ICreateContentRequest {
    content: string;
    fileIndexes: number[]; // Mảng chứa index của các file thuộc content này
}

// Interface cho file đã upload
export interface IUploadedFile {
    originalName: string;
    path: string;
    filename: string; // Thêm trường filename
    size: number;
    type: string;
    index: number; // Index của file trong mảng files gửi lên
}

// Interface cho response khi upload file
export interface IUploadFileResponse {
    success: boolean;
    files: IUploadedFile[];
    error?: string;
}

// Interface cho response khi tạo document
export interface ICreateDocumentResponse {
    document: IDocument;
    uploadInfo: IUploadFileResponse;
}

export interface IGetDocumentInProjectQuery {
    page : number;
    limit : number;
    sort : string;
    search : string;
    type ?: string;
    name : string;
    isCompleted? : string | boolean;
    createdBy ?: string | ObjectId;
    createdAt ?: string | Date;
}

// Interface cho update document
export interface IUpdateDocument {
    name: string;
    contents: IContent[];  // Use IContent directly
    updatedBy: string | ObjectId;
    updatedAt: Date;
}

export interface IDocumentMetadata {
    name? : string;
    isCompleted ?: boolean;
    updatedBy ?: string | ObjectId;
    updatedAt ?: Date;
}

// Interface cho response thống kê tài liệu theo trạng thái
export interface IDocumentStatusResponse {
    document: number;
    request: number;
    report: number;
    total: number;
}