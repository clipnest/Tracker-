import { ReactNode, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import SideNav from './SideNav';

export default function AppShell({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();
  const [key, setKey] = useState(location.pathname);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname;
      setKey(location.pathname + Date.now());
    }
  }, [location.pathname]);

  const SIDEBAR_WIDTH = 220;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-primary)', position: 'relative', zIndex: 1 }}>
      {!isMobile && <SideNav />}
      <main style={{
        flex: 1,
        marginLeft: isMobile ? 0 : SIDEBAR_WIDTH,
        paddingBottom: isMobile ? 'calc(72px + env(safe-area-inset-bottom))' : 0,
        minHeight: '100vh',
      }}>
        <div
          key={key}
          className="page-enter"
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: isMobile ? '20px 16px' : '32px 32px',
          }}
        >
          {children}
        </div>
      </main>
      {isMobile && <BottomNavigation />}
    </div>
  );
}
