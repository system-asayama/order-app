import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import MatchList from './pages/MatchList';
import MyBets from './pages/MyBets';
import Ranking from './pages/Ranking';
import AdminDashboard from './pages/AdminDashboard';
import AdminMatches from './pages/AdminMatches';
import AdminSports from './pages/AdminSports';
import AdminBets from './pages/AdminBets';
import AdminUsers from './pages/AdminUsers';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* User routes */}
      <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/matches" element={<ProtectedRoute><MatchList /></ProtectedRoute>} />
      <Route path="/my-bets" element={<ProtectedRoute><MyBets /></ProtectedRoute>} />
      <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/matches" element={<ProtectedRoute requireAdmin><AdminMatches /></ProtectedRoute>} />
      <Route path="/admin/sports" element={<ProtectedRoute requireAdmin><AdminSports /></ProtectedRoute>} />
      <Route path="/admin/bets" element={<ProtectedRoute requireAdmin><AdminBets /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
