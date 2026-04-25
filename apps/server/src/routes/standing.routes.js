const express = require('express');
const router = express.Router();
const standingController = require('../controllers/standing.controller');
const { cacheResponse } = require('../middlewares/cacheMiddleware');

// ⚡ Cache 5 phút: BXH cào từ SofaScore rất tốn thời gian, không cần realtime
router.get('/:tournamentId', cacheResponse(300), standingController.getStandings);

module.exports = router;