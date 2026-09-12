import { NavLink } from 'react-router-dom';
import { HomeIcon, HabitsIcon, SavingsIcon, InsightsIcon, SettingsIcon } from '../ui/Icons';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: HomeIcon },
  { path: '/habits', label: 'Habits', icon: HabitsIcon },
  { path: '/savings', label: 'Savings', icon: SavingsIcon },
  { path: '/insights', label: 'Insights', icon: InsightsIcon },
];

export default function SideNav() {
  return (
    <nav style={{
      width: '220px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      height: '100vh',
      position: 'fixed',
      left: 0, top: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      zIndex: 50,
      boxShadow: '2px 0 24px rgba(0,0,0,0.25)',
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
            boxShadow: 'var(--shadow-accent)',
          }}>⚡</div>
          <div>
            <span style={{
              fontSize: 18, fontWeight: 800,
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.3px',
            }}>Trackr</span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} end={path === '/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            fontSize: 14, fontWeight: isActive ? 600 : 500,
            color: isActive ? 'white' : 'var(--text-secondary)',
            background: isActive ? 'var(--accent-gradient)' : 'transparent',
            boxShadow: isActive ? 'var(--shadow-accent)' : 'none',
            transition: 'all var(--duration-normal) var(--ease-out)',
            position: 'relative',
          })}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            if (!el.querySelector('[data-active]')) {
              el.style.background = 'var(--bg-elevated)';
              el.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            if (!el.querySelector('[data-active]')) {
              el.style.background = '';
              el.style.color = '';
            }
          }}>
            {({ isActive }) => (
              <>
                <Icon size={18} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                <span data-active={isActive || undefined}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Settings at bottom */}
      <div style={{ padding: '10px 10px 16px', borderTop: '1px solid var(--border-subtle)' }}>
        <NavLink to="/settings" style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
          fontSize: 14, fontWeight: isActive ? 600 : 500,
          color: isActive ? 'white' : 'var(--text-secondary)',
          background: isActive ? 'var(--accent-gradient)' : 'transparent',
          boxShadow: isActive ? 'var(--shadow-accent)' : 'none',
          transition: 'all var(--duration-normal) var(--ease-out)',
        })}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          if (el.style.background === 'transparent' || !el.style.background) {
            el.style.background = 'var(--bg-elevated)';
            el.style.color = 'var(--text-primary)';
          }
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          if (!el.getAttribute('aria-current')) {
            el.style.background = '';
            el.style.color = '';
          }
        }}>
          {({ isActive }) => (
            <>
              <SettingsIcon size={18} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
              <span>Settings</span>
            </>
          )}
        </NavLink>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10, letterSpacing: '0.5px' }}>v1.0.0</p>
      </div>
    </nav>
  );
}
