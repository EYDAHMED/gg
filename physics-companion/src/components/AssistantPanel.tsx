import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Radio, Send } from 'lucide-react';
import { AppLanguage, ChatMessage } from '../types';
import { getTranslations } from '../i18n/translations';

interface AssistantPanelProps {
  language: AppLanguage; messages: ChatMessage[]; isThinking: boolean; voiceSupported: boolean;
  isListening: boolean; isWakeListening: boolean; wakeWordEnabled: boolean;
  onToggleWakeWord: () => void; onPushToTalk: () => void; onSendMessage: (text: string) => void;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  language, messages, isThinking, voiceSupported, isListening, isWakeListening, wakeWordEnabled, onToggleWakeWord, onPushToTalk, onSendMessage,
}) => {
  const t = getTranslations(language);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isThinking]);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!input.trim() || isThinking) return; onSendMessage(input.trim()); setInput(''); };

  return (
    <section className="flex flex-col rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[#1F2937]">{t.assistant.title}</h2>
          <p className="mt-0.5 text-[11px] text-[#6B7280]">{voiceSupported ? (isWakeListening ? t.assistant.wakeActive : t.assistant.wakeInactive) : t.assistant.voiceUnsupported}</p>
        </div>
        {voiceSupported && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={onToggleWakeWord} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium ${wakeWordEnabled ? 'border-[#374151] bg-[#374151] text-[#FFFFFF]' : 'border-[#E5E7EB] bg-[#FAFAFA] text-[#374151]'}`}><Radio className="h-3.5 w-3.5" /><span>{language === 'ar' ? 'ظ‡ظٹظ‡ ظپظٹط²ظٹظƒط³' : 'Hey Physics'}</span></button>
            <button type="button" onClick={onPushToTalk} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${isListening ? 'border-[#1F2937] bg-[#1F2937] text-[#FFFFFF]' : 'border-[#E5E7EB] bg-[#FFFFFF] text-[#1F2937]'}`}>{isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}<span>{isListening ? t.assistant.listening : t.assistant.pushToTalk}</span></button>
          </div>
        )}
      </div>
      <div className="mt-4 h-64 space-y-2.5 overflow-y-auto rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-3.5">
        {messages.length === 0 && (
          <div className="space-y-2 py-2">{t.assistant.quickPrompts.map((p) => (<button key={p} type="button" onClick={() => onSendMessage(p)} className="block w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 py-2 text-start text-xs text-[#374151]">{p}</button>))}</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${msg.role === 'user' ? 'bg-[#374151] text-[#FFFFFF]' : 'border border-[#E5E7EB] bg-[#FFFFFF] text-[#1F2937]'}`}>{msg.text}</div>
          </div>
        ))}
        {isThinking && <div className="flex justify-start"><div className="rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] px-3.5 py-2 text-xs text-[#6B7280]">...</div></div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.assistant.placeholder} className="flex-1 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#1F2937]" />
        <button type="submit" disabled={isThinking || !input.trim()} className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F2937] px-4 py-2 text-xs font-medium text-[#FFFFFF] disabled:opacity-40"><Send className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t.assistant.send}</span></button>
      </form>
      <p className="mt-2.5 text-[11px] leading-relaxed text-[#6B7280]">{t.assistant.backgroundNote}</p>
    </section>
  );
};