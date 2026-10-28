const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
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

const otpStore = new Map();

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
                    field: !email ? 'email' : 'password',
                    message: !email ? 'Vui lòng nhập địa chỉ Email.' : 'Vui lòng nhập Mật khẩu.'
                });
            }

            const cleanEmail = email.trim().toLowerCase();
            const user = await UserModel.findByEmail(cleanEmail);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    field: 'email',
                    message: 'Tài khoản (Email) không tồn tại trên hệ thống.'
                });
            }

            if (user.status !== 'ACTIVE') {
                return res.status(403).json({
                    success: false,
                    field: 'email',
                    message: 'Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.'
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    field: 'password',
                    message: 'Mật khẩu không chính xác.'
                });
            }

            // Ensure intern role consistency: if user has an internship record, they stay INTERN
            if (user.role === 'APPLICANT') {
                const [internCheck] = await pool.query(
                    'SELECT id, branch_id FROM interns WHERE user_id = ? ORDER BY id DESC LIMIT 1',
                    [user.id]
                );
                if (internCheck.length > 0) {
                    await pool.query('UPDATE users SET role = \'INTERN\', branch_id = COALESCE(branch_id, ?) WHERE id = ?', [internCheck[0].branch_id, user.id]);
                    user.role = 'INTERN';
                    if (!user.branch_id && internCheck[0].branch_id) {
                        user.branch_id = internCheck[0].branch_id;
                    }
                }
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
            let user = await UserModel.findById(req.user.id);
            if (user && user.role === 'APPLICANT') {
                const [internCheck] = await pool.query(
                    'SELECT id, branch_id FROM interns WHERE user_id = ? ORDER BY id DESC LIMIT 1',
                    [user.id]
                );
                if (internCheck.length > 0) {
                    await pool.query('UPDATE users SET role = \'INTERN\', branch_id = COALESCE(branch_id, ?) WHERE id = ?', [internCheck[0].branch_id, user.id]);
                    user = await UserModel.findById(user.id);
                }
            }
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
    },

    // POST /api/auth/forgot-password
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            if (!email || !email.trim()) {
                return res.status(400).json({
                    success: false,
                    field: 'email',
                    message: 'Vui lòng nhập địa chỉ Email.'
                });
            }

            const cleanEmail = email.trim().toLowerCase();
            const user = await UserModel.findByEmail(cleanEmail);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    field: 'email',
                    message: 'Không tìm thấy tài khoản nào gắn với email này.'
                });
            }

            if (user.status !== 'ACTIVE') {
                return res.status(403).json({
                    success: false,
                    field: 'email',
                    message: 'Tài khoản này đã bị khóa hoặc ngừng hoạt động.'
                });
            }

            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            otpStore.set(cleanEmail, {
                otp,
                expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
            });

            console.log('\n======================================================');
            console.log(' [DỊCH VỤ EMAIL HỆ THỐNG - VYMI TECH]');
            console.log(` Gửi tới: ${cleanEmail}`);
            console.log(' Tiêu đề: [VYMI Tech] Mã xác thực khôi phục mật khẩu');
            console.log(` Nội dung: Mã xác thực OTP của bạn là: ${otp}`);
            console.log(' Thời hạn hiệu lực: 10 phút (Vui lòng không chia sẻ mã này)');
            console.log('======================================================\n');

            return res.status(200).json({
                success: true,
                message: 'Mã xác thực OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
                data: {
                    email: cleanEmail
                }
            });
        } catch (err) {
            next(err);
        }
    },

    // POST /api/auth/reset-password
    async resetPassword(req, res, next) {
        try {
            const { email, otp, new_password } = req.body;

            if (!email || !otp || !new_password) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ Email, Mã OTP và Mật khẩu mới.'
                });
            }

            const cleanEmail = email.trim().toLowerCase();
            const stored = otpStore.get(cleanEmail);

            if (!stored || stored.expiresAt < Date.now()) {
                return res.status(400).json({
                    success: false,
                    field: 'otp',
                    message: 'Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng lấy mã mới.'
                });
            }

            if (stored.otp !== String(otp).trim()) {
                return res.status(400).json({
                    success: false,
                    field: 'otp',
                    message: 'Mã OTP xác thực không chính xác.'
                });
            }

            if (new_password.length < 6) {
                return res.status(400).json({
                    success: false,
                    field: 'new_password',
                    message: 'Mật khẩu mới phải có ít nhất 6 ký tự.'
                });
            }

            const user = await UserModel.findByEmail(cleanEmail);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Tài khoản người dùng không tồn tại.'
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(new_password, salt);
            await UserModel.updatePassword(user.id, hashedPassword);

            // Invalidate OTP after successful reset
            otpStore.delete(cleanEmail);

            return res.status(200).json({
                success: true,
                message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới.'
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = AuthController;
