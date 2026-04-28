import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PixelCard from '../components/PixelCard';
import Carousel from '../components/Carousel';
import { database } from '../config/firebase';
import { ref, onValue, set } from 'firebase/database';

function AnimatedCounter({ end, duration = 2000, label }) {
  const [count, setCount] = useState(0);
  const refObj = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const startTime = Date.now();
        const tick = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * end));
          if (progress < 1) requestAnimationFrame(tick);
          else setCount(end);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (refObj.current) observer.observe(refObj.current);
    return () => observer.disconnect();
  }, [end, duration]);

  // Restart animation when 'end' changes
  useEffect(() => {
    if (started.current && count !== end) {
      setCount(end); // Jump to new value or animate (jumping is safer for live updates)
    }
  }, [end]);

  const formatted = count >= 10000
    ? (count / 1000).toFixed(1) + 'K+'
    : count.toLocaleString('en-IN');

  return (
    <div className="stat-card" ref={refObj}>
      <div className="stat-number">{formatted}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Landing() {
  const [stats, setStats] = useState({ ngoCount: 15, corporateCount: 6, fundedCount: 3, totalBeneficiaries: 42500 });

  useEffect(() => {
    const statsRef = ref(database, 'platformStats');
    const unsubscribe = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStats(data);
      } else {
        // Seed initial data if empty
        set(statsRef, { ngoCount: 15, corporateCount: 6, fundedCount: 3, totalBeneficiaries: 42500 });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <section className="hero-section" id="hero-section">
        <h1 className="hero-title">
          ₹15,000 Cr in CSR.<br />
          ₹170B in unmet need.
        </h1>
        <p className="hero-subtitle">
          India's first AI-powered CSR allocation engine. Connecting corporate mandates
          with grassroots NGOs through intelligent matching and compliance verification.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '4rem' }}>
          <Link to="/login" className="btn btn-primary btn-lg" style={{ fontSize: '1.3rem' }}>
            Get Started
          </Link>
          <Link to="/heatmap" className="btn btn-secondary btn-lg" style={{ fontSize: '1.3rem' }}>
            View Impact Map
          </Link>
        </div>
      </section>

      <div className="stats-grid">
        <AnimatedCounter end={stats.ngoCount} label="NGOs Registered" />
        <AnimatedCounter end={stats.corporateCount || 5} label="Corporates" />
        <AnimatedCounter end={stats.fundedCount || 0} label="Projects Funded" />
        <AnimatedCounter end={stats.totalBeneficiaries} label="Beneficiaries Reached" />
      </div>

      <section className="page-container" style={{ marginTop: '4rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '1rem' }}>Platform Features</h2>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4rem' }}>
          <Carousel baseWidth={400} autoplay={true} loop={true} autoplayDelay={2500} />
        </div>

        <h2 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '3rem' }}>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <PixelCard variant="default">
            <div className="pixel-card-content">
              <h3>NGO Describes Work</h3>
              <p>Plain-language submission. No corporate jargon needed.</p>
            </div>
          </PixelCard>
          
          <PixelCard variant="blue">
            <div className="pixel-card-content">
              <h3>AI Generates Proposal</h3>
              <p>Gemini AI creates structured Schedule VII & SDG proposals.</p>
            </div>
          </PixelCard>
          
          <PixelCard variant="pink">
            <div className="pixel-card-content">
              <h3>Smart Matching</h3>
              <p>Algorithm connects NGOs directly with corporate mandates.</p>
            </div>
          </PixelCard>
        </div>
      </section>

      <footer style={{ borderTop: '3px solid #000', padding: '2rem', textAlign: 'center', fontWeight: 800, background: '#fff' }}>
        Built for GDSC Solution Challenge 2026 · Aligned with SDG 1, 4, 10, 17
      </footer>
    </>
  );
}
