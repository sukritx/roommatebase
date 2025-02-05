const express = require('express');
const auth = require('../middleware/authMiddleware');
const { getCurrentUser, getFavorites } = require('../controllers/userController');

const router = express.Router();

router.get('/me', auth, getCurrentUser);
router.get('/favorites', auth, getFavorites);

module.exports = router;