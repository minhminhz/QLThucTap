const TaskModel = require('../models/taskModel');
const InternModel = require('../models/internModel');
const pool = require('../config/db');
const { isValidId, isValidDate } = require('../utils/validators');

const TaskController = {
    // ==========================================
    // MENTOR ENDPOINTS
    // ==========================================

    // GET /api/mentor/tasks
    async getMentorTasks(req, res, next) {
        try {
            const tasks = await TaskModel.findByMentorId(req.user.id, req.query);
            return res.status(200).json({
                success: true,
                count: tasks.length,
                data: tasks
            });
        } catch (err) {
            next(err);
        }
    },

    // POST /api/mentor/tasks
    async createTask(req, res, next) {
        try {
            const { intern_id, title, description, deadline } = req.body;
            let attachment_file_url = null;
            let attachment_file_name = null;

            if (req.file) {
                attachment_file_url = `/uploads/task_attachments/${req.file.filename}`;
                attachment_file_name = req.file.originalname;
            }

            if (!intern_id || !title || !description || !deadline) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp đầy đủ thông tin: Thực tập sinh, Tiêu đề, Mô tả và Hạn chót (Deadline).'
                });
            }

            if (!isValidId(intern_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã định danh thực tập sinh không hợp lệ.'
                });
            }

            if (!isValidDate(deadline)) {
                return res.status(400).json({
                    success: false,
                    message: 'Hạn chót (Deadline) không đúng định dạng ngày hợp lệ.'
                });
            }

            // Verify that this intern is assigned to this mentor
            const intern = await InternModel.findById(intern_id);
            if (!intern) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thực tập sinh này.'
                });
            }

            if (intern.mentor_id !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền giao việc cho thực tập sinh được phân công cho mình!'
                });
            }

            const taskId = await TaskModel.create({
                intern_id,
                mentor_id: req.user.id,
                title,
                description,
                deadline,
                status: 'TODO',
                attachment_file_url,
                attachment_file_name
            });

            const newTask = await TaskModel.findById(taskId);

            // Notify Intern
            try {
                const NotificationService = require('../services/notificationService');
                if (intern.user_id) {
                    await NotificationService.notifyUser({
                        userId: intern.user_id,
                        senderId: req.user.id,
                        title: 'Nhiệm vụ mới được giao 📋',
                        message: `Mentor "${req.user.full_name}" đã giao cho bạn nhiệm vụ: "${title}" (Hạn chót: ${deadline}).`,
                        type: 'TASK',
                        link: '/intern/tasks'
                    });
                }
            } catch (notifyErr) {
                console.error('Notification error in createTask:', notifyErr.message);
            }

            return res.status(201).json({
                success: true,
                message: 'Giao task cho thực tập sinh thành công!',
                data: newTask
            });
        } catch (err) {
            next(err);
        }
    },

    // PUT /api/mentor/tasks/:id
    async updateTask(req, res, next) {
        try {
            const task = await TaskModel.findById(req.params.id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy công việc này.'
                });
            }

            if (task.mentor_id !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền chỉnh sửa công việc do mình tạo!'
                });
            }

            const { title, description, deadline, status, remove_attachment } = req.body;
            let attachment_file_url = undefined;
            let attachment_file_name = undefined;

            if (req.file) {
                attachment_file_url = `/uploads/task_attachments/${req.file.filename}`;
                attachment_file_name = req.file.originalname;
            } else if (remove_attachment === 'true' || remove_attachment === true) {
                attachment_file_url = null;
                attachment_file_name = null;
            }

            await TaskModel.update(task.id, {
                title: title || task.title,
                description: description || task.description,
                deadline: deadline || task.deadline,
                status: status || task.status,
                attachment_file_url,
                attachment_file_name
            });

            const updatedTask = await TaskModel.findById(task.id);

            // Notify Intern on update
            try {
                const NotificationService = require('../services/notificationService');
                if (task.intern_user_id) {
                    await NotificationService.notifyUser({
                        userId: task.intern_user_id,
                        senderId: req.user.id,
                        title: 'Cập nhật thông tin nhiệm vụ 📝',
                        message: `Mentor "${req.user.full_name}" đã cập nhật nhiệm vụ: "${updatedTask.title}".`,
                        type: 'TASK',
                        link: '/intern/tasks'
                    });
                }
            } catch (notifyErr) {
                console.error('Notification error in updateTask:', notifyErr.message);
            }

            return res.status(200).json({
                success: true,
                message: 'Cập nhật công việc thành công!',
                data: updatedTask
            });
        } catch (err) {
            next(err);
        }
    },

    // DELETE /api/mentor/tasks/:id
    async deleteTask(req, res, next) {
        try {
            const task = await TaskModel.findById(req.params.id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy công việc này.'
                });
            }

            if (task.mentor_id !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền xóa công việc do mình tạo!'
                });
            }

            await TaskModel.delete(task.id);

            return res.status(200).json({
                success: true,
                message: 'Đã xóa công việc thành công!'
            });
        } catch (err) {
            next(err);
        }
    },

    // PUT /api/mentor/tasks/:id/review
    async reviewTask(req, res, next) {
        try {
            const { status, feedback } = req.body;
            const valid = ['COMPLETED', 'REJECTED'];

            if (!status || !valid.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Trạng thái đánh giá chỉ có thể là COMPLETED (Hoàn thành) hoặc REJECTED (Yêu cầu làm lại).'
                });
            }

            if (status === 'REJECTED' && !feedback) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp lý do hoặc hướng dẫn chỉnh sửa khi yêu cầu thực tập sinh làm lại.'
                });
            }

            const task = await TaskModel.findById(req.params.id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy công việc này.'
                });
            }

            if (task.mentor_id !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền đánh giá công việc do mình phụ trách!'
                });
            }

            await TaskModel.review(task.id, status, feedback);
            const updatedTask = await TaskModel.findById(task.id);

            // Notify Intern of review result
            try {
                const NotificationService = require('../services/notificationService');
                if (task.intern_user_id) {
                    if (status === 'COMPLETED') {
                        await NotificationService.notifyUser({
                            userId: task.intern_user_id,
                            senderId: req.user.id,
                            title: 'Nhiệm vụ đã được duyệt hoàn thành ✅',
                            message: `Mentor "${req.user.full_name}" đã đánh giá HOÀN THÀNH nhiệm vụ: "${task.title}".${feedback ? ' Nhận xét: ' + feedback : ''}`,
                            type: 'TASK',
                            link: '/intern/tasks'
                        });
                    } else if (status === 'REJECTED') {
                        await NotificationService.notifyUser({
                            userId: task.intern_user_id,
                            senderId: req.user.id,
                            title: 'Yêu cầu chỉnh sửa lại nhiệm vụ ⚠️',
                            message: `Mentor "${req.user.full_name}" yêu cầu làm lại nhiệm vụ: "${task.title}". Góp ý: ${feedback}`,
                            type: 'TASK',
                            link: '/intern/tasks'
                        });
                    }
                }
            } catch (notifyErr) {
                console.error('Notification error in reviewTask:', notifyErr.message);
            }

            return res.status(200).json({
                success: true,
                message: status === 'COMPLETED' ? 'Đã duyệt hoàn thành công việc!' : 'Đã yêu cầu thực tập sinh chỉnh sửa lại!',
                data: updatedTask
            });
        } catch (err) {
            next(err);
        }
    },

    // ==========================================
    // INTERN ENDPOINTS
    // ==========================================

    // GET /api/intern/internship
    async getMyInternship(req, res, next) {
        try {
            const intern = await InternModel.findByUserId(req.user.id);
            if (!intern) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ thực tập.' });
            return res.status(200).json({ success: true, data: intern });
        } catch (err) { next(err); }
    },

    // GET /api/intern/dashboard
    async getInternDashboard(req, res, next) {
        try {
            const intern = await InternModel.findByUserId(req.user.id);
            if (!intern) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy hồ sơ thực tập của bạn.'
                });
            }

            const [tasks] = await pool.query(
                `SELECT 
                    COUNT(*) as total_tasks,
                    SUM(CASE WHEN status = 'TODO' THEN 1 ELSE 0 END) as todo_count,
                    SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_count,
                    SUM(CASE WHEN status = 'SUBMITTED' THEN 1 ELSE 0 END) as submitted_count,
                    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count,
                    SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count
                 FROM tasks WHERE intern_id = ?`,
                [intern.id]
            );

            return res.status(200).json({
                success: true,
                data: {
                    internship: intern,
                    stats: tasks[0]
                }
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/intern/tasks
    async getInternTasks(req, res, next) {
        try {
            const intern = await InternModel.findByUserId(req.user.id);
            if (!intern) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy hồ sơ thực tập của bạn.'
                });
            }

            const tasks = await TaskModel.findByInternId(intern.id, req.query);

            return res.status(200).json({
                success: true,
                count: tasks.length,
                data: tasks
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/tasks/:id
    async getTaskDetail(req, res, next) {
        try {
            const task = await TaskModel.findById(req.params.id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy công việc này.'
                });
            }

            // Authorization: Intern can only see own task, Mentor can see their created task, HR/Admin can see
            if (req.user.role === 'INTERN' && task.intern_user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền xem công việc của thực tập sinh khác.'
                });
            }

            if (req.user.role === 'MENTOR' && task.mentor_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền xem công việc do mình phụ trách.'
                });
            }

            return res.status(200).json({
                success: true,
                data: task
            });
        } catch (err) {
            next(err);
        }
    },

    // PATCH /api/intern/tasks/:id/status
    async updateTaskStatus(req, res, next) {
        try {
            if (!isValidId(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã định danh công việc không hợp lệ.'
                });
            }

            const { status } = req.body;
            const submission_content = req.body.submission_content ? req.body.submission_content.trim() : '';
            const valid = ['TODO', 'IN_PROGRESS', 'SUBMITTED'];

            if (!status || !valid.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Thực tập sinh chỉ có thể chuyển trạng thái sang TODO, IN_PROGRESS, hoặc SUBMITTED.'
                });
            }

            // Giới hạn độ dài nội dung nộp bài
            if (submission_content && submission_content.length > 5000) {
                return res.status(400).json({
                    success: false,
                    message: 'Nội dung mô tả bài nộp không được vượt quá 5000 ký tự.'
                });
            }

            let submission_file_url = undefined;
            let submission_file_name = undefined;
            let submission_file_size = undefined;

            if (req.file) {
                submission_file_url = `/uploads/task_submissions/${req.file.filename}`;
                submission_file_name = req.file.originalname;
                submission_file_size = req.file.size;
            }

            if (status === 'SUBMITTED' && !submission_content && !req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp nội dung mô tả hoặc tải lên file kết quả khi nộp bài.'
                });
            }

            const task = await TaskModel.findById(req.params.id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy công việc này.'
                });
            }

            if (task.intern_user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền chỉnh sửa công việc này.'
                });
            }

            // If submitting, use submitResult to save content & file
            if (status === 'SUBMITTED') {
                await TaskModel.submitResult(task.id, {
                    submission_content,
                    submission_file_url,
                    submission_file_name,
                    submission_file_size
                });

                // Notify Mentor
                try {
                    const NotificationService = require('../services/notificationService');
                    if (task.mentor_id) {
                        await NotificationService.notifyUser({
                            userId: task.mentor_id,
                            senderId: req.user.id,
                            title: 'Thực tập sinh đã nộp bài 🚀',
                            message: `Thực tập sinh "${req.user.full_name}" vừa nộp kết quả thực hiện nhiệm vụ: "${task.title}". Vui lòng kiểm tra và đánh giá.`,
                            type: 'TASK',
                            link: '/mentor/tasks'
                        });
                    }
                } catch (notifyErr) {
                    console.error('Notification error in updateTaskStatus submit:', notifyErr.message);
                }
            } else {
                await TaskModel.updateStatus(task.id, status);
            }
            const updated = await TaskModel.findById(task.id);

            return res.status(200).json({
                success: true,
                message: status === 'SUBMITTED' ? 'Nộp bài thành công! Đang chờ Mentor xem xét.' : `Đã cập nhật trạng thái sang ${status}!`,
                data: updated
            });
        } catch (err) {
            next(err);
        }
    },

    // PUT /api/intern/tasks/:id/submit
    async submitTaskResult(req, res, next) {
        try {
            const submission_content = req.body.submission_content ? req.body.submission_content.trim() : '';

            let submission_file_url = undefined;
            let submission_file_name = undefined;
            let submission_file_size = undefined;

            if (req.file) {
                submission_file_url = `/uploads/task_submissions/${req.file.filename}`;
                submission_file_name = req.file.originalname;
                submission_file_size = req.file.size;
            }

            if (!submission_content && !req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp nội dung kết quả thực hiện (link/mô tả) hoặc tải lên file bài nộp (PDF, Word, PNG/JPG, ZIP,...).'
                });
            }

            const task = await TaskModel.findById(req.params.id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy công việc này.'
                });
            }

            if (task.intern_user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền nộp bài cho công việc được giao cho bạn.'
                });
            }

            await TaskModel.submitResult(task.id, {
                submission_content,
                submission_file_url,
                submission_file_name,
                submission_file_size
            });
            const updated = await TaskModel.findById(task.id);

            // Notify Mentor
            try {
                const NotificationService = require('../services/notificationService');
                if (task.mentor_id) {
                    await NotificationService.notifyUser({
                        userId: task.mentor_id,
                        senderId: req.user.id,
                        title: 'Thực tập sinh đã nộp báo cáo kết quả 🚀',
                        message: `Thực tập sinh "${req.user.full_name}" vừa nộp kết quả cho nhiệm vụ: "${task.title}". Vui lòng kiểm tra và đánh giá.`,
                        type: 'TASK',
                        link: '/mentor/tasks'
                    });
                }
            } catch (notifyErr) {
                console.error('Notification error in submitTaskResult:', notifyErr.message);
            }

            return res.status(200).json({
                success: true,
                message: 'Nộp kết quả công việc thành công! Đang chờ Mentor xem xét và đánh giá.',
                data: updated
            });
        } catch (err) {
            next(err);
        }
    },

    // POST /api/intern/internship/request-certificate
    async requestCertificate(req, res, next) {
        try {
            const intern = await InternModel.findByUserId(req.user.id);
            if (!intern) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ thực tập.' });

            // Can request if Mentor evaluated or HR confirmed or completed
            const canRequest = intern.hr_result === 'PASSED' || intern.mentor_evaluated_at || intern.status === 'COMPLETED' || intern.mentor_recommendation === 'PASS';
            if (!canRequest) {
                return res.status(400).json({ success: false, message: 'Kỳ thực tập của bạn cần được Mentor hoàn thành đánh giá hoặc HR xác nhận trước khi yêu cầu cấp giấy.' });
            }

            if (intern.certificate_status === 'APPROVED') {
                return res.status(400).json({ success: false, message: 'Giấy xác nhận thực tập của bạn đã được cấp rồi.' });
            }

            const {
                certificate_request_note,
                custom_intern_name,
                student_dob,
                student_gender,
                student_phone,
                student_address,
                school_name,
                faculty_name,
                student_code,
                university_class,
                major_name,
                academic_year
            } = req.body;

            await InternModel.requestCertificate(intern.id, {
                certificate_request_note: certificate_request_note || null,
                custom_intern_name: custom_intern_name || null,
                student_dob: student_dob || null,
                student_gender: student_gender || null,
                student_phone: student_phone || null,
                student_address: student_address || null,
                school_name: school_name || null,
                faculty_name: faculty_name || null,
                student_code: student_code || null,
                university_class: university_class || null,
                major_name: major_name || null,
                academic_year: academic_year || null
            });

            // Notify HRs
            try {
                const NotificationService = require('../services/notificationService');
                await NotificationService.notifyHRs({
                    branchId: intern.branch_id,
                    senderId: req.user.id,
                    title: 'Yêu cầu cấp Giấy xác nhận & Đánh giá thực tập 📜',
                    message: `Thực tập sinh "${intern.intern_name}" (Vị trí: ${intern.position_title}) đã gửi yêu cầu cấp Giấy xác nhận & Phiếu đánh giá thực tập. Vui lòng kiểm tra và phê duyệt.`,
                    type: 'INTERNSHIP',
                    link: '/hr/interns'
                });
            } catch (notifyErr) {
                console.error('Notification error in requestCertificate:', notifyErr.message);
            }

            const updated = await InternModel.findByUserId(req.user.id);
            return res.status(200).json({ success: true, message: 'Đã gửi yêu cầu cấp Giấy xác nhận thực tập! HR sẽ kiểm tra và xử lý sớm.', data: updated });
        } catch (err) { next(err); }
    },

    // PUT /api/intern/internship/student-info
    async updateStudentInfo(req, res, next) {
        try {
            const intern = await InternModel.findByUserId(req.user.id);
            if (!intern) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ thực tập.' });

            const {
                custom_intern_name,
                student_dob,
                student_gender,
                student_phone,
                student_address,
                school_name,
                faculty_name,
                student_code,
                university_class,
                major_name,
                academic_year
            } = req.body;

            await InternModel.updateStudentInfo(intern.id, {
                custom_intern_name: custom_intern_name !== undefined ? custom_intern_name : intern.custom_intern_name,
                student_dob: student_dob !== undefined ? student_dob : intern.student_dob,
                student_gender: student_gender !== undefined ? student_gender : intern.student_gender,
                student_phone: student_phone !== undefined ? student_phone : intern.student_phone,
                student_address: student_address !== undefined ? student_address : intern.student_address,
                school_name: school_name !== undefined ? school_name : intern.school_name,
                faculty_name: faculty_name !== undefined ? faculty_name : intern.faculty_name,
                student_code: student_code !== undefined ? student_code : intern.student_code,
                university_class: university_class !== undefined ? university_class : intern.university_class,
                major_name: major_name !== undefined ? major_name : intern.major_name,
                academic_year: academic_year !== undefined ? academic_year : intern.academic_year
            });

            const updated = await InternModel.findByUserId(req.user.id);
            return res.status(200).json({
                success: true,
                message: 'Đã lưu thông tin cá nhân và trường lớp thành công!',
                data: updated
            });
        } catch (err) { next(err); }
    },

    // GET /api/intern/internship/certificate
    async getMyCertificate(req, res, next) {
        try {
            const intern = await InternModel.findByUserId(req.user.id);
            if (!intern) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ thực tập.' });
            return res.status(200).json({ success: true, data: intern });
        } catch (err) { next(err); }
    },

    // POST /api/intern/internship/deal-meeting/propose
    async proposeDealMeeting(req, res, next) {
        try {
            const intern = await InternModel.findByUserId(req.user.id);
            if (!intern) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ thực tập.' });

            const canPropose = ['OFFERED', 'HIRED'].includes(intern.hiring_decision) ||
                (intern.deal_meeting_status && !['NONE', 'CANCELLED'].includes(intern.deal_meeting_status));
            if (!canPropose || intern.hr_result === 'FAILED' || intern.status === 'FAILED' || ['NOT_OFFERED', 'REJECTED', 'DECLINED'].includes(intern.hiring_decision)) {
                return res.status(400).json({ success: false, message: 'Bạn chưa nhận được đề xuất tuyển dụng chính thức từ phòng Nhân sự để đặt lịch Deal Job.' });
            }

            const { deal_meeting_time, deal_meeting_type = 'OFFLINE', deal_meeting_location, deal_meeting_note } = req.body;
            if (!deal_meeting_time) {
                return res.status(400).json({ success: false, message: 'Vui lòng chọn thời gian mong muốn trao đổi.' });
            }

            await InternModel.updateDealMeeting(intern.id, {
                deal_meeting_status: 'PENDING_HR',
                deal_meeting_time,
                deal_meeting_type,
                deal_meeting_location: deal_meeting_location || (deal_meeting_type === 'ONLINE' ? 'Google Meet' : 'Văn phòng công ty'),
                deal_meeting_note,
                updated_by: req.user.id
            });

            const updated = await InternModel.findByUserId(req.user.id);

            // Notify HRs
            try {
                const NotificationService = require('../services/notificationService');
                const timeFormatted = new Date(deal_meeting_time).toLocaleString('vi-VN');
                await NotificationService.notifyHRs({
                    branchId: intern.branch_id,
                    senderId: req.user.id,
                    title: 'Thực tập sinh đề xuất lịch hẹn Deal Job 🤝',
                    message: `Thực tập sinh "${intern.intern_name}" đề xuất lịch hẹn trao đổi tuyển dụng chính thức vào lúc ${timeFormatted} (${deal_meeting_type === 'ONLINE' ? 'Online' : 'Trực tiếp'}). Vui lòng xem xét và xác nhận!`,
                    type: 'INTERNSHIP',
                    link: '/hr/interns'
                });
            } catch (notifyErr) {
                console.error('Notification error in proposeDealMeeting:', notifyErr.message);
            }

            return res.status(200).json({
                success: true,
                message: 'Đã gửi đề xuất lịch hẹn trao đổi Deal Job tới phòng Nhân sự!',
                data: updated
            });
        } catch (err) { next(err); }
    },

    // POST /api/intern/internship/deal-meeting/confirm
    async confirmDealMeeting(req, res, next) {
        try {
            const intern = await InternModel.findByUserId(req.user.id);
            if (!intern) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ thực tập.' });

            const { note } = req.body;
            await InternModel.confirmDealMeeting(intern.id, {
                updated_by: req.user.id,
                note
            });

            const updated = await InternModel.findByUserId(req.user.id);

            // Notify HRs
            try {
                const NotificationService = require('../services/notificationService');
                const timeFormatted = updated.deal_meeting_time ? new Date(updated.deal_meeting_time).toLocaleString('vi-VN') : 'đã chốt';
                await NotificationService.notifyHRs({
                    branchId: intern.branch_id,
                    senderId: req.user.id,
                    title: 'Thực tập sinh đã xác nhận lịch hẹn Deal Job ✅',
                    message: `Thực tập sinh "${intern.intern_name}" đã đồng ý và xác nhận lịch hẹn trao đổi Deal Job vào lúc ${timeFormatted} tại ${updated.deal_meeting_location || 'Văn phòng'}.`,
                    type: 'INTERNSHIP',
                    link: '/hr/interns'
                });
            } catch (notifyErr) {
                console.error('Notification error in confirmDealMeeting:', notifyErr.message);
            }

            return res.status(200).json({
                success: true,
                message: 'Bạn đã xác nhận đồng ý lịch hẹn trao đổi Deal Job!',
                data: updated
            });
        } catch (err) { next(err); }
    },

    // POST /api/intern/internship/decline-offer
    async declineHiringOffer(req, res, next) {
        try {
            const intern = await InternModel.findByUserId(req.user.id);
            if (!intern) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ thực tập.' });

            const { reason } = req.body;
            await InternModel.declineHiringOffer(intern.id, { reason });

            const updated = await InternModel.findByUserId(req.user.id);

            // Notify HRs
            try {
                const NotificationService = require('../services/notificationService');
                await NotificationService.notifyHRs({
                    branchId: intern.branch_id,
                    senderId: req.user.id,
                    title: 'TTS từ chối lời mời tuyển dụng chính thức ❌',
                    message: `Thực tập sinh "${intern.intern_name}" đã từ chối nhận lời mời tuyển dụng chính thức.${reason ? ' Lý do: ' + reason : ''}`,
                    type: 'INTERNSHIP',
                    link: '/hr/interns'
                });
            } catch (notifyErr) {
                console.error('Notification error in declineHiringOffer:', notifyErr.message);
            }

            return res.status(200).json({
                success: true,
                message: 'Đã ghi nhận phản hồi từ chối đề xuất tuyển dụng chính thức của bạn.',
                data: updated
            });
        } catch (err) { next(err); }
    }
};

module.exports = TaskController;
