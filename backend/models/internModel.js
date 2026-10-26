const pool = require('../config/db');

const InternModel = {
    async create({ user_id, application_id, position_id, branch_id, mentor_id, start_date, end_date, status = 'UPCOMING' }) {
        const [result] = await pool.query(
            `INSERT INTO interns (user_id, application_id, position_id, branch_id, mentor_id, start_date, end_date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, application_id || null, position_id, branch_id, mentor_id || null, start_date, end_date, status]
        );
        return result.insertId;
    },

    async findByUserId(user_id) {
        const [rows] = await pool.query(
            `SELECT i.*, 
                    COALESCE(i.custom_intern_name, u.full_name) as intern_name, u.email as intern_email, COALESCE(i.student_phone, u.phone) as intern_phone, u.avatar,
                    p.title as position_title,
                    b.name as branch_name, b.address as branch_address, b.phone as branch_phone,
                    d.name as department_name,
                    m.full_name as mentor_name, m.email as mentor_email, m.phone as mentor_phone,
                    hr_u.full_name as hr_confirmed_by_name,
                    cert_u.full_name as certificate_approved_by_name,
                    (SELECT COUNT(*) FROM tasks t WHERE t.intern_id = i.id) as total_tasks,
                    (SELECT COUNT(*) FROM tasks t WHERE t.intern_id = i.id AND t.status = 'COMPLETED') as completed_tasks
             FROM interns i
             JOIN users u ON i.user_id = u.id
             JOIN internship_positions p ON i.position_id = p.id
             JOIN branches b ON i.branch_id = b.id
             LEFT JOIN departments d ON p.department_id = d.id
             LEFT JOIN users m ON i.mentor_id = m.id
             LEFT JOIN users hr_u ON i.hr_confirmed_by = hr_u.id
             LEFT JOIN users cert_u ON i.certificate_approved_by = cert_u.id
             WHERE i.user_id = ?`,
            [user_id]
        );
        return rows[0] || null;
    },

    async findById(id) {
        const [rows] = await pool.query(
            `SELECT i.*, 
                    COALESCE(i.custom_intern_name, u.full_name) as intern_name, u.email as intern_email, COALESCE(i.student_phone, u.phone) as intern_phone, u.avatar,
                    p.title as position_title,
                    b.name as branch_name, b.address as branch_address, b.phone as branch_phone,
                    d.name as department_name,
                    m.full_name as mentor_name, m.email as mentor_email, m.phone as mentor_phone,
                    hr_u.full_name as hr_confirmed_by_name,
                    cert_u.full_name as certificate_approved_by_name,
                    (SELECT COUNT(*) FROM tasks t WHERE t.intern_id = i.id) as total_tasks,
                    (SELECT COUNT(*) FROM tasks t WHERE t.intern_id = i.id AND t.status = 'COMPLETED') as completed_tasks
             FROM interns i
             JOIN users u ON i.user_id = u.id
             JOIN internship_positions p ON i.position_id = p.id
             JOIN branches b ON i.branch_id = b.id
             LEFT JOIN departments d ON p.department_id = d.id
             LEFT JOIN users m ON i.mentor_id = m.id
             LEFT JOIN users hr_u ON i.hr_confirmed_by = hr_u.id
             LEFT JOIN users cert_u ON i.certificate_approved_by = cert_u.id
             WHERE i.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    async findAllForHR(branch_id = null, filters = {}) {
        let query = `
            SELECT i.*, 
                    COALESCE(i.custom_intern_name, u.full_name) as intern_name, u.email as intern_email, COALESCE(i.student_phone, u.phone) as intern_phone,
                    p.title as position_title,
                    b.name as branch_name, b.address as branch_address,
                    d.name as department_name,
                    m.full_name as mentor_name, m.email as mentor_email,
                    c.id as cv_id, c.original_name as cv_original_name, c.file_path as cv_file_path, c.file_type as cv_file_type,
                    hr_u.full_name as hr_confirmed_by_name,
                    cert_u.full_name as certificate_approved_by_name,
                    (SELECT COUNT(*) FROM tasks t WHERE t.intern_id = i.id) as total_tasks,
                    (SELECT COUNT(*) FROM tasks t WHERE t.intern_id = i.id AND t.status = 'COMPLETED') as completed_tasks
             FROM interns i
             JOIN users u ON i.user_id = u.id
             JOIN internship_positions p ON i.position_id = p.id
             JOIN branches b ON i.branch_id = b.id
             LEFT JOIN departments d ON p.department_id = d.id
             LEFT JOIN users m ON i.mentor_id = m.id
             LEFT JOIN applications a ON i.application_id = a.id
             LEFT JOIN cvs c ON a.cv_id = c.id
             LEFT JOIN users hr_u ON i.hr_confirmed_by = hr_u.id
             LEFT JOIN users cert_u ON i.certificate_approved_by = cert_u.id
             WHERE 1=1
        `;
        const params = [];

        if (branch_id) {
            query += ` AND i.branch_id = ?`;
            params.push(branch_id);
        }

        if (filters.status) {
            query += ` AND i.status = ?`;
            params.push(filters.status);
        }

        if (filters.mentor_id) {
            query += ` AND i.mentor_id = ?`;
            params.push(filters.mentor_id);
        }

        if (filters.hr_result) {
            query += ` AND i.hr_result = ?`;
            params.push(filters.hr_result);
        }

        if (filters.certificate_status) {
            query += ` AND i.certificate_status = ?`;
            params.push(filters.certificate_status);
        }

        if (filters.hiring_decision) {
            query += ` AND i.hiring_decision = ?`;
            params.push(filters.hiring_decision);
        }

        if (filters.search) {
            query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR p.title LIKE ?)`;
            const keyword = `%${filters.search}%`;
            params.push(keyword, keyword, keyword);
        }

        query += ` ORDER BY i.id DESC`;
        const [rows] = await pool.query(query, params);
        return rows;
    },

    async findByMentorId(mentor_id) {
        const [rows] = await pool.query(
            `SELECT i.*, 
                    COALESCE(i.custom_intern_name, u.full_name) as intern_name, u.email as intern_email, COALESCE(i.student_phone, u.phone) as intern_phone, u.avatar,
                    p.title as position_title, p.internship_duration, p.status as position_status,
                    b.name as branch_name, b.address as branch_address,
                    d.name as department_name,
                    c.id as cv_id, c.original_name as cv_original_name, c.file_path as cv_file_path, c.file_type as cv_file_type,
                    (SELECT COUNT(*) FROM tasks t WHERE t.intern_id = i.id) as total_tasks,
                    (SELECT COUNT(*) FROM tasks t WHERE t.intern_id = i.id AND t.status = 'COMPLETED') as completed_tasks,
                    (SELECT COUNT(*) FROM tasks t WHERE t.intern_id = i.id AND t.status = 'SUBMITTED') as pending_tasks
             FROM interns i
             JOIN users u ON i.user_id = u.id
             JOIN internship_positions p ON i.position_id = p.id
             JOIN branches b ON i.branch_id = b.id
             LEFT JOIN departments d ON p.department_id = d.id
             LEFT JOIN applications a ON i.application_id = a.id
             LEFT JOIN cvs c ON a.cv_id = c.id
             WHERE i.mentor_id = ?
             ORDER BY i.id DESC`,
            [mentor_id]
        );
        return rows;
    },

    async assignMentor(id, mentor_id) {
        const [result] = await pool.query(
            `UPDATE interns SET mentor_id = ? WHERE id = ?`,
            [mentor_id, id]
        );
        return result.affectedRows > 0;
    },

    async updateStatus(id, status) {
        const [result] = await pool.query(
            `UPDATE interns SET status = ? WHERE id = ?`,
            [status, id]
        );
        return result.affectedRows > 0;
    },

    async submitMentorEvaluation(id, {
        rating, final_review, mentor_recommendation = 'PASS', mentor_offer_recommendation = 0,
        score_discipline = null, score_competence = null, score_skills = null,
        evaluation_advantages = null, evaluation_limitations = null,
        school_name = null, student_code = null, university_class = null, major_name = null, academic_year = null
    }) {
        const [result] = await pool.query(
            `UPDATE interns 
             SET rating = ?, 
                 final_review = ?, 
                 mentor_recommendation = ?, 
                 mentor_offer_recommendation = ?, 
                 score_discipline = COALESCE(?, score_discipline),
                 score_competence = COALESCE(?, score_competence),
                 score_skills = COALESCE(?, score_skills),
                 evaluation_advantages = COALESCE(?, evaluation_advantages),
                 evaluation_limitations = COALESCE(?, evaluation_limitations),
                 school_name = COALESCE(?, school_name),
                 student_code = COALESCE(?, student_code),
                 university_class = COALESCE(?, university_class),
                 major_name = COALESCE(?, major_name),
                 academic_year = COALESCE(?, academic_year),
                 mentor_evaluated_at = NOW()
             WHERE id = ?`,
            [
                rating || null, final_review, mentor_recommendation, mentor_offer_recommendation ? 1 : 0,
                score_discipline, score_competence, score_skills,
                evaluation_advantages, evaluation_limitations,
                school_name, student_code, university_class, major_name, academic_year,
                id
            ]
        );
        return result.affectedRows > 0;
    },

    async confirmHRCompletion(id, { hr_result, hr_review, hiring_decision = 'NONE', hiring_note = null, hr_confirmed_by }) {
        const newStatus = 'COMPLETED';
        await pool.query('UPDATE users SET role = ? WHERE id = (SELECT user_id FROM interns WHERE id = ?)', ['INTERN', id]);
        
        let finalHiringDecision = hiring_decision;
        let resetDealMeetingSql = '';
        if (hr_result === 'FAILED') {
            finalHiringDecision = 'NOT_OFFERED';
            resetDealMeetingSql = `, deal_meeting_status = 'NONE', deal_meeting_time = NULL, deal_meeting_location = NULL, deal_meeting_note = NULL`;
        }

        const [result] = await pool.query(
            `UPDATE interns 
             SET hr_result = ?, 
                 hr_review = ?, 
                 status = ?,
                 hiring_decision = ?,
                 hiring_note = ?,
                 hr_confirmed_at = NOW(),
                 hr_confirmed_by = ?
                 ${resetDealMeetingSql}
             WHERE id = ?`,
            [hr_result, hr_review || null, newStatus, finalHiringDecision, hiring_note, hr_confirmed_by, id]
        );
        return result.affectedRows > 0;
    },

    async requestCertificate(id, { certificate_request_note, custom_intern_name, student_dob, student_gender, student_phone, student_address, school_name, faculty_name, student_code, university_class, major_name, academic_year }) {
        const [result] = await pool.query(
            `UPDATE interns 
             SET certificate_status = 'REQUESTED',
                 certificate_request_note = ?,
                 custom_intern_name = COALESCE(?, custom_intern_name),
                 student_dob = COALESCE(?, student_dob),
                 student_gender = COALESCE(?, student_gender),
                 student_phone = COALESCE(?, student_phone),
                 student_address = COALESCE(?, student_address),
                 school_name = COALESCE(?, school_name),
                 faculty_name = COALESCE(?, faculty_name),
                 student_code = COALESCE(?, student_code),
                 university_class = COALESCE(?, university_class),
                 major_name = COALESCE(?, major_name),
                 academic_year = COALESCE(?, academic_year),
                 certificate_requested_at = NOW(),
                 certificate_rejection_reason = NULL
             WHERE id = ?`,
            [
                certificate_request_note || null,
                custom_intern_name || null,
                student_dob || null,
                student_gender || null,
                student_phone || null,
                student_address || null,
                school_name || null,
                faculty_name || null,
                student_code || null,
                university_class || null,
                major_name || null,
                academic_year || null,
                id
            ]
        );
        return result.affectedRows > 0;
    },

    async updateStudentInfo(id, { custom_intern_name, student_dob, student_gender, student_phone, student_address, school_name, faculty_name, student_code, university_class, major_name, academic_year }) {
        const [result] = await pool.query(
            `UPDATE interns 
             SET custom_intern_name = ?,
                 student_dob = ?,
                 student_gender = ?,
                 student_phone = ?,
                 student_address = ?,
                 school_name = ?,
                 faculty_name = ?,
                 student_code = ?,
                 university_class = ?,
                 major_name = ?,
                 academic_year = ?
             WHERE id = ?`,
            [
                custom_intern_name || null,
                student_dob || null,
                student_gender || null,
                student_phone || null,
                student_address || null,
                school_name || null,
                faculty_name || null,
                student_code || null,
                university_class || null,
                major_name || null,
                academic_year || null,
                id
            ]
        );
        return result.affectedRows > 0;
    },

    async approveCertificate(id, { certificate_code, approved_by }) {
        const [result] = await pool.query(
            `UPDATE interns 
             SET certificate_status = 'APPROVED',
                 certificate_code = ?,
                 certificate_approved_at = NOW(),
                 certificate_approved_by = ?,
                 certificate_rejection_reason = NULL
             WHERE id = ?`,
            [certificate_code, approved_by, id]
        );
        return result.affectedRows > 0;
    },

    async issueDirectCertificate(id, { certificate_code, approved_by, custom_intern_name, student_dob, student_gender, student_phone, student_address, school_name, faculty_name, student_code, university_class, major_name, academic_year }) {
        const [result] = await pool.query(
            `UPDATE interns 
             SET certificate_status = 'APPROVED',
                 certificate_code = ?,
                 certificate_approved_at = NOW(),
                 certificate_approved_by = ?,
                 custom_intern_name = COALESCE(?, custom_intern_name),
                 student_dob = COALESCE(?, student_dob),
                 student_gender = COALESCE(?, student_gender),
                 student_phone = COALESCE(?, student_phone),
                 student_address = COALESCE(?, student_address),
                 school_name = COALESCE(?, school_name),
                 faculty_name = COALESCE(?, faculty_name),
                 student_code = COALESCE(?, student_code),
                 university_class = COALESCE(?, university_class),
                 major_name = COALESCE(?, major_name),
                 academic_year = COALESCE(?, academic_year),
                 certificate_rejection_reason = NULL
             WHERE id = ?`,
            [
                certificate_code,
                approved_by,
                custom_intern_name || null,
                student_dob || null,
                student_gender || null,
                student_phone || null,
                student_address || null,
                school_name || null,
                faculty_name || null,
                student_code || null,
                university_class || null,
                major_name || null,
                academic_year || null,
                id
            ]
        );
        return result.affectedRows > 0;
    },

    async rejectCertificate(id, { reason, approved_by }) {
        const [result] = await pool.query(
            `UPDATE interns 
             SET certificate_status = 'REJECTED',
                 certificate_rejection_reason = ?,
                 certificate_approved_by = ?,
                 certificate_approved_at = NOW()
             WHERE id = ?`,
            [reason || 'Yêu cầu không được phê duyệt.', approved_by, id]
        );
        return result.affectedRows > 0;
    },

    async updateHiringDecision(id, { hiring_decision, hiring_note }) {
        let resetDealSql = '';
        if (['NOT_OFFERED', 'REJECTED', 'DECLINED'].includes(hiring_decision)) {
            resetDealSql = `, deal_meeting_status = 'CANCELLED'`;
        }
        const [result] = await pool.query(
            `UPDATE interns 
             SET hiring_decision = ?,
                 hiring_note = ?
                 ${resetDealSql}
             WHERE id = ?`,
            [hiring_decision, hiring_note || null, id]
        );
        return result.affectedRows > 0;
    },

    async declineHiringOffer(id, { reason = null }) {
        const [result] = await pool.query(
            `UPDATE interns 
             SET hiring_decision = 'DECLINED',
                 hiring_decline_reason = ?,
                 hiring_declined_at = NOW(),
                 deal_meeting_status = 'CANCELLED'
             WHERE id = ?`,
            [reason || 'Thực tập sinh từ chối nhận lời mời làm việc chính thức.', id]
        );
        return result.affectedRows > 0;
    },

    async updateDealMeeting(id, { deal_meeting_status, deal_meeting_time, deal_meeting_type, deal_meeting_location, deal_meeting_note, updated_by }) {
        const [result] = await pool.query(
            `UPDATE interns 
             SET deal_meeting_status = ?,
                 deal_meeting_time = ?,
                 deal_meeting_type = ?,
                 deal_meeting_location = ?,
                 deal_meeting_note = ?,
                 deal_meeting_updated_by = ?,
                 deal_meeting_updated_at = NOW()
             WHERE id = ?`,
            [deal_meeting_status, deal_meeting_time || null, deal_meeting_type || 'OFFLINE', deal_meeting_location || null, deal_meeting_note || null, updated_by, id]
        );
        return result.affectedRows > 0;
    },

    async confirmDealMeeting(id, { updated_by, note }) {
        const [result] = await pool.query(
            `UPDATE interns 
             SET deal_meeting_status = 'CONFIRMED',
                 deal_meeting_note = COALESCE(?, deal_meeting_note),
                 deal_meeting_updated_by = ?,
                 deal_meeting_updated_at = NOW()
             WHERE id = ?`,
            [note || null, updated_by, id]
        );
        return result.affectedRows > 0;
    }
};

module.exports = InternModel;
