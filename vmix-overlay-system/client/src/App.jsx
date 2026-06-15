import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ControlPage from './pages/ControlPage';
import LiveOverlayPage from './pages/LiveOverlayPage';

import HomePage from './pages/HomePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/control/:matchId" element={<ControlPage />} />
        <Route path="/overlay/live/:matchId" element={<LiveOverlayPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
