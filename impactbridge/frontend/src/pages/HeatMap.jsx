import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import { getHeatmapData } from '../services/api';

const LIBRARIES = ['visualization'];
const INDIA_CENTER = { lat: 22.5, lng: 82.0 };
const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1e3a5f' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1a2744' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
];

function fmtCrore(n) {
  if (!n) return '₹0';
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(1) + ' Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + ' L';
  return '₹' + n.toLocaleString('en-IN');
}

function getColor(score) {
  if (score >= 75) return '#ef4444';
  if (score >= 50) return '#f59e0b';
  return '#22c55e';
}

function getLabel(score) {
  if (score >= 75) return 'High Need';
  if (score >= 50) return 'Moderate';
  return 'Well-served';
}

function getMarkerIcon(d) {
  const color = getColor(d.opportunityScore);
  const size = 14 + Math.min(d.opportunityScore / 3, 20);
  return {
    path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
    fillColor: color,
    fillOpacity: 0.85,
    strokeColor: '#fff',
    strokeWeight: d.isAspirational ? 3 : 1.5,
    scale: size,
  };
}

export default function HeatMap() {
  const [districts, setDistricts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showHeat, setShowHeat] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showAspOnly, setShowAspOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  useEffect(() => {
    getHeatmapData()
      .then(r => { setDistricts(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);

  const underserved = districts.filter(d => d.opportunityScore >= 70).length;
  const totalNgos = districts.reduce((s, d) => s + (d.ngoCount || 0), 0);
  const totalGap = districts.reduce((s, d) => {
    if (d.opportunityScore >= 50) return s + Math.max(0, 5000000 - (d.csrFundingReceived || 0));
    return s;
  }, 0);

  const visibleDistricts = showAspOnly ? districts.filter(d => d.isAspirational) : districts;

  const heatmapData = isLoaded && window.google
    ? visibleDistricts.map(d => ({
        location: new window.google.maps.LatLng(d.latitude, d.longitude),
        weight: d.opportunityScore,
      }))
    : [];

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';
  const isInvalidKey = apiKey.includes('your_') || apiKey === '';

  // If Google Maps can't load or key is missing/placeholder, show card fallback
  if (!isLoaded || isInvalidKey) {
    return <CardFallback districts={districts} loading={loading}
      underserved={underserved} totalNgos={totalNgos} totalGap={totalGap} />;
  }

  return (
    <div className="heatmap-container" id="heatmap-page">
      {/* Stats Bar */}
      <div className="heatmap-stats-bar">
        <span><strong style={{ color: '#ef4444' }}>{underserved}</strong> underserved districts</span>
        <span><strong style={{ color: '#60a5fa' }}>{totalNgos}</strong> NGOs mapped</span>
        <span><strong style={{ color: '#4ade80' }}>{fmtCrore(totalGap)}</strong> funding gap</span>
      </div>

      {/* Controls */}
      <div className="heatmap-toggles">
        <button className={`toggle-btn ${showHeat ? 'active' : ''}`} onClick={() => setShowHeat(!showHeat)}>
          🔥 Heat Layer
        </button>
        <button className={`toggle-btn ${showMarkers ? 'active' : ''}`} onClick={() => setShowMarkers(!showMarkers)}>
          📍 Markers
        </button>
        <button className={`toggle-btn ${showAspOnly ? 'active' : ''}`} onClick={() => setShowAspOnly(!showAspOnly)}>
          🎯 Aspirational Only
        </button>
      </div>

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={INDIA_CENTER}
        zoom={5}
        onLoad={onMapLoad}
        options={{
          styles: MAP_STYLES,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          minZoom: 4,
          maxZoom: 12,
          restriction: {
            latLngBounds: { north: 37, south: 6, west: 65, east: 100 },
            strictBounds: false,
          },
        }}
      >
        {/* Heatmap Layer */}
        {showHeat && heatmapData.length > 0 && (
          <HeatmapLayer
            data={heatmapData}
            options={{
              radius: 60,
              opacity: 0.7,
              gradient: [
                'rgba(0, 0, 0, 0)',
                'rgba(34, 197, 94, 0.4)',
                'rgba(250, 204, 21, 0.6)',
                'rgba(249, 115, 22, 0.7)',
                'rgba(239, 68, 68, 0.85)',
                'rgba(220, 38, 38, 1)',
              ],
            }}
          />
        )}

        {/* District Markers */}
        {showMarkers && visibleDistricts.map(d => (
          <Marker
            key={d.id}
            position={{ lat: Number(d.latitude), lng: Number(d.longitude) }}
            icon={getMarkerIcon(d)}
            label={{
              text: String(d.opportunityScore),
              color: '#fff',
              fontWeight: '700',
              fontSize: '11px',
            }}
            onClick={() => setSelected(d)}
            title={`${d.districtName}, ${d.state} — Score: ${d.opportunityScore}`}
          />
        ))}

        {/* Info Window */}
        {selected && (
          <InfoWindow
            position={{ lat: Number(selected.latitude), lng: Number(selected.longitude) }}
            onCloseClick={() => setSelected(null)}
            options={{ maxWidth: 340 }}
          >
            <div style={{ fontFamily: 'Inter, sans-serif', padding: 4 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color: '#1e40af' }}>
                {selected.districtName}
              </h3>
              <p style={{ margin: '0 0 10px', color: '#6b7280', fontSize: '0.85rem' }}>{selected.state}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: getColor(selected.opportunityScore) }}>
                    {selected.opportunityScore}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600 }}>Opportunity</div>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e40af' }}>
                    {selected.needScore}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600 }}>Need Score</div>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>
                    {fmtCrore(selected.csrFundingReceived)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600 }}>CSR Received</div>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e40af' }}>
                    {selected.ngoCount}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600 }}>Active NGOs</div>
                </div>
              </div>

              {selected.isAspirational && (
                <div style={{
                  background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8,
                  padding: '8px 10px', fontSize: '0.8rem', color: '#92400e', fontWeight: 600,
                }}>
                  🎯 NITI Aayog Aspirational District — Priority CSR area
                </div>
              )}

              <div style={{
                marginTop: 10, fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.5,
              }}>
                {selected.opportunityScore >= 75
                  ? '⚠️ Critical gap — high community need, low CSR presence. Ideal for new CSR investment.'
                  : selected.opportunityScore >= 50
                  ? '🔶 Moderate gap — some CSR activity but room for more targeted interventions.'
                  : '✅ Well-served district with adequate CSR coverage.'}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Legend */}
      <div className="heatmap-legend">
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.85rem', color: '#1e40af' }}>
          CSR Gap Score
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#ef4444', boxShadow: '0 0 6px #ef4444' }}></div>
          High need (75+)
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }}></div>
          Moderate (50–74)
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }}></div>
          Well-served (&lt;50)
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />
        <div className="legend-item">
          <div style={{ width: 12, height: 12, borderRadius: '50%', border: '3px solid #fff', background: 'transparent', boxShadow: '0 0 4px rgba(0,0,0,0.3)' }}></div>
          Aspirational District
        </div>
      </div>
    </div>
  );
}

/* ─── Card Fallback (if Google Maps key missing) ─── */
function CardFallback({ districts, loading, underserved, totalNgos, totalGap }) {
  const [sel, setSel] = useState(null);
  return (
    <div className="heatmap-container">
      <div className="heatmap-stats-bar">
        <span><strong style={{ color: '#ef4444' }}>{underserved}</strong> underserved</span>
        <span><strong style={{ color: '#1e40af' }}>{totalNgos}</strong> NGOs</span>
        <span><strong style={{ color: '#15803d' }}>{fmtCrore(totalGap)}</strong> gap</span>
      </div>
      <div className="map-fallback" style={{ position: 'relative', overflow: 'auto' }}>
        <div style={{ maxWidth: 1100, width: '100%', padding: '5rem 2rem 2rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#1e40af' }}>🗺️ CSR Impact Map — India</h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '2rem', fontSize: '0.9rem' }}>
            District-level visualization of CSR funding gaps and NGO presence
          </p>
          {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading...</div>}
          {!loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {districts.map(d => (
                <div key={d.id} onClick={() => setSel(d)}
                  style={{
                    background: 'white', borderRadius: 12, padding: '1.25rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer',
                    border: sel?.id === d.id ? '2px solid #1e40af' : '1px solid #e5e7eb',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{d.districtName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{d.state}</div>
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: getColor(d.opportunityScore), color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>
                      {d.opportunityScore}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    {d.isAspirational && <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>Aspirational</span>}
                    <span className="badge" style={{ background: getColor(d.opportunityScore)+'22', color: getColor(d.opportunityScore), fontSize: '0.7rem' }}>{getLabel(d.opportunityScore)}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#4b5563', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    <span>Need: <strong>{d.needScore}</strong></span>
                    <span>NGOs: <strong>{d.ngoCount}</strong></span>
                    <span>CSR: <strong>{fmtCrore(d.csrFundingReceived)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="heatmap-legend">
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '0.85rem' }}>Opportunity Score</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#ef4444' }}></div> High need (75+)</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#f59e0b' }}></div> Moderate (50–74)</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#22c55e' }}></div> Well-served (&lt;50)</div>
      </div>
    </div>
  );
}
