# vMix Overlay System

Hệ thống cung cấp overlay bóng đá chuyên nghiệp để nhúng vào vMix thông qua trình duyệt (Browser Input).

## Cấu trúc
- `server`: Node.js + Express + Socket.IO (Lưu trạng thái in-memory, có API REST và Socket).
- `client`: React + Vite + Tailwind CSS + Ant Design.

## 1. Hướng dẫn chạy Server
Mở terminal 1:
```bash
cd vmix-overlay-system/server
npm install
npm start
```
Server sẽ chạy ở cổng `http://localhost:5000`.

## 2. Hướng dẫn chạy Client
Mở terminal 2:
```bash
cd vmix-overlay-system/client
npm install
npm run dev
```
Client (Vite) sẽ chạy ở cổng `http://localhost:5173`.

## 3. URL Bảng điều khiển (Admin)
Mở trình duyệt: `http://localhost:5173/admin`
Tại đây bạn có thể tăng giảm tỉ số, đổi tên giải đấu, bật/tắt các layer overlay.

## 4. URL Overlay cho vMix
Trong vMix, thêm một Input mới dạng **Web Browser**:
- **URL**: `http://localhost:5173/overlay/live/match_001`
- **Width**: 1920
- **Height**: 1080
- Đánh dấu tick vào các tuỳ chọn nếu cần thiết để đảm bảo độ mượt mà.

## 5. Cách test bật/tắt layer
- Trải hai cửa sổ màn hình: Một bên là `http://localhost:5173/admin`, một bên là `http://localhost:5173/overlay/live/match_001`.
- Thử bấm nút "+" điểm hoặc bật "scoreboardTop" trong tab Layer Controls. Màn hình overlay sẽ ngay lập tức hiện ra mượt mà với animation.

## 6. Hướng dẫn Deploy lên VPS/EC2
1. Clone mã nguồn lên server.
2. Cài đặt Node.js và PM2 (`npm install -g pm2`).
3. Chạy backend bằng PM2: 
   ```bash
   cd server
   npm install
   pm2 start src/index.js --name "vmix-server"
   ```
4. Build frontend:
   ```bash
   cd client
   npm install
   npm run build
   ```
5. Cấu hình Nginx để phục vụ thư mục `client/dist` (cổng 80) và reverse proxy cổng `5000` (đường dẫn `/api` và `/socket.io`).
6. Cập nhật `VITE_SERVER_URL` trong `.env` của client thành domain hoặc IP của máy chủ trước khi build.
