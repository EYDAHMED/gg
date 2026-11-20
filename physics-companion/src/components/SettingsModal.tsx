import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AppLanguage, AppState, CalculationMethod } from '../types';
import { getTranslations } from '../i18n/translations';
import { PRESET_CITIES } from '../utils/prayerTimes';
import { PhoneControl, isAndroidNative } from '../services/phoneControlService';

interface SettingsModalProps {
  state: AppState; onClose: () => void; onSave: (partial: Partial<AppState>) => void; onResetOnboarding: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ state, onClose, onSave, onResetOnboarding }) => {
  const t = getTranslations(state.language);
  const [language, setLanguage] = useState<AppLanguage>(state.language);
  const [city, setCity] = useState(state.location.city);
  const [latitude, setLatitude] = useState(state.location.latitude);
  const [longitude, setLongitude] = useState(state.location.longitude);
  const [method, setMethod] = useState<CalculationMethod>(state.location.method);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(state.wakeWordEnabled);
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(state.voiceReplyEnabled);
  const [syncId, setSyncId] = useState(state.syncId);

  const handlePresetCity = (presetName: string) => {
    const found = PRESET_CITIES.find((c) => c.name === presetName);
    if (!found) return;
    setCity(found.name); setLatitude(found.lat); setLongitude(found.lng); setMethod(found.method);
  };

  const handleSave = () => {
    onSave({
      language, location: { city: city.trim() || 'Cairo', latitude, longitude, method, autoDetected: false },
      wakeWordEnabled, voiceReplyEnabled, syncId: syncId.trim() || state.syncId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2937]/30 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <h2 className="text-base font-semibold text-[#1F2937]">{t.settings.title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-[#6B7280]"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 space-y-5">
          <div>
            <label className="mb-2 block text-xs font-medium text-[#374151]">{t.settings.language}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['en', 'ar'] as AppLanguage[]).map((lang) => (
                <button key={lang} type="button" onClick={() => setLanguage(lang)} className={`rounded-xl border py-2 text-xs font-medium ${language === lang ? 'border-[#374151] bg-[#374151] text-[#FFFFFF]' : 'border-[#E5E7EB] bg-[#FAFAFA] text-[#374151]'}`}>{lang === 'en' ? 'English (LTR)' : 'ط§ظ„ط¹ط±ط¨ظٹط© (RTL)'}</button>
              ))}
            </div>
          </div>
          <div className="space-y-3 border-t border-[#E5E7EB] pt-4">
            <label className="block text-xs font-medium text-[#374151]">{t.settings.location}</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CITIES.map((c) => (<button key={c.name} type="button" onClick={() => handlePresetCity(c.name)} className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium ${city === c.name ? 'border-[#374151] bg-[#374151] text-[#FFFFFF]' : 'border-[#E5E7EB] bg-[#FAFAFA] text-[#374151]'}`}>{c.name}</button>))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder={t.settings.cityPlaceholder} className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-xs text-[#1F2937]" />
              <select value={method} onChange={(e) => setMethod(e.target.value as CalculationMethod)} className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-2.5 py-2 text-xs text-[#1F2937]">
                {(['Egypt', 'MWL', 'UmmAlQura', 'ISNA'] as CalculationMethod[]).map((m) => (<option key={m} value={m}>{t.settings.methods[m]}</option>))}
              </select>
            </div>
          </div>
          <div className="space-y-2.5 border-t border-[#E5E7EB] pt-4">
            <p className="text-xs font-medium text-[#374151]">{t.settings.voiceSettings}</p>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3.5 py-2.5 text-xs text-[#1F2937]"><span>{t.settings.wakeWordToggle}</span><input type="checkbox" checked={wakeWordEnabled} onChange={(e) => setWakeWordEnabled(e.target.checked)} className="h-4 w-4 accent-[#374151]" /></label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3.5 py-2.5 text-xs text-[#1F2937]"><span>{t.settings.voiceReplyToggle}</span><input type="checkbox" checked={voiceReplyEnabled} onChange={(e) => setVoiceReplyEnabled(e.target.checked)} className="h-4 w-4 accent-[#374151]" /></label>
            {isAndroidNative() && (
              <button type="button" onClick={() => PhoneControl.setupPermissionsAndOverlay()} className="w-full rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] px-3.5 py-2 text-xs font-medium text-[#1F2937]">
                {language === 'ar' ? 'ظ…ظ†ط­ طµظ„ط§ط­ظٹط© ط§ظ„ط¸ظ‡ظˆط± ظپظˆظ‚ ط§ظ„طھط·ط¨ظٹظ‚ط§طھ ظˆط§ظ„ظ…ط§ظٹظƒط±ظˆظپظˆظ†' : 'Grant Overlay & Mic Permissions (for Hey Physics)'}
              </button>
            )}
          </div>
          <div className="space-y-2 border-t border-[#E5E7EB] pt-4">
            <label className="block text-xs font-medium text-[#374151]">{t.settings.syncTitle}</label>
            <input type="text" value={syncId} onChange={(e) => setSyncId(e.target.value)} className="tabular-nums w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-xs text-[#1F2937]" />
          </div>
          <div className="border-t border-[#E5E7EB] pt-4">
            <button type="button" onClick={() => { if (window.confirm(t.settings.resetConfirm)) { onResetOnboarding(); onClose(); } }} className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3.5 py-2 text-xs font-medium text-[#6B7280]">{t.settings.resetProfile}</button>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-[#E5E7EB] pt-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] px-4 py-2 text-xs font-medium text-[#374151]">{t.schedule.cancel}</button>
          <button type="button" onClick={handleSave} className="rounded-xl bg-[#1F2937] px-5 py-2 text-xs font-medium text-[#FFFFFF]">{t.settings.save}</button>
        </div>
      </div>
    </div>
  );
};