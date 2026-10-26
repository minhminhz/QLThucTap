const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const { uploadTaskSubmission } = require('../middlewares/uploadMiddleware');

router.use(verifyToken, requireRole('INTERN', 'APPLICANT', 'ADMIN'));

router.get('/dashboard', TaskController.getInternDashboard);
router.get('/internship', TaskController.getMyInternship);
router.post('/internship/request-certificate', TaskController.requestCertificate);
router.put('/internship/student-info', TaskController.updateStudentInfo);
router.get('/internship/certificate', TaskController.getMyCertificate);
router.post('/internship/deal-meeting/propose', TaskController.proposeDealMeeting);
router.post('/internship/deal-meeting/confirm', TaskController.confirmDealMeeting);
router.post('/internship/decline-offer', TaskController.declineHiringOffer);
router.get('/tasks', TaskController.getInternTasks);
router.patch('/tasks/:id/status', uploadTaskSubmission.single('file'), TaskController.updateTaskStatus);
router.put('/tasks/:id/status', uploadTaskSubmission.single('file'), TaskController.updateTaskStatus);
router.put('/tasks/:id/submit', uploadTaskSubmission.single('file'), TaskController.submitTaskResult);

module.exports = router;
