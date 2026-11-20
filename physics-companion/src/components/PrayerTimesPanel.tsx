import React from 'react';
import { Bell, BellOff, Compass, MapPin } from 'lucide-react';
import { AppLanguage, LocationConfig, PrayerTimeEntry } from '../types';
import { getTranslations } from '../i18n/translations';
import { formatCountdownMs } from '../utils/dateUtils';
import { getNextPrayer } from '../utils/prayerTimes';

interface PrayerTimesPanelProps {
  language: AppLanguage; location: LocationConfig; prayers: PrayerTimeEntry[]; nowMs: number;
  alertsEnabled: boolean; onToggleAlerts: () => void; onDetectLocation: () => void;
}

export const PrayerTimesPanel: React.FC<PrayerTimesPanelProps> = ({
  language, location, prayers, nowMs, alertsEnabled, onToggleAlerts, onDetectLocation,
}) => {
  const t = getTranslations(language);
  const next = getNextPrayer(prayers, nowMs);

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Compass className="h-4 w-4 text-[#374151]" /><h2 className="text-base font-semibold tracking-tight text-[#1F2937]">{t.prayers.title}</h2></div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={onDetectLocation} className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-2 py-1 text-[11px] font-medium text-[#374151]"><MapPin className="h-3 w-3 text-[#6B7280]" /><span>{location.city}</span></button>
          <button type="button" onClick={onToggleAlerts} className={`rounded-lg border p-1.5 ${alertsEnabled ? 'border-[#374151] bg-[#374151] text-[#FFFFFF]' : 'border-[#E5E7EB] bg-[#FAFAFA] text-[#6B7280]'}`}>{alertsEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}</button>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3">
        <div><p className="text-[11px] font-medium text-[#6B7280]">{t.prayers.nextPrayer}</p><p className="text-sm font-semibold text-[#1F2937]">{t.prayers.names[next.prayer.name]} <span className="tabular-nums font-normal text-[#6B7280]">({next.prayer.time24})</span></p></div>
        <div className="text-end"><p className="text-[11px] text-[#6B7280]">{t.prayers.in}</p><p className="tabular-nums text-base font-semibold text-[#1F2937]">{formatCountdownMs(next.remainingMs)}</p></div>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {prayers.map((p) => {
          const isNext = p.name === next.prayer.name && p.timestamp > nowMs;
          const isPassed = p.timestamp <= nowMs;
          return (
            <div key={p.name} className={`rounded-xl border px-1.5 py-2 text-center ${isNext ? 'border-[#374151] bg-[#F1F3F5]' : isPassed ? 'border-[#E5E7EB] bg-[#FAFAFA] opacity-60' : 'border-[#E5E7EB] bg-[#FFFFFF]'}`}>
              <span className="block text-[11px] font-medium text-[#6B7280]">{t.prayers.names[p.name]}</span>
              <span className="tabular-nums mt-0.5 block text-xs font-semibold text-[#1F2937]">{p.time24}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-[#6B7280]">{t.prayers.bufferNote}</p>
    </section>
  );
};