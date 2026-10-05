const express = require('express');
const router = express.Router();
const CvController = require('../controllers/cvController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { uploadCV } = require('../middlewares/uploadMiddleware');

// Upload CV (Applicant only)
router.post('/upload', verifyToken, requireRole('APPLICANT'), uploadCV.single('cv'), CvController.upload);

// List own CVs (Applicant only)
router.get('/my', verifyToken, requireRole('APPLICANT'), CvController.getMyCVs);

// View / stream a CV file in-browser (authenticated: any role can view)
router.get('/:id/view', verifyToken, CvController.viewCV);

// Delete a CV
router.delete('/:id', verifyToken, requireRole('APPLICANT', 'ADMIN'), CvController.deleteCV);

module.exports = router;
