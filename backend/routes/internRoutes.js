const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const { uploadTaskSubmission } = require('../middlewares/uploadMiddleware');

router.use(verifyToken, requireRole('INTERN', 'ADMIN'));

router.get('/dashboard', TaskController.getInternDashboard);
router.get('/internship', TaskController.getMyInternship);
router.get('/tasks', TaskController.getInternTasks);
router.patch('/tasks/:id/status', uploadTaskSubmission.single('file'), TaskController.updateTaskStatus);
router.put('/tasks/:id/status', uploadTaskSubmission.single('file'), TaskController.updateTaskStatus);
router.put('/tasks/:id/submit', uploadTaskSubmission.single('file'), TaskController.submitTaskResult);

module.exports = router;
