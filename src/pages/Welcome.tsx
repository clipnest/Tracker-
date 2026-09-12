import React from 'react';
import { db } from '../db/database';

interface WelcomeProps { onComplete: () => void; }

export default function Welcome({ onComplete }: WelcomeProps) {
  const handleStart = async () => {
    await db.settings.put({ key: 'hasSeenWelcome', value: 'true' });
    onComplete();
  };

  const features = [
    { icon: '🎯', label: 'Habits', desc: 'Build daily habits' },
    { icon: '💰', label: 'Savings', desc: 'Track your goals' },
    { icon: '📊', label: 'Insights', desc: 'Analytics & trends' },
  ];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      padding: '40px 24px', textAlign: 'center',
      background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient glows */}
      <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(92,110,247,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', maxWidth: 400, width: '100%', animation: 'slide-up 0.6s cubic-bezier(0.4,0,0.2,1) both' }}>
        {/* Logo */}
        <div style={{ width: 88, height: 88, borderRadius: 28, background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, margin: '0 auto 28px', boxShadow: 'var(--shadow-accent-lg), 0 0 60px rgba(124,92,252,0.3)' }}>⚡</div>

        <h1 style={{ fontSize: 58, fontWeight: 900, marginBottom: 10, letterSpacing: '-2px', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Trackr</h1>
        <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 44, maxWidth: 300, margin: '0 auto 44px' }}>
          Build better habits.<br />Track your savings.<br />See your progress.
        </p>

        {/* Feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 40 }}>
          {features.map(f => (
            <div key={f.label} style={{ padding: '14px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{f.label}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.desc}</span>
            </div>
          ))}
        </div>

        <button onClick={handleStart} style={{
          display: 'block', width: '100%', padding: '18px',
          borderRadius: 'var(--radius-lg)', background: 'var(--accent-gradient)',
          border: 'none', color: '#fff', fontSize: 17, fontWeight: 700,
          boxShadow: 'var(--shadow-accent-lg)', cursor: 'pointer',
          transition: 'all var(--duration-normal)', letterSpacing: '0.2px',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(124,92,252,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-accent-lg)'; }}>
          Get Started →
        </button>

        <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>No account · 100% local · Private</p>
      </div>
    </div>
  );
}
