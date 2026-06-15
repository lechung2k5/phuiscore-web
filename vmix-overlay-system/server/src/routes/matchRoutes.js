const express = require('express');
const { getOverlayState, updateOverlayState, resetOverlayState, initMatchState, getAllMatchIds } = require('../state/overlayStore');
const MatchRepo = require('../repositories/match.repo');

const router = express.Router();

// Lấy/Khởi tạo state của một trận đấu (kết nối DB nếu chưa có)
router.get('/:matchId/state', async (req, res) => {
  const { matchId } = req.params;
  const date = req.query.date || new Date().toISOString().split('T')[0]; // Default to today

  let state = getOverlayState(matchId);
  if (!state) {
      state = await initMatchState(date, matchId);
  }
  res.json(state);
});

// Lấy danh sách trận đấu của một giải đấu (GSI)
router.get('/tournament/:tournamentId', async (req, res) => {
  const { tournamentId } = req.params;
  try {
    const matches = await MatchRepo.getMatchesByTournament(tournamentId);
    res.json({ success: true, data: matches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cập nhật state của một trận đấu (Optimistic Update)
router.put('/:matchId/state', (req, res) => {
  const { matchId } = req.params;
  const newState = req.body;
  
  const updatedState = updateOverlayState(matchId, newState);
  if(!updatedState) return res.status(404).json({error: "Match state not found. Init first."});

  // Broadcast thay đổi tới overlay qua socket
  const io = req.app.get('io');
  if (io) {
    io.to(matchId).emit('overlay:state', updatedState);
  }

  res.json(updatedState);
});

// Reset trạng thái trận đấu (Tải lại từ DB)
router.post('/:matchId/reset', async (req, res) => {
  const { matchId } = req.params;
  const state = await resetOverlayState(matchId);

  const io = req.app.get('io');
  if (io && state) {
    io.to(matchId).emit('overlay:state', state);
  }

  res.json(state);
});

// Webhook cho vMix Shortcut
router.get('/:matchId/action', (req, res) => {
  let { matchId } = req.params;
  const { type, team, amount } = req.query;

  // Hỗ trợ endpoint dùng chung cho mọi trận (lấy trận gần nhất đang được mở Control Panel)
  if (matchId === 'active') {
    const allIds = getAllMatchIds();
    if (allIds.length === 0) {
      return res.status(404).json({ error: 'No active match found. Please open Control Panel first.' });
    }
    matchId = allIds[allIds.length - 1]; // Lấy trận cuối cùng được nạp vào bộ nhớ
  }
  
  let currentState = getOverlayState(matchId);
  if (!currentState) {
    return res.status(404).json({ error: 'Match not initialized in overlay memory' });
  }

  let updates = {};
  if (type === 'score') {
    const teamKey = team === 'home' ? 'homeTeam' : 'awayTeam';
    const currentScore = currentState[teamKey]?.score || 0;
    const newScore = Math.max(0, currentScore + parseInt(amount || 1));
    
    const currentGoals = currentState[teamKey]?.goals || [];
    let newGoals = [...currentGoals];
    if (newScore > currentScore) {
      let minuteStr = '';
      if (currentState?.matchInfo?.time !== undefined) {
        minuteStr = `${Math.floor(currentState.matchInfo.time / 60)}'`;
      }
      // Add a generic goal if scored from vMix shortcut
      newGoals.push({ id: Date.now(), playerName: 'CẦU THỦ', minute: minuteStr });
    } else if (newScore < currentScore) {
      newGoals.pop();
    }

    updates = {
      [teamKey]: { score: newScore, goals: newGoals },
      scoreboardEvent: {
        type: 'scoreboard_goal',
        team: team,
        id: Date.now()
      }
    };
  } else if (type === 'time') {
    const action = req.query.action;
    updates = {
      matchInfo: { isRunning: action === 'start' }
    };
  }

  const updatedState = updateOverlayState(matchId, updates);
  const io = req.app.get('io');
  if (io && updatedState) {
    io.to(matchId).emit('overlay:state', updatedState);
  }

  res.json({ success: true, updatedState });
});

module.exports = router;
