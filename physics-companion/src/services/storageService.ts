import { AppState } from '../types';
import { getLocalDateKey } from '../utils/dateUtils';

const STORAGE_KEY = 'physics_app_state_v1';
export function createSyncId(): string {
  return 'phy-' + Math.random().toString(36).slice(2, 8) + '-' + Date.now().toString(36).slice(-4);
}
export function getDefaultAppState(): AppState {
  return {
    syncId: createSyncId(),
    language: 'en',
    userProfile: null,
    currentDate: getLocalDateKey(),
    tasks: [],
    timerPresets: [
      { id: 'p-25', label: 'Pomodoro', minutes: 25 },
      { id: 'p-45', label: 'Deep Study', minutes: 45 },
      { id: 'p-60', label: 'Focus Hour', minutes: 60 },
    ],
    todayFocusMinutes: 0,
    performanceHistory: [],
    location: { city: 'Cairo', latitude: 30.0444, longitude: 31.2357, method: 'Egypt', autoDetected: false },
    prayerNotificationsEnabled: true,
    wakeWordEnabled: false,
    voiceReplyEnabled: true,
    chatHistory: [],
    updatedAt: new Date().toISOString(),
  };
}
export function loadLocalState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { const init = getDefaultAppState(); saveLocalState(init); return init; }
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const defaults = getDefaultAppState();
    return {
      ...defaults,
      ...parsed,
      location: { ...defaults.location, ...(parsed.location || {}) },
      timerPresets: parsed.timerPresets?.length ? parsed.timerPresets : defaults.timerPresets,
    };
  } catch { return getDefaultAppState(); }
}
export function saveLocalState(state: AppState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}