const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const BranchModel = require('../models/branchModel');
const UserModel = require('../models/userModel');
const DepartmentModel = require('../models/departmentModel');

const AdminController = {
    // GET /api/admin/dashboard
    async getDashboardStats(req, res, next) {
        try {
            const [branches] = await pool.query(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_count,
                    SUM(CASE WHEN status = 'INACTIVE' THEN 1 ELSE 0 END) as inactive_count
                 FROM branches`
            );

            const [users] = await pool.query(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN role = 'HR' THEN 1 ELSE 0 END) as hr_count,
                    SUM(CASE WHEN role = 'MENTOR' THEN 1 ELSE 0 END) as mentor_count,
                    SUM(CASE WHEN role = 'INTERN' THEN 1 ELSE 0 END) as intern_count,
                    SUM(CASE WHEN role = 'APPLICANT' THEN 1 ELSE 0 END) as applicant_count
                 FROM users`
            );

            const [positions] = await pool.query(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open_count
                 FROM internship_positions`
            );

            const [applications] = await pool.query(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
                    SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count
                 FROM applications`
            );

            return res.status(200).json({
                success: true,
                data: {
                    branches: branches[0],
                    users: users[0],
                    positions: positions[0],
                    applications: applications[0]
                }
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/admin/branches
    async getBranches(req, res, next) {
        try {
            const branches = await BranchModel.findAll(false);
            return res.status(200).json({
                success: true,
                data: branches
            });
        } catch (err) {
            next(err);
        }
    },

    // POST /api/admin/branches
    async createBranch(req, res, next) {
        try {
            const { name, address, phone, status } = req.body;

            if (!name || !address) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập Tên cơ sở và Địa chỉ.'
                });
            }

            const existing = await BranchModel.findByName(name.trim());
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên cơ sở này đã tồn tại trong hệ thống.'
                });
            }

            const branchId = await BranchModel.create({
                name: name.trim(),
                address: address.trim(),
                phone: phone ? phone.trim() : null,
                status: status || 'ACTIVE'
            });

            const newBranch = await BranchModel.findById(branchId);

            return res.status(201).json({
                success: true,
                message: 'Thêm cơ sở mới thành công!',
                data: newBranch
            });
        } catch (err) {
            next(err);
        }
    },

    // PUT /api/admin/branches/:id
    async updateBranch(req, res, next) {
        try {
            const { name, address, phone, status } = req.body;
            const branch = await BranchModel.findById(req.params.id);

            if (!branch) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy cơ sở này.'
                });
            }

            if (name && name.trim() !== branch.name) {
                const existing = await BranchModel.findByName(name.trim());
                if (existing) {
                    return res.status(400).json({
                        success: false,
                        message: 'Tên cơ sở đã được sử dụng bởi một cơ sở khác.'
                    });
                }
            }

            await BranchModel.update(branch.id, {
                name: name ? name.trim() : branch.name,
                address: address ? address.trim() : branch.address,
                phone: phone !== undefined ? phone : branch.phone,
                status: status || branch.status
            });

            const updated = await BranchModel.findById(branch.id);

            return res.status(200).json({
                success: true,
                message: 'Cập nhật thông tin cơ sở thành công!',
                data: updated
            });
        } catch (err) {
            next(err);
        }
    },

    // PUT /api/admin/branches/:id/status
    async toggleBranchStatus(req, res, next) {
        try {
            const { status } = req.body;
            if (!['ACTIVE', 'INACTIVE'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Trạng thái cơ sở chỉ có thể là ACTIVE hoặc INACTIVE.'
                });
            }

            const branch = await BranchModel.findById(req.params.id);
            if (!branch) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy cơ sở này.'
                });
            }

            await BranchModel.updateStatus(branch.id, status);

            return res.status(200).json({
                success: true,
                message: `Đã chuyển trạng thái cơ sở sang ${status} thành công!`
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/admin/users
    async getUsers(req, res, next) {
        try {
            const users = await UserModel.findAll(req.query);
            return res.status(200).json({
                success: true,
                count: users.length,
                data: users
            });
        } catch (err) {
            next(err);
        }
    },

    // POST /api/admin/users
    async createUser(req, res, next) {
        try {
            const { full_name, email, password, phone, role, branch_id, department_id } = req.body;

            if (!full_name || !email || !password || !role) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp đầy đủ: Họ tên, Email, Mật khẩu và Vai trò (Role).'
                });
            }

            const validRoles = ['ADMIN', 'HR', 'MENTOR', 'INTERN', 'APPLICANT'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Vai trò người dùng không hợp lệ.'
                });
            }

            if (['HR', 'MENTOR'].includes(role) && !branch_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Tài khoản HR và Mentor bắt buộc phải thuộc một cơ sở cụ thể.'
                });
            }

            const existing = await UserModel.findByEmail(email.trim().toLowerCase());
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Email này đã tồn tại trong hệ thống.'
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const userId = await UserModel.create({
                full_name: full_name.trim(),
                email: email.trim().toLowerCase(),
                password: hashedPassword,
                phone: phone ? phone.trim() : null,
                role,
                branch_id: role === 'ADMIN' ? null : (branch_id || null),
                department_id: department_id || null
            });

            const newUser = await UserModel.findById(userId);

            return res.status(201).json({
                success: true,
                message: 'Tạo tài khoản người dùng thành công!',
                data: newUser
            });
        } catch (err) {
            next(err);
        }
    },

    // PUT /api/admin/users/:id/status
    async toggleUserStatus(req, res, next) {
        try {
            const { status } = req.body;
            if (!['ACTIVE', 'INACTIVE'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Trạng thái chỉ có thể là ACTIVE hoặc INACTIVE.'
                });
            }

            if (parseInt(req.params.id, 10) === req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn không thể tự khóa tài khoản của chính mình!'
                });
            }

            await UserModel.updateStatus(req.params.id, status);

            return res.status(200).json({
                success: true,
                message: `Đã chuyển trạng thái tài khoản sang ${status}!`
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/admin/departments
    async getDepartments(req, res, next) {
        try {
            const departments = await DepartmentModel.findAll();
            return res.status(200).json({
                success: true,
                data: departments
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = AdminController;
