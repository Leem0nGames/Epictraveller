'use client';

import { useState, useEffect } from 'react';
import { DebugManager } from '@/game/Systems/Debug/DebugManager';
import { DebugMenu } from './DebugMenu';

export function DebugOverlay() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const debugManager = DebugManager.getInstance();
    debugManager.init();
    return debugManager.isEnabled();
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [metrics, setMetrics] = useState({ fps: 0, mem: 0 });

  useEffect(() => {
    const debugManager = DebugManager.getInstance();
    debugManager.init();
    const isEng = debugManager.isEnabled();
    if (isEng) {
      const interval = setInterval(() => {
        setMetrics({
          fps: Math.round(60 + Math.random() * 2),
          mem: Math.round(50 + Math.random() * 5),
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div className="fixed top-0 left-0 p-4 bg-black/80 text-white font-mono text-xs z-50">
        <div>FPS: {metrics.fps}</div>
        <div>Mem: {metrics.mem} MB</div>
        <button 
          onClick={() => setMenuOpen(true)}
          className="mt-2 px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs"
        >
          Open Menu
        </button>
      </div>
      {menuOpen && <DebugMenu onClose={() => setMenuOpen(false)} />}
    </>
  );
}

