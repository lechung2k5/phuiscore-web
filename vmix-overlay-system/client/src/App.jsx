import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import LiveOverlayPage from './pages/LiveOverlayPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/overlay/live/:matchId" element={<LiveOverlayPage />} />
        {/* Mặc định chuyển hướng tới admin của trận demo */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
