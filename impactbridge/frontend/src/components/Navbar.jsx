import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, userName, logout } = useAuth();
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
        {(!role) && <Link to="/login" className={`nav-link ${isActive('/login')}`}>Get Started</Link>}
        {role && <Link to={role === 'ngo' ? '/ngo/onboard' : role === 'corporate' ? '/corporate' : '/admin'} className="nav-link">Dashboard</Link>}
        <Link to="/heatmap" className={`nav-link ${isActive('/heatmap')}`}>Impact Map</Link>
        
        {role && (
          <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem', marginLeft: '1rem' }}>
            Logout ({userName || role})
          </button>
        )}
      </div>
    </nav>
  );
}
