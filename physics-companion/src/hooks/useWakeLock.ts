import { useEffect, useRef } from 'react';
export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function acquire() {
      if (!active || !('wakeLock' in navigator)) return;
      try { const s = await navigator.wakeLock.request('screen'); if (cancelled) await s.release(); else sentinelRef.current = s; } catch {}
    }
    async function release() {
      if (sentinelRef.current) { try { await sentinelRef.current.release(); } catch {} sentinelRef.current = null; }
    }
    if (active) acquire(); else release();
    const onVis = () => { if (document.visibilityState === 'visible' && active) acquire(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', onVis); release(); };
  }, [active]);
}