import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, logout } = useAuth();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar" id="main-navbar">
      <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
        <span className="logo-icon">🌉</span>
        ImpactBridge
      </Link>
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
        {(!role) && <Link to="/login" className={`nav-link ${isActive('/login')}`}>Login</Link>}
        {role === 'ngo' && <Link to="/ngo/onboard" className={`nav-link ${isActive('/ngo/onboard')}`}>NGO Onboarding</Link>}
        {role === 'corporate' && <Link to="/corporate" className={`nav-link ${isActive('/corporate')}`}>Corporate Dashboard</Link>}
        {role === 'admin' && <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>Admin Analytics</Link>}
        <Link to="/heatmap" className={`nav-link ${isActive('/heatmap')}`}>Impact Map</Link>
        
        {role && (
          <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem', marginLeft: '1rem' }}>
            Logout ({role})
          </button>
        )}
      </div>
    </nav>
  );
}
