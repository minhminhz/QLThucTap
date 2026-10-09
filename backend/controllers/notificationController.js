const NotificationModel = require('../models/notificationModel');

const NotificationController = {
    // GET /api/notifications
    async getNotifications(req, res, next) {
        try {
            const userId = req.user.id;
            const limit = parseInt(req.query.limit, 10) || 50;
            const offset = parseInt(req.query.offset, 10) || 0;
            const unreadOnly = req.query.unread === 'true' || req.query.unread === '1';

            const [notifications, unreadCount] = await Promise.all([
                NotificationModel.findByUserId(userId, { limit, offset, unread_only: unreadOnly }),
                NotificationModel.countUnread(userId)
            ]);

            return res.status(200).json({
                success: true,
                unread_count: unreadCount,
                data: notifications
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/notifications/unread-count
    async getUnreadCount(req, res, next) {
        try {
            const count = await NotificationModel.countUnread(req.user.id);
            return res.status(200).json({
                success: true,
                count
            });
        } catch (err) {
            next(err);
        }
    },

    // PATCH /api/notifications/:id/read
    async markAsRead(req, res, next) {
        try {
            const success = await NotificationModel.markAsRead(req.params.id, req.user.id);
            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông báo hoặc bạn không có quyền.'
                });
            }

            const unreadCount = await NotificationModel.countUnread(req.user.id);

            return res.status(200).json({
                success: true,
                message: 'Đã đánh dấu thông báo là đã đọc.',
                unread_count: unreadCount
            });
        } catch (err) {
            next(err);
        }
    },

    // PATCH /api/notifications/read-all
    async markAllAsRead(req, res, next) {
        try {
            await NotificationModel.markAllAsRead(req.user.id);
            return res.status(200).json({
                success: true,
                message: 'Đã đánh dấu tất cả thông báo là đã đọc.',
                unread_count: 0
            });
        } catch (err) {
            next(err);
        }
    },

    // DELETE /api/notifications/:id
    async deleteNotification(req, res, next) {
        try {
            const success = await NotificationModel.delete(req.params.id, req.user.id);
            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông báo cần xóa.'
                });
            }

            const unreadCount = await NotificationModel.countUnread(req.user.id);

            return res.status(200).json({
                success: true,
                message: 'Đã xóa thông báo.',
                unread_count: unreadCount
            });
        } catch (err) {
            next(err);
        }
    },

    // DELETE /api/notifications
    async clearAll(req, res, next) {
        try {
            await NotificationModel.deleteAll(req.user.id);
            return res.status(200).json({
                success: true,
                message: 'Đã xóa toàn bộ thông báo.',
                unread_count: 0
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = NotificationController;
