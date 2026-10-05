const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            branch_id: user.branch_id
        },
        process.env.JWT_SECRET || 'vymi_tech_internship_secret_key_2026_jwt',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

const AuthController = {
    // POST /api/auth/register (Guest -> Applicant)
    async register(req, res, next) {
        try {
            const { full_name, email, password, phone } = req.body;

            if (!full_name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp đầy đủ Họ tên, Email và Mật khẩu.'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu phải có ít nhất 6 ký tự.'
                });
            }

            // Check if email already exists
            const existingUser = await UserModel.findByEmail(email.trim().toLowerCase());
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email này đã được sử dụng. Vui lòng chọn email khác.'
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const userId = await UserModel.create({
                full_name: full_name.trim(),
                email: email.trim().toLowerCase(),
                password: hashedPassword,
                phone: phone ? phone.trim() : null,
                role: 'APPLICANT',
                branch_id: null,
                department_id: null
            });

            const newUser = await UserModel.findById(userId);
            const token = generateToken(newUser);

            return res.status(201).json({
                success: true,
                message: 'Đăng ký tài khoản ứng viên thành công!',
                data: {
                    user: newUser,
                    token
                }
            });
        } catch (err) {
            next(err);
        }
    },

    // POST /api/auth/login
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập Email và Mật khẩu.'
                });
            }

            const user = await UserModel.findByEmail(email.trim().toLowerCase());
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Email hoặc mật khẩu không chính xác.'
                });
            }

            if (user.status !== 'ACTIVE') {
                return res.status(403).json({
                    success: false,
                    message: 'Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.'
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Email hoặc mật khẩu không chính xác.'
                });
            }

            const token = generateToken(user);
            const safeUser = await UserModel.findById(user.id);

            return res.status(200).json({
                success: true,
                message: 'Đăng nhập thành công!',
                data: {
                    user: safeUser,
                    token
                }
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/auth/me
    async getMe(req, res, next) {
        try {
            const user = await UserModel.findById(req.user.id);
            return res.status(200).json({
                success: true,
                data: user
            });
        } catch (err) {
            next(err);
        }
    },

    // PUT /api/auth/profile
    async updateProfile(req, res, next) {
        try {
            const { full_name, phone, avatar } = req.body;
            await UserModel.updateProfile(req.user.id, { full_name, phone, avatar });

            const updatedUser = await UserModel.findById(req.user.id);
            return res.status(200).json({
                success: true,
                message: 'Cập nhật thông tin cá nhân thành công!',
                data: updatedUser
            });
        } catch (err) {
            next(err);
        }
    },

    // PUT /api/auth/change-password
    async changePassword(req, res, next) {
        try {
            const { current_password, new_password } = req.body;

            if (!current_password || !new_password) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.'
                });
            }

            if (new_password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu mới phải có ít nhất 6 ký tự.'
                });
            }

            const userWithPassword = await UserModel.findByEmail(req.user.email);
            const isMatch = await bcrypt.compare(current_password, userWithPassword.password);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu hiện tại không đúng.'
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedNewPassword = await bcrypt.hash(new_password, salt);
            await UserModel.updatePassword(req.user.id, hashedNewPassword);

            return res.status(200).json({
                success: true,
                message: 'Đổi mật khẩu thành công!'
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = AuthController;
