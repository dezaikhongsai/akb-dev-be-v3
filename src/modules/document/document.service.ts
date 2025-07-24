import { ApiError, HTTP_STATUS } from '../../common/constants';
import { 
    IUploadedFile, 
    ICreateDocumentResponse, 
    IContent, IGetDocumentInProjectQuery, 
    IDocumentMetadata 
} from './dto';
import { Document } from './document.model';
import { Request } from 'express';
import fs from 'fs';
import path from 'path';
import { 
    getAllFilePaths ,
    deleteFiles ,
    mapFilesToContent,
} from '../../common/utils';
import Project from '../project/project.model';

const uploadDir = path.join(__dirname, "../../uploads");

export const createDocument = async (
    req: Request,
    documentData: {
        projectId: string;
        type: 'document' | 'report' | 'request';
        name: string;
        contents: Array<{ content: string; fileIndexes?: number[] }>;
    },
    uploadedFiles: IUploadedFile[]
): Promise<ICreateDocumentResponse> => {
    try {
        // Validate project existence and status
        // Transform contents
        const pId = documentData.projectId;
        const project = await Project.findById(pId , {isActive : true });
        if(!project) throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND, req.t('createDocument.error', {ns: 'document'}));
        const contents: IContent[] = documentData.contents.map(contentData => ({
            content: contentData.content,
            files: mapFilesToContent(contentData.fileIndexes, uploadedFiles)
        }));

        // Create document object
        const documentObject = {
            projectId: documentData.projectId,
            type: documentData.type,
            name: documentData.name,
            contents: contents,
            isCompleted : documentData.type !=='request' ? true : false  ,
            createdBy: req.user?._id,
            updatedBy: req.user?._id,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Save to database
        const newDocument = await Document.create(documentObject);
        if (!newDocument) {
            throw new ApiError(
                HTTP_STATUS.ERROR.BAD_REQUEST, 
                req.t('createDocument.error', { ns: 'document' })
            );
        }

        // Transform uploadedFiles for response
        const transformedFiles = uploadedFiles.map(file => ({
            ...file,
            path: file.filename
        }));

        return {
            document: newDocument,
            uploadInfo: {
                success: true,
                files: transformedFiles
            }
        };
    } catch (error: any) {
        // Handle specific errors
        if (error instanceof ApiError) {
            throw error;
        }
        // Log the actual error for debugging
        console.error('Create document error:', error);
        throw new ApiError(
            HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, 
            req.t('createDocument.error', { ns: 'document' })
        );
    }
};

export const addContentToDocument = async (
    req: Request,
    documentId: string,
    contentData: { content: string; fileIndexes?: number[] },
    uploadedFiles: IUploadedFile[]
): Promise<IContent> => {
    try {
        // Find document
        const document = await Document.findById(documentId);
        if (!document) {
            throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND, req.t('addContentToDocument.error', {ns: 'document'}));
        }

        // Check permissions if user is customer
        const userRole = req.user?.role;
        const userId = req.user?._id.toString();
        if (userRole === 'customer' && document.createdBy.toString() !== userId) {
            throw new ApiError(HTTP_STATUS.ERROR.FORBIDDEN, req.t('addContentToDocument.error', {ns: 'document'}));
        }

        // Map files to content
        const files = mapFilesToContent(contentData.fileIndexes, uploadedFiles);

        // Create new content object
        const newContent: IContent = {
            content: contentData.content,
            files: files
        };

        // Add content to document
        document.contents.push(newContent);
        document.updatedAt = new Date();
        if (req.user?._id) {
            document.updatedBy = req.user._id;
        }

        // Save document
        await document.save();

        // Return the newly added content
        return document.contents[document.contents.length - 1];
    } catch (error: any) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const getDocumentInProject = async (projectId: string, query: IGetDocumentInProjectQuery) => {
    try {
        const { page = 1, limit = 10, sort, search, type, name , isCompleted } = query;
        
        // Build query conditions
        const conditions: any = { projectId };
        
        // Add type filter if specified
        if (type) {
            conditions.type = type;
        }
        
        // Add name search if specified
        if (name) {
            conditions.name = { $regex: name, $options: 'i' };
        }

        // Add isCompleted filter if specified (as string)
        if (typeof isCompleted === 'string') {
            if (isCompleted === 'true') {
                conditions.isCompleted = true;
            } else if (isCompleted === 'false') {
                conditions.isCompleted = false;
            }
        }

        // Build sort options
        const sortOptions: any = {};
        if (sort) {
            // sort=createdAt:desc or sort=createdAt:asc
            const [field, order] = sort.split(':');
            sortOptions[field] = order === 'desc' ? -1 : 1;
        } else {
            // Default sort by createdAt descending
            sortOptions.createdAt = -1;
        }

        // Calculate skip value for pagination
        const skip = (Number(page) - 1) * Number(limit);

        // Execute query with pagination
        const documents = await Document.find(conditions)
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit))
            .populate('createdBy', 'username email profile.name role')
            .lean();

        // Get total count for pagination
        const total = await Document.countDocuments(conditions);

        return {
            documents,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        };
    } catch (error: any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
};

export const updateDocument = async (req : Request , documentId : string , documentData : IDocumentMetadata) => {
    try {
        const document = await Document.findById(documentId);
        if(!document) throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND, req.t('updateDocument.error', {ns: 'document'}));
        const userRole = req.user?.role;
        const userId = req.user?._id.toString();
        if(userRole === 'customer' && document.createdBy.toString() !== userId) throw new ApiError(HTTP_STATUS.ERROR.FORBIDDEN, req.t('updateDocument.error', {ns: 'document'}));
        const updatedDocument = await Document.findByIdAndUpdate(documentId, documentData, {new : true});
        if(!updatedDocument) throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND, req.t('updateDocument.error', {ns: 'document'}));
        return updatedDocument;
    } catch (error: any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const updateContent = async (req: Request, contentId: string, contentData: IContent) => {
    try {
        // Find document containing the content
        const document = await Document.findOne({ 'contents._id': contentId });
        if (!document) {
            throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND, req.t('updateContent.error', {ns: 'document'}));
        }

        // Check permissions
        const userRole = req.user?.role;
        const userId = req.user?._id.toString();
        if (userRole === 'customer' && document.createdBy.toString() !== userId) {
            throw new ApiError(HTTP_STATUS.ERROR.FORBIDDEN, req.t('updateContent.error', {ns: 'document'}));
        }

        // Find the specific content in the document
        const existingContent = document.contents.find(c => c._id?.toString() === contentId);
        if (!existingContent) {
            throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND, req.t('updateContent.error', {ns: 'document'}));
        }

        // Validate files
        if (!contentData.files || contentData.files.length === 0) {
            throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'Files cannot be empty');
        }

        // Get list of old files to delete
        const oldFiles = existingContent.files;
        const newFilePaths = contentData.files.map(file => file.path);

        // Update the content within the document
        const updatedDocument = await Document.findOneAndUpdate(
            { 'contents._id': contentId },
            { 
                $set: {
                    'contents.$.content': contentData.content,
                    'contents.$.files': contentData.files
                }
            },
            { new: true }
        );

        if (!updatedDocument) {
            throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND, req.t('updateContent.error', {ns: 'document'}));
        }

        // After successful DB update, delete all old files that are not in the new list
        for (const oldFile of oldFiles) {
            // Only delete if file is not in the new list
            if (!newFilePaths.includes(oldFile.path)) {
                const filePath = path.join(uploadDir, path.basename(oldFile.path));
                if (fs.existsSync(filePath)) {
                    try {
                        await fs.promises.unlink(filePath);
                        console.log("Old file deleted:", filePath);
                    } catch (err) {
                        console.error("Error deleting old file:", filePath, err);
                    }
                }
            }
        }

        // Return the updated content
        const updatedContent = updatedDocument.contents.find(c => c._id?.toString() === contentId);
        return updatedContent;
    } catch (error: any) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
};

export const deleteDocument = async (req: Request, documentId: string) => {
    try {
        // Lấy document để có thông tin về files cần xóa
        const document = await Document.findById(documentId);
        if (!document) {
            throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND, req.t('deleteDocument.error', {ns: 'document'}));
        }

        // Kiểm tra quyền xóa nếu là customer
        const userRole = req.user?.role;
        const userId = req.user?._id.toString();
        if (userRole === 'customer' && document.createdBy.toString() !== userId) {
            throw new ApiError(HTTP_STATUS.ERROR.FORBIDDEN, req.t('deleteDocument.error', {ns: 'document'}));
        }

        // Lấy tất cả file paths từ document
        const filesToDelete = getAllFilePaths(document.contents);

        // Xóa document từ database
        const deletedDocument = await Document.findByIdAndDelete(documentId);
        if (!deletedDocument) {
            throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND, req.t('deleteDocument.error', {ns: 'document'}));
        }

        // Xóa tất cả files liên quan
        await deleteFiles(filesToDelete);

        return deletedDocument;
    } catch (error: any) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
};


export const deleteAllDocumentByProjectId = async (projectId : string) => {
    try {
        const documents = await Document.find({projectId});
        if(!documents) return;
        const filesToDelete = documents.flatMap(document => getAllFilePaths(document.contents));
        await deleteFiles(filesToDelete);
        await Document.deleteMany({projectId});
    } catch (error: any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const deleteContent = async (req: Request, contentId: string) => {
    try {
        // Find document containing the content
        const document = await Document.findOne({ 'contents._id': contentId });
        if (!document) {
            throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND, req.t('deleteContent.error', {ns: 'document'}));
        }

        // Check permissions if user is customer
        const userRole = req.user?.role;
        const userId = req.user?._id.toString();
        if (userRole === 'customer' && document.createdBy.toString() !== userId) {
            throw new ApiError(HTTP_STATUS.ERROR.FORBIDDEN, req.t('deleteContent.error', {ns: 'document'}));
        }

        // Find the content to get files for deletion
        const contentToDelete = document.contents.find(c => c._id?.toString() === contentId);
        if (!contentToDelete) {
            throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND, req.t('deleteContent.error', {ns: 'document'}));
        }

        // Remove content from document
        const updatedDocument = await Document.findOneAndUpdate(
            { _id: document._id },
            { $pull: { contents: { _id: contentId } } },
            { new: true }
        );

        if (!updatedDocument) {
            throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND, req.t('deleteContent.error', {ns: 'document'}));
        }

        // Delete associated files
        for (const file of contentToDelete.files) {
            const filePath = path.join(uploadDir, path.basename(file.path));
            if (fs.existsSync(filePath)) {
                try {
                    await fs.promises.unlink(filePath);
                    console.log(`File ${filePath} deleted successfully`);
                } catch (error) {
                    console.error(`Error deleting file ${filePath}:`, error);
                }
            }
        }

        return contentToDelete;
    } catch (error: any) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const changeIsCompleted = async (req : Request , documentId : string) => {
    try {
        const userId = req.user?._id;
        const userRole = req.user?.role;
        const doc = await Document.findById(documentId);
        if(userRole === 'customer' && userId != doc?.createdBy) throw new ApiError(HTTP_STATUS.ERROR.FORBIDDEN , 'Bạn không có quyền chỉnh sửa thông tin !');
        const newIsCompleted = !doc?.isCompleted;
        const updatedDoc = await Document.findByIdAndUpdate(documentId , {isCompleted : newIsCompleted} , {new :true});
        return updatedDoc;
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER , error.message)
    }
}