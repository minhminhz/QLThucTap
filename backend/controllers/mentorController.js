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
            const {
                final_review, rating, mentor_recommendation = 'PASS', mentor_offer_recommendation = false,
                score_discipline, score_competence, score_skills,
                evaluation_advantages, evaluation_limitations,
                school_name, student_code, university_class, major_name, academic_year
            } = req.body;
            if (!final_review) return res.status(400).json({ success: false, message: 'Vui lòng nhập nhận xét tổng kết.' });
            const intern = await InternModel.findById(req.params.id);
            if (!intern) return res.status(404).json({ success: false, message: 'Không tìm thấy thực tập sinh.' });
            if (intern.mentor_id !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({ success: false, message: 'Chỉ Mentor phụ trách mới có thể đánh giá.' });
            }

            // Calculate rating if criteria are provided
            let finalRating = rating !== undefined && rating !== null && rating !== '' ? parseFloat(rating) : null;
            if (score_discipline !== undefined && score_competence !== undefined && score_skills !== undefined) {
                const totalScore = (parseFloat(score_discipline) || 0) + (parseFloat(score_competence) || 0) + (parseFloat(score_skills) || 0);
                if (totalScore > 0) {
                    finalRating = Math.round(totalScore * 10) / 10;
                }
            }

            await InternModel.submitMentorEvaluation(intern.id, {
                rating: finalRating,
                final_review,
                mentor_recommendation: mentor_recommendation || 'PASS',
                mentor_offer_recommendation: mentor_offer_recommendation ? 1 : 0,
                score_discipline: score_discipline ? parseFloat(score_discipline) : null,
                score_competence: score_competence ? parseFloat(score_competence) : null,
                score_skills: score_skills ? parseFloat(score_skills) : null,
                evaluation_advantages: evaluation_advantages || null,
                evaluation_limitations: evaluation_limitations || null,
                school_name: school_name || null,
                student_code: student_code || null,
                university_class: university_class || null,
                major_name: major_name || null,
                academic_year: academic_year || null
            });

            const updated = await InternModel.findById(intern.id);

            // Dispatch notifications to Intern and HR
            try {
                const NotificationService = require('../services/notificationService');
                // 1. Notify Intern
                if (intern.user_id) {
                    await NotificationService.notifyUser({
                        userId: intern.user_id,
                        senderId: req.user.id,
                        title: 'Đánh giá cuối kỳ từ Mentor 🏆',
                        message: `Mentor "${req.user.full_name}" đã hoàn thành đánh giá cuối kỳ: ${rating ? rating + '/10 điểm - ' : ''}"${final_review}". Kết quả đang được gửi tới phòng Nhân sự (HR) để tổng hợp và xác nhận hoàn thành!`,
                        type: 'INTERNSHIP',
                        link: '/intern'
                    });
                }

                // 2. Notify HRs at branch
                await NotificationService.notifyHRs({
                    branchId: intern.branch_id,
                    senderId: req.user.id,
                    title: 'Đánh giá cuối kỳ TTS hoàn tất 🎓',
                    message: `Mentor "${req.user.full_name}" vừa hoàn tất đánh giá cuối kỳ cho TTS "${intern.intern_name}" (Vị trí: ${intern.position_title || 'Thực tập sinh'}, Điểm: ${rating || 'N/A'}/10, Đề xuất: ${mentor_recommendation === 'PASS' ? 'Đạt' : 'Không đạt'}${mentor_offer_recommendation ? ', Có đề xuất tuyển dụng chính thức' : ''}). Vui lòng xác nhận hoàn thành thực tập.`,
                    type: 'INTERNSHIP',
                    link: '/hr/interns'
                });
            } catch (notifyErr) {
                console.error('Notification error in submitFinalReview:', notifyErr.message);
            }

            return res.status(200).json({ success: true, message: 'Đánh giá cuối kỳ thành công! Kết quả đã được chuyển tới HR.', data: updated });
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
