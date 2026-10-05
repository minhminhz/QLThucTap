const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Mentor operations
router.get('/mentor', verifyToken, requireRole('MENTOR', 'ADMIN'), TaskController.getMentorTasks);
router.post('/mentor', verifyToken, requireRole('MENTOR', 'ADMIN'), TaskController.createTask);
router.put('/mentor/:id', verifyToken, requireRole('MENTOR', 'ADMIN'), TaskController.updateTask);
router.delete('/mentor/:id', verifyToken, requireRole('MENTOR', 'ADMIN'), TaskController.deleteTask);
router.put('/mentor/:id/review', verifyToken, requireRole('MENTOR', 'ADMIN'), TaskController.reviewTask);

// Intern operations
router.put('/intern/:id/status', verifyToken, requireRole('INTERN'), TaskController.updateTaskStatus);
router.put('/intern/:id/submit', verifyToken, requireRole('INTERN'), TaskController.submitTaskResult);

// Shared detail
router.get('/:id', verifyToken, TaskController.getTaskDetail);

module.exports = router;
