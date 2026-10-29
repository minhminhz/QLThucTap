const AppError = require('../utils/appError');

/**
 * 404 Not Found Middleware
 */
const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Đường dẫn API không tồn tại: ${req.method} ${req.originalUrl}`
    });
};

/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    error.code = err.code;
    error.stack = err.stack;

    const isDev = process.env.NODE_ENV !== 'production';

    // Log error to console in server
    console.error(`[Error] [${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} ->`, err.message || err);
    if (isDev && err.stack) {
        console.error(err.stack);
    }

    // 1. AppError (Operational errors intentionally thrown)
    let statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
    let message = err.message || 'Đã có lỗi xảy ra trên hệ thống.';
    let details = err.details || null;

    // 2. Multer Errors
    if (err.name === 'MulterError') {
        statusCode = 400;
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'Dung lượng file vượt quá giới hạn cho phép.';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Trường dữ liệu tải lên file không hợp lệ hoặc vượt quá số lượng cho phép.';
        } else {
            message = `Lỗi tải file: ${err.message}`;
        }
    } else if (err.message && (err.message.includes('Chỉ chấp nhận file') || err.message.includes('Định dạng tệp'))) {
        // Custom fileFilter rejection from Multer
        statusCode = 400;
        message = err.message;
    }

    // 3. MySQL Database Errors
    if (err.code) {
        switch (err.code) {
            case 'ER_DUP_ENTRY': // 1062
                statusCode = 409;
                message = 'Dữ liệu đã tồn tại trong hệ thống (trùng lặp thông tin).';
                // Try to extract duplicated key detail
                if (err.sqlMessage) {
                    const match = err.sqlMessage.match(/Duplicate entry '([^']+)' for key '([^']+)'/);
                    if (match) {
                        message = `Giá trị "${match[1]}" đã tồn tại trong hệ thống. Vui lòng chọn giá trị khác.`;
                    }
                }
                break;

            case 'ER_NO_REFERENCED_ROW_2': // 1452
            case 'ER_NO_REFERENCED_ROW':   // 1216
                statusCode = 400;
                message = 'Dữ liệu liên kết không tồn tại trong hệ thống (cơ sở, phòng ban hoặc người dùng không hợp lệ).';
                break;

            case 'ER_ROW_IS_REFERENCED_2': // 1451
            case 'ER_ROW_IS_REFERENCED':   // 1217
                statusCode = 409;
                message = 'Không thể xóa hoặc sửa bản ghi này do đang có các dữ liệu khác phụ thuộc liên kết.';
                break;

            case 'ER_DATA_TOO_LONG': // 1406
                statusCode = 400;
                message = 'Độ dài dữ liệu nhập vào vượt quá giới hạn cho phép của hệ thống.';
                break;

            case 'ER_BAD_NULL_ERROR': // 1048
                statusCode = 400;
                message = 'Vui lòng cung cấp đầy đủ các trường thông tin bắt buộc.';
                break;

            case 'ECONNREFUSED':
            case 'PROTOCOL_CONNECTION_LOST':
                statusCode = 503;
                message = 'Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau giây lát.';
                break;
        }
    }

    // 4. JWT Authentication Errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Mã xác thực (Token) không hợp lệ. Vui lòng đăng nhập lại.';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }

    // 5. Mask internal 500 error messages in production
    if (!isDev && statusCode === 500 && !err.isOperational) {
        message = 'Đã có lỗi nội bộ xảy ra trên máy chủ. Vui lòng liên hệ quản trị viên.';
    }

    // Response object
    const responsePayload = {
        success: false,
        message
    };

    if (details) {
        responsePayload.details = details;
    }

    if (isDev && statusCode === 500) {
        responsePayload.stack = err.stack;
    }

    return res.status(statusCode).json(responsePayload);
};

module.exports = {
    notFound,
    errorHandler
};
