import { useState, useEffect } from 'react';
import { getStats } from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats().then(res => {
      setStats(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Admin Analytics...</div>;
  if (!stats) return <div style={{ padding: '3rem', textAlign: 'center' }}>Failed to load stats.</div>;

  return (
    <div className="page-container">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e40af', marginBottom: '1.5rem' }}>Platform Analytics Overview</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: 600 }}>Total NGOs</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.ngoCount}</div>
        </div>
        <div className="card" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
          <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 600 }}>Registered Corporates</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.corporateCount}</div>
        </div>
        <div className="card" style={{ background: '#fce7f3', border: '1px solid #fbcfe8' }}>
          <div style={{ fontSize: '0.85rem', color: '#9d174d', fontWeight: 600 }}>Matches Generated</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.matchCount}</div>
        </div>
        <div className="card" style={{ background: '#dcfce7', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>Projects Funded</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.fundedCount}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Impact Metrics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Total Beneficiaries Covered</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{stats.totalBeneficiaries.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Aspirational Districts Targeted</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{stats.aspirationalDistrictsServed}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
