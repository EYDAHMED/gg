import { AIResponsePayload, AppLanguage, DailyPerformance, PrayerTimeEntry, TaskCategory, TaskItem, UserProfile } from '../types';
import { minutesToTime, timeToMinutes } from '../utils/dateUtils';
import { avoidPrayerConflict, getNextPrayer } from '../utils/prayerTimes';

interface AIContext {
  appLanguage: AppLanguage;
  userProfile: UserProfile | null;
  todaySchedule: TaskItem[];
  prayerTimes: PrayerTimeEntry[];
  yesterdaySummary: DailyPerformance | null;
  todayFocusMinutes: number;
}

export function buildSystemPrompt(ctx: AIContext): string {
  const langLabel = ctx.appLanguage === 'ar' ? 'Arabic (ط§ظ„ط¹ط±ط¨ظٹط©)' : 'English';
  const remaining = ctx.todaySchedule.filter((t) => !t.completed);
  const completed = ctx.todaySchedule.filter((t) => t.completed);

  return `You are "Physics", a comprehensive personal assistant for daily life management, time tracking, prayer times, accountability, phone control, and smart behavioral/routine analysis.
Your style is practical, direct, clear, and conciseâ€”no unnecessary fluff.

Core Operating Rules:
1. Language Control: Always respond strictly in the user's active selected language (\`app_language\`: ${langLabel}).
2. Wake Word & Immediate Response: When called by name ("Physics" / "Hey Physics" / "ظ‡ظٹظ‡ ظپظٹط²ظٹظƒط³") or given a direct command, respond immediately and clearly.
3. One-Time Onboarding: If \`user_profile\` is empty, conduct concise onboarding.
4. Timers & Prayer Times: Support creating/starting timers and respect daily prayer times.
5. Daily Schedule & Performance Comparison: Summarize Completed vs Remaining and compare today vs previous day (better or worse, with brief reason).
6. Dynamic Updates & Phone Control: Return structured actions to update tasks, start timers, or control the Android phone (open app, set alarm, flashlight, volume, call contact/number, open Wi-Fi/Bluetooth settings).

Live Context:
- app_language: ${langLabel}
- user_profile: ${JSON.stringify(ctx.userProfile)}
- today_schedule: ${JSON.stringify({ completed, remaining, todayFocusMinutes: ctx.todayFocusMinutes })}
- prayer_times: ${JSON.stringify(ctx.prayerTimes.map((p) => ({ name: p.name, time: p.time24 })))}
- yesterday_summary: ${JSON.stringify(ctx.yesterdaySummary)}

Return ONLY valid JSON:
{
  "reply": "Your response strictly in ${langLabel}",
  "actions": [
    // { "type": "ADD_TASK", "payload": { "title": "...", "scheduledTime": "HH:mm", "durationMinutes": 45, "category": "study" } }
    // { "type": "COMPLETE_TASK", "payload": { "titleQuery": "..." } }
    // { "type": "START_TIMER", "payload": { "label": "...", "minutes": 45 } }
    // { "type": "OPEN_APP", "payload": { "appName": "WhatsApp" } }
    // { "type": "SET_ALARM", "payload": { "hour": 6, "minute": 30, "message": "Wake up" } }
    // { "type": "TOGGLE_FLASHLIGHT", "payload": { "enabled": true } }
    // { "type": "SET_VOLUME", "payload": { "level": 60 } }
    // { "type": "CALL_PHONE", "payload": { "target": "Ahmed" } }
    // { "type": "OPEN_SYSTEM_PANEL", "payload": { "panel": "wifi" } }
  ]
}`;
}

export function generateInitialScheduleFromProfile(profile: UserProfile, prayers: PrayerTimeEntry[], lang: AppLanguage): TaskItem[] {
  const wakeMin = timeToMinutes(profile.wakeTime || '06:30');
  const peakMap: Record<UserProfile['peakFocusWindow'], number> = {
    morning: Math.max(wakeMin + 45, 420), afternoon: 780, evening: 1050, night: 1260,
  };
  let cursor = peakMap[profile.peakFocusWindow] || wakeMin + 60;
  const duration = profile.focusBlockMinutes || 45;
  const priorities = profile.priorities.length ? profile.priorities : lang === 'ar' ? ['ط¬ظ„ط³ط© طھط±ظƒظٹط² ط£ط³ط§ط³ظٹط©', 'ظ…ط±ط§ط¬ط¹ط© ط§ظ„ظ…ط´ط±ظˆط¹', 'طھظ…ط±ظٹظ† ط¨ط¯ظ†ظٹ'] : ['Core Study Block', 'Deep Project Session', 'Training / Workout'];

  const tasks: TaskItem[] = priorities.slice(0, 4).map((priority, idx) => {
    const { adjustedTime } = avoidPrayerConflict(minutesToTime(cursor), duration, prayers, 15);
    cursor = timeToMinutes(adjustedTime) + duration + 30;
    const lower = priority.toLowerCase();
    let category: TaskCategory = 'study';
    if (lower.includes('train') || lower.includes('طھظ…ط±ظٹظ†') || lower.includes('ط±ظٹط§ط¶')) category = 'training';
    else if (lower.includes('work') || lower.includes('ط¹ظ…ظ„')) category = 'work';
    else if (lower.includes('project') || lower.includes('ظ…ط´ط±ظˆط¹')) category = 'project';
    else if (lower.includes('personal') || lower.includes('ط´ط®طµ') || lower.includes('read') || lower.includes('ظ‚ط±ط§ط،')) category = 'personal';
    return { id: `task-init-${Date.now()}-${idx}`, title: priority, scheduledTime: adjustedTime, durationMinutes: duration, category, completed: false };
  });

  const reviewRaw = minutesToTime(Math.max(timeToMinutes(profile.sleepTime) - 75, cursor));
  const { adjustedTime: reviewTime } = avoidPrayerConflict(reviewRaw, 15, prayers, 15);
  tasks.push({ id: `task-init-review-${Date.now()}`, title: lang === 'ar' ? 'ظ…ط±ط§ط¬ط¹ط© ط§ظ„ظٹظˆظ… ظˆط§ظ„طھط®ط·ظٹط· ظ„ظ„ط؛ط¯' : 'Daily Check-in & Tomorrow Prep', scheduledTime: reviewTime, durationMinutes: 15, category: 'personal', completed: false });
  return tasks.sort((a, b) => timeToMinutes(a.scheduledTime) - timeToMinutes(b.scheduledTime));
}

function parseJsonResponse(rawText: string): AIResponsePayload | null {
  try {
    const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.reply === 'string') return { reply: parsed.reply, actions: Array.isArray(parsed.actions) ? parsed.actions : [] };
    return null;
  } catch { return null; }
}

export async function queryPhysicsAI(userInput: string, ctx: AIContext): Promise<AIResponsePayload> {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (apiKey && !String(apiKey).startsWith('your_')) {
    const systemPrompt = buildSystemPrompt(ctx);
    const trimmedKey = String(apiKey).trim();
    try {
      const isGemini = trimmedKey.startsWith('AIza') || trimmedKey.startsWith('AQ.');
      if (isGemini) {
        const model = import.meta.env.VITE_AI_MODEL || 'gemini-2.5-flash';
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': trimmedKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userInput }] }],
            generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return parseJsonResponse(text) || (text ? { reply: text, actions: [] } : localCompanionFallback(userInput, ctx));
        }
      } else {
        const baseUrl = import.meta.env.VITE_AI_BASE_URL || 'https://api.openai.com/v1';
        const model = import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini';
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${trimmedKey}` },
          body: JSON.stringify({ model, temperature: 0.3, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userInput }] }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content || '';
          return parseJsonResponse(text) || (text ? { reply: text, actions: [] } : localCompanionFallback(userInput, ctx));
        }
      }
    } catch {}
  }
  return localCompanionFallback(userInput, ctx);
}

function localCompanionFallback(input: string, ctx: AIContext): AIResponsePayload {
  const q = input.trim(), lower = q.toLowerCase(), isAr = ctx.appLanguage === 'ar';
  const completed = ctx.todaySchedule.filter((t) => t.completed), remaining = ctx.todaySchedule.filter((t) => !t.completed);

  if (lower.includes('flashlight') || lower.includes('torch') || q.includes('ظƒط´ط§ظپ') || q.includes('ظپظ„ط§ط´')) {
    const off = lower.includes('off') || q.includes('ط§ط·ظپ') || q.includes('ط§ظ‚ظپظ„');
    return { reply: isAr ? (off ? 'طھظ… ط¥ظٹظ‚ط§ظپ ط§ظ„ظƒط´ط§ظپ.' : 'طھظ… طھط´ط؛ظٹظ„ ط§ظ„ظƒط´ط§ظپ.') : (off ? 'Flashlight off.' : 'Flashlight on.'), actions: [{ type: 'TOGGLE_FLASHLIGHT', payload: { enabled: !off } }] };
  }
  const openEn = q.match(/^open\s+(.+)$/i), openAr = q.match(/^(?:ط§ظپطھط­|ط´ط؛ظ„)\s+(.+)$/);
  if (openEn || openAr) {
    const appName = (openEn?.[1] || openAr?.[1] || '').trim();
    if (lower.includes('wifi') || q.includes('ظˆط§ظٹ ظپط§ظٹ')) return { reply: isAr ? 'طھظ… ظپطھط­ ط§ظ„ظˆط§ظٹ ظپط§ظٹ.' : 'Opening Wi-Fi.', actions: [{ type: 'OPEN_SYSTEM_PANEL', payload: { panel: 'wifi' } }] };
    return { reply: isAr ? `ط¬ط§ط±ظچ ظپطھط­ ${appName}.` : `Opening ${appName}.`, actions: [{ type: 'OPEN_APP', payload: { appName } }] };
  }
  const callEn = q.match(/^call\s+(.+)$/i), callAr = q.match(/^(?:ط§طھطµظ„ ط¨ظ€|ط§طھطµظ„ ط¹ظ„ظ‰|ط§طھطµظ„|ظƒظ„ظ…)\s+(.+)$/);
  if (callEn || callAr) {
    const target = (callEn?.[1] || callAr?.[1] || '').trim();
    return { reply: isAr ? `ط¬ط§ط±ظچ ط§ظ„ط§طھطµط§ظ„ ط¨ظ€ ${target}.` : `Calling ${target}.`, actions: [{ type: 'CALL_PHONE', payload: { target } }] };
  }
  const alarmMatch = q.match(/(?:alarm|ظ…ظ†ط¨ظ‡).*?(\d{1,2})(?::(\d{2}))?/i);
  if (alarmMatch) {
    const hour = Math.max(0, Math.min(23, parseInt(alarmMatch[1], 10))), minute = alarmMatch[2] ? Math.max(0, Math.min(59, parseInt(alarmMatch[2], 10))) : 0;
    return { reply: isAr ? `طھظ… ط¶ط¨ط· ط§ظ„ظ…ظ†ط¨ظ‡ ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}.` : `Alarm set for ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}.`, actions: [{ type: 'SET_ALARM', payload: { hour, minute, message: 'Physics' } }] };
  }
  const timerMatch = q.match(/(\d+)\s*(?:min|minute|minutes|m|ط¯ظ‚ظٹظ‚ط©|ط¯ظ‚ط§ط¦ظ‚|ط¯)/i);
  if (timerMatch && (lower.includes('timer') || lower.includes('start') || lower.includes('study') || q.includes('ظ…ط¤ظ‚طھ') || q.includes('ط§ط¨ط¯ط£'))) {
    const minutes = Math.max(1, Math.min(180, parseInt(timerMatch[1], 10)));
    const label = lower.includes('study') || q.includes('ظ…ط°ط§ظƒط±') ? (isAr ? 'ظ…ط°ط§ظƒط±ط©' : 'Study') : (isAr ? 'طھط±ظƒظٹط²' : 'Focus');
    return { reply: isAr ? `ط¨ط¯ط£طھ ظ…ط¤ظ‚طھ "${label}" ظ„ظ…ط¯ط© ${minutes} ط¯ظ‚ظٹظ‚ط©.` : `Started ${minutes}-minute "${label}" timer.`, actions: [{ type: 'START_TIMER', payload: { label, minutes } }] };
  }
  const doneEn = q.match(/(?:mark|complete|finish)\s+(.+?)(?:\s+as\s+(?:done|complete|completed))?$/i), doneAr = q.match(/(?:ط£ظ†ظ‡ظٹطھ|ط§ظ†ظ‡ظٹطھ|طھظ… ط¥ظ†ط¬ط§ط²|ط£ظƒظ…ظ„طھ|ط®ظ„طµطھ)\s+(.+)$/);
  if (doneEn || doneAr) {
    const matched = remaining.find((t) => t.title.toLowerCase().includes((doneEn?.[1] || doneAr?.[1] || '').trim().toLowerCase()));
    if (matched) return { reply: isAr ? `طھظ… طھط­ط¯ظٹط¯ "${matched.title}" ظƒظ…ظƒطھظ…ظ„ط©.` : `Marked "${matched.title}" as completed.`, actions: [{ type: 'COMPLETE_TASK', payload: { titleQuery: matched.title } }] };
  }
  if (lower.includes('compare') || lower.includes('yesterday') || q.includes('ط£ظ…ط³') || q.includes('ظ…ظ‚ط§ط±ظ†ط©')) {
    const total = ctx.todaySchedule.length, rate = total > 0 ? Math.round((completed.length / total) * 100) : 0, prev = ctx.yesterdaySummary;
    if (!prev) return { reply: isAr ? `ط£ظ†ط¬ط²طھ ط§ظ„ظٹظˆظ… ${completed.length}/${total} (${rate}%). ظ„ط§ ظٹظˆط¬ط¯ ط³ط¬ظ„ ظ„ط£ظ…ط³ ط¨ط¹ط¯.` : `Today: ${completed.length}/${total} (${rate}%). No previous day recorded yet.`, actions: [] };
    const diff = rate - prev.completionRate;
    return { reply: isAr ? `ط§ظ„ظٹظˆظ… ${rate}% ظ…ظ‚ط§ط¨ظ„ ${prev.completionRate}% ط£ظ…ط³ (${diff >= 0 ? '+' : ''}${diff}%).` : `Today ${rate}% vs ${prev.completionRate}% yesterday (${diff >= 0 ? '+' : ''}${diff}%).`, actions: [] };
  }
  if (lower.includes('prayer') || q.includes('طµظ„ط§') || q.includes('ط£ط°ط§ظ†')) {
    const next = getNextPrayer(ctx.prayerTimes);
    return { reply: isAr ? `ط§ظ„طµظ„ط§ط© ط§ظ„ظ‚ط§ط¯ظ…ط© ${next.prayer.name} ط§ظ„ط³ط§ط¹ط© ${next.prayer.time24}.` : `Next prayer is ${next.prayer.name} at ${next.prayer.time24}.`, actions: [] };
  }
  if (lower.includes('left') || lower.includes('schedule') || q.includes('طھط¨ظ‚ظ‰') || q.includes('ظ…طھط¨ظ‚ظٹ') || q.includes('ط¬ط¯ظˆظ„')) {
    if (!remaining.length) return { reply: isAr ? `ط£ظ†ظ‡ظٹطھ ط¬ظ…ظٹط¹ ظ…ظ‡ط§ظ… ط§ظ„ظٹظˆظ….` : `All tasks for today are completed.`, actions: [] };
    return { reply: isAr ? `ط§ظ„ظ…طھط¨ظ‚ظٹ (${remaining.length}): ${remaining.map((t) => `${t.scheduledTime} ${t.title}`).join('طŒ ')}` : `Remaining (${remaining.length}): ${remaining.map((t) => `${t.scheduledTime} ${t.title}`).join('; ')}`, actions: [] };
  }
  return { reply: isAr ? `ط£ظ†ط§ ط¬ط§ظ‡ط². ظ„ط¯ظٹظƒ ${remaining.length} ظ…ظ‡ط§ظ… ظ…طھط¨ظ‚ظٹط© ط§ظ„ظٹظˆظ….` : `Ready. You have ${remaining.length} tasks remaining today.`, actions: [] };
}