import { useState, useEffect } from 'react';
import { getAllCorporates, getAllNgos, submitCorporate, getMatches, expressInterest, markAsFunded, downloadReport } from '../services/api';
import { CorporateVerificationPanel } from '../components/VerificationPanel';

const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu and Kashmir'];
const THEMES = [{v:'EDUCATION',l:'Education'},{v:'HEALTH',l:'Health'},{v:'ENVIRONMENT',l:'Environment'},{v:'LIVELIHOOD',l:'Livelihood'},{v:'WOMEN_EMPOWERMENT',l:'Women Empowerment'},{v:'RURAL_DEVELOPMENT',l:'Rural Development'},{v:'DISABILITY',l:'Disability'},{v:'HUNGER',l:'Hunger'}];
const SECTORS = ['IT','Automotive','Pharma','FMCG','Banking','Energy','Telecom','Manufacturing','Real Estate','Other'];

function fmtINR(n) {
  if (n==null) return '₹0';
  const s=Number(n).toFixed(0);
  let l3=s.substring(s.length-3);
  const r=s.substring(0,s.length-3);
  if(r!=='') l3=','+l3;
  return '₹'+r.replace(/\B(?=(\d{2})+(?!\d))/g,',')+l3;
}

function ScoreCircle({ score }) {
  const cls = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
  return <div className={`score-circle ${cls}`}>{score}</div>;
}

function ScoreBar({ label, value, max }) {
  return (
    <div className="score-bar-row">
      <div className="score-bar-label">{label}</div>
      <div className="score-bar-track"><div className="score-bar-fill" style={{ width: `${(value/max)*100}%` }}></div></div>
      <div className="score-bar-value">{value}/{max}</div>
    </div>
  );
}

export default function CorporateDashboard() {
  const [corporates, setCorporates] = useState([]);
  const [selectedCorp, setSelectedCorp] = useState(null);
  const [matches, setMatches] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingNgos, setLoadingNgos] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name:'', sector:'IT', csrBudget:2500000, focusTheme:'EDUCATION', preferredState:'Maharashtra' });
  const [filterTheme, setFilterTheme] = useState('');
  const [filterState, setFilterState] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('score');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCorporates();
    loadNgos();
  }, []);

  async function loadCorporates() {
    try { const r = await getAllCorporates(); setCorporates(r.data); } catch {}
  }

  async function loadNgos() {
    setLoadingNgos(true);
    try {
      const r = await getAllNgos();
      setNgos(r.data || []);
    } catch {
      setNgos([]);
    } finally {
      setLoadingNgos(false);
    }
  }

  async function handleSelectCorporate(corp) {
    setSelectedCorp(corp); setLoadingMatches(true); setError('');
    try { const r = await getMatches(corp.id); setMatches(r.data); }
    catch { setError('Failed to load matches'); }
    finally { setLoadingMatches(false); }
  }

  async function handleCreateCorporate(e) {
    e.preventDefault(); setCreating(true);
    try {
      const r = await submitCorporate(form);
      await loadCorporates();
      handleSelectCorporate(r.data);
    } catch { setError('Failed to create corporate profile'); }
    finally { setCreating(false); }
  }

  const [handshakeMatch, setHandshakeMatch] = useState(null);
  const [profileMatch, setProfileMatch] = useState(null);

  async function handleExpressInterest(match) {
    try {
      await expressInterest({ matchId: match.id, corporateId: match.corporateId, ngoId: match.ngoId });
      setMatches(prev => prev.map(m => m.id === match.id ? { ...m, status: 'INTERESTED' } : m));
      setHandshakeMatch({ ...match, status: 'INTERESTED' });
    } catch {}
  }

  async function handleMarkAsFunded(match) {
    try {
      await markAsFunded(match.id, { outcomeNotes: "Funds successfully disbursed to escrow." });
      setMatches(prev => prev.map(m => m.id === match.id ? { ...m, status: 'FUNDED' } : m));
      setHandshakeMatch(null);
    } catch {}
  }

  async function handleDownloadReport() {
    if (!selectedCorp) return;
    try {
      const res = await downloadReport(selectedCorp.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedCorp.name}_CSR_Report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { alert('Failed to download report'); }
  }

  let filtered = matches
    .filter(m => !searchQuery || m.ngoName.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(m => !filterTheme || m.ngoTheme === filterTheme)
    .filter(m => !filterState || m.ngoState === filterState)
    .filter(m => m.overallScore >= minScore);

  if (sortBy === 'score') filtered.sort((a,b) => b.overallScore - a.overallScore);
  else if (sortBy === 'budget') filtered.sort((a,b) => (a.budgetRequired||0) - (b.budgetRequired||0));
  else if (sortBy === 'beneficiaries') filtered.sort((a,b) => (b.ngoBeneficiaries||0) - (a.ngoBeneficiaries||0));

  return (
    <div className="page-container">
      <h2 style={{ fontSize:'1.5rem', fontWeight:800, color:'#1e40af', marginBottom:'1.5rem' }}>Corporate CSR Dashboard</h2>

      {/* STEP 1: Register or Select */}
      {!selectedCorp && (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {/* Show existing corporates if any */}
          {corporates.length > 0 && (
            <div className="card" style={{ marginBottom:'1.5rem' }}>
              <h3 style={{ fontWeight:700, marginBottom:'1rem' }}>Your Registered Companies</h3>
              {corporates.map(c => (
                <button key={c.id} onClick={() => handleSelectCorporate(c)}
                  className="btn btn-outline" style={{ width:'100%', marginBottom:'0.5rem', justifyContent:'flex-start', fontSize:'0.85rem' }}>
                  {c.name} — {fmtINR(c.csrBudget)}
                </button>
              ))}
            </div>
          )}

          <div className="card">
            <h3 style={{ fontWeight:700, marginBottom:'1rem' }}>Register Your Company</h3>

            {/* OCR Upload Zone */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, marginBottom: '1rem', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.9rem', color: '#334155' }}>Auto-fill with CSR Policy (AI)</div>
              <div style={{ marginBottom: 10, padding: '12px', border: '2px dashed #93c5fd', borderRadius: 8, textAlign: 'center', background: '#eff6ff', cursor: 'pointer' }}
                onClick={() => document.getElementById('ocr-file-input').click()}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e40af' }}>Upload CSR Policy Screenshot / Photo</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Take a screenshot or photo of your CSR policy document</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>Supported: JPG, PNG, WEBP (Google Cloud Vision OCR)</div>
                <input type="file" id="ocr-file-input" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (!file.type.startsWith('image/')) {
                      alert('Please upload an image (JPG/PNG). For PDFs, take a screenshot first.');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = async () => {
                      try {
                        const { parseDocumentVision } = await import('../services/api');
                        const res = await parseDocumentVision(reader.result);
                        if (res.data.text) {
                          document.getElementById('policy-textarea').value = res.data.text;
                          alert('Text extracted via Vision API! Click "Parse Policy" to auto-fill.');
                        } else { alert('No text detected in the image. Try a clearer screenshot.'); }
                      } catch { alert('Vision OCR failed. Please paste text manually instead.'); }
                    };
                    reader.readAsDataURL(file);
                  }} />
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 8 }}>— or paste text directly —</div>
              <textarea placeholder="Paste your raw CSR Policy document here..." rows="3"
                style={{ width: '100%', padding: '8px', fontSize: '0.85rem', marginBottom: 8 }} id="policy-textarea" />
              <button className="btn btn-outline" style={{ fontSize: '0.8rem', width: '100%' }} onClick={async (e) => {
                e.preventDefault();
                const text = document.getElementById('policy-textarea').value;
                if (!text) return;
                try {
                  const { parseCSRPolicy } = await import('../services/api');
                  const res = await parseCSRPolicy(text);
                  const parsed = res.data.parsed || res.data;
                  setForm(prev => ({
                    ...prev,
                    name: parsed.companyName || prev.name,
                    csrBudget: parsed.annualBudgetMax || parsed.annualBudgetMin || prev.csrBudget,
                    focusTheme: (parsed.focusThemes && parsed.focusThemes[0]) || prev.focusTheme,
                    preferredState: (parsed.preferredStates && parsed.preferredStates[0]) || prev.preferredState,
                  }));
                  alert('Form auto-filled from AI analysis!');
                } catch { alert('Failed to parse policy.'); }
              }}>Parse Policy & Auto-fill</button>
            </div>

            <form onSubmit={handleCreateCorporate}>
              <div className="form-group"><label>Company Name</label>
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="e.g. Tata Consultancy Services" /></div>
              <div className="form-group"><label>Sector</label>
                <select value={form.sector} onChange={e=>setForm({...form,sector:e.target.value})}>
                  {SECTORS.map(s=><option key={s}>{s}</option>)}</select></div>
              <div className="form-group"><label>CSR Budget: {fmtINR(form.csrBudget)}</label>
                <input type="range" min="100000" max="50000000" step="100000" value={form.csrBudget}
                  onChange={e=>setForm({...form,csrBudget:parseInt(e.target.value)})} /></div>
              <div className="form-group"><label>Focus Theme</label>
                <select value={form.focusTheme} onChange={e=>setForm({...form,focusTheme:e.target.value})}>
                  {THEMES.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}</select></div>
              <div className="form-group"><label>Preferred State</label>
                <select value={form.preferredState} onChange={e=>setForm({...form,preferredState:e.target.value})}>
                  {INDIAN_STATES.map(s=><option key={s}>{s}</option>)}</select></div>
              <button className="btn btn-primary" type="submit" disabled={creating} style={{ width:'100%' }}>
                {creating ? 'Creating...' : 'Register & Find Matching NGOs'}</button>
            </form>
          </div>
        </div>
      )}

      <div className="card" style={{ margin: '0 auto 1.5rem', maxWidth: 1100 }}>
        <h3 style={{ fontWeight: 800, marginBottom: '0.75rem' }}>Registered NGOs on Platform</h3>
        {loadingNgos && <div style={{ color: '#6b7280' }}>Loading NGOs...</div>}
        {!loadingNgos && ngos.length === 0 && (
          <div style={{ color: '#6b7280' }}>No NGOs registered yet. NGOs appear here after onboarding.</div>
        )}
        {!loadingNgos && ngos.slice(0, 6).map(ngo => (
          <div key={ngo.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>{ngo.name}</span>
              <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                {ngo.isPublished ? 'Published' : 'Registered'}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              {ngo.theme} · {ngo.district}, {ngo.state} · {ngo.annualBeneficiaries} beneficiaries
            </div>
          </div>
        ))}
      </div>

      {/* STEP 2: Matches view */}
      {selectedCorp && (
      <div className="dashboard-layout">
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: 800, margin: 0 }}>{selectedCorp.name}</h3>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{selectedCorp.sector} · Budget: {fmtINR(selectedCorp.csrBudget)}</div>
              </div>
              <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => setSelectedCorp(null)}>← Back</button>
            </div>
          </div>

          <CorporateVerificationPanel
            corporateId={selectedCorp.id}
            onVerified={(result) => console.log('Corporate verified:', result)}
          />
        </div>

        <div>
          {error && <div style={{ background:'#fee2e2', color:'#dc2626', padding:12, borderRadius:8, marginBottom:'1rem' }}>{error}</div>}
          {selectedCorp && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div className="filter-bar" style={{ margin: 0, flex: 1 }}>
                <input type="text" placeholder="Search NGO Name..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{ width: 150 }} />
                <select value={filterTheme} onChange={e=>setFilterTheme(e.target.value)}>
                  <option value="">All Themes</option>
                  {THEMES.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
                <select value={filterState} onChange={e=>setFilterState(e.target.value)}>
                  <option value="">All States</option>
                  {[...new Set(matches.map(m=>m.ngoState))].map(s=><option key={s}>{s}</option>)}
                </select>
                <input type="number" placeholder="Min score" value={minScore||''} onChange={e=>setMinScore(parseInt(e.target.value)||0)} style={{ width:90 }} />
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                  <option value="score">Sort: Score</option>
                  <option value="budget">Sort: Budget</option>
                  <option value="beneficiaries">Sort: Beneficiaries</option>
                </select>
              </div>
              <button className="btn btn-outline" onClick={handleDownloadReport} style={{ background: '#fff', flexShrink: 0 }}>
                📥 Download CSR Report
              </button>
            </div>
          )}

          {loadingMatches && <div style={{ textAlign:'center', padding:'3rem', color:'#6b7280' }}>Loading matches...</div>}

          {!loadingMatches && filtered.map(m => (
            <div className="match-card" key={m.id}>
              <div className="match-header">
                <div className="match-ngo-info">
                  <h3 style={{ cursor: 'pointer', color: '#1e40af', textDecoration: 'underline' }} onClick={() => setProfileMatch(m)}>{m.ngoName}</h3>
                  <div className="match-location">📍 {m.ngoDistrict ? m.ngoDistrict + ', ' : ''}{m.ngoState}</div>
                  <div className="badges-row" style={{ marginTop:6 }}>
                    {m.ngoVerificationStatus === 'VERIFIED' && <span className="badge badge-green">✅ Verified NGO</span>}
                    {m.ngoVerificationStatus === 'PENDING' && <span className="badge badge-yellow">⏳ Verification Pending</span>}
                    {m.ngoIsAspirational && <span className="badge badge-amber">🎯 Aspirational District</span>}
                    <span className="badge badge-blue">{m.ngoTheme?.replace('_',' ')}</span>
                    {m.scheduleViiCategory && <span className="badge badge-green">{m.scheduleViiCategory}</span>}
                  </div>
                </div>
                <ScoreCircle score={m.overallScore} />
              </div>

              <div className="score-breakdown">
                <ScoreBar label="Geographic" value={m.geographicScore} max={20} />
                <ScoreBar label="Thematic" value={m.thematicScore} max={30} />
                <ScoreBar label="Budget" value={m.budgetScore} max={20} />
                <ScoreBar label="Compliance" value={m.complianceScore} max={15} />
                <ScoreBar label="Impact" value={m.impactDensityScore} max={15} />
              </div>

              <div className="match-meta">
                <div className="match-meta-item"><strong>Budget Ask:</strong> {fmtINR(m.budgetRequired)}</div>
                <div className="match-meta-item"><strong>Beneficiaries:</strong> {(m.ngoBeneficiaries||0).toLocaleString('en-IN')}</div>
                {m.sdgTags?.map(t => <span className="badge badge-blue" key={t} style={{ fontSize:'0.7rem' }}>{t}</span>)}
              </div>

              {m.complianceNote && (
                <div className="compliance-note" style={{ fontSize:'0.8rem', marginBottom:'1rem' }}>
                  {m.complianceNote}
                </div>
              )}

              {m.outcomeNotes && (
                <div style={{ background: '#dcfce7', color: '#166534', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>
                  🎯 Outcome Tracking: {m.outcomeNotes}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className={`btn ${m.status === 'INTERESTED' || m.status === 'FUNDED' ? 'btn-outline' : 'btn-primary'}`} style={{ fontSize:'0.85rem', padding:'8px 20px' }}
                  disabled={m.status === 'INTERESTED' || m.status === 'FUNDED'}
                  onClick={() => handleExpressInterest(m)}>
                  {m.status === 'FUNDED' ? '🎉 Project Funded' : m.status === 'INTERESTED' ? '✅ Interest Expressed' : '🤝 Express Interest'}
                </button>
                {m.status === 'INTERESTED' && (
                  <button className="btn btn-primary" style={{ fontSize:'0.85rem', padding:'8px 20px', background: 'var(--success)' }}
                    onClick={() => setHandshakeMatch(m)}>
                    View Handshake
                  </button>
                )}
              </div>
            </div>
          ))}

          {handshakeMatch && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
              <div className="card" style={{ width: 500, maxWidth: '90%' }}>
                <h3 style={{ marginBottom: 16 }}>🤝 Handshake: {handshakeMatch.ngoName}</h3>
                <p>We have notified the NGO about your interest.</p>
                <div style={{ background: '#f3f4f6', padding: 12, borderRadius: 8, margin: '16px 0', fontSize: '0.9rem' }}>
                  <strong>Next Steps for Compliance:</strong>
                  <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                    <li>NGO uploads 80G and 12A certificates to platform.</li>
                    <li>ImpactBridge verifies MCA21 & Darpan databases.</li>
                    <li>Digital escrow account generated for fund transfer.</li>
                  </ul>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 16 }}>
                  Once offline compliance checks are clear, you can mark this project as officially funded to begin outcome tracking.
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-outline" onClick={() => setHandshakeMatch(null)}>Close</button>
                  <button className="btn btn-primary" onClick={() => handleMarkAsFunded(handshakeMatch)} style={{ background: 'var(--success)' }}>
                    Mark as Funded (Transfer OK)
                  </button>
                </div>
              </div>
            </div>
          )}

          {profileMatch && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
              <div className="card" style={{ width: 800, maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: '1.8rem', color: '#1e40af', marginBottom: 4 }}>{profileMatch.ngoName}</h2>
                    <div style={{ color: '#6b7280' }}>📍 {profileMatch.ngoDistrict ? profileMatch.ngoDistrict + ', ' : ''}{profileMatch.ngoState}</div>
                  </div>
                  <button className="btn btn-outline" onClick={() => setProfileMatch(null)}>Close</button>
                </div>
                
                <div style={{ background: '#f3f4f6', padding: 12, borderRadius: 8, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div><strong style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}>Registration Type</strong>{profileMatch.ngoRegistrationType}</div>
                  <div><strong style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}>Focus Theme</strong>{profileMatch.ngoTheme?.replace('_', ' ')}</div>
                  <div><strong style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}>Annual Beneficiaries</strong>{(profileMatch.ngoBeneficiaries||0).toLocaleString('en-IN')}</div>
                </div>

                {profileMatch.ngoProposal ? (
                  <>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>Project Proposal: {profileMatch.ngoProposal.projectTitle}</h3>
                    <div style={{ marginBottom: 16 }}>
                      <strong style={{ display: 'block', color: '#4b5563', marginBottom: 4 }}>Problem Statement</strong>
                      <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{profileMatch.ngoProposal.problemStatement}</p>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <strong style={{ display: 'block', color: '#4b5563', marginBottom: 4 }}>Proposed Solution</strong>
                      <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{profileMatch.ngoProposal.proposedSolution}</p>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <strong style={{ display: 'block', color: '#4b5563', marginBottom: 4 }}>Expected Outcomes</strong>
                      <ul style={{ fontSize: '0.9rem', paddingLeft: 20 }}>
                        {(profileMatch.ngoProposal.expectedOutcomes || []).map((o, i) => <li key={i}>{o}</li>)}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p>No detailed proposal generated.</p>
                )}
              </div>
            </div>
          )}

          {!loadingMatches && selectedCorp && filtered.length === 0 && (
            <div className="card" style={{ textAlign:'center', padding:'3rem', color:'#6b7280' }}>
              No matches found. Try adjusting filters or register more NGOs first.
            </div>
          )}
        </div>
      </div>
      )}

    </div>
  );
}
