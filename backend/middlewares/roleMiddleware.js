const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để tiếp tục.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Quyền truy cập bị từ chối. Bạn không có quyền thực hiện chức năng này (${req.user.role}).`
            });
        }

        next();
    };
};

module.exports = {
    requireRole
};
