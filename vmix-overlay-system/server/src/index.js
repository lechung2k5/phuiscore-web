const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const matchRoutes = require('./routes/matchRoutes');
const setupSockets = require('./sockets/overlaySocket');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // Trong thực tế nên giới hạn domain hợp lệ
    methods: ['GET', 'POST', 'PUT']
  }
});

// Pass io to Express app to use it in routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/matches', matchRoutes);

// Cấu hình Socket.IO
setupSockets(io);

// Lắng nghe cổng
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`vMix Overlay Server đang chạy tại cổng ${PORT}`);
});
