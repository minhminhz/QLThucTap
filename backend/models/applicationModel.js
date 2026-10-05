const pool = require('../config/db');

const ApplicationModel = {
    async create({ position_id, applicant_id, cv_id, cover_letter }) {
        const [result] = await pool.query(
            `INSERT INTO applications (position_id, applicant_id, cv_id, cover_letter, status)
             VALUES (?, ?, ?, ?, 'PENDING')`,
            [position_id, applicant_id, cv_id, cover_letter || null]
        );
        return result.insertId;
    },

    async findActiveApplication(applicant_id, position_id) {
        const [rows] = await pool.query(
            `SELECT * FROM applications 
             WHERE applicant_id = ? AND position_id = ? AND status IN ('PENDING', 'REVIEWING')`,
            [applicant_id, position_id]
        );
        return rows[0] || null;
    },

    async findByApplicantId(applicant_id) {
        const [rows] = await pool.query(
            `SELECT a.*, 
                    p.title as position_title, p.deadline as position_deadline, p.status as position_status,
                    b.id as branch_id, b.name as branch_name,
                    d.name as department_name,
                    c.original_name as cv_original_name, c.file_path as cv_file_path, c.file_type as cv_file_type
             FROM applications a
             JOIN internship_positions p ON a.position_id = p.id
             JOIN branches b ON p.branch_id = b.id
             LEFT JOIN departments d ON p.department_id = d.id
             JOIN cvs c ON a.cv_id = c.id
             WHERE a.applicant_id = ?
             ORDER BY a.id DESC`,
            [applicant_id]
        );
        return rows;
    },

    async findById(id) {
        const [rows] = await pool.query(
            `SELECT a.*, 
                    p.title as position_title, p.deadline as position_deadline, p.status as position_status,
                    p.branch_id,
                    b.name as branch_name,
                    d.name as department_name,
                    u.full_name as applicant_name, u.email as applicant_email, u.phone as applicant_phone,
                    c.original_name as cv_original_name, c.file_path as cv_file_path, c.file_size as cv_file_size, c.file_type as cv_file_type
             FROM applications a
             JOIN internship_positions p ON a.position_id = p.id
             JOIN branches b ON p.branch_id = b.id
             LEFT JOIN departments d ON p.department_id = d.id
             JOIN users u ON a.applicant_id = u.id
             JOIN cvs c ON a.cv_id = c.id
             WHERE a.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    async findAllForHR(branch_id = null, filters = {}) {
        let query = `
            SELECT a.*, 
                    p.title as position_title, p.branch_id,
                    b.name as branch_name,
                    d.name as department_name,
                    u.full_name as applicant_name, u.email as applicant_email, u.phone as applicant_phone,
                    c.original_name as cv_original_name, c.file_path as cv_file_path, c.file_type as cv_file_type
             FROM applications a
             JOIN internship_positions p ON a.position_id = p.id
             LEFT JOIN branches b ON p.branch_id = b.id
             LEFT JOIN departments d ON p.department_id = d.id
             JOIN users u ON a.applicant_id = u.id
             LEFT JOIN cvs c ON a.cv_id = c.id
             WHERE 1=1
        `;
        const params = [];

        if (branch_id) {
            query += ` AND p.branch_id = ?`;
            params.push(branch_id);
        }

        if (filters.status) {
            query += ` AND a.status = ?`;
            params.push(filters.status);
        }

        if (filters.position_id) {
            query += ` AND a.position_id = ?`;
            params.push(filters.position_id);
        }

        if (filters.search) {
            query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR p.title LIKE ?)`;
            const keyword = `%${filters.search}%`;
            params.push(keyword, keyword, keyword);
        }

        query += ` ORDER BY a.id DESC`;
        const [rows] = await pool.query(query, params);
        return rows;
    },

    async updateStatus(id, status, hr_note = null) {
        const [result] = await pool.query(
            `UPDATE applications 
             SET status = ?, hr_note = COALESCE(?, hr_note)
             WHERE id = ?`,
            [status, hr_note, id]
        );
        return result.affectedRows > 0;
    }
};

module.exports = ApplicationModel;
