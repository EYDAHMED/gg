import React from 'react';
import { Minus, TrendingDown, TrendingUp, X } from 'lucide-react';
import { AppLanguage, DailyPerformance } from '../types';
import { getTranslations } from '../i18n/translations';

interface PerformanceReviewModalProps {
  language: AppLanguage; todayStats: DailyPerformance; yesterdayStats: DailyPerformance | null;
  onClose: () => void; onAskAiReview: () => void;
}

export const PerformanceReviewModal: React.FC<PerformanceReviewModalProps> = ({
  language, todayStats, yesterdayStats, onClose, onAskAiReview,
}) => {
  const t = getTranslations(language);
  const delta = yesterdayStats ? todayStats.completionRate - yesterdayStats.completionRate : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2937]/30 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <h2 className="text-base font-semibold text-[#1F2937]">{t.review.title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-[#6B7280]"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
            <p className="text-xs font-medium text-[#6B7280]">{t.review.today}</p>
            <p className="tabular-nums mt-2 text-2xl font-semibold text-[#1F2937]">{todayStats.completionRate}%</p>
            <p className="tabular-nums mt-1 text-xs text-[#6B7280]">{todayStats.completedTasks} / {todayStats.totalTasks} آ· {todayStats.focusMinutes} {t.review.minutes}</p>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
            <p className="text-xs font-medium text-[#6B7280]">{t.review.yesterday}</p>
            {yesterdayStats ? (
              <><p className="tabular-nums mt-2 text-2xl font-semibold text-[#374151]">{yesterdayStats.completionRate}%</p><p className="tabular-nums mt-1 text-xs text-[#6B7280]">{yesterdayStats.completedTasks} / {yesterdayStats.totalTasks} آ· {yesterdayStats.focusMinutes} {t.review.minutes}</p></>
            ) : <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">{t.review.noYesterday}</p>}
          </div>
        </div>
        {yesterdayStats && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F1F3F5] px-4 py-3 text-xs font-medium text-[#1F2937]">
            {delta > 0 ? <TrendingUp className="h-4 w-4" /> : delta < 0 ? <TrendingDown className="h-4 w-4 text-[#6B7280]" /> : <Minus className="h-4 w-4 text-[#6B7280]" />}
            <span>{delta > 0 ? t.review.better : delta < 0 ? t.review.worse : t.review.same} ({delta > 0 ? `+${delta}%` : `${delta}%`})</span>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] px-4 py-2 text-xs font-medium text-[#374151]">{t.review.close}</button>
          <button type="button" onClick={() => { onAskAiReview(); onClose(); }} className="rounded-xl bg-[#1F2937] px-4 py-2 text-xs font-medium text-[#FFFFFF]">{t.review.askAiReview}</button>
        </div>
      </div>
    </div>
  );
};