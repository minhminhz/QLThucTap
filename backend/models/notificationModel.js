const pool = require('../config/db');

const NotificationModel = {
    /**
     * Create a single notification
     */
    async create({ user_id, sender_id = null, title, message, type = 'SYSTEM', link = null }) {
        const [result] = await pool.query(
            `INSERT INTO notifications (user_id, sender_id, title, message, type, link)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, sender_id, title, message, type, link]
        );
        return result.insertId;
    },

    /**
     * Create multiple notifications at once (e.g. notify all HRs)
     */
    async createMultiple(notifications) {
        if (!notifications || notifications.length === 0) return [];
        const values = notifications.map(n => [
            n.user_id,
            n.sender_id || null,
            n.title,
            n.message,
            n.type || 'SYSTEM',
            n.link || null
        ]);

        const [result] = await pool.query(
            `INSERT INTO notifications (user_id, sender_id, title, message, type, link)
             VALUES ?`,
            [values]
        );
        return result;
    },

    /**
     * Get notifications for a specific user
     */
    async findByUserId(user_id, { limit = 50, offset = 0, unread_only = false } = {}) {
        let query = `
            SELECT n.*, 
                   u.full_name as sender_name,
                   u.role as sender_role,
                   u.avatar as sender_avatar
            FROM notifications n
            LEFT JOIN users u ON n.sender_id = u.id
            WHERE n.user_id = ?
        `;
        const params = [user_id];

        if (unread_only) {
            query += ` AND n.is_read = 0`;
        }

        query += ` ORDER BY n.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit, 10) || 50, parseInt(offset, 10) || 0);

        const [rows] = await pool.query(query, params);
        return rows;
    },

    /**
     * Count unread notifications for a user
     */
    async countUnread(user_id) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0`,
            [user_id]
        );
        return rows[0]?.unread_count || 0;
    },

    /**
     * Mark a single notification as read
     */
    async markAsRead(id, user_id) {
        const [result] = await pool.query(
            `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
            [id, user_id]
        );
        return result.affectedRows > 0;
    },

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(user_id) {
        const [result] = await pool.query(
            `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
            [user_id]
        );
        return result.affectedRows;
    },

    /**
     * Delete a single notification
     */
    async delete(id, user_id) {
        const [result] = await pool.query(
            `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
            [id, user_id]
        );
        return result.affectedRows > 0;
    },

    /**
     * Delete all notifications for a user
     */
    async deleteAll(user_id) {
        const [result] = await pool.query(
            `DELETE FROM notifications WHERE user_id = ?`,
            [user_id]
        );
        return result.affectedRows;
    }
};

module.exports = NotificationModel;
