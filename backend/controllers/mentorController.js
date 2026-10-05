const pool = require('../config/db');
const InternModel = require('../models/internModel');
const TaskModel = require('../models/taskModel');

const MentorController = {
    // GET /api/mentor/dashboard
    async getDashboardStats(req, res, next) {
        try {
            const mentorId = req.user.id;

            const [internsCount] = await pool.query(
                `SELECT COUNT(*) as count FROM interns WHERE mentor_id = ? AND status = 'IN_PROGRESS'`,
                [mentorId]
            );

            const [pendingTasks] = await pool.query(
                `SELECT COUNT(*) as count FROM tasks WHERE mentor_id = ? AND status = 'SUBMITTED'`,
                [mentorId]
            );

            const [activeTasks] = await pool.query(
                `SELECT COUNT(*) as count FROM tasks WHERE mentor_id = ? AND status IN ('TODO', 'IN_PROGRESS')`,
                [mentorId]
            );

            const [completedTasks] = await pool.query(
                `SELECT COUNT(*) as count FROM tasks WHERE mentor_id = ? AND status = 'COMPLETED'`,
                [mentorId]
            );

            // Fetch batches & positions for mentor's interns
            const [batchRows] = await pool.query(
                `SELECT p.id as position_id, p.title as position_title, p.internship_duration,
                        b.name as branch_name,
                        MIN(i.start_date) as start_date, 
                        MAX(i.end_date) as end_date,
                        COUNT(i.id) as intern_count
                 FROM interns i
                 JOIN internship_positions p ON i.position_id = p.id
                 JOIN branches b ON i.branch_id = b.id
                 WHERE i.mentor_id = ?
                 GROUP BY p.id, p.title, p.internship_duration, b.name
                 ORDER BY p.id ASC`,
                [mentorId]
            );

            return res.status(200).json({
                success: true,
                data: {
                    active_interns: internsCount[0].count,
                    pending_reviews: pendingTasks[0].count,
                    active_tasks: activeTasks[0].count,
                    completed_tasks: completedTasks[0].count,
                    batches: batchRows
                }
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/mentor/interns
    async getMyInterns(req, res, next) {
        try {
            const interns = await InternModel.findByMentorId(req.user.id);
            return res.status(200).json({
                success: true,
                count: interns.length,
                data: interns
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/mentor/tasks  
    async getAllTasks(req, res, next) {
        try {
            const tasks = await TaskModel.findByMentorId(req.user.id, req.query);
            return res.status(200).json({ success: true, count: tasks.length, data: tasks });
        } catch (err) { next(err); }
    },

    // GET /api/mentor/tasks/:id
    async getTaskDetail(req, res, next) {
        try {
            const task = await TaskModel.findById(req.params.id);
            if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy công việc.' });
            if (task.mentor_id !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({ success: false, message: 'Không có quyền xem công việc này.' });
            }
            return res.status(200).json({ success: true, data: task });
        } catch (err) { next(err); }
    },

    // PATCH /api/mentor/interns/:id/final-review
    async submitFinalReview(req, res, next) {
        try {
            const { final_review, rating } = req.body;
            if (!final_review) return res.status(400).json({ success: false, message: 'Vui lòng nhập nhận xét tổng kết.' });
            const intern = await InternModel.findById(req.params.id);
            if (!intern) return res.status(404).json({ success: false, message: 'Không tìm thấy thực tập sinh.' });
            if (intern.mentor_id !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({ success: false, message: 'Chỉ Mentor phụ trách mới có thể đánh giá.' });
            }
            await pool.query(
                `UPDATE interns SET final_review = ?, rating = ?, status = 'COMPLETED' WHERE id = ?`,
                [final_review, rating || null, intern.id]
            );
            const updated = await InternModel.findById(intern.id);
            return res.status(200).json({ success: true, message: 'Đánh giá tổng kết thành công!', data: updated });
        } catch (err) { next(err); }
    },

    // GET /api/mentor/interns/:id
    async getInternDetail(req, res, next) {
        try {
            const intern = await InternModel.findById(req.params.id);
            if (!intern) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông tin thực tập sinh này.'
                });
            }

            if (intern.mentor_id !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền xem chi tiết thực tập sinh được phân công cho mình.'
                });
            }

            const tasks = await TaskModel.findByInternId(intern.id);

            return res.status(200).json({
                success: true,
                data: {
                    intern,
                    tasks
                }
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = MentorController;
