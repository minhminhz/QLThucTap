const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const PositionModel = require('../models/positionModel');
const ApplicationModel = require('../models/applicationModel');
const InternModel = require('../models/internModel');
const UserModel = require('../models/userModel');

function getEnforcedBranchId(req) {
    if (req.user.role === 'ADMIN') {
        if (req.query.branch_id && req.query.branch_id !== 'all') {
            return parseInt(req.query.branch_id, 10);
        }
        return null;
    }
    // HR is strictly restricted to their own branch
    return req.user.branch_id || null;
}

const HrController = {
    // GET /api/hr/dashboard
    async getDashboardStats(req, res, next) {
        try {
            const branchId = getEnforcedBranchId(req);

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
            const branchId = getEnforcedBranchId(req);

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
            const { title, description, requirements, benefits, quantity, internship_duration, deadline, status, department_id } = req.body;
            const branchId = req.user.role === 'ADMIN' && req.body.branch_id 
                ? parseInt(req.body.branch_id, 10) 
                : req.user.branch_id;

            if (!branchId) {
                return res.status(400).json({
                    success: false,
                    message: 'Tài khoản HR chưa được gán cơ sở làm việc để tạo vị trí tuyển dụng.'
                });
            }

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
            const branchId = getEnforcedBranchId(req);
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

            if (req.user.role !== 'ADMIN' && application.branch_id !== req.user.branch_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền xét duyệt hồ sơ ứng tuyển thuộc cơ sở của mình.'
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

            // Dispatch notifications to applicant
            try {
                const NotificationService = require('../services/notificationService');
                const positionTitle = application.position_title || 'Thực tập sinh';
                if (status === 'APPROVED') {
                    await NotificationService.notifyUser({
                        userId: application.applicant_id,
                        senderId: req.user.id,
                        title: '🎉 Chúc mừng bạn đã trúng tuyển thực tập!',
                        message: `Chúc mừng bạn! Hồ sơ ứng tuyển vị trí "${positionTitle}" đã được DUYỆT.${finalNote ? ' Lời nhắn HR: ' + finalNote : ''} Bạn đã chính thức trở thành Thực tập sinh của VYMI Tech.`,
                        type: 'APPLICATION',
                        link: '/intern'
                    });
                } else if (status === 'REJECTED') {
                    await NotificationService.notifyUser({
                        userId: application.applicant_id,
                        senderId: req.user.id,
                        title: 'Kết quả xét duyệt hồ sơ ứng tuyển 📄',
                        message: `Hồ sơ ứng tuyển vị trí "${positionTitle}" của bạn chưa phù hợp trong đợt tuyển dụng này.${finalNote ? ' Phản hồi HR: ' + finalNote : ''}`,
                        type: 'APPLICATION',
                        link: '/dashboard'
                    });
                } else if (status === 'REVIEWING') {
                    await NotificationService.notifyUser({
                        userId: application.applicant_id,
                        senderId: req.user.id,
                        title: 'Hồ sơ đang được xem xét ⏳',
                        message: `Hồ sơ ứng tuyển vị trí "${positionTitle}" của bạn đang được phòng Nhân sự kiểm tra và đánh giá.${finalNote ? ' Ghi chú: ' + finalNote : ''}`,
                        type: 'APPLICATION',
                        link: '/dashboard'
                    });
                }
            } catch (notifyErr) {
                console.error('Notification error in updateApplicationStatus:', notifyErr.message);
            }

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
            const branchId = getEnforcedBranchId(req);
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

            let assignedMentor = null;
            if (mentor_id) {
                assignedMentor = await UserModel.findById(mentor_id);
                if (!assignedMentor || assignedMentor.role !== 'MENTOR') {
                    return res.status(400).json({
                        success: false,
                        message: 'Tài khoản người hướng dẫn (Mentor) không hợp lệ.'
                    });
                }

                if (assignedMentor.status !== 'ACTIVE') {
                    return res.status(400).json({
                        success: false,
                        message: 'Mentor này đang ở trạng thái ngừng hoạt động (INACTIVE). Vui lòng chọn Mentor đang hoạt động (ACTIVE).'
                    });
                }

                // Verify mentor belongs to the SAME branch
                if (assignedMentor.branch_id !== intern.branch_id) {
                    return res.status(400).json({
                        success: false,
                        message: 'Mentor được phân công phải thuộc cùng cơ sở với Thực tập sinh!'
                    });
                }
            }

            await InternModel.assignMentor(intern.id, mentor_id || null);
            const updatedIntern = await InternModel.findById(intern.id);

            // Dispatch notifications to Mentor and Intern
            try {
                const NotificationService = require('../services/notificationService');
                if (mentor_id && assignedMentor) {
                    // Notify Mentor
                    await NotificationService.notifyUser({
                        userId: mentor_id,
                        senderId: req.user.id,
                        title: 'Phân công hướng dẫn Thực tập sinh 👨‍🏫',
                        message: `Phòng HR đã phân công bạn hướng dẫn Thực tập sinh "${intern.full_name}" (Vị trí: ${intern.position_title || 'Thực tập sinh'}).`,
                        type: 'INTERNSHIP',
                        link: '/mentor/interns'
                    });

                    // Notify Intern
                    if (intern.user_id) {
                        await NotificationService.notifyUser({
                            userId: intern.user_id,
                            senderId: req.user.id,
                            title: 'Phân công Người hướng dẫn (Mentor) 🤝',
                            message: `Bạn đã được phân công Mentor "${assignedMentor.full_name}" (${assignedMentor.email}) trực tiếp hướng dẫn trong kỳ thực tập.`,
                            type: 'INTERNSHIP',
                            link: '/intern'
                        });
                    }
                } else if (!mentor_id && intern.user_id) {
                    await NotificationService.notifyUser({
                        userId: intern.user_id,
                        senderId: req.user.id,
                        title: 'Cập nhật Người hướng dẫn',
                        message: 'HR đã thay đổi phân công Mentor cho kỳ thực tập của bạn.',
                        type: 'INTERNSHIP',
                        link: '/intern'
                    });
                }
            } catch (notifyErr) {
                console.error('Notification error in assignMentor:', notifyErr.message);
            }

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

            // Dispatch notifications to Intern and Mentor
            try {
                const NotificationService = require('../services/notificationService');
                const statusMap = {
                    UPCOMING: 'Sắp bắt đầu',
                    IN_PROGRESS: 'Đang thực tập',
                    COMPLETED: 'Đã hoàn thành',
                    CANCELLED: 'Đã hủy / Tạm ngừng'
                };
                const statusLabel = statusMap[status] || status;

                // Notify Intern
                if (intern.user_id) {
                    await NotificationService.notifyUser({
                        userId: intern.user_id,
                        senderId: req.user.id,
                        title: 'Cập nhật tiến độ kỳ thực tập 📊',
                        message: `Trạng thái kỳ thực tập của bạn đã được chuyển sang: "${statusLabel}".`,
                        type: 'INTERNSHIP',
                        link: '/intern'
                    });
                }

                // Notify Mentor if assigned
                if (intern.mentor_id) {
                    await NotificationService.notifyUser({
                        userId: intern.mentor_id,
                        senderId: req.user.id,
                        title: 'Cập nhật trạng thái Thực tập sinh 📋',
                        message: `Kỳ thực tập của TTS "${intern.full_name}" đã chuyển sang trạng thái: "${statusLabel}".`,
                        type: 'INTERNSHIP',
                        link: '/mentor/interns'
                    });
                }
            } catch (notifyErr) {
                console.error('Notification error in updateInternStatus:', notifyErr.message);
            }

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
            const branchId = getEnforcedBranchId(req);
            const status = req.query.status || null; // 'ACTIVE', 'INACTIVE', or null for ALL
            const search = req.query.search || null;
            const mentors = await UserModel.findMentorsByBranch(branchId, status, search);

            return res.status(200).json({
                success: true,
                count: mentors.length,
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
            // HR always gets their own branch; ADMIN can pass branch_id explicitly
            const branchId = req.user.role === 'ADMIN' && req.body.branch_id
                ? parseInt(req.body.branch_id, 10)
                : req.user.branch_id;

            if (!branchId) {
                return res.status(400).json({
                    success: false,
                    message: 'Tài khoản HR chưa được gán cơ sở. Không thể tạo Mentor.'
                });
            }

            if (!full_name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp đầy đủ Họ tên, Email và Mật khẩu khởi tạo cho Mentor.'
                });
            }

            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu phải có ít nhất 8 ký tự.'
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
                department_id: department_id ? parseInt(department_id, 10) : null
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

    // PUT /api/hr/mentors/:id
    async updateMentor(req, res, next) {
        try {
            const mentorId = parseInt(req.params.id, 10);
            const mentor = await UserModel.findById(mentorId);

            if (!mentor || mentor.role !== 'MENTOR') {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy Mentor.'
                });
            }

            // HR can only manage mentors in their own branch
            if (req.user.role !== 'ADMIN' && mentor.branch_id !== req.user.branch_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền cập nhật thông tin Mentor thuộc cơ sở của mình.'
                });
            }

            const { full_name, phone, department_id } = req.body;
            await UserModel.updateMentorProfile(mentorId, { full_name, phone, department_id });
            const updated = await UserModel.findById(mentorId);

            return res.status(200).json({
                success: true,
                message: 'Cập nhật thông tin Mentor thành công!',
                data: updated
            });
        } catch (err) {
            next(err);
        }
    },

    // PATCH /api/hr/mentors/:id/status
    async toggleMentorStatus(req, res, next) {
        try {
            const mentorId = parseInt(req.params.id, 10);
            const { status } = req.body;

            if (!['ACTIVE', 'INACTIVE'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Trạng thái không hợp lệ. Chỉ được dùng ACTIVE hoặc INACTIVE.'
                });
            }

            const mentor = await UserModel.findById(mentorId);

            if (!mentor || mentor.role !== 'MENTOR') {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy Mentor.'
                });
            }

            // HR can only manage mentors in their own branch
            if (req.user.role !== 'ADMIN' && mentor.branch_id !== req.user.branch_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền thay đổi trạng thái Mentor thuộc cơ sở của mình.'
                });
            }

            // If deactivating, check active interns assignment and warn
            let affectedInterns = [];
            if (status === 'INACTIVE') {
                affectedInterns = await UserModel.getActiveInternsForMentor(mentorId);
            }

            await UserModel.updateStatus(mentorId, status);

            // Notify mentor of status change
            try {
                const NotificationService = require('../services/notificationService');
                if (status === 'INACTIVE') {
                    await NotificationService.notifyUser({
                        userId: mentorId,
                        senderId: req.user.id,
                        title: 'Tài khoản Mentor tạm ngưng hoạt động 🔒',
                        message: `Tài khoản Mentor của bạn đã được phòng HR chuyển sang trạng thái ngưng hoạt động. Vui lòng liên hệ HR để biết thêm thông tin.`,
                        type: 'ACCOUNT',
                        link: '/mentor'
                    });
                } else {
                    await NotificationService.notifyUser({
                        userId: mentorId,
                        senderId: req.user.id,
                        title: 'Tài khoản Mentor đã được kích hoạt 🟢',
                        message: `Tài khoản Mentor của bạn đã được phòng HR kích hoạt trở lại. Bạn có thể tiếp tục hướng dẫn thực tập sinh.`,
                        type: 'ACCOUNT',
                        link: '/mentor'
                    });
                }
            } catch (notifyErr) {
                console.error('Notification error in toggleMentorStatus:', notifyErr.message);
            }

            const responseData = {
                success: true,
                message: `Đã chuyển trạng thái Mentor sang ${status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngưng hoạt động'}.`,
                data: { ...mentor, status }
            };

            // Attach intern warning if deactivating with active interns
            if (status === 'INACTIVE' && affectedInterns.length > 0) {
                responseData.warning = `Mentor này đang hướng dẫn ${affectedInterns.length} thực tập sinh đang/sắp thực tập. Vui lòng phân công Mentor mới cho các bạn này.`;
                responseData.affected_interns = affectedInterns;
            }

            return res.status(200).json(responseData);
        } catch (err) {
            next(err);
        }
    },

    // PATCH /api/hr/mentors/:id/reset-password
    async resetMentorPassword(req, res, next) {
        try {
            const mentorId = parseInt(req.params.id, 10);
            const { new_password } = req.body;

            if (!new_password || new_password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu mới phải có ít nhất 8 ký tự.'
                });
            }

            const mentor = await UserModel.findById(mentorId);

            if (!mentor || mentor.role !== 'MENTOR') {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy Mentor.'
                });
            }

            // HR can only reset passwords for mentors in their own branch
            if (req.user.role !== 'ADMIN' && mentor.branch_id !== req.user.branch_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền đặt lại mật khẩu cho Mentor thuộc cơ sở của mình.'
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(new_password, salt);
            await UserModel.updatePassword(mentorId, hashedPassword);

            // Notify mentor of password reset
            try {
                const NotificationService = require('../services/notificationService');
                await NotificationService.notifyUser({
                    userId: mentorId,
                    senderId: req.user.id,
                    title: 'Mật khẩu của bạn đã được đặt lại 🔑',
                    message: `Phòng HR đã đặt lại mật khẩu tài khoản Mentor của bạn. Vui lòng đăng nhập lại và thay đổi mật khẩu trong phần Hồ sơ cá nhân.`,
                    type: 'ACCOUNT',
                    link: '/profile'
                });
            } catch (notifyErr) {
                console.error('Notification error in resetMentorPassword:', notifyErr.message);
            }

            return res.status(200).json({
                success: true,
                message: `Đặt lại mật khẩu cho Mentor "${mentor.full_name}" thành công. Thông báo đã được gửi tới Mentor.`
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/hr/applicants
    async getApplicants(req, res, next) {
        try {
            const branchId = getEnforcedBranchId(req);
            const filters = { search: req.query.search || null };
            const applicants = await UserModel.findApplicantsByBranch(branchId, filters);

            return res.status(200).json({
                success: true,
                count: applicants.length,
                data: applicants
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/hr/applicants/:id
    async getApplicantDetails(req, res, next) {
        try {
            const branchId = getEnforcedBranchId(req);
            const applicantId = parseInt(req.params.id, 10);

            const details = await UserModel.findApplicantDetailsInBranch(applicantId, branchId);

            if (!details) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy ứng viên này.'
                });
            }

            // HR can only view applicants who have applied to their branch positions
            if (req.user.role !== 'ADMIN' && details.applications.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Ứng viên này chưa nộp hồ sơ vào cơ sở của bạn.'
                });
            }

            return res.status(200).json({
                success: true,
                data: details
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/hr/departments
    async getDepartments(req, res, next) {
        try {
            const branchId = getEnforcedBranchId(req);
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
                if (mentor.status !== 'ACTIVE') {
                    return res.status(400).json({ success: false, message: 'Mentor này đang ngưng hoạt động (INACTIVE). Vui lòng chọn Mentor đang hoạt động.' });
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

            // Dispatch notifications to Mentor and Intern
            try {
                const NotificationService = require('../services/notificationService');
                if (mentor_id) {
                    const mentor = await UserModel.findById(mentor_id);
                    if (mentor) {
                        await NotificationService.notifyUser({
                            userId: mentor_id,
                            senderId: req.user.id,
                            title: 'Phân công hướng dẫn Thực tập sinh 👨‍🏫',
                            message: `Phòng HR đã phân công bạn hướng dẫn Thực tập sinh "${intern.intern_name || intern.full_name}" (Vị trí: ${intern.position_title || 'Thực tập sinh'}).`,
                            type: 'INTERNSHIP',
                            link: '/mentor/interns'
                        });
                        if (intern.user_id) {
                            await NotificationService.notifyUser({
                                userId: intern.user_id,
                                senderId: req.user.id,
                                title: 'Phân công Người hướng dẫn (Mentor) 🤝',
                                message: `Bạn đã được phân công Mentor "${mentor.full_name}" (${mentor.email}) trực tiếp hướng dẫn trong kỳ thực tập.`,
                                type: 'INTERNSHIP',
                                link: '/intern'
                            });
                        }
                    }
                }
            } catch (notifyErr) {
                console.error('Notification error in assignMentorWithDates:', notifyErr.message);
            }

            return res.status(200).json({ success: true, message: 'Phân công Mentor thành công!', data: updated });
        } catch (err) { next(err); }
    }
};

module.exports = HrController;


