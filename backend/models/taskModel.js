const pool = require('../config/db');

const TaskModel = {
    async create({ intern_id, mentor_id, title, description, deadline, status = 'TODO' }) {
        const [result] = await pool.query(
            `INSERT INTO tasks (intern_id, mentor_id, title, description, deadline, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [intern_id, mentor_id, title, description, deadline, status]
        );
        return result.insertId;
    },

    async findById(id) {
        const [rows] = await pool.query(
            `SELECT t.*, 
                    i.user_id as intern_user_id,
                    u_intern.full_name as intern_name, u_intern.email as intern_email, u_intern.phone as intern_phone,
                    u_mentor.full_name as mentor_name, u_mentor.email as mentor_email
             FROM tasks t
             JOIN interns i ON t.intern_id = i.id
             JOIN users u_intern ON i.user_id = u_intern.id
             JOIN users u_mentor ON t.mentor_id = u_mentor.id
             WHERE t.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    async findByInternId(intern_id, filters = {}) {
        let query = `
            SELECT t.*, 
                    u_mentor.full_name as mentor_name, u_mentor.email as mentor_email
             FROM tasks t
             JOIN users u_mentor ON t.mentor_id = u_mentor.id
             WHERE t.intern_id = ?
        `;
        const params = [intern_id];

        if (filters.status) {
            query += ` AND t.status = ?`;
            params.push(filters.status);
        }

        query += ` ORDER BY t.deadline ASC, t.id DESC`;
        const [rows] = await pool.query(query, params);
        return rows;
    },

    async findByMentorId(mentor_id, filters = {}) {
        let query = `
            SELECT t.*, 
                    i.user_id as intern_user_id,
                    u_intern.full_name as intern_name, u_intern.email as intern_email
             FROM tasks t
             JOIN interns i ON t.intern_id = i.id
             JOIN users u_intern ON i.user_id = u_intern.id
             WHERE t.mentor_id = ?
        `;
        const params = [mentor_id];

        if (filters.intern_id) {
            query += ` AND t.intern_id = ?`;
            params.push(filters.intern_id);
        }

        if (filters.status) {
            query += ` AND t.status = ?`;
            params.push(filters.status);
        }

        query += ` ORDER BY t.deadline ASC, t.id DESC`;
        const [rows] = await pool.query(query, params);
        return rows;
    },

    async update(id, { title, description, deadline, status }) {
        const [result] = await pool.query(
            `UPDATE tasks 
             SET title = ?, description = ?, deadline = ?, status = COALESCE(?, status)
             WHERE id = ?`,
            [title, description, deadline, status || null, id]
        );
        return result.affectedRows > 0;
    },

    async updateStatus(id, status) {
        const [result] = await pool.query(
            `UPDATE tasks SET status = ? WHERE id = ?`,
            [status, id]
        );
        return result.affectedRows > 0;
    },

    async submitResult(id, submission_content) {
        const [result] = await pool.query(
            `UPDATE tasks 
             SET submission_content = ?, status = 'SUBMITTED'
             WHERE id = ?`,
            [submission_content, id]
        );
        return result.affectedRows > 0;
    },

    async review(id, status, feedback) {
        const [result] = await pool.query(
            `UPDATE tasks 
             SET status = ?, feedback = ?
             WHERE id = ?`,
            [status, feedback || null, id]
        );
        return result.affectedRows > 0;
    },

    async delete(id) {
        const [result] = await pool.query(`DELETE FROM tasks WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
};

module.exports = TaskModel;
