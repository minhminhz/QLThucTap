const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const PositionModel = require('../models/positionModel');
const ApplicationModel = require('../models/applicationModel');
const InternModel = require('../models/internModel');
const UserModel = require('../models/userModel');

const HrController = {
    // GET /api/hr/dashboard
    async getDashboardStats(req, res, next) {
        try {
            let branchId = null;
            if (req.query.branch_id && req.query.branch_id !== 'all') {
                branchId = parseInt(req.query.branch_id, 10);
            } else if (!req.query.branch_id && req.user.role !== 'ADMIN' && req.user.branch_id) {
                branchId = req.user.branch_id;
            }

            let positionQuery = `SELECT COUNT(*) as count FROM internship_positions WHERE status = 'OPEN'`;
            let pendingAppQuery = `SELECT COUNT(*) as count FROM applications a JOIN internship_positions p ON a.position_id = p.id WHERE a.status = 'PENDING'`;
            let totalAppQuery = `SELECT COUNT(*) as count FROM applications a JOIN internship_positions p ON a.position_id = p.id WHERE 1=1`;
            let internQuery = `SELECT COUNT(*) as count FROM interns WHERE status IN ('UPCOMING', 'IN_PROGRESS')`;
            let mentorQuery = `SELECT COUNT(*) as count FROM users WHERE role = 'MENTOR' AND status = 'ACTIVE'`;

            if (branchId) {
                positionQuery += ` AND branch_id = ?`;
                pendingAppQuery += ` AND p.branch_id = ?`;
                totalAppQuery += ` AND p.branch_id = ?`;
                internQuery += ` AND branch_id = ?`;
                mentorQuery += ` AND branch_id = ?`;
            }

            const [openPos] = await pool.query(positionQuery, branchId ? [branchId] : []);
            const [pendingApps] = await pool.query(pendingAppQuery, branchId ? [branchId] : []);
            const [totalApps] = await pool.query(totalAppQuery, branchId ? [branchId] : []);
            const [activeInterns] = await pool.query(internQuery, branchId ? [branchId] : []);
            const [mentors] = await pool.query(mentorQuery, branchId ? [branchId] : []);

            return res.status(200).json({
                success: true,
                data: {
                    applications: totalApps[0].count,
                    total_applications: totalApps[0].count,
                    pending_applications: pendingApps[0].count,
                    interns: activeInterns[0].count,
                    active_interns: activeInterns[0].count,
                    open_positions: openPos[0].count,
                    mentors: mentors[0].count
                }
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/hr/positions
    async getPositions(req, res, next) {
        try {
            let branchId = null;
            if (req.query.branch_id && req.query.branch_id !== 'all') {
                branchId = parseInt(req.query.branch_id, 10);
            } else if (!req.query.branch_id && req.user.role !== 'ADMIN' && req.user.branch_id) {
                branchId = req.user.branch_id;
            }

            const positions = await PositionModel.findAll({
                branch_id: branchId,
                status: req.query.status || null,
                search: req.query.search || null
            });

            return res.status(200).json({
                success: true,
                data: positions
            });
        } catch (err) {
            next(err);
        }
    },

    // POST /api/hr/positions
    async createPosition(req, res, next) {
        try {
            const { title, description, requirements, benefits, quantity, internship_duration, deadline, status, branch_id, department_id } = req.body;
            const branchId = branch_id ? parseInt(branch_id, 10) : (req.user.branch_id || 1);

            if (!title || !deadline) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng điền tiêu đề vị trí và hạn nộp hồ sơ.'
                });
            }

            const positionId = await PositionModel.create({
                branch_id: branchId,
                department_id: department_id ? parseInt(department_id, 10) : null,
                title: title.trim(),
                description: description && description.trim() ? description.trim() : `Tuyển dụng thực tập sinh ${title.trim()}`,
                requirements: requirements && requirements.trim() ? requirements.trim() : 'Theo yêu cầu công việc và trao đổi cụ thể khi phỏng vấn.',
                benefits: benefits ? benefits.trim() : null,
                quantity: parseInt(quantity, 10) || 1,
                internship_duration: internship_duration || '3 tháng',
                deadline,
                status: status || 'OPEN'
            });

            const newPosition = await PositionModel.findById(positionId);

            return res.status(201).json({
                success: true,
                message: 'Tạo vị trí thực tập thành công!',
                data: newPosition
            });
        } catch (err) {
            next(err);
        }
    },

    // PUT /api/hr/positions/:id
    async updatePosition(req, res, next) {
        try {
            const position = await PositionModel.findById(req.params.id);
            if (!position) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy vị trí tuyển dụng này.'
                });
            }

            if (req.user.role !== 'ADMIN' && position.branch_id !== req.user.branch_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền chỉnh sửa vị trí thuộc cơ sở của mình.'
                });
            }

            const { title, department_id, description, requirements, benefits, quantity, internship_duration, deadline, status } = req.body;
            const branchId = req.user.role === 'ADMIN' && req.body.branch_id ? req.body.branch_id : position.branch_id;

            await PositionModel.update(position.id, {
                branch_id: branchId,
                department_id: department_id || position.department_id,
                title: title || position.title,
                description: description || position.description,
                requirements: requirements || position.requirements,
                benefits: benefits !== undefined ? benefits : position.benefits,
                quantity: quantity || position.quantity,
                internship_duration: internship_duration || position.internship_duration,
                deadline: deadline || position.deadline,
                status: status || position.status
            });

            const updated = await PositionModel.findById(position.id);

            return res.status(200).json({
                success: true,
                message: 'Cập nhật vị trí thực tập thành công!',
                data: updated
            });
        } catch (err) {
            next(err);
        }
    },

    // DELETE /api/hr/positions/:id
    async deletePosition(req, res, next) {
        try {
            const position = await PositionModel.findById(req.params.id);
            if (!position) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy vị trí tuyển dụng này.'
                });
            }

            if (req.user.role !== 'ADMIN' && position.branch_id !== req.user.branch_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền quản lý vị trí thuộc cơ sở của mình.'
                });
            }

            // If applications exist, soft close instead of deleting to preserve history
            if (position.applications_count > 0) {
                await PositionModel.updateStatus(position.id, 'CLOSED');
                return res.status(200).json({
                    success: true,
                    message: 'Vị trí này đã có ứng viên nộp hồ sơ nên đã được chuyển sang trạng thái ĐÓNG (CLOSED) để bảo toàn dữ liệu.'
                });
            }

            await PositionModel.delete(position.id);
            return res.status(200).json({
                success: true,
                message: 'Đã xóa vị trí tuyển dụng thành công!'
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/hr/applications
    async getApplications(req, res, next) {
        try {
            let branchId = null;
            if (req.query.branch_id && req.query.branch_id !== 'all') {
                branchId = parseInt(req.query.branch_id, 10);
            } else if (!req.query.branch_id && req.user.role !== 'ADMIN' && req.user.branch_id) {
                branchId = req.user.branch_id;
            }

            const applications = await ApplicationModel.findAllForHR(branchId, req.query);

            return res.status(200).json({
                success: true,
                count: applications.length,
                data: applications
            });
        } catch (err) {
            next(err);
        }
    },

    async updateApplicationStatus(req, res, next) {
        try {
            const { status, hr_note, note, start_date, end_date } = req.body;
            const finalNote = hr_note !== undefined ? hr_note : (note !== undefined ? note : null);
            const validStatuses = ['PENDING', 'REVIEWING', 'APPROVED', 'REJECTED'];

            if (!status || !validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Trạng thái xét duyệt không hợp lệ.'
                });
            }

            const application = await ApplicationModel.findById(req.params.id);
            if (!application) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy hồ sơ ứng tuyển này.'
                });
            }

            // Execute in transaction if APPROVED to create intern record
            if (status === 'APPROVED') {
                const connection = await pool.getConnection();
                try {
                    await connection.beginTransaction();

                    // 1. Update application status
                    await connection.query(
                        `UPDATE applications SET status = 'APPROVED', hr_note = COALESCE(?, hr_note) WHERE id = ?`,
                        [finalNote || null, application.id]
                    );

                    // 2. Promote user to INTERN and bind to branch
                    await connection.query(
                        `UPDATE users SET role = 'INTERN', branch_id = ? WHERE id = ?`,
                        [application.branch_id, application.applicant_id]
                    );

                    // 3. Create or update interns record
                    const [existingIntern] = await connection.query(
                        `SELECT * FROM interns WHERE user_id = ?`,
                        [application.applicant_id]
                    );

                    const startDateVal = start_date || new Date().toISOString().split('T')[0];
                    const defaultEndDate = new Date();
                    defaultEndDate.setMonth(defaultEndDate.getMonth() + 3);
                    const endDateVal = end_date || defaultEndDate.toISOString().split('T')[0];

                    if (existingIntern.length === 0) {
                        await connection.query(
                            `INSERT INTO interns (user_id, application_id, position_id, branch_id, start_date, end_date, status)
                             VALUES (?, ?, ?, ?, ?, ?, 'UPCOMING')`,
                            [application.applicant_id, application.id, application.position_id, application.branch_id, startDateVal, endDateVal]
                        );
                    }

                    await connection.commit();
                } catch (txErr) {
                    await connection.rollback();
                    throw txErr;
                } finally {
                    connection.release();
                }
            } else {
                await ApplicationModel.updateStatus(application.id, status, finalNote);
            }

            const updatedApp = await ApplicationModel.findById(application.id);

            return res.status(200).json({
                success: true,
                message: `Cập nhật trạng thái hồ sơ sang ${status} thành công!`,
                data: updatedApp
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/hr/interns
    async getInterns(req, res, next) {
        try {
            const branchId = req.user.role === 'ADMIN' ? req.query.branch_id : req.user.branch_id;
            const interns = await InternModel.findAllForHR(branchId, req.query);

            return res.status(200).json({
                success: true,
                data: interns
            });
        } catch (err) {
            next(err);
        }
    },

    // PUT /api/hr/interns/:id/mentor
    async assignMentor(req, res, next) {
        try {
            const { mentor_id } = req.body;
            const intern = await InternModel.findById(req.params.id);

            if (!intern) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thực tập sinh này.'
                });
            }

            if (req.user.role !== 'ADMIN' && intern.branch_id !== req.user.branch_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền phân công thực tập sinh thuộc cơ sở của mình.'
                });
            }

            if (mentor_id) {
                const mentor = await UserModel.findById(mentor_id);
                if (!mentor || mentor.role !== 'MENTOR') {
                    return res.status(400).json({
                        success: false,
                        message: 'Tài khoản người hướng dẫn (Mentor) không hợp lệ.'
                    });
                }

                // Verify mentor belongs to the SAME branch
                if (mentor.branch_id !== intern.branch_id) {
                    return res.status(400).json({
                        success: false,
                        message: 'Mentor được phân công phải thuộc cùng cơ sở với Thực tập sinh!'
                    });
                }
            }

            await InternModel.assignMentor(intern.id, mentor_id || null);
            const updatedIntern = await InternModel.findById(intern.id);

            return res.status(200).json({
                success: true,
                message: 'Phân công Mentor thành công!',
                data: updatedIntern
            });
        } catch (err) {
            next(err);
        }
    },

    // PUT /api/hr/interns/:id/status
    async updateInternStatus(req, res, next) {
        try {
            const { status } = req.body;
            const valid = ['UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

            if (!status || !valid.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Trạng thái kỳ thực tập không hợp lệ.'
                });
            }

            const intern = await InternModel.findById(req.params.id);
            if (!intern) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thực tập sinh này.'
                });
            }

            if (req.user.role !== 'ADMIN' && intern.branch_id !== req.user.branch_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền quản lý thực tập sinh thuộc cơ sở của mình.'
                });
            }

            await InternModel.updateStatus(intern.id, status);
            const updated = await InternModel.findById(intern.id);

            return res.status(200).json({
                success: true,
                message: `Cập nhật trạng thái kỳ thực tập thành ${status} thành công!`,
                data: updated
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/hr/mentors
    async getMentors(req, res, next) {
        try {
            const branchId = req.user.role === 'ADMIN' ? req.query.branch_id : req.user.branch_id;
            const mentors = await UserModel.findMentorsByBranch(branchId);

            return res.status(200).json({
                success: true,
                data: mentors
            });
        } catch (err) {
            next(err);
        }
    },

    // POST /api/hr/mentors
    async createMentor(req, res, next) {
        try {
            const { full_name, email, password, phone, department_id } = req.body;
            const branchId = req.user.role === 'ADMIN' && req.body.branch_id ? req.body.branch_id : req.user.branch_id;

            if (!full_name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp đầy đủ Họ tên, Email và Mật khẩu khởi tạo cho Mentor.'
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

            const mentorId = await UserModel.create({
                full_name: full_name.trim(),
                email: email.trim().toLowerCase(),
                password: hashedPassword,
                phone: phone ? phone.trim() : null,
                role: 'MENTOR',
                branch_id: branchId,
                department_id: department_id || 1
            });

            const newMentor = await UserModel.findById(mentorId);

            return res.status(201).json({
                success: true,
                message: 'Tạo tài khoản Mentor thành công!',
                data: newMentor
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/hr/departments
    async getDepartments(req, res, next) {
        try {
            const branchId = req.user.role === 'ADMIN' ? req.query.branch_id : req.user.branch_id;
            let query = `SELECT id, name, branch_id FROM departments WHERE 1=1`;
            const params = [];
            if (branchId) { query += ` AND branch_id = ?`; params.push(branchId); }
            query += ` ORDER BY name ASC`;
            const [rows] = await pool.query(query, params);
            return res.status(200).json({ success: true, data: rows });
        } catch (err) { next(err); }
    },

    // PATCH /api/hr/positions/:id/status (toggle open/closed)
    async togglePositionStatus(req, res, next) {
        try {
            const { status } = req.body;
            if (!['OPEN', 'CLOSED'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Trạng thái vị trí không hợp lệ.' });
            }
            const position = await PositionModel.findById(req.params.id);
            if (!position) return res.status(404).json({ success: false, message: 'Không tìm thấy vị trí.' });
            if (req.user.role !== 'ADMIN' && position.branch_id !== req.user.branch_id) {
                return res.status(403).json({ success: false, message: 'Không có quyền thao tác vị trí này.' });
            }
            await PositionModel.updateStatus(position.id, status);
            const updated = await PositionModel.findById(position.id);
            return res.status(200).json({ success: true, data: updated });
        } catch (err) { next(err); }
    },

    // PATCH /api/hr/interns/:id/assign-mentor (with dates)
    async assignMentorWithDates(req, res, next) {
        try {
            const { mentor_id, start_date, end_date } = req.body;
            const intern = await InternModel.findById(req.params.id);
            if (!intern) return res.status(404).json({ success: false, message: 'Không tìm thấy thực tập sinh.' });
            if (req.user.role !== 'ADMIN' && intern.branch_id !== req.user.branch_id) {
                return res.status(403).json({ success: false, message: 'Không có quyền thao tác thực tập sinh này.' });
            }
            if (mentor_id) {
                const mentor = await UserModel.findById(mentor_id);
                if (!mentor || mentor.role !== 'MENTOR') {
                    return res.status(400).json({ success: false, message: 'Mentor không hợp lệ.' });
                }
                if (mentor.branch_id !== intern.branch_id) {
                    return res.status(400).json({ success: false, message: 'Mentor phải thuộc cùng cơ sở với Thực tập sinh.' });
                }
            }
            await pool.query(
                `UPDATE interns SET mentor_id = ?, start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date), status = 'IN_PROGRESS' WHERE id = ?`,
                [mentor_id || null, start_date || null, end_date || null, intern.id]
            );
            const updated = await InternModel.findById(intern.id);
            return res.status(200).json({ success: true, message: 'Phân công Mentor thành công!', data: updated });
        } catch (err) { next(err); }
    }
};

module.exports = HrController;

