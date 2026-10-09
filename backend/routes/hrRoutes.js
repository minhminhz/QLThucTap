const express = require('express');
const router = express.Router();
const HrController = require('../controllers/hrController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// All HR routes require HR or ADMIN role
router.use(verifyToken, requireRole('HR', 'ADMIN'));

// Stats & metadata
router.get('/stats', HrController.getDashboardStats);
router.get('/dashboard', HrController.getDashboardStats);
router.get('/departments', HrController.getDepartments);

// Position management
router.get('/positions', HrController.getPositions);
router.post('/positions', HrController.createPosition);
router.put('/positions/:id', HrController.updatePosition);
router.patch('/positions/:id/status', HrController.togglePositionStatus);
router.delete('/positions/:id', HrController.deletePosition);

// Application management
router.get('/applications', HrController.getApplications);
router.put('/applications/:id/status', HrController.updateApplicationStatus);
router.patch('/applications/:id/status', HrController.updateApplicationStatus);

// Intern management
router.get('/interns', HrController.getInterns);
router.put('/interns/:id/mentor', HrController.assignMentor);
router.patch('/interns/:id/assign-mentor', HrController.assignMentorWithDates);
router.put('/interns/:id/status', HrController.updateInternStatus);
router.patch('/interns/:id/status', HrController.updateInternStatus);

// Mentor management within branch
router.get('/mentors', HrController.getMentors);
router.post('/mentors', HrController.createMentor);
router.put('/mentors/:id', HrController.updateMentor);
router.patch('/mentors/:id/status', HrController.toggleMentorStatus);
router.patch('/mentors/:id/reset-password', HrController.resetMentorPassword);

// Applicant management within branch
router.get('/applicants', HrController.getApplicants);
router.get('/applicants/:id', HrController.getApplicantDetails);

module.exports = router;
