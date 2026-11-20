import React, { useState } from 'react';
import { Bell, Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { ActiveTimer, AppLanguage, TimerPreset } from '../types';
import { getTranslations } from '../i18n/translations';
import { formatSeconds } from '../utils/dateUtils';

interface TimerPanelProps {
  language: AppLanguage; presets: TimerPreset[]; activeTimer: ActiveTimer | null;
  onStartTimer: (label: string, minutes: number, preAlertMinutes?: number) => void;
  onTogglePause: () => void; onResetTimer: () => void;
}

export const TimerPanel: React.FC<TimerPanelProps> = ({
  language, presets, activeTimer, onStartTimer, onTogglePause, onResetTimer,
}) => {
  const t = getTranslations(language);
  const [customLabel, setCustomLabel] = useState('');
  const [customMinutes, setCustomMinutes] = useState(30);
  const [preAlertMin, setPreAlertMin] = useState(2);
  const progress = activeTimer ? ((activeTimer.totalSeconds - activeTimer.remainingSeconds) / activeTimer.totalSeconds) * 100 : 0;

  const handleCustomStart = (e: React.FormEvent) => {
    e.preventDefault();
    onStartTimer(customLabel.trim() || (language === 'ar' ? 'طھط±ظƒظٹط² ظ…ط®طµطµ' : 'Custom Focus'), Math.max(1, customMinutes), Math.max(0, preAlertMin));
  };

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Timer className="h-4 w-4 text-[#374151]" /><h2 className="text-base font-semibold tracking-tight text-[#1F2937]">{t.timer.title}</h2></div>
        {activeTimer && <span className="inline-flex items-center gap-1 rounded-full bg-[#F1F3F5] px-2.5 py-0.5 text-[11px] font-medium text-[#374151]"><Bell className="h-3 w-3" />{activeTimer.preAlertMinutes}m</span>}
      </div>
      {activeTimer ? (
        <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4 text-center">
          <p className="text-xs font-medium text-[#6B7280]">{activeTimer.label}</p>
          <p className="tabular-nums mt-2 text-4xl font-semibold tracking-tight text-[#1F2937]">{formatSeconds(activeTimer.remainingSeconds)}</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]"><div className="h-full rounded-full bg-[#374151] transition-all duration-500" style={{ width: `${Math.min(100, progress)}%` }} /></div>
          <div className="mt-4 flex justify-center gap-2">
            <button type="button" onClick={onTogglePause} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1F2937] px-4 py-1.5 text-xs font-medium text-[#FFFFFF]">
              {activeTimer.isRunning ? <><Pause className="h-3.5 w-3.5" /><span>{t.timer.pause}</span></> : <><Play className="h-3.5 w-3.5" /><span>{t.timer.resume}</span></>}
            </button>
            <button type="button" onClick={onResetTimer} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#374151]"><RotateCcw className="h-3.5 w-3.5" /><span>{t.timer.reset}</span></button>
          </div>
        </div>
      ) : <p className="mt-3 rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-4 py-4 text-center text-xs text-[#6B7280]">{t.timer.idleHint}</p>}
      <div className="mt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">{t.timer.presets}</p>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset) => (
            <button key={preset.id} type="button" onClick={() => onStartTimer(preset.label, preset.minutes, preAlertMin)} className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-2.5 py-2 text-center hover:border-[#374151]">
              <span className="block truncate text-xs font-medium text-[#1F2937]">{preset.label}</span>
              <span className="tabular-nums text-[11px] text-[#6B7280]">{preset.minutes} {t.review.minutes}</span>
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={handleCustomStart} className="mt-4 grid grid-cols-12 gap-2">
        <input type="text" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder={t.timer.customPlaceholder} className="col-span-5 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-2.5 py-1.5 text-xs text-[#1F2937]" />
        <input type="number" min={1} max={240} value={customMinutes} onChange={(e) => setCustomMinutes(Number(e.target.value))} className="tabular-nums col-span-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-2 py-1.5 text-xs text-[#1F2937]" />
        <input type="number" min={0} max={30} value={preAlertMin} onChange={(e) => setPreAlertMin(Number(e.target.value))} title={t.timer.preAlert} className="tabular-nums col-span-2 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-2 py-1.5 text-xs text-[#6B7280]" />
        <button type="submit" className="col-span-2 rounded-lg bg-[#1F2937] px-2 py-1.5 text-xs font-medium text-[#FFFFFF]">{t.timer.start}</button>
      </form>
    </section>
  );
};