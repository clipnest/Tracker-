const fs = require('fs');
const path = require('path');

const files = {
  'src/utils/dateUtils.ts': `
export const getToday = (): string => new Date().toISOString().split('T')[0];
export const formatDate = (dateStr: string): string => new Date(dateStr).toLocaleDateString();
export const getDayOfWeek = (dateStr: string): number => new Date(dateStr).getDay();
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};
export const getWeekStart = (dateStr: string): string => {
  const date = new Date(dateStr);
  const diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
  return new Date(date.setDate(diff)).toISOString().split('T')[0];
};
export const getMonthStart = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
};
export const getDateRange = (startStr: string, endStr: string): string[] => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const arr = [];
  for(let dt = new Date(start); dt <= end; dt.setDate(dt.getDate()+1)){
    arr.push(new Date(dt).toISOString().split('T')[0]);
  }
  return arr;
};
  `,
  'src/utils/moneyUtils.ts': `
export const paisoToRupees = (paise: number): number => Math.floor(paise / 100);
export const rupeesToPaise = (rupees: number): number => Math.round(rupees * 100);
export const formatRupees = (paise: number): string => '₹' + paisoToRupees(paise).toLocaleString('en-IN');
export const parseCurrency = (input: string): number => rupeesToPaise(parseFloat(input) || 0);
  `,
  'src/utils/scoreUtils.ts': `
import { Habit, HabitRecord, SavingsGoal, SavingsTransaction } from '../db/database';
export const calculateDailyScore = (habits: Habit[], records: HabitRecord[], goals: SavingsGoal[], transactions: SavingsTransaction[], date: string): number => {
  if (habits.length === 0 && goals.length === 0) return -1;
  let habitScore = 100;
  if (habits.length > 0) {
    const scheduled = habits.length; // Simplified
    const completed = records.filter(r => r.date === date && (r.status === 'completed' || r.status === 'maintained')).length;
    habitScore = scheduled > 0 ? (completed / scheduled) * 100 : 100;
  }
  let savingsScore = 100;
  if (goals.length > 0) {
    const txToday = transactions.some(t => t.date === date);
    savingsScore = txToday ? 70 : 30;
  }
  if (habits.length === 0) return savingsScore;
  if (goals.length === 0) return habitScore;
  return habitScore * 0.7 + savingsScore * 0.3;
};
  `,
  'src/utils/streakUtils.ts': `
import { Habit, HabitRecord } from '../db/database';
export const calculateCurrentStreak = (habit: Habit, records: HabitRecord[]): number => {
  return records.filter(r => r.status === 'completed' || r.status === 'maintained').length; // Simplified
};
export const calculateBestStreak = (habit: Habit, records: HabitRecord[]): number => {
  return calculateCurrentStreak(habit, records); // Simplified
};
  `,
  'src/utils/exportImport.ts': `
import { db } from '../db/database';
export const exportData = async () => {
  // Mock implementation
  const data = JSON.stringify({ version: 1 });
  const blob = new Blob([data], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'trackr-backup.json';
  a.click();
};
export const validateBackupFile = (data: any): boolean => true;
export const importData = async (file: File) => {
  // Mock implementation
};
  `,
  'src/components/ui/Icons.tsx': `
export const HomeIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
export const CheckIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
export const XIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
export const SavingsIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
export const HabitsIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
export const InsightsIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
export const SettingsIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
export const PlusIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
  `,
  'src/components/layout/BottomNavigation.tsx': `
import { NavLink } from 'react-router-dom';
import { HomeIcon, HabitsIcon, SavingsIcon, InsightsIcon, SettingsIcon } from '../ui/Icons';

export default function BottomNavigation() {
  const tabs = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/habits', label: 'Habits', icon: HabitsIcon },
    { path: '/savings', label: 'Savings', icon: SavingsIcon },
    { path: '/insights', label: 'Insights', icon: InsightsIcon },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: '64px', background: 'rgba(22, 22, 37, 0.95)',
      backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 50
    }}>
      {tabs.map(({ path, label, icon: Icon }) => (
        <NavLink key={path} to={path} end={path === '/'} style={({ isActive }) => ({
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          color: isActive ? 'var(--accent-purple)' : 'var(--text-secondary)',
          textDecoration: 'none', fontSize: '11px'
        })}>
          <Icon size={24} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
  `,
  'src/components/layout/SideNav.tsx': `
import { NavLink } from 'react-router-dom';
import { HomeIcon, HabitsIcon, SavingsIcon, InsightsIcon, SettingsIcon } from '../ui/Icons';

export default function SideNav() {
  const tabs = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/habits', label: 'Habits', icon: HabitsIcon },
    { path: '/savings', label: 'Savings', icon: SavingsIcon },
    { path: '/insights', label: 'Insights', icon: InsightsIcon },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <nav style={{
      width: '240px', background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-color)', height: '100vh',
      position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column',
      padding: '24px 0', zIndex: 50
    }}>
      <h1 style={{ padding: '0 24px', marginBottom: '32px', color: 'var(--accent-purple)' }}>Trackr</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 12px' }}>
        {tabs.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} end={path === '/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '16px',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: isActive ? 'var(--bg-elevated)' : 'transparent',
            padding: '12px', borderRadius: '8px', textDecoration: 'none'
          })}>
            <Icon size={20} />
            <span style={{ fontWeight: 500 }}>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
  `,
  'src/components/layout/AppShell.tsx': `
import { ReactNode, useState, useEffect } from 'react';
import BottomNavigation from './BottomNavigation';
import SideNav from './SideNav';

export default function AppShell({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-primary)' }}>
      {!isMobile && <SideNav />}
      <main style={{ 
        flex: 1, 
        paddingBottom: isMobile ? 'calc(64px + env(safe-area-inset-bottom))' : '0',
        marginLeft: isMobile ? '0' : '240px',
        padding: '24px',
        maxWidth: '1200px',
        margin: isMobile ? '0 auto' : '0 auto 0 240px'
      }}>
        {children}
      </main>
      {isMobile && <BottomNavigation />}
    </div>
  );
}
  `,
  'src/components/ui/Button.tsx': `
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  stopPropagation?: boolean;
}

export default function Button({ 
  children, variant = 'primary', size = 'md', stopPropagation = false, onClick, style, ...props 
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    borderRadius: '8px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.6 : 1,
    transition: 'all 0.2s',
  };

  const variants = {
    primary: { background: 'var(--accent-purple)', color: '#fff' },
    secondary: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' },
    danger: { background: 'var(--danger)', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--text-primary)' },
    icon: { background: 'transparent', padding: '8px', borderRadius: '50%' }
  };

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '13px' },
    md: { padding: '10px 16px', fontSize: '15px' },
    lg: { padding: '14px 24px', fontSize: '16px' },
    icon: { padding: '8px' }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) e.stopPropagation();
    onClick?.(e);
  };

  return (
    <button 
      style={{ ...baseStyle, ...variants[variant], ...(variant === 'icon' ? sizes.icon : sizes[size]), ...style }} 
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
  `,
  'src/components/ui/Card.tsx': `
import React from 'react';

export default function Card({ children, onClick, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      onClick={onClick}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}
  `,
  'src/pages/Welcome.tsx': `
import React from 'react';
import Button from '../components/ui/Button';

export default function Welcome({ onComplete }: { onComplete: () => void }) {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '48px', color: 'var(--accent-purple)', marginBottom: '16px' }}>Trackr</h1>
      <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '48px' }}>
        Build better habits. Track your progress. Save toward your goals.
      </p>
      <Button size="lg" onClick={onComplete} style={{ width: '100%', maxWidth: '300px' }}>
        Get Started
      </Button>
    </div>
  );
}
  `,
  'src/pages/Home.tsx': `
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import Card from '../components/ui/Card';
import { getToday } from '../utils/dateUtils';
import { calculateDailyScore } from '../utils/scoreUtils';

export default function Home() {
  const habits = useLiveQuery(() => db.habits.toArray()) || [];
  const records = useLiveQuery(() => db.habitRecords.toArray()) || [];
  const goals = useLiveQuery(() => db.savingsGoals.toArray()) || [];
  const transactions = useLiveQuery(() => db.savingsTransactions.toArray()) || [];

  const today = getToday();
  const score = calculateDailyScore(habits, records, goals, transactions, today);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header>
        <h1 className="text-h2">Dashboard</h1>
        <p className="text-secondary">{new Date().toLocaleDateString()}</p>
      </header>
      
      <Card>
        <h2 className="text-h3" style={{ marginBottom: '16px' }}>Today's Score</h2>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '120px' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
              <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--bg-elevated)" strokeWidth="3" />
              <path strokeDasharray={score >= 0 ? \`\${score}, 100\` : '0, 100'} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--accent-purple)" strokeWidth="3" />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
              {score >= 0 ? \`\${Math.round(score)}%\` : '--'}
            </div>
          </div>
        </div>
      </Card>
      
      <Card>
        <h2 className="text-h3" style={{ marginBottom: '16px' }}>Today's Habits</h2>
        {habits.length === 0 ? <p className="text-secondary">No habits yet.</p> : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {habits.map(h => (
              <li key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                <span>{h.icon} {h.name}</span>
                <button style={{ color: 'var(--success)', fontWeight: 'bold' }}>Done</button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      
      <Card>
        <h2 className="text-h3" style={{ marginBottom: '16px' }}>Savings Overview</h2>
        {goals.length === 0 ? <p className="text-secondary">No savings goals yet.</p> : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {goals.map(g => (
              <li key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                <span>{g.icon} {g.name}</span>
                <span>₹{Math.floor(g.currentBalance / 100).toLocaleString()} / ₹{Math.floor(g.targetAmount / 100).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
  `,
  'src/pages/Habits.tsx': `
import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';

export default function Habits() {
  const habits = useLiveQuery(() => db.habits.toArray()) || [];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="text-h2">Habits</h1>
        <Button size="sm">+ New</Button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {habits.map(h => (
          <Card key={h.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '24px' }}>{h.icon}</div>
              <div>
                <h3 className="text-h3">{h.name}</h3>
                <p className="text-secondary">{h.category}</p>
              </div>
            </div>
          </Card>
        ))}
        {habits.length === 0 && <p className="text-secondary">No habits. Create one!</p>}
      </div>
    </div>
  );
}
  `,
  'src/pages/HabitDetail.tsx': \`
import React from 'react';
import { useParams } from 'react-router-dom';

export default function HabitDetail() {
  const { id } = useParams();
  return <div>Habit Detail {id}</div>;
}
  \`,
  'src/pages/Savings.tsx': \`
import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';

export default function Savings() {
  const goals = useLiveQuery(() => db.savingsGoals.toArray()) || [];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="text-h2">Savings</h1>
        <Button size="sm">+ New Goal</Button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {goals.map(g => (
          <Card key={g.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '24px' }}>{g.icon}</div>
              <div>
                <h3 className="text-h3">{g.name}</h3>
                <p className="text-secondary">₹{Math.floor(g.currentBalance/100).toLocaleString()} / ₹{Math.floor(g.targetAmount/100).toLocaleString()}</p>
              </div>
            </div>
          </Card>
        ))}
        {goals.length === 0 && <p className="text-secondary">No savings goals. Create one!</p>}
      </div>
    </div>
  );
}
  \`,
  'src/pages/SavingsDetail.tsx': \`
import React from 'react';
import { useParams } from 'react-router-dom';

export default function SavingsDetail() {
  const { id } = useParams();
  return <div>Savings Detail {id}</div>;
}
  \`,
  'src/pages/Insights.tsx': \`
import React from 'react';
import Card from '../components/ui/Card';

export default function Insights() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="text-h2">Insights</h1>
      <Card>
        <p className="text-secondary">Charts and analytics will appear here as you log data.</p>
      </Card>
    </div>
  );
}
  \`,
  'src/pages/Settings.tsx': \`
import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useTheme } from '../contexts/ThemeContext';

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="text-h2">Settings</h1>
      
      <Card>
        <h3 className="text-h3" style={{ marginBottom: '16px' }}>Appearance</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant={theme === 'dark' ? 'primary' : 'secondary'} onClick={() => setTheme('dark')}>Dark</Button>
          <Button variant={theme === 'light' ? 'primary' : 'secondary'} onClick={() => setTheme('light')}>Light</Button>
          <Button variant={theme === 'system' ? 'primary' : 'secondary'} onClick={() => setTheme('system')}>System</Button>
        </div>
      </Card>
      
      <Card>
        <h3 className="text-h3" style={{ marginBottom: '16px' }}>Data</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="secondary">Export Data</Button>
          <Button variant="secondary">Import Data</Button>
          <Button variant="danger">Reset All Data</Button>
        </div>
      </Card>
    </div>
  );
}
  \`
};

const createFiles = () => {
  for (const [filepath, content] of Object.entries(files)) {
    const fullPath = path.join(__dirname, filepath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\\n');
    console.log(\`Created \${filepath}\`);
  }
};

createFiles();
