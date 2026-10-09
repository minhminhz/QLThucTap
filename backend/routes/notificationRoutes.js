const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

// All notification routes require authentication
router.use(verifyToken);

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/:id/read', NotificationController.markAsRead);
router.patch('/read-all', NotificationController.markAllAsRead);
router.delete('/:id', NotificationController.deleteNotification);
router.delete('/', NotificationController.clearAll);

module.exports = router;
