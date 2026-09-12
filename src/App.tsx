import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import AppShell from './components/layout/AppShell';
import Home from './pages/Home';
import Habits from './pages/Habits';
import HabitDetail from './pages/HabitDetail';
import Savings from './pages/Savings';
import SavingsDetail from './pages/SavingsDetail';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import Welcome from './pages/Welcome';
import { useEffect, useState } from 'react';
import { db } from './db/database';

export default function App() {
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);

  useEffect(() => {
    const checkWelcome = async () => {
      const setting = await db.settings.where('key').equals('hasSeenWelcome').first();
      setHasSeenWelcome(setting?.value === 'true');
    };
    checkWelcome();
  }, []);

  if (hasSeenWelcome === null) return null; // loading

  return (
    <ThemeProvider>
      <SnackbarProvider>
        <Router>
          {hasSeenWelcome ? (
            <AppShell>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/habits" element={<Habits />} />
                <Route path="/habits/:id" element={<HabitDetail />} />
                <Route path="/savings" element={<Savings />} />
                <Route path="/savings/:id" element={<SavingsDetail />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </AppShell>
          ) : (
            <Routes>
              <Route path="*" element={<Welcome onComplete={async () => {
                await db.settings.put({ key: 'hasSeenWelcome', value: 'true' });
                setHasSeenWelcome(true);
              }} />} />
            </Routes>
          )}
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
