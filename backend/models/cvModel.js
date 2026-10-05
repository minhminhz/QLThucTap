const pool = require('../config/db');

const CvModel = {
    async create({ user_id, original_name, stored_name, file_path, file_size, file_type }) {
        const [result] = await pool.query(
            `INSERT INTO cvs (user_id, original_name, stored_name, file_path, file_size, file_type)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, original_name, stored_name, file_path, file_size, file_type]
        );
        return result.insertId;
    },

    async findByUserId(user_id) {
        const [rows] = await pool.query(
            `SELECT * FROM cvs WHERE user_id = ? ORDER BY id DESC`,
            [user_id]
        );
        return rows;
    },

    async findById(id) {
        const [rows] = await pool.query(`SELECT * FROM cvs WHERE id = ?`, [id]);
        return rows[0] || null;
    },

    async delete(id) {
        const [result] = await pool.query(`DELETE FROM cvs WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
};

module.exports = CvModel;
