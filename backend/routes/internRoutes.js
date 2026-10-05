const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.use(verifyToken, requireRole('INTERN', 'ADMIN'));

router.get('/dashboard', TaskController.getInternDashboard);
router.get('/internship', TaskController.getMyInternship);
router.get('/tasks', TaskController.getInternTasks);
router.patch('/tasks/:id/status', TaskController.updateTaskStatus);

module.exports = router;
