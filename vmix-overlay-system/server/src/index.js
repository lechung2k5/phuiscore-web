require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const matchRoutes = require('./routes/matchRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const vmixRoutes = require('./routes/vmixRoutes');
const setupSockets = require('./sockets/overlaySocket');
const path = require('path');

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
app.use('/api/upload', uploadRoutes);
app.use('/api/vmix', vmixRoutes);

// Phục vụ các file tĩnh trong thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Cấu hình Socket.IO
setupSockets(io);

// Lắng nghe cổng
const PORT = process.env.PORT || 5500;
server.listen(PORT, () => {
  console.log(`vMix Overlay Server đang chạy tại cổng ${PORT}`);
});
