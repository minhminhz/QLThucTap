const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', verifyToken, AuthController.getMe);
router.put('/profile', verifyToken, AuthController.updateProfile);
router.put('/change-password', verifyToken, AuthController.changePassword);

module.exports = router;
