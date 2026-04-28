import { useState } from 'react';
import { verifyNgo, verifyCorporate, quickCheckCIN, quickCheckDarpan } from '../services/api';

// ── NGO Verification Panel ──────────────────────────────────
export function NgoVerificationPanel({ ngoId, onVerified }) {
  const [form, setForm] = useState({
    registrationNumber: '',
    panNumber: '',
    ngoDarpanId: ''
  });
  const [cinCheck, setCinCheck] = useState(null);
  const [darpanCheck, setDarpanCheck] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDarpanBlur() {
    if (form.ngoDarpanId.length >= 8) {
      try {
        const r = await quickCheckDarpan(form.ngoDarpanId);
        setDarpanCheck(r.data);
      } catch {}
    }
  }

  async function handleVerify() {
    setLoading(true);
    setError('');
    try {
      const r = await verifyNgo(ngoId, form);
      setResult(r.data);
      if (onVerified) onVerified(r.data);
    } catch (e) {
      setError(e?.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="verification-result">
        <StatusBanner status={result.status} score={result.verificationScore} />
        <div className="verification-notes">{result.notes}</div>
        <div className="badges-row" style={{ marginTop: 12 }}>
          {result.badges?.map((b, i) => (
            <VerificationBadge key={i} badge={b} />
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: '0.85rem', color: '#6b7280' }}>
          Credibility Score updated to: <strong>{result.credibilityScore}/100</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-panel">
      <h3 className="verification-title">
        🏛️ Verify Your NGO
      </h3>
      <p className="verification-subtitle">
        Verified NGOs get a trust badge visible to corporates and rank higher in matches.
        We cross-check with NGO Darpan, PAN database, and Schedule VII eligibility.
      </p>

      {error && (
        <div className="verification-error">{error}</div>
      )}

      <div className="form-group">
        <label>12A / 80G Registration Number</label>
        <input
          value={form.registrationNumber}
          onChange={e => setForm({ ...form, registrationNumber: e.target.value })}
          placeholder="e.g. DIT(E)/2010-11/MUM/380"
        />
        <span className="field-hint">
          Issued by Income Tax Department. Enables 80G tax deduction for donors.
        </span>
      </div>

      <div className="form-group">
        <label>PAN Number</label>
        <input
          value={form.panNumber}
          onChange={e => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
          placeholder="e.g. AAATI1234A"
          maxLength={10}
        />
        <span className="field-hint">
          NGO PAN typically starts with AAAT (Trust) or AAAA (Association).
        </span>
      </div>

      <div className="form-group">
        <label>NGO Darpan Unique ID</label>
        <input
          value={form.ngoDarpanId}
          onChange={e => setForm({ ...form, ngoDarpanId: e.target.value.toUpperCase() })}
          onBlur={handleDarpanBlur}
          placeholder="e.g. MH/2019/0123456"
        />
        {darpanCheck && (
          <span className={`field-hint ${darpanCheck.valid ? 'hint-success' : 'hint-error'}`}>
            {darpanCheck.message}
          </span>
        )}
        <span className="field-hint">
          Find your Darpan ID at ngodarpan.gov.in
        </span>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleVerify}
        disabled={loading || (!form.registrationNumber && !form.panNumber && !form.ngoDarpanId)}
        style={{ width: '100%', marginTop: 8 }}
      >
        {loading ? '🔍 Verifying...' : '✅ Verify My NGO'}
      </button>

      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
        We verify against NGO Darpan (Government of India) and Income Tax PAN database.
        Verification is free and takes under 30 seconds.
      </p>
    </div>
  );
}

// ── Corporate Verification Panel ────────────────────────────
export function CorporateVerificationPanel({ corporateId, onVerified }) {
  const [form, setForm] = useState({ cinNumber: '', gstin: '' });
  const [cinCheck, setCinCheck] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCINBlur() {
    if (form.cinNumber.length >= 18) {
      try {
        const r = await quickCheckCIN(form.cinNumber);
        setCinCheck(r.data);
      } catch {}
    }
  }

  async function handleVerify() {
    setLoading(true);
    setError('');
    try {
      const r = await verifyCorporate(corporateId, form);
      setResult(r.data);
      if (onVerified) onVerified(r.data);
    } catch (e) {
      setError(e?.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="verification-result">
        <StatusBanner status={result.status} score={result.verificationScore} />
        <div className="verification-notes">{result.notes}</div>
        <div className="badges-row" style={{ marginTop: 12 }}>
          {result.badges?.map((b, i) => (
            <VerificationBadge key={i} badge={b} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="verification-panel">
      <h3 className="verification-title">
        🏢 Verify Your Company
      </h3>
      <p className="verification-subtitle">
        Verified corporates get priority access to top-rated NGOs and build trust
        in the ecosystem. We validate against MCA21 and GST databases.
      </p>

      {error && (
        <div className="verification-error">{error}</div>
      )}

      <div className="form-group">
        <label>CIN Number (Corporate Identity Number)</label>
        <input
          value={form.cinNumber}
          onChange={e => setForm({ ...form, cinNumber: e.target.value.toUpperCase() })}
          onBlur={handleCINBlur}
          placeholder="e.g. L17110MH1973PLC019786"
          maxLength={21}
        />
        {cinCheck && (
          <div className={`cin-check-result ${cinCheck.valid ? 'success' : 'error'}`}>
            <span>{cinCheck.message}</span>
            {cinCheck.valid && (
              <div className="cin-details">
                <span>📅 Incorporated: {cinCheck.yearOfIncorporation}</span>
                <span>📍 State: {cinCheck.stateCode}</span>
                <span>🏛️ {cinCheck.listingStatus}</span>
                <span>📋 Type: {cinCheck.companyType}</span>
              </div>
            )}
          </div>
        )}
        <span className="field-hint">
          Find your CIN on MCA21 portal (mca.gov.in) or your incorporation certificate.
        </span>
      </div>

      <div className="form-group">
        <label>GSTIN (optional but recommended)</label>
        <input
          value={form.gstin}
          onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
          placeholder="e.g. 27AAPFU0939F1ZV"
          maxLength={15}
        />
        <span className="field-hint">
          Providing GSTIN alongside CIN increases verification score significantly.
        </span>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleVerify}
        disabled={loading || !form.cinNumber}
        style={{ width: '100%', marginTop: 8 }}
      >
        {loading ? '🔍 Verifying with MCA21...' : '✅ Verify Company'}
      </button>

      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
        CIN validation uses Ministry of Corporate Affairs format standards.
        GSTIN cross-validation via GST pattern verification.
      </p>
    </div>
  );
}

// ── Shared Components ────────────────────────────────────────
function StatusBanner({ status, score }) {
  const config = {
    VERIFIED: { bg: '#d1fae5', color: '#065f46', icon: '✅', text: 'Verified' },
    PENDING: { bg: '#fef3c7', color: '#92400e', icon: '⏳', text: 'Pending Review' },
    UNVERIFIED: { bg: '#fee2e2', color: '#991b1b', icon: '⚠️', text: 'Unverified' }
  };
  const c = config[status] || config.UNVERIFIED;

  return (
    <div style={{
      background: c.bg, color: c.color,
      padding: '12px 16px', borderRadius: 8,
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 12,
      border: '3px solid #000',
      boxShadow: '4px 4px 0px #000'
    }}>
      <span style={{ fontWeight: 800, fontSize: '1rem' }}>
        {c.icon} {c.text}
      </span>
      <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
        Verification Score: {score}/100
      </span>
    </div>
  );
}

function VerificationBadge({ badge }) {
  const colors = {
    verified: { bg: 'var(--success)', color: '#000' },
    pending: { bg: 'var(--warning)', color: '#000' },
    unverified: { bg: 'var(--danger)', color: '#fff' },
    reg: { bg: 'var(--primary)', color: '#000' },
    pan: { bg: 'var(--primary)', color: '#000' },
    darpan: { bg: 'var(--accent)', color: '#000' },
    cin: { bg: 'var(--primary)', color: '#000' },
    gst: { bg: 'var(--success)', color: '#000' }
  };
  const c = colors[badge.type] || colors.pending;

  return (
    <span title={badge.description} className="badge" style={{
      background: c.bg, color: c.color,
      padding: '4px 10px',
      fontSize: '0.78rem', fontWeight: 800,
      cursor: 'help'
    }}>
      {badge.label}
    </span>
  );
}
