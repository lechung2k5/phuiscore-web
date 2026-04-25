const express = require('express');
const router = express.Router();
const TeamMemberController = require('../controllers/teamMember.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Public routes
router.get('/', TeamMemberController.getMembersByTeam);

// Protected routes
router.post('/', verifyToken, TeamMemberController.addMember);
router.put('/:id', verifyToken, TeamMemberController.updateMember);
router.delete('/:id', verifyToken, TeamMemberController.deleteMember);

module.exports = router;
