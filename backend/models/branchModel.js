const pool = require('../config/db');

const BranchModel = {
    async findAll(onlyActive = false) {
        let query = `
            SELECT b.*, 
                   (SELECT COUNT(*) FROM internship_positions p WHERE p.branch_id = b.id AND p.status = 'OPEN') as open_positions_count,
                   (SELECT COUNT(*) FROM users u WHERE u.branch_id = b.id AND u.role = 'HR') as hr_count,
                   (SELECT COUNT(*) FROM users u WHERE u.branch_id = b.id AND u.role = 'MENTOR') as mentor_count,
                   (SELECT COUNT(*) FROM interns i WHERE i.branch_id = b.id AND i.status = 'IN_PROGRESS') as active_interns_count
            FROM branches b
        `;
        const params = [];

        if (onlyActive) {
            query += ` WHERE b.status = 'ACTIVE'`;
        }

        query += ` ORDER BY b.id ASC`;
        const [rows] = await pool.query(query, params);
        return rows;
    },

    async findById(id) {
        const [rows] = await pool.query(
            `SELECT b.*,
                    (SELECT COUNT(*) FROM internship_positions p WHERE p.branch_id = b.id AND p.status = 'OPEN') as open_positions_count,
                    (SELECT COUNT(*) FROM interns i WHERE i.branch_id = b.id AND i.status = 'IN_PROGRESS') as active_interns_count
             FROM branches b
             WHERE b.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    async findByName(name) {
        const [rows] = await pool.query(`SELECT * FROM branches WHERE name = ?`, [name]);
        return rows[0] || null;
    },

    async create({ name, address, phone, status = 'ACTIVE' }) {
        const [result] = await pool.query(
            `INSERT INTO branches (name, address, phone, status) VALUES (?, ?, ?, ?)`,
            [name, address, phone || null, status]
        );
        return result.insertId;
    },

    async update(id, { name, address, phone, status }) {
        const [result] = await pool.query(
            `UPDATE branches SET name = ?, address = ?, phone = ?, status = ? WHERE id = ?`,
            [name, address, phone || null, status, id]
        );
        return result.affectedRows > 0;
    },

    async updateStatus(id, status) {
        const [result] = await pool.query(
            `UPDATE branches SET status = ? WHERE id = ?`,
            [status, id]
        );
        return result.affectedRows > 0;
    }
};

module.exports = BranchModel;
