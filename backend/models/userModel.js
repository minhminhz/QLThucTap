const pool = require('../config/db');

const UserModel = {
    async findByEmail(email) {
        const [rows] = await pool.query(
            `SELECT u.*, b.name as branch_name, d.name as department_name
             FROM users u
             LEFT JOIN branches b ON u.branch_id = b.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.email = ?`,
            [email]
        );
        return rows[0] || null;
    },

    async findById(id) {
        const [rows] = await pool.query(
            `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.department_id, 
                    u.avatar, u.status, u.created_at, u.updated_at,
                    b.name as branch_name, d.name as department_name
             FROM users u
             LEFT JOIN branches b ON u.branch_id = b.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    async create({ full_name, email, password, phone, role = 'APPLICANT', branch_id = null, department_id = null }) {
        const [result] = await pool.query(
            `INSERT INTO users (full_name, email, password, phone, role, branch_id, department_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [full_name, email, password, phone || null, role, branch_id || null, department_id || null]
        );
        return result.insertId;
    },

    async updateProfile(id, { full_name, phone, avatar }) {
        const fields = [];
        const values = [];

        if (full_name !== undefined) {
            fields.push('full_name = ?');
            values.push(full_name);
        }
        if (phone !== undefined) {
            fields.push('phone = ?');
            values.push(phone);
        }
        if (avatar !== undefined) {
            fields.push('avatar = ?');
            values.push(avatar);
        }

        if (fields.length === 0) return false;

        values.push(id);
        const [result] = await pool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return result.affectedRows > 0;
    },

    async updatePassword(id, hashedPassword) {
        const [result] = await pool.query(
            `UPDATE users SET password = ? WHERE id = ?`,
            [hashedPassword, id]
        );
        return result.affectedRows > 0;
    },

    async updateRoleAndBranch(id, role, branch_id) {
        const [result] = await pool.query(
            `UPDATE users SET role = ?, branch_id = ? WHERE id = ?`,
            [role, branch_id, id]
        );
        return result.affectedRows > 0;
    },

    async updateStatus(id, status) {
        const [result] = await pool.query(
            `UPDATE users SET status = ? WHERE id = ?`,
            [status, id]
        );
        return result.affectedRows > 0;
    },

    async findMentorsByBranch(branch_id, status = null, search = null) {
        let query = `
            SELECT u.id, u.full_name, u.email, u.phone, u.department_id, u.branch_id, u.status, u.created_at,
                   b.name as branch_name, d.name as department_name,
                   (SELECT COUNT(*) FROM interns i WHERE i.mentor_id = u.id AND i.status IN ('UPCOMING', 'IN_PROGRESS')) as active_interns_count,
                   (SELECT COUNT(*) FROM interns i WHERE i.mentor_id = u.id) as total_interns_count
            FROM users u
            LEFT JOIN branches b ON u.branch_id = b.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.role = 'MENTOR'
        `;
        const params = [];

        if (branch_id) {
            query += ` AND u.branch_id = ?`;
            params.push(branch_id);
        }

        if (status && status !== 'ALL') {
            query += ` AND u.status = ?`;
            params.push(status);
        }

        if (search) {
            query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
            const keyword = `%${search}%`;
            params.push(keyword, keyword, keyword);
        }

        query += ` ORDER BY u.status ASC, u.full_name ASC`;
        const [rows] = await pool.query(query, params);
        return rows;
    },

    async countActiveInternsForMentor(mentor_id) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) as count 
             FROM interns 
             WHERE mentor_id = ? AND status IN ('UPCOMING', 'IN_PROGRESS')`,
            [mentor_id]
        );
        return rows[0] ? rows[0].count : 0;
    },

    async getActiveInternsForMentor(mentor_id) {
        const [rows] = await pool.query(
            `SELECT i.id, i.start_date, i.end_date, i.status,
                    u.full_name, u.email, u.phone,
                    p.title as position_title
             FROM interns i
             JOIN users u ON i.user_id = u.id
             JOIN internship_positions p ON i.position_id = p.id
             WHERE i.mentor_id = ? AND i.status IN ('UPCOMING', 'IN_PROGRESS')
             ORDER BY i.id DESC`,
            [mentor_id]
        );
        return rows;
    },

    async updateMentorProfile(id, { full_name, phone, department_id }) {
        const fields = [];
        const values = [];

        if (full_name !== undefined) {
            fields.push('full_name = ?');
            values.push(full_name.trim());
        }
        if (phone !== undefined) {
            fields.push('phone = ?');
            values.push(phone ? phone.trim() : null);
        }
        if (department_id !== undefined) {
            fields.push('department_id = ?');
            values.push(department_id ? parseInt(department_id, 10) : null);
        }

        if (fields.length === 0) return false;

        values.push(id);
        const [result] = await pool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ? AND role = 'MENTOR'`,
            values
        );
        return result.affectedRows > 0;
    },

    async findApplicantsByBranch(branch_id, filters = {}) {
        let query = `
            SELECT 
                u.id, u.full_name, u.email, u.phone, u.avatar, u.status, u.created_at,
                COUNT(a.id) as total_applications,
                MAX(a.created_at) as latest_application_date,
                SUBSTRING_INDEX(GROUP_CONCAT(a.status ORDER BY a.id DESC SEPARATOR '||'), '||', 1) as latest_status,
                SUBSTRING_INDEX(GROUP_CONCAT(p.title ORDER BY a.id DESC SEPARATOR '||'), '||', 1) as latest_position_title,
                SUBSTRING_INDEX(GROUP_CONCAT(c.original_name ORDER BY a.id DESC SEPARATOR '||'), '||', 1) as latest_cv_name,
                SUBSTRING_INDEX(GROUP_CONCAT(c.file_path ORDER BY a.id DESC SEPARATOR '||'), '||', 1) as latest_cv_path
            FROM users u
            JOIN applications a ON u.id = a.applicant_id
            JOIN internship_positions p ON a.position_id = p.id
            LEFT JOIN cvs c ON a.cv_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (branch_id) {
            query += ` AND p.branch_id = ?`;
            params.push(branch_id);
        }

        if (filters.search) {
            query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
            const keyword = `%${filters.search}%`;
            params.push(keyword, keyword, keyword);
        }

        query += ` GROUP BY u.id, u.full_name, u.email, u.phone, u.avatar, u.status, u.created_at
                   ORDER BY latest_application_date DESC`;

        const [rows] = await pool.query(query, params);
        return rows;
    },

    async findApplicantDetailsInBranch(applicant_id, branch_id) {
        const applicant = await this.findById(applicant_id);
        if (!applicant) return null;

        let query = `
            SELECT a.*, 
                   p.title as position_title, p.branch_id,
                   b.name as branch_name,
                   d.name as department_name,
                   c.original_name as cv_original_name, c.file_path as cv_file_path, c.file_type as cv_file_type
            FROM applications a
            JOIN internship_positions p ON a.position_id = p.id
            JOIN branches b ON p.branch_id = b.id
            LEFT JOIN departments d ON p.department_id = d.id
            LEFT JOIN cvs c ON a.cv_id = c.id
            WHERE a.applicant_id = ?
        `;
        const params = [applicant_id];

        if (branch_id) {
            query += ` AND p.branch_id = ?`;
            params.push(branch_id);
        }

        query += ` ORDER BY a.id DESC`;
        const [applications] = await pool.query(query, params);

        return {
            ...applicant,
            applications
        };
    },

    async findAll(filters = {}) {
        let query = `
            SELECT u.id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.department_id, 
                   u.status, u.created_at,
                   b.name as branch_name, d.name as department_name
            FROM users u
            LEFT JOIN branches b ON u.branch_id = b.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.role) {
            query += ` AND u.role = ?`;
            params.push(filters.role);
        }
        if (filters.branch_id) {
            query += ` AND u.branch_id = ?`;
            params.push(filters.branch_id);
        }
        if (filters.status) {
            query += ` AND u.status = ?`;
            params.push(filters.status);
        }
        if (filters.search) {
            query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
            const searchKeyword = `%${filters.search}%`;
            params.push(searchKeyword, searchKeyword, searchKeyword);
        }

        query += ` ORDER BY u.id DESC`;
        const [rows] = await pool.query(query, params);
        return rows;
    }
};

module.exports = UserModel;
