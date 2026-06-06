const { getOverlayState, updateOverlayState } = require('../state/overlayStore');

const setupSockets = (io) => {
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

    socket.on('match:update', ({ matchId, matchData }) => {
      handleUpdate(matchId, { match: matchData });
    });

    socket.on('layer:toggle', ({ matchId, layerName, visible }) => {
      handleUpdate(matchId, { layers: { [layerName]: { visible } } });
    });

    socket.on('layer:show-temporary', ({ matchId, layerName, duration = 8000, data = null }) => {
      // Bật layer kèm data (ví dụ goalPopup có thông tin cầu thủ)
      handleUpdate(matchId, { layers: { [layerName]: { visible: true, data } } });

      // Cài giờ tắt
      setTimeout(() => {
        handleUpdate(matchId, { layers: { [layerName]: { visible: false, data: null } } });
      }, duration);
    });

    socket.on('timer:start', ({ matchId }) => {
        // Logic đếm giờ có thể phức tạp nếu tick ở server.
        // Tạm thời chỉ phát event timer:start để các client bắt đầu chạy đồng hồ tự động.
        io.to(matchId).emit('timer:tick', { action: 'start' });
    });

    socket.on('timer:pause', ({ matchId }) => {
        io.to(matchId).emit('timer:tick', { action: 'pause' });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = setupSockets;
