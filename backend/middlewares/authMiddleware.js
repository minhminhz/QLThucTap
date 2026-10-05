const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const verifyToken = async (req, res, next) => {
    try {
        let token = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query && req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để thực hiện chức năng này.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vymi_tech_internship_secret_key_2026_jwt');

        // Fetch fresh user from database
        const [rows] = await pool.query(
            `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.department_id, u.avatar, u.status,
                    b.name as branch_name, d.name as department_name
             FROM users u
             LEFT JOIN branches b ON u.branch_id = b.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.id = ?`,
            [decoded.id]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Người dùng không tồn tại hoặc tài khoản đã bị xóa.'
            });
        }

        const user = rows[0];
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.'
            });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Xác thực không thành công. Token không hợp lệ.'
        });
    }
};

module.exports = {
    verifyToken
};
