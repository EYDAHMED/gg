import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { AppLanguage, UserProfile } from '../types';
import { getTranslations } from '../i18n/translations';

interface OnboardingViewProps { language: AppLanguage; onComplete: (profile: UserProfile) => void; }

export const OnboardingView: React.FC<OnboardingViewProps> = ({ language, onComplete }) => {
  const t = getTranslations(language);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [peakFocusWindow, setPeakFocusWindow] = useState<UserProfile['peakFocusWindow']>('morning');
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([t.onboarding.prioritiesList[0], t.onboarding.prioritiesList[1]]);
  const [customPriority, setCustomPriority] = useState('');
  const [focusBlockMinutes, setFocusBlockMinutes] = useState(45);
  const [strictness, setStrictness] = useState<UserProfile['strictness']>('balanced');
  const [traits, setTraits] = useState('');

  const togglePriority = (item: string) => setSelectedPriorities((prev) => (prev.includes(item) ? prev.filter((p) => p !== item) : [...prev, item]));
  const addCustomPriority = () => {
    const trimmed = customPriority.trim();
    if (!trimmed) return;
    if (!selectedPriorities.includes(trimmed)) setSelectedPriorities((p) => [...p, trimmed]);
    setCustomPriority('');
  };
  const handleSubmit = () => {
    const priorities = selectedPriorities.length ? selectedPriorities : [t.onboarding.prioritiesList[0]];
    onComplete({
      name: name.trim() || (language === 'ar' ? 'طµط¯ظٹظ‚ظٹ' : 'Friend'),
      wakeTime, sleepTime, peakFocusWindow, priorities, focusBlockMinutes, strictness,
      personalitySummary: traits.trim() || `${focusBlockMinutes}m blocks (${strictness})`,
      createdAt: new Date().toISOString(),
    });
  };
  const ForwardIcon = language === 'ar' ? ArrowLeft : ArrowRight;
  const BackIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <span className="rounded-full border border-[#E5E7EB] bg-[#F1F3F5] px-3 py-1 text-xs font-medium text-[#374151]">{t.onboarding.badge}</span>
          <span className="tabular-nums text-xs font-medium text-[#6B7280]">{t.onboarding.stepOf} {step} {t.onboarding.of} 3</span>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#1F2937]">{t.onboarding.title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[#6B7280]">{t.onboarding.subtitle}</p>
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-[#F1F3F5]">
          <div className="h-full rounded-full bg-[#374151] transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
        {step === 1 && (
          <div className="mt-7 space-y-5">
            <div><h3 className="text-sm font-semibold text-[#1F2937]">{t.onboarding.q1Title}</h3><p className="mt-0.5 text-xs text-[#6B7280]">{t.onboarding.q1Prompt}</p></div>
            <div><label className="mb-1.5 block text-xs font-medium text-[#374151]">{t.onboarding.nameLabel}</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.onboarding.namePlaceholder} className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3.5 py-2.5 text-sm text-[#1F2937]" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="mb-1.5 block text-xs font-medium text-[#374151]">{t.onboarding.wakeLabel}</label><input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="tabular-nums w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3.5 py-2.5 text-sm text-[#1F2937]" /></div>
              <div><label className="mb-1.5 block text-xs font-medium text-[#374151]">{t.onboarding.sleepLabel}</label><input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} className="tabular-nums w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3.5 py-2.5 text-sm text-[#1F2937]" /></div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-[#374151]">{t.onboarding.peakLabel}</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(['morning', 'afternoon', 'evening', 'night'] as const).map((key) => (
                  <button key={key} type="button" onClick={() => setPeakFocusWindow(key)} className={`rounded-xl border px-3.5 py-2.5 text-start text-xs font-medium ${peakFocusWindow === key ? 'border-[#374151] bg-[#374151] text-[#FFFFFF]' : 'border-[#E5E7EB] bg-[#FAFAFA] text-[#374151]'}`}>{t.onboarding.peaks[key]}</button>
                ))}
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="mt-7 space-y-5">
            <div><h3 className="text-sm font-semibold text-[#1F2937]">{t.onboarding.q2Title}</h3><p className="mt-0.5 text-xs text-[#6B7280]">{t.onboarding.q2Prompt}</p></div>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set([...t.onboarding.prioritiesList, ...selectedPriorities])).map((item) => {
                const active = selectedPriorities.includes(item);
                return (
                  <button key={item} type="button" onClick={() => togglePriority(item)} className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium ${active ? 'border-[#374151] bg-[#374151] text-[#FFFFFF]' : 'border-[#E5E7EB] bg-[#FAFAFA] text-[#374151]'}`}>
                    {active && <Check className="h-3.5 w-3.5" />}<span>{item}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input type="text" value={customPriority} onChange={(e) => setCustomPriority(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomPriority())} placeholder={t.onboarding.customPriorityPlaceholder} className="flex-1 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3.5 py-2.5 text-sm text-[#1F2937]" />
              <button type="button" onClick={addCustomPriority} className="rounded-xl border border-[#E5E7EB] bg-[#F1F3F5] px-4 py-2 text-xs font-medium text-[#1F2937]">+</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="mt-7 space-y-5">
            <div><h3 className="text-sm font-semibold text-[#1F2937]">{t.onboarding.q3Title}</h3><p className="mt-0.5 text-xs text-[#6B7280]">{t.onboarding.q3Prompt}</p></div>
            <div>
              <label className="mb-2 block text-xs font-medium text-[#374151]">{t.onboarding.blockLabel}</label>
              <div className="grid grid-cols-3 gap-2.5">
                {[25, 45, 60].map((mins) => (
                  <button key={mins} type="button" onClick={() => setFocusBlockMinutes(mins)} className={`tabular-nums rounded-xl border py-2.5 text-xs font-medium ${focusBlockMinutes === mins ? 'border-[#374151] bg-[#374151] text-[#FFFFFF]' : 'border-[#E5E7EB] bg-[#FAFAFA] text-[#374151]'}`}>{mins} {t.review.minutes}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-[#374151]">{t.onboarding.strictnessLabel}</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(['gentle', 'balanced', 'strict'] as const).map((level) => (
                  <button key={level} type="button" onClick={() => setStrictness(level)} className={`rounded-xl border px-3 py-2.5 text-xs font-medium ${strictness === level ? 'border-[#374151] bg-[#374151] text-[#FFFFFF]' : 'border-[#E5E7EB] bg-[#FAFAFA] text-[#374151]'}`}>{t.onboarding.strictness[level]}</button>
                ))}
              </div>
            </div>
            <textarea rows={2} value={traits} onChange={(e) => setTraits(e.target.value)} placeholder={t.onboarding.traitsPlaceholder} className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3.5 py-2.5 text-sm text-[#1F2937]" />
          </div>
        )}
        <div className="mt-8 flex items-center justify-between border-t border-[#E5E7EB] pt-5">
          {step > 1 ? <button type="button" onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] px-4 py-2 text-xs font-medium text-[#374151]"><BackIcon className="h-3.5 w-3.5" /><span>{t.onboarding.back}</span></button> : <div />}
          {step < 3 ? <button type="button" onClick={() => setStep((s) => s + 1)} className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F2937] px-5 py-2.5 text-xs font-medium text-[#FFFFFF]"><span>{t.onboarding.next}</span><ForwardIcon className="h-3.5 w-3.5" /></button>
            : <button type="button" onClick={handleSubmit} className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F2937] px-5 py-2.5 text-xs font-medium text-[#FFFFFF]"><Check className="h-3.5 w-3.5" /><span>{t.onboarding.finish}</span></button>}
        </div>
      </div>
    </div>
  );
};