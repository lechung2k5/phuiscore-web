const express = require('express');
const router = express.Router();
const TeamController = require('../controllers/team.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Protected routes
router.get('/my-teams/dashboard', verifyToken, TeamController.getMyTeams);
router.post('/', verifyToken, TeamController.createTeam);
router.put('/:id', verifyToken, TeamController.updateTeam);
router.delete('/:id', verifyToken, TeamController.deleteTeam);

// Public routes
router.get('/', TeamController.getAllTeams);
router.get('/:id', TeamController.getTeamById);

module.exports = router;
