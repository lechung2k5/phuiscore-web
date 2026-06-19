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

// Phục vụ các file tĩnh trong thư mục uploads (nằm cùng cấp với file .exe)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Phục vụ giao diện tĩnh (sau khi build sẽ copy vào thư mục public của server để đóng gói)
app.use(express.static(path.join(__dirname, '../public')));

// Fallback route cho React Router
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Cấu hình Socket.IO
setupSockets(io);

// Lắng nghe cổng
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`vMix Overlay Server đang chạy tại cổng ${PORT}`);
  
  // Tự động mở trình duyệt mặc định trên Windows
  const { exec } = require('child_process');
  // Dùng explorer thay vì start để tránh lỗi shell build-in khi bị đóng gói thành .exe
  exec(`explorer "http://localhost:${PORT}"`);
});
