const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Đường dẫn API không tồn tại: ${req.method} ${req.originalUrl}`
    });
};

const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${req.method} ${req.url} ->`, err.message);

    // Multer specific errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Dung lượng file vượt quá giới hạn cho phép (Tối đa 5MB).'
            });
        }
        return res.status(400).json({
            success: false,
            message: `Lỗi tải file: ${err.message}`
        });
    }

    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Đã có lỗi xảy ra trên hệ thống.'
    });
};

module.exports = {
    notFound,
    errorHandler
};
