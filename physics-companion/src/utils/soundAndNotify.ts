let audioCtx: AudioContext | null = null;
export function playGentleChime(type: 'complete' | 'prealert' | 'prayer' = 'complete') {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const notes = type === 'prayer' ? [523.25, 659.25, 783.99] : type === 'prealert' ? [440, 523.25] : [523.25, 659.25];
    notes.forEach((freq, idx) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.16);
      gain.gain.setValueAtTime(0.001, now + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.16 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.16 + 0.55);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.16); osc.stop(now + idx * 0.16 + 0.6);
    });
  } catch {}
}
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission === 'default' ? Notification.requestPermission() : Notification.permission;
}
export function sendBrowserNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body, icon: '/icon.svg' }); } catch {}
  }
}