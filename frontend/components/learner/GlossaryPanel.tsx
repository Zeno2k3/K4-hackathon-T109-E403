'use client';

import { useEffect } from 'react';
import type { GlossaryTerm } from './types';

type GlossaryPanelProps = {
  open: boolean;
  onClose: () => void;
  terms: Record<string, GlossaryTerm>;
  selectedTerm: string | null;
  onSelectTerm: (term: string) => void;
};

export function GlossaryPanel({ open, onClose, terms, selectedTerm, onSelectTerm }: GlossaryPanelProps) {
  const termKeys = Object.keys(terms);

  useEffect(() => {
    if (open && !selectedTerm && termKeys.length > 0) {
      onSelectTerm(termKeys[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  const active = selectedTerm ? terms[selectedTerm] : null;

  return (
    <>
      <div className="fixed inset-0 bg-black/45 z-40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Từ điển thuật ngữ"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(880px,94vw)] h-[min(640px,86vh)] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-[0_24px_60px_rgba(10,20,40,0.28)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border dark:border-slate-700 flex-none">
          <h3 className="m-0 text-xl font-bold text-accent dark:text-blue-300">Từ điển thuật ngữ</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng từ điển"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#45536c] dark:text-slate-400 hover:bg-[#f0f4fa] dark:hover:bg-slate-800"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex min-h-0 flex-col sm:flex-row">
          <div
            role="listbox"
            aria-label="Danh sách từ khóa"
            className="w-full sm:w-[240px] flex-none border-b sm:border-b-0 sm:border-r border-border dark:border-slate-700 overflow-y-auto p-3 max-h-[140px] sm:max-h-none"
          >
            {termKeys.map((term) => (
              <button
                key={term}
                type="button"
                role="option"
                aria-selected={term === selectedTerm}
                onClick={() => onSelectTerm(term)}
                className={`block w-full text-left px-3.5 py-3 mb-1 rounded-lg text-[15px] font-semibold ${
                  term === selectedTerm
                    ? 'bg-[#eef4fb] dark:bg-blue-950 text-brand-blue dark:text-blue-300'
                    : 'text-ink dark:text-slate-200 hover:bg-[#f3f6fb] dark:hover:bg-slate-800'
                }`}
              >
                {term}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            {active ? (
              <>
                <h4 className="m-0 mb-3.5 text-2xl font-bold text-accent dark:text-blue-300">{active.term}</h4>
                <p className="m-0 text-[15px] leading-relaxed text-[#33445e] dark:text-slate-300 max-w-[560px]">
                  {active.def}
                </p>
                {active.example && (
                  <div className="mt-5 max-w-[560px] bg-[#f6f8fb] dark:bg-slate-800 border-l-[3px] border-brand-blue rounded-lg px-4 py-3.5">
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-brand-blue mb-1">
                      Ví dụ
                    </span>
                    <p className="m-0 text-[13.5px] leading-relaxed text-[#45536c] dark:text-slate-400">
                      {active.example}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="italic text-muted dark:text-slate-500">Chọn một từ khóa bên trái để xem giải thích.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
