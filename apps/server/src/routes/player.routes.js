const express = require('express');
const router = express.Router();
const PlayerController = require('../controllers/player.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Public routes
router.get('/', PlayerController.getPlayersByTeam);

// Protected routes
router.post('/', verifyToken, PlayerController.addPlayer);
router.put('/:id', verifyToken, PlayerController.updatePlayer);
router.delete('/:id', verifyToken, PlayerController.deletePlayer);

module.exports = router;
