import { Request, Response, NextFunction } from 'express';
import { createDocumentSchema } from './dto/document.validation';
import { uploadMultiple } from '../../common/middlewares/upload.middleware';
import { ApiError, ApiResponse, HTTP_STATUS } from '../../common/constants';
import { 
    IContent, 
    IDocumentMetadata, 
    IFile, 
    IGetDocumentInProjectQuery, 
    IUploadedFile 
} from './dto/document.type';
import { 
    addContentToDocument, 
    createDocument, 
    deleteContent, 
    deleteDocument, 
    getDocumentInProject, 
    updateContent, 
    updateDocument,
    changeIsCompleted,
    messageDocStatus
} from './document.service';
import { Document } from './document.model';
import fs from 'fs';
import path from 'path';
import { 
    cleanupFiles ,
    transformUploadedFiles 
} from '../../common/utils';
import { queueMail } from '../mail/mail';
import Project from '../project/project.model';



export const createDocumentController = async (req: Request, res: Response, next: NextFunction) => {
    const files = [] as Express.Multer.File[];
    try {
        // Upload files
        await new Promise<void>((resolve, reject) => {
            uploadMultiple(req, res, (error: any) => {
                if (error) {
                    reject(new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'File upload error: ' + error.message));
                }
                resolve();
            });
        });

        if (req.files) {
            files.push(...(req.files as Express.Multer.File[]));
        }
        
        try {
            // Validate document data exists
            if (!req.body.document) {
                throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'Document data is required');
            }

            // Parse và validate document data
            let documentData;
            try {
                documentData = JSON.parse(req.body.document);
            } catch (error) {
                throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'Invalid document data format');
            }

            const { error, value } = createDocumentSchema.validate(documentData, { abortEarly: false });
            
            if (error) {
                throw new ApiError(
                    HTTP_STATUS.ERROR.BAD_REQUEST,
                    'Validation error: ' + error.details.map(detail => detail.message).join(', ')
                );
            }

            // Transform uploaded files
            const uploadedFiles = transformUploadedFiles(files);

            // Create document
            const result = await createDocument(
                req,
                value,
                uploadedFiles
            );

            const project = await Project.findById(result.document.projectId)
                .populate('customer', 'profile.name profile.emailContact')
                .populate('pm', 'profile.name profile.emailContact');
          

            // Return response
            const response: ApiResponse<typeof result> = {
                status: 'success',
                message: req.t('createDocument.success', {ns: 'document'}),
                data: result
            };

            if(result && project) {
                // Gửi email thông báo cho PM và Customer
                const emailRecipients = [];
                
                const pmData = project.pm as any;
                const customerData = project.customer as any;
                
                if (pmData?.profile?.emailContact) {
                    emailRecipients.push(pmData.profile.emailContact);
                }
                
                if (customerData?.profile?.emailContact) {
                    emailRecipients.push(customerData.profile.emailContact);
                }
                
                if (emailRecipients.length > 0) {
                    await queueMail({
                        to: emailRecipients.join(', '),
                        subject: `Tài liệu mới: ${result.document.name}`,
                        templateName: 'addDocInProject.template',
                        templateData: {
                            projectName: project.name,
                            documentName: result.document.name,
                            message: `Tài liệu ${result.document.name} đã được thêm vào dự án ${project.name}`
                        },
                        priority: 2
                    }, req.user?._id as string, req);
                }
            }

            return res.status(HTTP_STATUS.SUCCESS.CREATED).json(response);

        } catch (error) {
            // Cleanup files if validation or creation fails
            cleanupFiles(files);
            throw error;
        }

    } catch (error: any) {
        // Cleanup files in case of any error
        if (files.length > 0) {
            cleanupFiles(files);
        }
        
        // Handle specific API errors
        if (error instanceof ApiError) {
            const response: ApiResponse<null> = {
                status: 'error',
                message: error.message,
                data: null
            };
            return res.status(error.statusCode).json(response);
        }
        
        // Log unexpected errors
        console.error('Create document error:', error);
        next(error);
    }
};

export const addContentToDocumentController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Upload files
        await new Promise<void>((resolve, reject) => {
            uploadMultiple(req, res, (error: any) => {
                if (error) {
                    reject(error);
                }
                resolve();
            });
        });

        const files = (req.files || []) as Express.Multer.File[];
        
        try {
            const {documentId} = req.params;
            
            // Get content from request body
            let contentData: { content: string; fileIndexes?: number[] };
            
            // Check if content is a JSON string or plain text
            try {
                contentData = JSON.parse(req.body.content);
            } catch (e) {
                // If parsing fails, treat it as plain text
                contentData = {
                    content: req.body.content,
                    fileIndexes: Array.from({ length: files.length }, (_, i) => i) // Create array [0,1,2,...] based on number of files
                };
            }

            // Validate content
            if (!contentData.content) {
                throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'Content is required');
            }
            
            // Transform uploaded files
            const uploadedFiles = transformUploadedFiles(files);

            const result = await addContentToDocument(
                req,
                documentId,
                contentData,
                uploadedFiles
            );
            
            const response: ApiResponse<typeof result> = {
                status: 'success',
                message: req.t('addContentToDocument.success', {ns: 'document'}),
                data: result
            };
            
            return res.status(HTTP_STATUS.SUCCESS.CREATED).json(response);
        } catch (error) {
            // Cleanup files if update fails
            cleanupFiles(files);
            throw error;
        }
    } catch (error) {
        next(error);
    }
};


export const getDocumentInProjectController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {projectId} = req.params;
        const {page , limit , sort , search , type , name , createdBy , createdAt , isCompleted} = req.query;
        const query : IGetDocumentInProjectQuery = {
            page : Number(page),
            limit : Number(limit),
            sort : sort as string,
            search : search as string,
            type : type as string,
            name : name as string,
            isCompleted : isCompleted as string, // truyền đúng dạng string
            createdBy : createdBy as string,
            createdAt : createdAt as string,
        }
        const result = await getDocumentInProject(projectId , query);
        const response: ApiResponse<typeof result> = {
            status: 'success',
            message: req.t('getDocumentInProject.success', {ns: 'document'}),
            data: result
        };
        return res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export const updateDocumentController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {documentId} = req.params;
        const {name , isCompleted} = req.body;
        const documentData : IDocumentMetadata = {
            name , isCompleted , updatedBy : req.user?._id.toString() , updatedAt : new Date()
        }
        const result = await updateDocument(req , documentId , documentData);
        const response: ApiResponse<typeof result> = {
            status: 'success',
            message: req.t('updateDocument.success', {ns: 'document'}),
            data: result
        };
        return res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export const updateContentController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {contentId} = req.params;
        if (!contentId) {
            throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'Content ID is required');
        }

        // Upload files
        await new Promise<void>((resolve, reject) => {
            uploadMultiple(req, res, (error : any) => {
                if (error) {
                    reject(error);
                }
                resolve();
            });
        });

        const files = (req.files || []) as Express.Multer.File[];
        
        try {
            // Get content text directly from form-data
            const content = req.body.content;
            if (!content) {
                throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, 'Content text is required');
            }

            // Get existing files from form-data
            const existingFiles = JSON.parse(req.body.existingFiles || '[]');

            // Find document and check permissions
            const document = await Document.findOne({ 'contents._id': contentId });
            if (!document) {
                throw new ApiError(
                    HTTP_STATUS.ERROR.NOT_FOUND, 
                    `Document containing content ID ${contentId} not found`
                );
            }

            // Get existing content
            const existingContent = document.contents.find(c => c._id?.toString() === contentId);
            if (!existingContent) {
                throw new ApiError(
                    HTTP_STATUS.ERROR.NOT_FOUND,
                    `Content with ID ${contentId} not found in document`
                );
            }

            // Transform new uploaded files
            const newFiles: IFile[] = files.map((file) => ({
                originalName: file.originalname, // Sử dụng trực tiếp originalname thay vì chuyển đổi encoding
                path: file.filename,
                size: file.size,
                type: file.mimetype,
            }));

            // Combine existing and new files
            const updatedFiles = [...existingFiles, ...newFiles];

            const updateData: IContent = {
                content: content,
                files: updatedFiles,
            };

            const result = await updateContent(req, contentId, updateData);
            
            const response: ApiResponse<typeof result> = {
                status: 'success',
                message: req.t('updateContent.success', {ns: 'document'}),
                data: result
            };
            
            return res.status(HTTP_STATUS.SUCCESS.OK).json(response);
        } catch (error) {
            // Cleanup new files if update fails
            cleanupFiles(files);
            throw error;
        }
    } catch (error) {
        // Improve error handling
        if (error instanceof ApiError) {
            const response: ApiResponse<null> = {
                status: 'error',
                message: error.message,
                data: null
            };
            return res.status(error.statusCode).json(response);
        }
        next(error);
    }
};

export const deleteDocumentController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {documentId} = req.params;
        const result = await deleteDocument(req , documentId);
        const response: ApiResponse<typeof result> = {
            status: 'success',
            message: req.t('deleteDocument.success', {ns: 'document'}),
            data: result
        };
        return res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}


export const deleteContentController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {contentId} = req.params;
        const result = await deleteContent(req , contentId);
        const response: ApiResponse<typeof result> = {
            status: 'success',
            message: req.t('deleteContent.success', {ns: 'document'}),
            data: result
        };
        return res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export const downloadFileController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {filename} = req.params;
        const uploadDir = path.join(__dirname, "../../uploads");
        const filePath = path.join(uploadDir, filename);
        if(!fs.existsSync(filePath)) throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND, 'File not found');
        res.download(filePath); 
        return res.status(HTTP_STATUS.SUCCESS.OK).json({
            status: 'success',
            message: req.t('downloadFile.success', {ns: 'document'}),
            data: null
        });
    } catch (error) {
        next(error);
    }
}

export const changeIsCompletedController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {documentId} = req.params;
        const doc = await changeIsCompleted(req , documentId);
        res.status(HTTP_STATUS.SUCCESS.OK).json({
            status : 'success',
            message : req.t('document.update', {ns: 'document'}),
            data : doc
        } as ApiResponse<typeof doc>)
    } catch (error) {
        next(error);
    }
}

export const messageDocStatusController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {projectId} = req.params;
        const result = await messageDocStatus(req , projectId);
        const response : ApiResponse<typeof result> = {
            status : 'success',
            message : req.t('messageDocStatus.success', {ns: 'document'}),
            data : result
        }
        return res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}