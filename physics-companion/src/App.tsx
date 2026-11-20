import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActiveTimer, AIAction, AppLanguage, AppState, ChatMessage, DailyPerformance, TaskCategory, TaskItem, UserProfile } from './types';
import { getTranslations } from './i18n/translations';
import { getLocalDateKey, timeToMinutes } from './utils/dateUtils';
import { avoidPrayerConflict, calculatePrayerTimes } from './utils/prayerTimes';
import { playGentleChime, requestNotificationPermission, sendBrowserNotification } from './utils/soundAndNotify';
import { loadLocalState, saveLocalState } from './services/storageService';
import { fetchStateFromCloud, isFirebaseConfigured, syncStateToCloud } from './services/firebaseService';
import { generateInitialScheduleFromProfile, queryPhysicsAI } from './services/aiService';
import { PhoneControl } from './services/phoneControlService';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { useWakeLock } from './hooks/useWakeLock';
import { Header } from './components/Header';
import { OnboardingView } from './components/OnboardingView';
import { ScheduleSection } from './components/ScheduleSection';
import { TimerPanel } from './components/TimerPanel';
import { PrayerTimesPanel } from './components/PrayerTimesPanel';
import { AssistantPanel } from './components/AssistantPanel';
import { PerformanceReviewModal } from './components/PerformanceReviewModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadLocalState());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const alertedPrayersRef = useRef<Set<string>>(new Set());
  const t = getTranslations(state.language);

  useEffect(() => {
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';
  }, [state.language]);

  useEffect(() => {
    saveLocalState(state);
    if (isFirebaseConfigured()) {
      const timer = setTimeout(() => syncStateToCloud(state).then((ok) => setCloudSynced(ok)), 600);
      return () => clearTimeout(timer);
    }
  }, [state]);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    fetchStateFromCloud(state.syncId).then((cloud) => { if (cloud && cloud.updatedAt > state.updatedAt) { setState(cloud); setCloudSynced(true); } });
  }, []);

  const prayers = useMemo(() => calculatePrayerTimes(state.location, new Date(nowMs)), [state.location, nowMs]);

  useEffect(() => {
    const todayKey = getLocalDateKey(new Date(nowMs));
    if (state.currentDate !== todayKey) {
      setState((prev) => {
        const total = prev.tasks.length, done = prev.tasks.filter((i) => i.completed).length;
        const prevSummary: DailyPerformance = { date: prev.currentDate, totalTasks: total, completedTasks: done, completionRate: total > 0 ? Math.round((done / total) * 100) : 0, focusMinutes: prev.todayFocusMinutes };
        const refreshedTasks = prev.userProfile ? generateInitialScheduleFromProfile(prev.userProfile, prayers, prev.language) : [];
        return { ...prev, currentDate: todayKey, todayFocusMinutes: 0, performanceHistory: [prevSummary, ...prev.performanceHistory].slice(0, 30), tasks: refreshedTasks, updatedAt: new Date().toISOString() };
      });
    }
  }, [nowMs, state.currentDate, prayers]);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (state.prayerNotificationsEnabled) {
        const dateKey = getLocalDateKey(new Date(current));
        prayers.forEach((p) => {
          const key = `${dateKey}-${p.name}`, diff = current - p.timestamp;
          if (diff >= 0 && diff < 30000 && !alertedPrayersRef.current.has(key)) {
            alertedPrayersRef.current.add(key);
            playGentleChime('prayer');
            sendBrowserNotification(`${t.prayers.names[p.name]} (${p.time24})`, state.language === 'ar' ? `ط­ط§ظ† ط§ظ„ط¢ظ† ظ…ظˆط¹ط¯ طµظ„ط§ط© ${t.prayers.names[p.name]}` : `Time for ${t.prayers.names[p.name]} prayer.`);
          }
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [prayers, state.language, state.prayerNotificationsEnabled, t.prayers.names]);

  useEffect(() => { if (toast) { const id = setTimeout(() => setToast(null), 4000); return () => clearTimeout(id); } }, [toast]);

  useEffect(() => {
    if (!activeTimer || !activeTimer.isRunning) return;
    const interval = setInterval(() => {
      setActiveTimer((prev) => {
        if (!prev || !prev.isRunning) return prev;
        const nextSec = prev.remainingSeconds - 1;
        if (prev.preAlertMinutes > 0 && !prev.preAlertSent && nextSec > 0 && nextSec <= prev.preAlertMinutes * 60) {
          playGentleChime('prealert'); sendBrowserNotification(t.timer.preAlertToast, prev.label);
          return { ...prev, remainingSeconds: nextSec, preAlertSent: true };
        }
        if (nextSec <= 0) {
          playGentleChime('complete'); sendBrowserNotification(t.timer.completedToast, prev.label);
          setToast(`${t.timer.completedToast}: ${prev.label}`);
          const mins = Math.round(prev.totalSeconds / 60);
          setState((s) => ({ ...s, todayFocusMinutes: s.todayFocusMinutes + mins, tasks: prev.linkedTaskId ? s.tasks.map((tk) => (tk.id === prev.linkedTaskId ? { ...tk, completed: true } : tk)) : s.tasks, updatedAt: new Date().toISOString() }));
          return null;
        }
        return { ...prev, remainingSeconds: nextSec };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer?.isRunning, t.timer.completedToast, t.timer.preAlertToast]);

  useWakeLock(Boolean(activeTimer?.isRunning || state.wakeWordEnabled));

  const startTimer = useCallback((label: string, minutes: number, preAlertMinutes = 2, linkedTaskId?: string) => {
    requestNotificationPermission();
    const totalSeconds = Math.max(60, Math.round(minutes * 60));
    setActiveTimer({ id: `timer-${Date.now()}`, label, totalSeconds, remainingSeconds: totalSeconds, isRunning: true, preAlertMinutes, preAlertSent: false, linkedTaskId });
  }, []);

  const addTask = useCallback((taskInput: Omit<TaskItem, 'id' | 'completed'>) => {
    const { adjustedTime, shifted } = avoidPrayerConflict(taskInput.scheduledTime, taskInput.durationMinutes, prayers, 15);
    if (shifted) setToast(`${t.schedule.conflictNotice} (${adjustedTime})`);
    const newTask: TaskItem = { id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...taskInput, scheduledTime: adjustedTime, completed: false };
    setState((prev) => ({ ...prev, tasks: [...prev.tasks, newTask].sort((a, b) => timeToMinutes(a.scheduledTime) - timeToMinutes(b.scheduledTime)), updatedAt: new Date().toISOString() }));
  }, [prayers, t.schedule.conflictNotice]);

  const toggleTask = useCallback((id: string) => setState((p) => ({ ...p, tasks: p.tasks.map((tk) => (tk.id === id ? { ...tk, completed: !tk.completed } : tk)), updatedAt: new Date().toISOString() })), []);
  const deleteTask = useCallback((id: string) => setState((p) => ({ ...p, tasks: p.tasks.filter((tk) => tk.id !== id), updatedAt: new Date().toISOString() })), []);

  const detectLocation = useCallback(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setState((p) => ({ ...p, location: { ...p.location, city: `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`, latitude: pos.coords.latitude, longitude: pos.coords.longitude, autoDetected: true }, updatedAt: new Date().toISOString() })),
      () => setToast(state.language === 'ar' ? 'طھط¹ط°ط± طھط­ط¯ظٹط¯ ط§ظ„ظ…ظˆظ‚ط¹.' : 'Location permission denied.')
    );
  }, [state.language]);

  const applyAIActions = useCallback((actions: AIAction[]) => {
    for (const action of actions) {
      if (action.type === 'START_TIMER') startTimer(String(action.payload?.label || 'Focus'), Number(action.payload?.minutes) || 45, 2);
      else if (action.type === 'ADD_TASK') addTask({ title: String(action.payload?.title || 'Task'), scheduledTime: String(action.payload?.scheduledTime || '12:00'), durationMinutes: Number(action.payload?.durationMinutes) || 45, category: (action.payload?.category as TaskCategory) || 'study' });
      else if (action.type === 'COMPLETE_TASK' || action.type === 'UNCOMPLETE_TASK') {
        const q = String(action.payload?.titleQuery || '').toLowerCase(), done = action.type === 'COMPLETE_TASK';
        setState((p) => ({ ...p, tasks: p.tasks.map((i) => (i.title.toLowerCase().includes(q) ? { ...i, completed: done } : i)), updatedAt: new Date().toISOString() }));
      } else if (action.type === 'DELETE_TASK') {
        const q = String(action.payload?.titleQuery || '').toLowerCase();
        setState((p) => ({ ...p, tasks: p.tasks.filter((i) => !i.title.toLowerCase().includes(q)), updatedAt: new Date().toISOString() }));
      } else if (action.type === 'OPEN_APP') PhoneControl.openApp(String(action.payload?.appName || '')).catch(() => {});
      else if (action.type === 'SET_ALARM') PhoneControl.setAlarm(Number(action.payload?.hour ?? 7), Number(action.payload?.minute ?? 0), String(action.payload?.message || 'Physics')).catch(() => {});
      else if (action.type === 'TOGGLE_FLASHLIGHT') PhoneControl.toggleFlashlight(Boolean(action.payload?.enabled ?? true)).catch(() => {});
      else if (action.type === 'SET_VOLUME') PhoneControl.setVolume(Number(action.payload?.level ?? 50)).catch(() => {});
      else if (action.type === 'CALL_PHONE') PhoneControl.callPhone(String(action.payload?.target || '')).catch(() => {});
      else if (action.type === 'OPEN_SYSTEM_PANEL') PhoneControl.openSystemPanel(String(action.payload?.panel || 'wifi')).catch(() => {});
    }
  }, [addTask, startTimer]);

  const speakRef = useRef<(text: string) => void>(() => {});
  const handleSendToAssistant = useCallback(async (text: string, fromVoice = false) => {
    const userMsg: ChatMessage = { id: `m-${Date.now()}`, role: 'user', text, timestamp: new Date().toISOString() };
    setState((p) => ({ ...p, chatHistory: [...p.chatHistory, userMsg].slice(-40) }));
    setIsThinking(true);
    const result = await queryPhysicsAI(text, {
      appLanguage: state.language, userProfile: state.userProfile, todaySchedule: state.tasks,
      prayerTimes: prayers, yesterdaySummary: state.performanceHistory[0] || null, todayFocusMinutes: state.todayFocusMinutes,
    });
    if (result.actions?.length) applyAIActions(result.actions);
    const botMsg: ChatMessage = { id: `m-${Date.now() + 1}`, role: 'assistant', text: result.reply, timestamp: new Date().toISOString() };
    setState((p) => ({ ...p, chatHistory: [...p.chatHistory, botMsg].slice(-40), updatedAt: new Date().toISOString() }));
    setIsThinking(false);
    if (fromVoice || state.voiceReplyEnabled) speakRef.current(result.reply);
  }, [applyAIActions, prayers, state.language, state.performanceHistory, state.tasks, state.todayFocusMinutes, state.userProfile, state.voiceReplyEnabled]);

  const voice = useVoiceAssistant({
    language: state.language, wakeWordEnabled: state.wakeWordEnabled && Boolean(state.userProfile),
    voiceReplyEnabled: state.voiceReplyEnabled, onCommand: (transcript) => handleSendToAssistant(transcript, true),
  });
  speakRef.current = voice.speak;

  const handleOnboardingComplete = (profile: UserProfile) => {
    requestNotificationPermission();
    const initialTasks = generateInitialScheduleFromProfile(profile, prayers, state.language);
    const welcomeText = state.language === 'ar' ? `ط£ظ‡ظ„ط§ظ‹ ${profile.name}. طھظ… ط¨ظ†ط§ط، ط¬ط¯ظˆظ„ظƒ ط§ظ„ظٹظˆظ…ظٹ.` : `Welcome ${profile.name}. Your daily schedule is ready.`;
    setState((p) => ({ ...p, userProfile: profile, tasks: initialTasks, chatHistory: [{ id: `m-welcome-${Date.now()}`, role: 'assistant', text: welcomeText, timestamp: new Date().toISOString() }], updatedAt: new Date().toISOString() }));
  };

  const todayStats: DailyPerformance = useMemo(() => {
    const total = state.tasks.length, completed = state.tasks.filter((x) => x.completed).length;
    return { date: state.currentDate, totalTasks: total, completedTasks: completed, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0, focusMinutes: state.todayFocusMinutes };
  }, [state.currentDate, state.tasks, state.todayFocusMinutes]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1F2937]">
      <Header language={state.language} onLanguageChange={(lang: AppLanguage) => setState((p) => ({ ...p, language: lang, updatedAt: new Date().toISOString() }))} onOpenReview={() => setShowReview(true)} onOpenSettings={() => setShowSettings(true)} cloudSynced={cloudSynced} showNavActions={Boolean(state.userProfile)} />
      {toast && <div className="fixed bottom-5 end-5 z-50 rounded-xl border border-[#E5E7EB] bg-[#1F2937] px-4 py-2.5 text-xs font-medium text-[#FFFFFF] shadow-lg">{toast}</div>}
      {!state.userProfile ? <OnboardingView language={state.language} onComplete={handleOnboardingComplete} /> : (
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <ScheduleSection language={state.language} tasks={state.tasks} onAddTask={addTask} onToggleTask={toggleTask} onDeleteTask={deleteTask} onStartTaskTimer={(tk) => startTimer(tk.title, tk.durationMinutes, 2, tk.id)} />
              <AssistantPanel language={state.language} messages={state.chatHistory} isThinking={isThinking} voiceSupported={voice.isSupported} isListening={voice.isListening} isWakeListening={voice.isWakeListening} wakeWordEnabled={state.wakeWordEnabled} onToggleWakeWord={() => setState((p) => ({ ...p, wakeWordEnabled: !p.wakeWordEnabled, updatedAt: new Date().toISOString() }))} onPushToTalk={voice.togglePushToTalk} onSendMessage={(m) => handleSendToAssistant(m, false)} />
            </div>
            <div className="space-y-6 lg:col-span-5">
              <TimerPanel language={state.language} presets={state.timerPresets} activeTimer={activeTimer} onStartTimer={(l, m, pre) => startTimer(l, m, pre)} onTogglePause={() => setActiveTimer((p) => (p ? { ...p, isRunning: !p.isRunning } : null))} onResetTimer={() => setActiveTimer(null)} />
              <PrayerTimesPanel language={state.language} location={state.location} prayers={prayers} nowMs={nowMs} alertsEnabled={state.prayerNotificationsEnabled} onToggleAlerts={() => { requestNotificationPermission(); setState((p) => ({ ...p, prayerNotificationsEnabled: !p.prayerNotificationsEnabled, updatedAt: new Date().toISOString() })); }} onDetectLocation={detectLocation} />
            </div>
          </div>
        </main>
      )}
      {showReview && <PerformanceReviewModal language={state.language} todayStats={todayStats} yesterdayStats={state.performanceHistory[0] || null} onClose={() => setShowReview(false)} onAskAiReview={() => handleSendToAssistant(state.language === 'ar' ? 'ظ‚ظٹظ‘ظ… ط£ط¯ط§ط¦ظٹ ط§ظ„ظٹظˆظ… ظ…ظ‚ط§ط±ظ†ط© ط¨ط£ظ…ط³.' : 'How did I do today compared to yesterday?')} />}
      {showSettings && <SettingsModal state={state} onClose={() => setShowSettings(false)} onSave={(partial) => setState((p) => ({ ...p, ...partial, updatedAt: new Date().toISOString() }))} onResetOnboarding={() => setState((p) => ({ ...p, userProfile: null, tasks: [], chatHistory: [], updatedAt: new Date().toISOString() }))} />}
    </div>
  );
}