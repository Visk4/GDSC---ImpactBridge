import { useState, useEffect } from 'react';
import { submitNgo, publishNgo, translateToEnglish } from '../services/api';
import { NgoVerificationPanel } from '../components/VerificationPanel';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh',
  'Chandigarh','Puducherry'
];

const THEMES = [
  { value: 'EDUCATION', label: 'Education' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'ENVIRONMENT', label: 'Environment' },
  { value: 'LIVELIHOOD', label: 'Livelihood' },
  { value: 'WOMEN_EMPOWERMENT', label: 'Women Empowerment' },
  { value: 'RURAL_DEVELOPMENT', label: 'Rural Development' },
  { value: 'DISABILITY', label: 'Disability' },
  { value: 'HUNGER', label: 'Hunger' },
];

const REG_TYPES = [
  { value: 'TRUST', label: 'Trust' },
  { value: 'SOCIETY', label: 'Society' },
  { value: 'SECTION8', label: 'Section 8 Company' },
  { value: 'FCRA', label: 'FCRA Registered' },
];

const LOADING_MESSAGES = [
  'Reading your description...',
  'Identifying Schedule VII category...',
  'Calculating impact density...',
  'Generating corporate-ready proposal...',
  'Almost ready...',
];

function formatIndianCurrency(num) {
  if (num == null) return '₹0';
  const n = Number(num);
  const str = n.toFixed(0);
  let lastThree = str.substring(str.length - 3);
  const rest = str.substring(0, str.length - 3);
  if (rest !== '') lastThree = ',' + lastThree;
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return '₹' + formatted;
}

export default function NgoOnboard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', registrationType: 'TRUST', state: 'Maharashtra', district: '',
    theme: 'EDUCATION', description: '', yearsActive: 3, annualBeneficiaries: 200,
  });
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [detectedLang, setDetectedLang] = useState('');
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [proposal, setProposal] = useState(null);
  const [error, setError] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsg(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(''); setStep(2); setLoadingMsg(0);

    try {
      const res = await submitNgo(form);
      setProposal(res.data);
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to generate proposal. Please check the backend is running.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    if (!proposal?.id) return;
    setPublishing(true);
    try {
      await publishNgo(proposal.id);
      setIsPublished(true);
      alert('Success! Your NGO is now live and visible to corporate matching algorithms.');
    } catch (err) {
      alert('Failed to publish. Please try again.');
    } finally {
      setPublishing(false);
    }
  }

  const p = proposal?.generatedProposal || {};

  return (
    <div className="page-container">
      {/* Wizard Steps Indicator */}
      <div className="wizard-steps">
        {[{ n: 1, t: 'NGO Details' }, { n: 2, t: 'AI Generation' }, { n: 3, t: 'Your Proposal' }].map(s => (
          <div key={s.n} className={`wizard-step ${step === s.n ? 'active' : step > s.n ? 'completed' : ''}`}>
            <span className="wizard-step-number">{step > s.n ? '✓' : s.n}</span> {s.t}
          </div>
        ))}
      </div>

      {/* STEP 2: Loading Overlay */}
      {step === 2 && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <div className="loading-text">{LOADING_MESSAGES[loadingMsg]}</div>
        </div>
      )}

      {/* STEP 1: Form */}
      {step === 1 && (
        <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e40af', marginBottom: '0.5rem' }}>
            NGO Onboarding
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Describe your work in plain language. Our AI will generate a corporate-ready funding proposal.
          </p>

          {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: 8, marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="ngo-name">NGO Name</label>
                <input id="ngo-name" value={form.name} onChange={e => update('name', e.target.value)} required placeholder="e.g. Shiksha Setu Foundation" />
              </div>
              <div className="form-group">
                <label htmlFor="reg-type">Registration Type</label>
                <select id="reg-type" value={form.registrationType} onChange={e => update('registrationType', e.target.value)}>
                  {REG_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="state">State</label>
                <select id="state" value={form.state} onChange={e => update('state', e.target.value)}>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="district">District</label>
                <input id="district" value={form.district} onChange={e => update('district', e.target.value)} placeholder="e.g. Nandurbar" />
              </div>
              <div className="form-group">
                <label htmlFor="theme">Focus Theme</label>
                <select id="theme" value={form.theme} onChange={e => update('theme', e.target.value)}>
                  {THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="years">Years Active</label>
                <input id="years" type="number" min="1" value={form.yearsActive} onChange={e => update('yearsActive', parseInt(e.target.value) || 1)} required />
              </div>
              <div className="form-group">
                <label htmlFor="beneficiaries">Annual Beneficiaries</label>
                <input id="beneficiaries" type="number" min="1" value={form.annualBeneficiaries} onChange={e => update('annualBeneficiaries', parseInt(e.target.value) || 1)} required />
              </div>
              <div className="form-group full-width">
                <label htmlFor="description">Description</label>
                <textarea id="description" rows="5" value={form.description} onChange={e => update('description', e.target.value)} required
                  placeholder="Describe your work in plain language — what you do, where, who you help, and what funding you need. You can type in Hindi, Tamil, or any regional language." />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: 8 }}>
                  <button type="button" className="btn btn-secondary" disabled={translating || !form.description.trim()}
                    onClick={async () => {
                      setTranslating(true);
                      try {
                        const res = await translateToEnglish(form.description);
                        const data = res.data;
                        if (data.translatedText) {
                          update('description', data.translatedText);
                          setDetectedLang(data.detectedLanguage || '');
                        }
                      } catch (e) { console.error('Translation failed', e); }
                      setTranslating(false);
                    }}
                    style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
                    {translating ? 'Translating...' : '🌐 Translate to English'}
                  </button>
                  {detectedLang && <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 700 }}>Detected: {detectedLang.toUpperCase()}</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                  Regional Languages Supported — Hindi, Tamil, Bengali, Marathi, Telugu, and more. Google Cloud Translation API auto-detects and translates.
                </div>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" type="submit" style={{ width: '100%', marginTop: '1rem' }} id="generate-btn">
              ✨ Generate My Proposal
            </button>
          </form>
        </div>
      )}

      {/* STEP 3: Proposal Reveal */}
      {step === 3 && proposal && (
        <div className="proposal-card">
          <div className="reveal-field" style={{ animationDelay: '0.1s' }}>
            <div className="project-title">{p.projectTitle || 'Generated Proposal'}</div>
          </div>

          <div className="reveal-field field-section" style={{ animationDelay: '0.3s' }}>
            <div className="field-label">Problem Statement</div>
            <div className="field-value">{p.problemStatement}</div>
          </div>

          <div className="reveal-field field-section" style={{ animationDelay: '0.5s' }}>
            <div className="field-label">Proposed Solution</div>
            <div className="field-value">{p.proposedSolution}</div>
          </div>

          <div className="reveal-field metrics-row" style={{ animationDelay: '0.7s' }}>
            <div className="metric-card">
              <div className="metric-value">{(p.targetBeneficiaries || proposal.annualBeneficiaries || 0).toLocaleString('en-IN')}</div>
              <div className="metric-label">Target Beneficiaries</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{formatIndianCurrency(p.budgetRequired)}</div>
              <div className="metric-label">Budget Required</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{p.implementationTimeline || '12 months'}</div>
              <div className="metric-label">Timeline</div>
            </div>
          </div>

          {p.budgetBreakdown && (
            <div className="reveal-field field-section budget-chart" style={{ animationDelay: '0.9s' }}>
              <div className="field-label">Budget Breakdown</div>
              {Object.entries(p.budgetBreakdown).map(([key, val]) => {
                const total = Object.values(p.budgetBreakdown).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
                return (
                  <div className="budget-bar-row" key={key}>
                    <div className="budget-bar-label">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                    <div className="budget-bar-track">
                      <div className={`budget-bar-fill ${key}`} style={{ width: pct + '%' }}></div>
                    </div>
                    <div className="budget-bar-amount">{formatIndianCurrency(val)} ({pct}%)</div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="reveal-field field-section" style={{ animationDelay: '1.1s' }}>
            <div className="field-label">SDG Alignment</div>
            <div className="badges-row">
              {(p.sdgTags || proposal.sdgTags || []).map(tag => (
                <span className="badge badge-blue" key={tag}>{tag}</span>
              ))}
            </div>
          </div>

          <div className="reveal-field field-section" style={{ animationDelay: '1.3s' }}>
            <div className="field-label">Schedule VII Category</div>
            <div className="badges-row">
              <span className="badge badge-green">{p.scheduleVIIClause || ''}</span>
              <span className="badge badge-green">{p.scheduleVIICategory || proposal.scheduleViiCategory || ''}</span>
            </div>
          </div>

          <div className="reveal-field field-section" style={{ animationDelay: '1.5s' }}>
            <div className="field-label">Credibility Score</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="credibility-score-text">{p.credibilityScore || proposal.credibilityScore || 0}</span>
              <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>/ 100</span>
            </div>
            <div className="credibility-bar-container">
              <div className="credibility-bar-bg">
                <div className="credibility-bar-fill" style={{ width: (p.credibilityScore || proposal.credibilityScore || 0) + '%' }}></div>
              </div>
            </div>
            {p.credibilityFactors && (
              <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#6b7280' }}>
                {p.credibilityFactors.join(' • ')}
              </div>
            )}
          </div>

          <div className="reveal-field field-section" style={{ animationDelay: '1.7s' }}>
            <div className="field-label">Expected Outcomes</div>
            <ul className="outcomes-list">
              {(p.expectedOutcomes || []).map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          </div>

          <div className="reveal-field" style={{ animationDelay: '1.9s' }}>
            <div className="compliance-note">
              ✅ {p.complianceNote || 'CSR expenditure qualifies under Section 135 of the Companies Act 2013.'}
            </div>
          </div>

          <div className="reveal-field" style={{ animationDelay: '2.1s', display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button 
              className={`btn ${isPublished ? 'btn-outline' : 'btn-primary'}`}
              onClick={handlePublish} 
              disabled={publishing || isPublished}
              id="submit-platform-btn"
            >
              {isPublished ? '✅ Published to Platform' : publishing ? '⏳ Publishing...' : '✅ Submit to Platform'}
            </button>
            <button className="btn btn-outline" onClick={() => { setStep(1); setProposal(null); setIsPublished(false); }} id="regenerate-btn">
              🔄 Start Over
            </button>
          </div>
          
          <div className="reveal-field" style={{ animationDelay: '2.3s', marginTop: '2rem' }}>
            {proposal?.id && (
              <NgoVerificationPanel
                ngoId={proposal.id}
                onVerified={(result) => console.log('NGO verified:', result)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
