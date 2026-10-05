const express = require('express');
const router = express.Router();
const MentorController = require('../controllers/mentorController');
const TaskController = require('../controllers/taskController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.use(verifyToken, requireRole('MENTOR', 'ADMIN'));

// Dashboard
router.get('/dashboard', MentorController.getDashboardStats);

// Intern management
router.get('/interns', MentorController.getMyInterns);
router.get('/interns/:id', MentorController.getInternDetail);
router.patch('/interns/:id/final-review', MentorController.submitFinalReview);

// Task management (operations done by mentor)
router.get('/tasks', MentorController.getAllTasks);
router.post('/tasks', TaskController.createTask);
router.get('/tasks/:id', MentorController.getTaskDetail);
router.put('/tasks/:id', TaskController.updateTask);
router.delete('/tasks/:id', TaskController.deleteTask);
router.patch('/tasks/:id/review', TaskController.reviewTask);
router.put('/tasks/:id/review', TaskController.reviewTask);

module.exports = router;
