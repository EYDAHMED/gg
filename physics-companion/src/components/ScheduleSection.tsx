import React, { useState } from 'react';
import { CheckCircle2, Circle, Play, Plus, Trash2 } from 'lucide-react';
import { AppLanguage, TaskCategory, TaskItem } from '../types';
import { getTranslations } from '../i18n/translations';

interface ScheduleSectionProps {
  language: AppLanguage; tasks: TaskItem[];
  onAddTask: (task: Omit<TaskItem, 'id' | 'completed'>) => void;
  onToggleTask: (id: string) => void; onDeleteTask: (id: string) => void; onStartTaskTimer: (task: TaskItem) => void;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  language, tasks, onAddTask, onToggleTask, onDeleteTask, onStartTaskTimer,
}) => {
  const t = getTranslations(language);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [category, setCategory] = useState<TaskCategory>('study');
  const remaining = tasks.filter((item) => !item.completed);
  const completed = tasks.filter((item) => item.completed);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask({ title: title.trim(), scheduledTime, durationMinutes: Math.max(5, durationMinutes), category });
    setTitle(''); setShowAdd(false);
  };

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[#1F2937]">{t.schedule.title}</h2>
          <p className="tabular-nums mt-0.5 text-xs text-[#6B7280]">{completed.length} / {tasks.length} {t.schedule.completed}</p>
        </div>
        <button type="button" onClick={() => setShowAdd((s) => !s)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-1.5 text-xs font-medium text-[#1F2937] hover:bg-[#F1F3F5]">
          <Plus className="h-3.5 w-3.5" /><span>{t.schedule.addTask}</span>
        </button>
      </div>
      {showAdd && (
        <form onSubmit={handleAddSubmit} className="mt-4 space-y-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.schedule.taskPlaceholder} className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 py-2 text-sm text-[#1F2937]" autoFocus />
          <div className="grid grid-cols-3 gap-2.5">
            <div><label className="mb-1 block text-[11px] text-[#6B7280]">{t.schedule.timeLabel}</label><input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="tabular-nums w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-2.5 py-1.5 text-xs text-[#1F2937]" /></div>
            <div><label className="mb-1 block text-[11px] text-[#6B7280]">{t.schedule.durationLabel}</label><input type="number" min={5} max={240} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="tabular-nums w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-2.5 py-1.5 text-xs text-[#1F2937]" /></div>
            <div><label className="mb-1 block text-[11px] text-[#6B7280]">{t.schedule.categoryLabel}</label><select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)} className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-2 py-1.5 text-xs text-[#1F2937]">{(['study', 'work', 'training', 'project', 'personal'] as TaskCategory[]).map((c) => (<option key={c} value={c}>{t.schedule.categories[c]}</option>))}</select></div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 py-1.5 text-xs text-[#6B7280]">{t.schedule.cancel}</button>
            <button type="submit" className="rounded-lg bg-[#1F2937] px-4 py-1.5 text-xs font-medium text-[#FFFFFF]">{t.schedule.add}</button>
          </div>
        </form>
      )}
      <div className="mt-6">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">{t.schedule.remaining}</h3>
          <span className="tabular-nums rounded-full bg-[#F1F3F5] px-2 py-0.5 text-[11px] font-medium text-[#374151]">{remaining.length}</span>
        </div>
        {remaining.length === 0 ? <p className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-4 py-5 text-center text-xs text-[#6B7280]">{t.schedule.emptyRemaining}</p> : (
          <ul className="space-y-2">
            {remaining.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] px-3.5 py-3">
                <div className="flex min-w-0 items-start gap-3">
                  <button type="button" onClick={() => onToggleTask(task.id)} className="mt-0.5 text-[#6B7280] hover:text-[#1F2937]"><Circle className="h-[18px] w-[18px]" /></button>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#1F2937]">{task.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#6B7280]">
                      <span className="tabular-nums font-medium text-[#374151]">{task.scheduledTime}</span><span>آ·</span>
                      <span className="tabular-nums">{task.durationMinutes} {t.review.minutes}</span>
                      <span className="rounded-md bg-[#F1F3F5] px-1.5 py-0.5 text-[10px] font-medium text-[#374151]">{t.schedule.categories[task.category]}</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => onStartTaskTimer(task)} className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-1.5 text-[#374151]"><Play className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => onDeleteTask(task.id)} className="rounded-lg p-1.5 text-[#9CA3AF] hover:text-[#374151]"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-7 border-t border-[#E5E7EB] pt-5">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">{t.schedule.completed}</h3>
          <span className="tabular-nums rounded-full bg-[#F1F3F5] px-2 py-0.5 text-[11px] font-medium text-[#6B7280]">{completed.length}</span>
        </div>
        {completed.length === 0 ? <p className="rounded-xl bg-[#FAFAFA] px-4 py-4 text-center text-xs text-[#6B7280]">{t.schedule.emptyCompleted}</p> : (
          <ul className="space-y-2">
            {completed.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3.5 py-2.5 opacity-80">
                <div className="flex min-w-0 items-center gap-3">
                  <button type="button" onClick={() => onToggleTask(task.id)} className="text-[#374151]"><CheckCircle2 className="h-[18px] w-[18px]" /></button>
                  <div className="min-w-0"><p className="truncate text-sm text-[#6B7280] line-through">{task.title}</p><p className="tabular-nums text-[11px] text-[#9CA3AF]">{task.scheduledTime} آ· {task.durationMinutes} {t.review.minutes}</p></div>
                </div>
                <button type="button" onClick={() => onDeleteTask(task.id)} className="rounded-lg p-1.5 text-[#9CA3AF]"><Trash2 className="h-3.5 w-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};