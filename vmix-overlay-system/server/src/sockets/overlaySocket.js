const { getOverlayState, updateOverlayState, getAllMatchIds } = require('../state/overlayStore');

const setupSockets = (io) => {
  // Clock Manager: emit 'clock:tick' riêng (nhẹ) thay vì full 'overlay:state' mỗi giây
  // Tránh gây re-render toàn bộ overlay components không liên quan đến clock
  setInterval(() => {
    const matchIds = getAllMatchIds();
    matchIds.forEach(matchId => {
      const state = getOverlayState(matchId);
      if (state && state.matchInfo?.isRunning) {
        const newTime = (state.matchInfo.time || 0) + 1;
        updateOverlayState(matchId, {
          matchInfo: { time: newTime }
        });
        // Chỉ emit thời gian - không emit full state
        io.to(matchId).emit('clock:tick', { time: newTime });
      }
    });
  }, 1000);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Khi client (Admin hoặc Overlay) tham gia vào một room (theo matchId)
    socket.on('join-match', (matchId) => {
      socket.join(matchId);
      console.log(`Socket ${socket.id} joined match ${matchId}`);
      
      // Gửi state hiện tại ngay lập tức
      const currentState = getOverlayState(matchId);
      socket.emit('overlay:state', currentState);
    });

    // Admin gửi yêu cầu cập nhật state (match:update, score:update, layer:toggle, v.v.)
    // Ở bản đơn giản, chúng ta có thể gộp chung thành một event update state tổng quát
    // Nhưng để đáp ứng yêu cầu chi tiết, ta sẽ chia nhỏ các event.

    const handleUpdate = (matchId, partialState) => {
      const updatedState = updateOverlayState(matchId, partialState);
      io.to(matchId).emit('overlay:state', updatedState);
    };

    socket.on('update_state', ({ matchId, updates }) => {
      handleUpdate(matchId, updates);
    });

    socket.on('trigger_event', ({ matchId, eventData }) => {
      let layerName = null;
      if (eventData.type === 'scoreboard_goal') {
        handleUpdate(matchId, { scoreboardEvent: eventData });
        return;
      }
      
      if (eventData.type === 'goal') {
        layerName = 'goalPopup';
        // Lưu bàn thắng vào mảng goals của đội
        const currentState = getOverlayState(matchId);
        if (currentState) {
          const teamKey = eventData.team === 'home' ? 'homeTeam' : 'awayTeam';
          const teamData = currentState[teamKey] || {};
          const currentGoals = teamData.goals || [];
          const currentIncidents = currentState.incidents || [];
          handleUpdate(matchId, {
            [teamKey]: { goals: [...currentGoals, { id: eventData.id, playerName: eventData.playerName, minute: eventData.minute }] },
            incidents: [...currentIncidents, { id: eventData.id, type: 'goal', team: eventData.team, time: eventData.minute, playerName: eventData.playerName }]
          });
        }
      }
      else if (eventData.type === 'undo_goal') {
        const currentState = getOverlayState(matchId);
        if (currentState) {
          const teamKey = eventData.team === 'home' ? 'homeTeam' : 'awayTeam';
          const teamData = currentState[teamKey] || {};
          const currentGoals = teamData.goals || [];
          const currentIncidents = currentState.incidents || [];
          if (currentGoals.length > 0) {
            const lastGoal = currentGoals[currentGoals.length - 1];
            handleUpdate(matchId, {
              [teamKey]: { goals: currentGoals.slice(0, -1) },
              incidents: currentIncidents.filter(inc => inc.id !== lastGoal.id)
            });
          }
        }
        return; // Không hiện popup
      }
      else if (eventData.type === 'delete_goal') {
        const currentState = getOverlayState(matchId);
        if (currentState) {
          const teamKey = eventData.team === 'home' ? 'homeTeam' : 'awayTeam';
          const teamData = currentState[teamKey] || {};
          const currentGoals = teamData.goals || [];
          const currentIncidents = currentState.incidents || [];
          handleUpdate(matchId, {
            [teamKey]: { goals: currentGoals.filter(g => g.id !== eventData.id) },
            incidents: currentIncidents.filter(inc => inc.id !== eventData.id)
          });
        }
        return;
      }
      else if (eventData.type === 'delete_card') {
        const currentState = getOverlayState(matchId);
        if (currentState) {
          const teamKey = eventData.team === 'home' ? 'homeTeam' : 'awayTeam';
          const teamData = currentState[teamKey] || {};
          const currentCards = teamData.cards || [];
          const currentIncidents = currentState.incidents || [];
          handleUpdate(matchId, {
            [teamKey]: { cards: currentCards.filter(c => c.id !== eventData.id) },
            incidents: currentIncidents.filter(inc => inc.id !== eventData.id)
          });
        }
        return;
      }
      else if (eventData.type === 'delete_sub') {
        const currentState = getOverlayState(matchId);
        if (currentState) {
          const teamKey = eventData.team === 'home' ? 'homeTeam' : 'awayTeam';
          const teamData = currentState[teamKey] || {};
          const currentSubs = teamData.subs || [];
          const currentIncidents = currentState.incidents || [];
          handleUpdate(matchId, {
            [teamKey]: { subs: currentSubs.filter(s => s.id !== eventData.id) },
            incidents: currentIncidents.filter(inc => inc.id !== eventData.id)
          });
        }
        return;
      }
      else if (eventData.type === 'toggle_overlay') {
        const currentState = getOverlayState(matchId);
        if (currentState && currentState.layers) {
          const layerKey = eventData.target;
          if (currentState.layers[layerKey]) {
            handleUpdate(matchId, {
              layers: {
                [layerKey]: {
                  visible: !currentState.layers[layerKey].visible
                }
              }
            });
          }
        }
        return;
      }
      else if (eventData.type === 'yellow_card' || eventData.type === 'red_card') {
        layerName = 'cardPopup';
        const currentState = getOverlayState(matchId);
        if (currentState) {
          const teamKey = eventData.team === 'home' ? 'homeTeam' : 'awayTeam';
          const teamData = currentState[teamKey] || {};
          const currentCards = teamData.cards || [];
          const currentIncidents = currentState.incidents || [];
          handleUpdate(matchId, {
            [teamKey]: { cards: [...currentCards, { id: eventData.id, type: eventData.type, playerName: eventData.playerName, minute: eventData.minute }] },
            incidents: [...currentIncidents, { id: eventData.id, type: eventData.type, team: eventData.team, time: eventData.minute, playerName: eventData.playerName }]
          });
        }
      }
      else if (eventData.type === 'sub') {
        layerName = 'substitution';
        const currentState = getOverlayState(matchId);
        if (currentState) {
          const teamKey = eventData.team === 'home' ? 'homeTeam' : 'awayTeam';
          const teamData = currentState[teamKey] || {};
          const currentSubs = teamData.subs || [];
          const currentIncidents = currentState.incidents || [];
          handleUpdate(matchId, {
            [teamKey]: { subs: [...currentSubs, { id: eventData.id, playerOutName: eventData.playerOutName, playerInName: eventData.playerInName, minute: eventData.minute }] },
            incidents: [...currentIncidents, { id: eventData.id, type: 'substitution', team: eventData.team, time: eventData.minute, playerInName: eventData.playerInName, playerOutName: eventData.playerOutName }]
          });
        }
      }
      else if (eventData.type === 'coach') layerName = 'coachPopup';
      else if (eventData.type === 'media_logo') layerName = 'mediaLogo';
      else if (eventData.type === 'lineup') layerName = 'lineup';

      if (layerName) {
        handleUpdate(matchId, { layers: { [layerName]: { visible: true, data: eventData } } });

        
        // Lưu HLV vào lineups
        if (eventData.type === 'coach') {
          const currentState = getOverlayState(matchId);
          if (currentState) {
            // Dùng JSON parse/stringify để clone object tránh lỗi tham chiếu
            const currentLineups = JSON.parse(JSON.stringify(currentState.lineups || currentState.dbData?.lineups || {}));
            const teamKey = eventData.teamType === 'home' ? 'home' : 'away';
            
            if (!currentLineups[teamKey]) currentLineups[teamKey] = {};
            currentLineups[teamKey].coach = {
              ...(currentLineups[teamKey].coach || {}),
              name: eventData.coachName
            };
            
            handleUpdate(matchId, { lineups: currentLineups });
          }
        }
        
        // Lưu Lineup tổng thể vào lineups
        if (eventData.type === 'lineup') {
          const currentState = getOverlayState(matchId);
          if (currentState) {
            const currentLineups = JSON.parse(JSON.stringify(currentState.lineups || currentState.dbData?.lineups || {}));
            const teamKey = eventData.teamType === 'home' ? 'home' : 'away';
            
            if (!currentLineups[teamKey]) currentLineups[teamKey] = {};
            
            const mapPlayer = (p, isSub) => ({
                player: { name: p.name, id: p.id, photo: p.avatar, avatar: p.avatar, shortName: p.name },
                jerseyNumber: p.jerseyNumber || '',
                substitute: isSub
            });
            
            const starting = (eventData.startingXI || []).map(p => mapPlayer(p, false));
            const subs = (eventData.substitutes || []).map(p => mapPlayer(p, true));
            
            currentLineups[teamKey].players = [...starting, ...subs];
            if (eventData.coach) {
                currentLineups[teamKey].coach = { name: eventData.coach };
            }
            
            handleUpdate(matchId, { lineups: currentLineups });
          }
        }
        
        // Ngoại trừ logo đài phát (mediaLogo) và đội hình (lineup), các hiệu ứng khác sẽ tự động tắt
        if (layerName !== 'mediaLogo' && layerName !== 'lineup') {
          // Các hiệu ứng khác hiện 8 giây
          const displayDuration = 8000;
          setTimeout(() => {
            handleUpdate(matchId, { layers: { [layerName]: { visible: false, data: null } } });
          }, displayDuration);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = setupSockets;
