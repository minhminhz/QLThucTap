const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/applicationController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.post('/', verifyToken, requireRole('APPLICANT'), ApplicationController.apply);
router.get('/my', verifyToken, requireRole('APPLICANT'), ApplicationController.getMyApplications);
router.get('/:id', verifyToken, ApplicationController.getApplicationById);

module.exports = router;
