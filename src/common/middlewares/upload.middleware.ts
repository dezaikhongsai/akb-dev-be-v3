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
  | 'image/jpg';

// Định nghĩa các loại file được phép upload
const ALLOWED_FILE_TYPES: Record<AllowedMimeTypes, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/jpg': '.jpg'
};

// Hàm xử lý tên file tiếng Việt
const normalizeFileName = (fileName: string): string => {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
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
  fileFilter
});

export const uploadMultiple = multerUpload.array("files", 10);
