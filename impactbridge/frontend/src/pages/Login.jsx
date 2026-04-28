import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [error, setError] = useState('');

  const roles = [
    { id: 'ngo', label: 'NGO', desc: 'Register your organisation, generate AI proposals, get matched with corporates.', color: '#f59e0b', orgLabel: 'NGO / Trust Name' },
    { id: 'corporate', label: 'Corporate', desc: 'Upload CSR policy, discover matched NGOs, fund projects with compliance reports.', color: '#3b82f6', orgLabel: 'Company Name' },
    { id: 'admin', label: 'Admin', desc: 'View platform analytics, manage verifications, monitor impact data.', color: '#ec4899', orgLabel: 'Organisation' },
  ];

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !org.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    login(selectedRole, name.trim(), org.trim());
    if (selectedRole === 'ngo') navigate('/ngo/onboard');
    if (selectedRole === 'corporate') navigate('/corporate');
    if (selectedRole === 'admin') navigate('/admin');
  }

  const sel = roles.find(r => r.id === selectedRole);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '3rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 900 }}>Welcome to ImpactBridge</h1>
      <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '2.5rem', color: '#6b7280' }}>Select your role to get started</p>

      {/* Role Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', width: '100%', maxWidth: '800px', marginBottom: '2rem' }}>
        {roles.map(r => (
          <div key={r.id} onClick={() => { setSelectedRole(r.id); setError(''); }}
            style={{
              padding: '1.5rem', borderRadius: 12, cursor: 'pointer',
              border: selectedRole === r.id ? `3px solid ${r.color}` : '3px solid #e5e7eb',
              background: selectedRole === r.id ? r.color + '12' : '#fff',
              boxShadow: selectedRole === r.id ? `4px 4px 0px ${r.color}` : '2px 2px 0px #e5e7eb',
              transition: 'all 0.2s ease',
              transform: selectedRole === r.id ? 'translateY(-2px)' : 'none',
            }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 6, color: selectedRole === r.id ? r.color : '#1e293b' }}>
              {r.label}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>{r.desc}</div>
          </div>
        ))}
      </div>

      {/* Login Form — appears after role selection */}
      {selectedRole && (
        <form onSubmit={handleSubmit} style={{
          width: '100%', maxWidth: '450px', background: '#fff',
          border: '3px solid #000', borderRadius: 12, padding: '2rem',
          boxShadow: '6px 6px 0px #000',
        }}>
          <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.2rem' }}>
            Sign in as {sel.label}
          </h3>

          {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 700, marginBottom: 4, display: 'block' }}>Your Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Viraj Sharma"
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '1rem' }} />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, marginBottom: 4, display: 'block' }}>{sel.orgLabel}</label>
            <input value={org} onChange={e => setOrg(e.target.value)}
              placeholder={selectedRole === 'ngo' ? 'e.g. Pratham Education Foundation' : selectedRole === 'corporate' ? 'e.g. Tata Consultancy Services' : 'e.g. NITI Aayog'}
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '1rem' }} />
          </div>

          <button type="submit" className="btn btn-primary" style={{
            width: '100%', padding: '12px', fontSize: '1.1rem', fontWeight: 800,
            background: sel.color, borderColor: '#000',
          }}>
            Continue as {sel.label} →
          </button>
        </form>
      )}
    </div>
  );
}
