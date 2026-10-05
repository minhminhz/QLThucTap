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
                    u.full_name as intern_name, u.email as intern_email, u.phone as intern_phone, u.avatar,
                    p.title as position_title,
                    b.name as branch_name, b.address as branch_address,
                    d.name as department_name,
                    m.full_name as mentor_name, m.email as mentor_email, m.phone as mentor_phone
             FROM interns i
             JOIN users u ON i.user_id = u.id
             JOIN internship_positions p ON i.position_id = p.id
             JOIN branches b ON i.branch_id = b.id
             LEFT JOIN departments d ON p.department_id = d.id
             LEFT JOIN users m ON i.mentor_id = m.id
             WHERE i.user_id = ?`,
            [user_id]
        );
        return rows[0] || null;
    },

    async findById(id) {
        const [rows] = await pool.query(
            `SELECT i.*, 
                    u.full_name as intern_name, u.email as intern_email, u.phone as intern_phone, u.avatar,
                    p.title as position_title,
                    b.name as branch_name,
                    d.name as department_name,
                    m.full_name as mentor_name, m.email as mentor_email, m.phone as mentor_phone,
                    (SELECT COUNT(*) FROM tasks t WHERE t.intern_id = i.id) as total_tasks,
                    (SELECT COUNT(*) FROM tasks t WHERE t.intern_id = i.id AND t.status = 'COMPLETED') as completed_tasks
             FROM interns i
             JOIN users u ON i.user_id = u.id
             JOIN internship_positions p ON i.position_id = p.id
             JOIN branches b ON i.branch_id = b.id
             LEFT JOIN departments d ON p.department_id = d.id
             LEFT JOIN users m ON i.mentor_id = m.id
             WHERE i.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    async findAllForHR(branch_id = null, filters = {}) {
        let query = `
            SELECT i.*, 
                    u.full_name as intern_name, u.email as intern_email, u.phone as intern_phone,
                    p.title as position_title,
                    b.name as branch_name,
                    d.name as department_name,
                    m.full_name as mentor_name, m.email as mentor_email,
                    c.id as cv_id, c.original_name as cv_original_name, c.file_path as cv_file_path, c.file_type as cv_file_type,
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
                    u.full_name as intern_name, u.email as intern_email, u.phone as intern_phone, u.avatar,
                    p.title as position_title, p.internship_duration, p.status as position_status,
                    b.name as branch_name,
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
    }
};

module.exports = InternModel;
