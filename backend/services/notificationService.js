const pool = require('../config/db');
const NotificationModel = require('../models/notificationModel');

const NotificationService = {
    /**
     * Send notification to a specific user
     */
    async notifyUser({ userId, senderId = null, title, message, type = 'SYSTEM', link = null }) {
        try {
            if (!userId) return null;
            return await NotificationModel.create({
                user_id: userId,
                sender_id: senderId,
                title,
                message,
                type,
                link
            });
        } catch (err) {
            console.error('[NotificationService] notifyUser error:', err.message);
            return null;
        }
    },

    /**
     * Send notification to multiple users
     */
    async notifyUsers(userIds, { senderId = null, title, message, type = 'SYSTEM', link = null }) {
        try {
            if (!userIds || userIds.length === 0) return [];
            // Remove duplicates and falsy IDs
            const uniqueIds = [...new Set(userIds.filter(id => Boolean(id)))];
            if (uniqueIds.length === 0) return [];

            const list = uniqueIds.map(uid => ({
                user_id: uid,
                sender_id: senderId,
                title,
                message,
                type,
                link
            }));

            return await NotificationModel.createMultiple(list);
        } catch (err) {
            console.error('[NotificationService] notifyUsers error:', err.message);
            return [];
        }
    },

    /**
     * Send notification to HR staff (optionally scoped to a branch) and Admins
     */
    async notifyHRs({ branchId = null, senderId = null, title, message, type = 'HR', link = '/hr' }) {
        try {
            let query = `SELECT id FROM users WHERE status = 'ACTIVE' AND (role = 'ADMIN' OR (role = 'HR'`;
            const params = [];

            if (branchId) {
                query += ` AND (branch_id = ? OR branch_id IS NULL)))`;
                params.push(branchId);
            } else {
                query += `))`;
            }

            const [rows] = await pool.query(query, params);
            const userIds = rows.map(r => r.id);

            // Filter out senderId so they don't notify themselves if sender is an HR/Admin
            const targetIds = senderId ? userIds.filter(id => id !== senderId) : userIds;

            if (targetIds.length > 0) {
                return await this.notifyUsers(targetIds, {
                    senderId,
                    title,
                    message,
                    type,
                    link
                });
            }
            return [];
        } catch (err) {
            console.error('[NotificationService] notifyHRs error:', err.message);
            return [];
        }
    }
};

module.exports = NotificationService;
