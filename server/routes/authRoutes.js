const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { loginSchema } = require('../validators/schemas');

router.post('/login', validate(loginSchema), authController.login);
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
