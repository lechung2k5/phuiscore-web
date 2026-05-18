const express = require('express');
const router = express.Router();
const {
    register,
    verifyEmail,
    login,
    refreshToken,
    getProfile,
    getMyProfile,
    updateMyProfile,
    uploadProfileImage,
    forgotPassword,
    resetPassword,
    changePassword,
    logout,
} = require('../controllers/auth.controller');
const { verifyToken, verifyTokenOptional } = require('../middlewares/auth.middleware');

// Public routes
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/profile/:id', verifyTokenOptional, getProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Private routes
router.get('/me', verifyToken, getMyProfile);
router.patch('/me/profile', verifyToken, updateMyProfile);
router.post('/me/profile-image', verifyToken, uploadProfileImage);
router.post('/change-password', verifyToken, changePassword);
router.post('/logout', verifyToken, logout);

module.exports = router;
