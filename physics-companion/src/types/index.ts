export type AppLanguage = 'en' | 'ar';
export type TaskCategory = 'study' | 'work' | 'training' | 'personal' | 'project';

export interface TaskItem {
  id: string;
  title: string;
  scheduledTime: string;
  durationMinutes: number;
  category: TaskCategory;
  completed: boolean;
  completedAt?: string;
}

export interface UserProfile {
  name: string;
  wakeTime: string;
  sleepTime: string;
  peakFocusWindow: 'morning' | 'afternoon' | 'evening' | 'night';
  priorities: string[];
  focusBlockMinutes: number;
  strictness: 'gentle' | 'balanced' | 'strict';
  personalitySummary: string;
  createdAt: string;
}

export interface DailyPerformance {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  focusMinutes: number;
}

export interface TimerPreset { id: string; label: string; minutes: number; }

export interface ActiveTimer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  preAlertMinutes: number;
  preAlertSent: boolean;
  linkedTaskId?: string;
}

export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
export interface PrayerTimeEntry { name: PrayerName; time24: string; timestamp: number; }
export type CalculationMethod = 'Egypt' | 'MWL' | 'UmmAlQura' | 'ISNA';

export interface LocationConfig {
  city: string;
  latitude: number;
  longitude: number;
  method: CalculationMethod;
  autoDetected: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface AppState {
  syncId: string;
  language: AppLanguage;
  userProfile: UserProfile | null;
  currentDate: string;
  tasks: TaskItem[];
  timerPresets: TimerPreset[];
  todayFocusMinutes: number;
  performanceHistory: DailyPerformance[];
  location: LocationConfig;
  prayerNotificationsEnabled: boolean;
  wakeWordEnabled: boolean;
  voiceReplyEnabled: boolean;
  chatHistory: ChatMessage[];
  updatedAt: string;
}

export interface AIAction {
  type:
    | 'ADD_TASK' | 'COMPLETE_TASK' | 'UNCOMPLETE_TASK' | 'DELETE_TASK'
    | 'START_TIMER' | 'OPEN_APP' | 'SET_ALARM' | 'TOGGLE_FLASHLIGHT'
    | 'SET_VOLUME' | 'CALL_PHONE' | 'OPEN_SYSTEM_PANEL';
  payload: Record<string, any>;
}

export interface AIResponsePayload { reply: string; actions: AIAction[]; }