const pool = require('../config/db');

const DepartmentModel = {
    async findAll() {
        const [rows] = await pool.query(`SELECT * FROM departments ORDER BY id ASC`);
        return rows;
    },

    async findById(id) {
        const [rows] = await pool.query(`SELECT * FROM departments WHERE id = ?`, [id]);
        return rows[0] || null;
    }
};

module.exports = DepartmentModel;
