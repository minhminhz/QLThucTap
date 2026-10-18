const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const { uploadTaskAttachment, uploadTaskSubmission } = require('../middlewares/uploadMiddleware');

// Mentor operations
router.get('/mentor', verifyToken, requireRole('MENTOR', 'ADMIN'), TaskController.getMentorTasks);
router.post('/mentor', verifyToken, requireRole('MENTOR', 'ADMIN'), uploadTaskAttachment.single('file'), TaskController.createTask);
router.put('/mentor/:id', verifyToken, requireRole('MENTOR', 'ADMIN'), uploadTaskAttachment.single('file'), TaskController.updateTask);
router.delete('/mentor/:id', verifyToken, requireRole('MENTOR', 'ADMIN'), TaskController.deleteTask);
router.put('/mentor/:id/review', verifyToken, requireRole('MENTOR', 'ADMIN'), TaskController.reviewTask);
router.patch('/mentor/:id/review', verifyToken, requireRole('MENTOR', 'ADMIN'), TaskController.reviewTask);

// Intern operations
router.put('/intern/:id/status', verifyToken, requireRole('INTERN'), uploadTaskSubmission.single('file'), TaskController.updateTaskStatus);
router.patch('/intern/:id/status', verifyToken, requireRole('INTERN'), uploadTaskSubmission.single('file'), TaskController.updateTaskStatus);
router.put('/intern/:id/submit', verifyToken, requireRole('INTERN'), uploadTaskSubmission.single('file'), TaskController.submitTaskResult);

// Shared detail
router.get('/:id', verifyToken, TaskController.getTaskDetail);

module.exports = router;
