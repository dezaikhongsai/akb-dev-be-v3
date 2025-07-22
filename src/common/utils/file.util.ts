import path from "path";
import { IContent, IFile, IUploadedFile } from "../../modules/document/dto/document.type";
import fs from "fs";

const uploadDir = path.join(__dirname, "../../uploads");

// Pure function để map file indexes với uploaded files
export const mapFilesToContent = (fileIndexes: number[] = [], uploadedFiles: IUploadedFile[]): IFile[] => 
    fileIndexes
        .map(index => uploadedFiles.find(f => f.index === index))
        .filter((file): file is IUploadedFile => file !== undefined)
        .map(file => ({
            originalName: file.originalName,
            path: file.filename, 
            size: file.size,
            type: file.type
}));


// Utility function to get all file paths from contents
export const getAllFilePaths = (contents: IContent[]): string[] => {
    return contents.reduce((paths: string[], content) => {
        const filePaths = content.files
            .filter((file): file is IFile => !('fileIndex' in file))
            .map(file => file.path);
        return [...paths, ...filePaths];
    }, []);
};

// Utility function to delete files from uploads directory
export const deleteFiles = async (filePaths: string[]): Promise<void> => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    for (const filePath of filePaths) {
        try {
            const fullPath = path.join(uploadDir, filePath);
            if (fs.existsSync(fullPath)) {
                await fs.promises.unlink(fullPath);
                console.log(`File ${filePath} deleted successfully`);
            }
        } catch (error) {
            console.error(`Error deleting file ${filePath}:`, error);
        }
    }
};

// Utility function to find files that need to be deleted
export const findFilesToDelete = (oldContents: IContent[], newContents: IContent[]): string[] => {
    const oldFiles = getAllFilePaths(oldContents);
    const newFiles = getAllFilePaths(newContents);
    
    return oldFiles.filter(oldFile => !newFiles.includes(oldFile));
};

// Utility function to validate file paths
export const validateFilePaths = async (files: IFile[]): Promise<boolean> => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    for (const file of files) {
        const fullPath = path.join(uploadDir, file.path);
        if (!fs.existsSync(fullPath)) {
            return false;
        }
    }
    return true;
};

// Utility function to map new uploaded files to content
export const mapNewFilesToContent = (contents: IContent[], uploadedFiles: IUploadedFile[]): IContent[] => {
    return contents.map(content => {
        if (!content.files) return content;
        
        const updatedFiles = content.files.map(file => {
            // Nếu file có index, đây là file mới upload
            if ('fileIndex' in file) {
                const uploadedFile = uploadedFiles.find(f => f.index === file.fileIndex);
                if (uploadedFile) {
                    return {
                        originalName: uploadedFile.originalName,
                        path: uploadedFile.filename,
                        size: uploadedFile.size,
                        type: uploadedFile.type
                    };
                }
            }
            return file;
        });

        return {
            ...content,
            files: updatedFiles.filter(file => file !== null)
        };
    });
};

export const transformUploadedFiles = (files: Express.Multer.File[]): IUploadedFile[] =>
    files.map((file, index) => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        type: file.mimetype,
        index
    }));

// Pure function để cleanup files
export const cleanupFiles = (files: Express.Multer.File[]) =>
    files.forEach(file => {
        try {
            fs.unlinkSync(file.path);
        } catch (err) {
            console.error('Error deleting file:', err);
        }
    });
