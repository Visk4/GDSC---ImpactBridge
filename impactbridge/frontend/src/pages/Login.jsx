import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PixelCard from '../components/PixelCard';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role) => {
    login(role);
    if (role === 'ngo') navigate('/ngo/onboard');
    if (role === 'corporate') navigate('/corporate');
    if (role === 'admin') navigate('/admin');
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Select Profile</h1>
      <p style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '3rem' }}>Demo environment: Choose a role to access the platform.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', width: '100%', maxWidth: '900px' }}>
        <div style={{ cursor: 'pointer' }} onClick={() => handleLogin('ngo')}>
          <PixelCard variant="yellow">
            <div className="pixel-card-content">
              <h2>NGO Portal</h2>
              <p>Generate proposals & track verification.</p>
            </div>
          </PixelCard>
        </div>
        
        <div style={{ cursor: 'pointer' }} onClick={() => handleLogin('corporate')}>
          <PixelCard variant="blue">
            <div className="pixel-card-content">
              <h2>Corporate</h2>
              <p>Match mandates & fund grassroots projects.</p>
            </div>
          </PixelCard>
        </div>

        <div style={{ cursor: 'pointer' }} onClick={() => handleLogin('admin')}>
          <PixelCard variant="pink">
            <div className="pixel-card-content">
              <h2>Admin</h2>
              <p>View platform analytics and map.</p>
            </div>
          </PixelCard>
        </div>
      </div>
    </div>
  );
}
