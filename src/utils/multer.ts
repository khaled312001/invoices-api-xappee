import multer from "multer";

export interface MulterRequest extends Request {
    file: Express.Multer.File;
}

export const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB size limit
    fileFilter: (req, file, cb: any) => {
        if (!file.originalname.endsWith('.csv')) {
            return cb(new Error('Please upload a CSV file.'), false);
        }
        cb(null, true);
    },
}); 