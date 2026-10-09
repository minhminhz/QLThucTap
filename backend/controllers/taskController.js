const TaskModel = require('../models/taskModel');
const InternModel = require('../models/internModel');
const pool = require('../config/db');

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

            if (!intern_id || !title || !description || !deadline) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp đầy đủ thông tin: Thực tập sinh, Tiêu đề, Mô tả và Hạn chót (Deadline).'
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
                status: 'TODO'
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

            const { title, description, deadline, status } = req.body;

            await TaskModel.update(task.id, {
                title: title || task.title,
                description: description || task.description,
                deadline: deadline || task.deadline,
                status: status || task.status
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
            const { status, submission_content } = req.body;
            const valid = ['TODO', 'IN_PROGRESS', 'SUBMITTED'];

            if (!status || !valid.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Thực tập sinh chỉ có thể chuyển trạng thái sang TODO, IN_PROGRESS, hoặc SUBMITTED.'
                });
            }

            if (status === 'SUBMITTED' && (!submission_content || !submission_content.trim())) {
                return res.status(400).json({ success: false, message: 'Vui lòng cung cấp nội dung kết quả khi nộp bài.' });
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

            // If submitting, use submitResult to save content
            if (status === 'SUBMITTED') {
                await TaskModel.submitResult(task.id, submission_content.trim());

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
            const { submission_content } = req.body;

            if (!submission_content || submission_content.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp nội dung kết quả thực hiện (Link tài liệu, Github repo, hoặc mô tả chi tiết).'
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

            await TaskModel.submitResult(task.id, submission_content.trim());
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
    }
};

module.exports = TaskController;
