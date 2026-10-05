const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.use(verifyToken, requireRole('ADMIN'));

router.get('/dashboard', AdminController.getDashboardStats);
router.get('/branches', AdminController.getBranches);
router.post('/branches', AdminController.createBranch);
router.put('/branches/:id', AdminController.updateBranch);
router.put('/branches/:id/status', AdminController.toggleBranchStatus);

router.get('/users', AdminController.getUsers);
router.post('/users', AdminController.createUser);
router.put('/users/:id/status', AdminController.toggleUserStatus);

router.get('/departments', AdminController.getDepartments);

module.exports = router;
