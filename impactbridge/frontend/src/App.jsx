import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import NgoOnboard from './pages/NgoOnboard';
import CorporateDashboard from './pages/CorporateDashboard';
import HeatMap from './pages/HeatMap';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/ngo/onboard" element={<ProtectedRoute allowedRoles={['ngo']}><NgoOnboard /></ProtectedRoute>} />
            <Route path="/corporate" element={<ProtectedRoute allowedRoles={['corporate']}><CorporateDashboard /></ProtectedRoute>} />
            <Route path="/heatmap" element={<HeatMap />} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
