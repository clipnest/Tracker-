import { NavLink } from 'react-router-dom';
import { HomeIcon, HabitsIcon, SavingsIcon, InsightsIcon, SettingsIcon } from '../ui/Icons';

const TABS = [
  { path: '/', label: 'Home', icon: HomeIcon },
  { path: '/habits', label: 'Habits', icon: HabitsIcon },
  { path: '/savings', label: 'Savings', icon: SavingsIcon },
  { path: '/insights', label: 'Insights', icon: InsightsIcon },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function BottomNavigation() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: '64px',
      background: 'rgba(17,17,32,0.92)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid var(--border-subtle)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100,
      boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
    }}>
      {TABS.map(({ path, label, icon: Icon }) => (
        <NavLink key={path} to={path} end={path === '/'} style={{ textDecoration: 'none', flex: 1 }}>
          {({ isActive }) => (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '6px 4px',
              position: 'relative',
            }}>
              {/* Active pill bg */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: 4, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 40, height: 28, borderRadius: 10,
                  background: 'rgba(124,92,252,0.15)',
                  backdropFilter: 'blur(8px)',
                }} />
              )}
              <Icon size={20} style={{
                color: isActive ? 'var(--accent-purple-light)' : 'var(--text-muted)',
                transition: 'color var(--duration-normal) var(--ease-out)',
                position: 'relative', zIndex: 1,
              }} />
              <span style={{
                fontSize: 10, fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--accent-purple-light)' : 'var(--text-muted)',
                transition: 'color var(--duration-normal) var(--ease-out)',
                letterSpacing: isActive ? '0.3px' : 0,
              }}>{label}</span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
