const express = require('express');
const { getOverlayState, updateOverlayState, resetOverlayState } = require('../state/overlayStore');

const router = express.Router();

// Lấy state của một trận đấu
router.get('/:matchId/state', (req, res) => {
  const { matchId } = req.params;
  const state = getOverlayState(matchId);
  res.json(state);
});

// Cập nhật state của một trận đấu
// Body: { match: {...}, layers: {...} }
router.put('/:matchId/state', (req, res) => {
  const { matchId } = req.params;
  const newState = req.body;
  
  const updatedState = updateOverlayState(matchId, newState);

  // Broadcast thay đổi tới overlay qua socket (sẽ handle ở mức app hoặc truyền io vào)
  const io = req.app.get('io');
  if (io) {
    io.to(matchId).emit('overlay:state', updatedState);
  }

  res.json(updatedState);
});

// Reset trạng thái trận đấu
router.post('/:matchId/reset', (req, res) => {
  const { matchId } = req.params;
  const state = resetOverlayState(matchId);

  const io = req.app.get('io');
  if (io) {
    io.to(matchId).emit('overlay:state', state);
  }

  res.json(state);
});

module.exports = router;
