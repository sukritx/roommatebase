const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getCurrentUser, getFavorites } = require('../controllers/userController');

const router = express.Router();

router.get('/me', authenticateToken, getCurrentUser);
router.get('/favorites', authenticateToken, getFavorites);

module.exports = router;