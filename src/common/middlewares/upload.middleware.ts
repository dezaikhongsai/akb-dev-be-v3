import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';

// Trỏ tới thư mục uploads bên trong src
const uploadDir = path.join(__dirname, "..", "..", "uploads");

// Tạo thư mục nếu chưa có
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Định nghĩa type cho các loại file được phép
type AllowedMimeTypes = 
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'image/jpeg'
  | 'image/png'
  | 'image/jpg'
  | 'image/gif'
  | 'image/webp'
  | 'image/svg+xml'
  | 'image/tiff'
  | 'image/bmp'
  | 'image/heic'
  | 'image/heif';

// Định nghĩa các loại file được phép upload
const ALLOWED_FILE_TYPES: Record<AllowedMimeTypes, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/jpg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/tiff': '.tiff',
  'image/bmp': '.bmp',
  'image/heic': '.heic',
  'image/heif': '.heif'
};

// Function để xử lý tên file tiếng Việt một cách chính xác
const sanitizeOriginalName = (fileName: string): string => {
  console.log('Sanitizing fileName:', fileName);
  
  // Kiểm tra xem tên file đã có ký tự tiếng Việt đúng chưa
  const hasVietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(fileName);
  
  if (hasVietnameseChars) {
    console.log('File name already has correct Vietnamese characters, keeping as is');
    return fileName;
  }
  
  // Thử các phương pháp khác nhau để xử lý encoding
  const methods = [
    // Method 1: Thử decode URI component
    () => {
      try {
        return decodeURIComponent(fileName);
      } catch {
        return null;
      }
    },
    // Method 2: Thử Buffer từ latin1 sang utf8
    () => {
      try {
        return Buffer.from(fileName, 'latin1').toString('utf8');
      } catch {
        return null;
      }
    },
    // Method 3: Thử Buffer từ binary sang utf8
    () => {
      try {
        const buffer = Buffer.from(fileName, 'binary');
        return buffer.toString('utf8');
      } catch {
        return null;
      }
    },
    // Method 4: Giữ nguyên nếu tất cả đều thất bại
    () => fileName
  ];

  for (const method of methods) {
    const result = method();
    if (result && result !== fileName) {
      // Kiểm tra xem kết quả có chứa ký tự tiếng Việt đúng không
      const hasCorrectVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(result);
      if (hasCorrectVietnamese) {
        console.log('Successfully sanitized:', result);
        return result;
      }
    }
  }

  console.log('Using original fileName:', fileName);
  return fileName;
};

// Hàm xử lý tên file tiếng Việt - giữ nguyên tên gốc nhưng loại bỏ ký tự đặc biệt cho tên file lưu trên server
const normalizeFileName = (fileName: string): string => {
  // Giữ nguyên tên gốc cho originalname, chỉ chuẩn hóa cho filename lưu trên server
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu thanh
    .replace(/đ/g, 'd').replace(/Đ/g, 'D') // Chuyển đổi đ/Đ thành d/D
    .replace(/[^a-zA-Z0-9.\-_]/g, '-') // Thay thế ký tự đặc biệt bằng dấu gạch ngang
    .replace(/-+/g, '-') // Gộp nhiều dấu gạch ngang liên tiếp
    .replace(/^-+|-+$/g, ''); // Loại bỏ dấu gạch ngang ở đầu và cuối
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    try {
      const ext = ALLOWED_FILE_TYPES[file.mimetype as AllowedMimeTypes] || path.extname(file.originalname);
      const uuid = uuidv4();
      const originalNameWithoutExt = path.parse(file.originalname).name;
      const normalizedName = normalizeFileName(originalNameWithoutExt);
      const newFileName = `${normalizedName}-${uuid}${ext}`;
      
      // Lưu tên file vào file object để sử dụng sau này
      file.filename = newFileName;
      
      cb(null, newFileName);
    } catch (error) {
      cb(error as Error, '');
    }
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_FILE_TYPES[file.mimetype as AllowedMimeTypes]) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ hỗ trợ file PDF, DOCX, XLSX, JPG, JPEG hoặc PNG"));
  }
};

const multerUpload = multer({
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Log file details for debugging
    console.log('Multer processing file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    if (ALLOWED_FILE_TYPES[file.mimetype as AllowedMimeTypes]) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ hỗ trợ file PDF, DOCX, XLSX, JPG, JPEG hoặc PNG"));
    }
  },
  // Thêm cấu hình để xử lý encoding UTF-8 đúng cách
  preservePath: true
});

// Middleware để xử lý encoding sau khi Multer xử lý
export const uploadMultiple = (req: any, res: any, next: any) => {
  // Log request headers để debug
  // console.log('Content-Type:', req.headers['content-type']);
  // console.log('Content-Length:', req.headers['content-length']);
  
  multerUpload.array("files", 10)(req, res, (err) => {
    if (err) {
      return next(err);
    }
    
    // Xử lý encoding cho tên file sau khi Multer xử lý
    if (req.files) {
      req.files.forEach((file: Express.Multer.File, index: number) => {
        console.log(`File ${index + 1} originalname:`, file.originalname);
        
        // Thử xử lý encoding cho tên file
        const originalName = file.originalname;
        let sanitizedName = originalName;
        
        // Thử các phương pháp decode khác nhau
        const decodeMethods = [
          () => {
            try {
              return decodeURIComponent(originalName);
            } catch {
              return null;
            }
          },
          () => {
            try {
              return Buffer.from(originalName, 'latin1').toString('utf8');
            } catch {
              return null;
            }
          },
          () => {
            try {
              return Buffer.from(originalName, 'binary').toString('utf8');
            } catch {
              return null;
            }
          },
          () => {
            try {
              // Thử xử lý với escape sequences
              let result = originalName;
              result = result.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
                return String.fromCharCode(parseInt(hex, 16));
              });
              return result;
            } catch {
              return null;
            }
          }
        ];
        
        for (const method of decodeMethods) {
          const result = method();
          if (result && result !== originalName) {
            // Kiểm tra xem kết quả có chứa ký tự tiếng Việt đúng không
            const hasVietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(result);
            if (hasVietnameseChars) {
              // console.log(`Successfully decoded filename ${index + 1}:`, result);
              sanitizedName = result;
              break;
            }
          }
        }
        
        // Cập nhật tên file đã được xử lý
        file.originalname = sanitizedName;
        // console.log(`File ${index + 1} sanitized originalname:`, sanitizedName);
      });
    }
    
    next();
  });
};
