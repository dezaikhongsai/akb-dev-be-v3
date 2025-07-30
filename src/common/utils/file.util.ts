import path from "path";
import { IContent, IFile, IUploadedFile } from "../../modules/document/dto/document.type";
import fs from "fs";

const uploadDir = path.join(__dirname, "../../uploads");

// Function để xử lý tên file tiếng Việt một cách nhất quán
export const sanitizeFileName = (fileName: string): string => {
    console.log('Sanitizing fileName in util:', fileName);
  
    // Regex kiểm tra tên file hợp lệ (chữ thường, hoa, tiếng Việt, số, khoảng trắng, ., -, _)
    const validVietnameseFileNameRegex = /^[a-zA-Z0-9\s._-àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]+$/;
  
    // Kiểm tra xem tên file đã có ký tự tiếng Việt đúng chưa
    const hasVietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(fileName);
    
    if (hasVietnameseChars) {
      console.log('File name already has correct Vietnamese characters, keeping as is');
      return fileName;
    }
  
    const methods = [
      // Method 1: decodeURIComponent
      () => {
        try {
          const result = decodeURIComponent(fileName);
          return result;
        } catch {
          return null;
        }
      },
      // Method 2: Buffer latin1 -> UTF-8
      () => {
        try {
          const result = Buffer.from(fileName, 'latin1').toString('utf8');
          return result;
        } catch {
          return null;
        }
      },
      // Method 3: Buffer binary -> UTF-8
      () => {
        try {
          const result = Buffer.from(fileName, 'binary').toString('utf8');
          return result;
        } catch {
          return null;
        }
      },
      // Method 4: Thử decode với escape sequences
      () => {
        try {
          // Thử xử lý các escape sequences phổ biến
          let result = fileName;
          result = result.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
          });
          return result;
        } catch {
          return null;
        }
      },
      // Method 5: Giữ nguyên
      () => fileName
    ];
  
    for (const method of methods) {
      const result = method();
      if (result && result !== fileName) {
        // Kiểm tra xem kết quả có chứa ký tự tiếng Việt đúng không
        const hasCorrectVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(result);
        if (hasCorrectVietnamese) {
          console.log('Successfully sanitized to valid Vietnamese filename:', result);
          return result;
        } else {
          console.log('Tried sanitizing but still invalid:', result);
        }
      }
    }
  
    console.log('Using original fileName, but invalid format:', fileName);
    return fileName;
  };
  
  

// Pure function để map file indexes với uploaded files
export const mapFilesToContent = (fileIndexes: number[] = [], uploadedFiles: IUploadedFile[]): IFile[] => 
    fileIndexes
        .map(index => uploadedFiles.find(f => f.index === index))
        .filter((file): file is IUploadedFile => file !== undefined)
        .map(file => ({
            originalName: sanitizeFileName(file.originalName), // Xử lý tên file tiếng Việt
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
                        originalName: sanitizeFileName(uploadedFile.originalName), // Xử lý tên file tiếng Việt
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
    files.map((file, index) => {
        // console.log(`Transform file ${index + 1}:`);
        // console.log(`  - Original originalname:`, file.originalname);
        
        // Thử xử lý encoding trực tiếp trước khi sanitize
        let processedName = file.originalname;
        
        // Thử các phương pháp decode khác nhau
        const decodeMethods = [
            () => {
                try {
                    return decodeURIComponent(file.originalname);
                } catch {
                    return null;
                }
            },
            () => {
                try {
                    return Buffer.from(file.originalname, 'latin1').toString('utf8');
                } catch {
                    return null;
                }
            },
            () => {
                try {
                    return Buffer.from(file.originalname, 'binary').toString('utf8');
                } catch {
                    return null;
                }
            }
        ];
        
        for (const method of decodeMethods) {
            const result = method();
            if (result && result !== file.originalname) {
                // Kiểm tra xem kết quả có chứa ký tự tiếng Việt đúng không
                const hasVietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(result);
                if (hasVietnameseChars) {
                    console.log(`Successfully decoded filename ${index + 1}:`, result);
                    processedName = result;
                    break;
                }
            }
        }
        
        const sanitizedName = sanitizeFileName(processedName);
        console.log(`  - Sanitized name:`, sanitizedName);
        
        return {
            originalName: sanitizedName, // Xử lý tên file tiếng Việt
            filename: file.filename,
            path: file.path,
            size: file.size,
            type: file.mimetype,
            index
        };
    });

// Pure function để cleanup files
export const cleanupFiles = (files: Express.Multer.File[]) =>
    files.forEach(file => {
        try {
            fs.unlinkSync(file.path);
        } catch (err) {
            console.error('Error deleting file:', err);
        }
    });
