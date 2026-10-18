const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'cvs');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `cv_${uniqueSuffix}_${baseName}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();

    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file định dạng PDF, DOC hoặc DOCX!'), false);
    }
};

const uploadCV = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

const taskAttachmentDir = path.join(__dirname, '..', 'uploads', 'task_attachments');
if (!fs.existsSync(taskAttachmentDir)) {
    fs.mkdirSync(taskAttachmentDir, { recursive: true });
}

const taskSubmissionDir = path.join(__dirname, '..', 'uploads', 'task_submissions');
if (!fs.existsSync(taskSubmissionDir)) {
    fs.mkdirSync(taskSubmissionDir, { recursive: true });
}

const taskFileFilter = (req, file, cb) => {
    const allowedExtensions = [
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.png', '.jpg', '.jpeg', '.webp', '.gif',
        '.zip', '.rar', '.7z', '.tar', '.gz',
        '.txt', '.csv', '.json', '.md'
    ];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Định dạng tệp "${ext}" không được hỗ trợ! Vui lòng tải lên file PDF, DOC/DOCX, PNG/JPG, ZIP/RAR hoặc bảng tính.`), false);
    }
};

const storageTaskAttachment = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, taskAttachmentDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `task_${uniqueSuffix}_${baseName}${ext}`);
    }
});

const storageTaskSubmission = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, taskSubmissionDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `submit_${uniqueSuffix}_${baseName}${ext}`);
    }
});

const uploadTaskAttachment = multer({
    storage: storageTaskAttachment,
    limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
    fileFilter: taskFileFilter
});

const uploadTaskSubmission = multer({
    storage: storageTaskSubmission,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: taskFileFilter
});

module.exports = {
    uploadCV,
    uploadTaskAttachment,
    uploadTaskSubmission
};
