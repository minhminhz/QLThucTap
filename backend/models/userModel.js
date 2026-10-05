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

    async findMentorsByBranch(branch_id) {
        let query = `
            SELECT u.id, u.full_name, u.email, u.phone, u.department_id, u.branch_id,
                   b.name as branch_name, d.name as department_name,
                   (SELECT COUNT(*) FROM interns i WHERE i.mentor_id = u.id AND i.status = 'IN_PROGRESS') as active_interns_count
            FROM users u
            LEFT JOIN branches b ON u.branch_id = b.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.role = 'MENTOR' AND u.status = 'ACTIVE'
        `;
        const params = [];

        if (branch_id) {
            query += ` AND u.branch_id = ?`;
            params.push(branch_id);
        }

        query += ` ORDER BY u.full_name ASC`;
        const [rows] = await pool.query(query, params);
        return rows;
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
