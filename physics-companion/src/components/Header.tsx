import React from 'react';
import { BarChart2, Cloud, Globe, HardDrive, Settings } from 'lucide-react';
import { AppLanguage } from '../types';
import { getTranslations } from '../i18n/translations';

interface HeaderProps {
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  onOpenReview: () => void;
  onOpenSettings: () => void;
  cloudSynced: boolean;
  showNavActions: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  language, onLanguageChange, onOpenReview, onOpenSettings, cloudSynced, showNavActions,
}) => {
  const t = getTranslations(language);
  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-[#FFFFFF]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F1F3F5]">
            <svg viewBox="0 0 32 32" className="h-5 w-5 text-[#1F2937]" fill="none">
              <circle cx="16" cy="16" r="8.5" stroke="currentColor" strokeWidth="1.75" />
              <ellipse cx="16" cy="16" rx="12" ry="4.8" transform="rotate(-30 16 16)" stroke="#6B7280" strokeWidth="1.4" />
              <circle cx="16" cy="16" r="2.2" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-[#1F2937]">{t.appName}</h1>
              <span className="hidden items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-2 py-0.5 text-[11px] font-medium text-[#6B7280] sm:inline-flex">
                {cloudSynced ? <Cloud className="h-3 w-3" /> : <HardDrive className="h-3 w-3" />}
                {cloudSynced ? t.nav.cloudSynced : t.nav.syncSaved}
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">{t.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onLanguageChange(language === 'en' ? 'ar' : 'en')} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-2.5 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#F1F3F5]">
            <Globe className="h-3.5 w-3.5 text-[#6B7280]" />
            <span>{language === 'en' ? 'ط§ظ„ط¹ط±ط¨ظٹط©' : 'English'}</span>
          </button>
          {showNavActions && (
            <>
              <button type="button" onClick={onOpenReview} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-2.5 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#F1F3F5]">
                <BarChart2 className="h-3.5 w-3.5 text-[#6B7280]" /><span className="hidden sm:inline">{t.nav.review}</span>
              </button>
              <button type="button" onClick={onOpenSettings} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-2.5 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#F1F3F5]">
                <Settings className="h-3.5 w-3.5 text-[#6B7280]" /><span className="hidden sm:inline">{t.nav.settings}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};