const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// @route   POST /api/auth/register
router.post('/register', registerValidation, authController.register);

// @route   POST /api/auth/login
router.post('/login', loginValidation, authController.login);

// @route   GET /api/auth/me
router.get('/me', protect, authController.getMe);

// @route   POST /api/auth/logout
router.post('/logout', protect, authController.logout);

module.exports = router;
