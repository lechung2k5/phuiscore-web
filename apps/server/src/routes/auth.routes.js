const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.get('/profile/:id', getProfile);
module.exports = router;