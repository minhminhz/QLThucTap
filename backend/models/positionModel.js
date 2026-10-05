const pool = require('../config/db');

const PositionModel = {
    async findAll(filters = {}) {
        let query = `
            SELECT p.*, 
                   b.name as branch_name, b.status as branch_status,
                   d.name as department_name,
                   (SELECT COUNT(*) FROM applications a WHERE a.position_id = p.id) as applications_count
            FROM internship_positions p
            LEFT JOIN branches b ON p.branch_id = b.id
            LEFT JOIN departments d ON p.department_id = d.id
            WHERE 1=1
        `;
        const params = [];

        // For public viewing: only open positions, in active branches, with deadline in future or today
        if (filters.onlyActive) {
            query += ` AND p.status = 'OPEN' AND b.status = 'ACTIVE' AND p.deadline >= CURDATE()`;
        }

        if (filters.branch_id) {
            query += ` AND p.branch_id = ?`;
            params.push(filters.branch_id);
        }

        if (filters.department_id) {
            query += ` AND p.department_id = ?`;
            params.push(filters.department_id);
        }

        if (filters.status) {
            query += ` AND p.status = ?`;
            params.push(filters.status);
        }

        if (filters.search) {
            query += ` AND (p.title LIKE ? OR p.description LIKE ? OR p.requirements LIKE ?)`;
            const keyword = `%${filters.search}%`;
            params.push(keyword, keyword, keyword);
        }

        query += ` ORDER BY p.id DESC`;
        const [rows] = await pool.query(query, params);
        return rows;
    },

    async findById(id) {
        const [rows] = await pool.query(
            `SELECT p.*, 
                    b.name as branch_name, b.address as branch_address, b.status as branch_status,
                    d.name as department_name,
                    (SELECT COUNT(*) FROM applications a WHERE a.position_id = p.id) as applications_count
             FROM internship_positions p
             JOIN branches b ON p.branch_id = b.id
             LEFT JOIN departments d ON p.department_id = d.id
             WHERE p.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    async create({ branch_id, department_id, title, description, requirements, benefits, quantity, internship_duration, deadline, status = 'OPEN' }) {
        const [result] = await pool.query(
            `INSERT INTO internship_positions 
             (branch_id, department_id, title, description, requirements, benefits, quantity, internship_duration, deadline, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [branch_id, department_id || null, title, description, requirements, benefits || null, quantity || 1, internship_duration || '3 tháng', deadline, status]
        );
        return result.insertId;
    },

    async update(id, { branch_id, department_id, title, description, requirements, benefits, quantity, internship_duration, deadline, status }) {
        const [result] = await pool.query(
            `UPDATE internship_positions 
             SET branch_id = ?, department_id = ?, title = ?, description = ?, requirements = ?, 
                 benefits = ?, quantity = ?, internship_duration = ?, deadline = ?, status = ?
             WHERE id = ?`,
            [branch_id, department_id, title, description, requirements, benefits || null, quantity, internship_duration, deadline, status, id]
        );
        return result.affectedRows > 0;
    },

    async updateStatus(id, status) {
        const [result] = await pool.query(
            `UPDATE internship_positions SET status = ? WHERE id = ?`,
            [status, id]
        );
        return result.affectedRows > 0;
    },

    async delete(id) {
        const [result] = await pool.query(`DELETE FROM internship_positions WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
};

module.exports = PositionModel;
