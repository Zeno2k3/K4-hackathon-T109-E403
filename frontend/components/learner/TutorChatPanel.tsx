'use client';

import type { ChangeEvent, KeyboardEvent } from 'react';
import type { ChatMessage, PendingQuote } from './types';

type TutorChatPanelProps = {
  messages: ChatMessage[];
  activePage: number;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onNewChat: () => void;
  pendingQuote: PendingQuote | null;
  onClearPendingQuote: () => void;
  /** Mobile off-canvas drawer visibility. */
  open: boolean;
  onClose: () => void;
  /** Desktop (xl+) column collapse — independent from the mobile drawer. */
  collapsedDesktop: boolean;
  onToggleCollapsedDesktop: () => void;
};

function ContextLabel({ page }: { page: number }) {
  return (
    <div className="text-[11px] text-muted dark:text-slate-500 mt-3 mb-1 first:mt-0">
      Ngữ cảnh: Slide trang {page}
    </div>
  );
}

function QuoteCard({ page, text }: { page: number; text: string }) {
  return (
    <div className="mb-1.5 rounded-lg border border-[#cdd9ee] dark:border-blue-800 bg-[#eef4fb] dark:bg-blue-950/60 px-3 py-2 max-w-[85%] ml-auto">
      <div className="text-[10px] font-bold uppercase tracking-wide text-brand-blue dark:text-blue-300">
        Ngữ cảnh: Slide trang {page}
      </div>
      <div className="text-[13px] italic text-accent dark:text-blue-200 mt-0.5">&ldquo;{text}&rdquo;</div>
    </div>
  );
}

export function TutorChatPanel({
  messages,
  activePage,
  inputValue,
  onInputChange,
  onSend,
  onNewChat,
  pendingQuote,
  onClearPendingQuote,
  open,
  onClose,
  collapsedDesktop,
  onToggleCollapsedDesktop,
}: TutorChatPanelProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') onSend();
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onInputChange(e.target.value);
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 xl:hidden" onClick={onClose} aria-hidden="true" />}

      {collapsedDesktop && (
        <button
          type="button"
          onClick={onToggleCollapsedDesktop}
          aria-label="Hiện VLearn Tutor"
          title="Hiện VLearn Tutor"
          className="hidden xl:flex fixed right-2 top-1/2 -translate-y-1/2 z-20 w-6 h-14 items-center justify-center rounded-lg border border-border dark:border-slate-700 bg-card dark:bg-slate-900 text-muted dark:text-slate-400 shadow-card hover:text-brand-blue hover:border-[#cdd9ee]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-40 w-[340px] max-w-[90vw] transform transition-transform duration-200 ease-out
          xl:relative xl:z-auto xl:translate-x-0 xl:transition-[width,opacity] xl:duration-200
          ${open ? 'translate-x-0' : 'translate-x-full'}
          ${collapsedDesktop ? 'xl:w-0 xl:opacity-0 xl:overflow-hidden xl:pointer-events-none' : 'xl:w-[360px] xl:opacity-100'}
          flex-none flex flex-col min-h-0 p-3 xl:p-0 bg-bg dark:bg-slate-950 xl:bg-transparent`}
      >
        <div className="flex flex-col min-h-0 flex-1 w-[316px] xl:w-[360px] bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-xl shadow-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border dark:border-slate-700 flex-none flex-wrap">
            <div className="flex items-center gap-2 font-bold text-accent dark:text-blue-300 text-[15px]">
              VLearn Tutor
              <span
                className="w-2.5 h-2.5 rounded-full bg-emerald-500"
                title="Trợ lý học theo ngữ cảnh"
                aria-hidden="true"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleCollapsedDesktop}
                aria-label="Ẩn VLearn Tutor"
                title="Ẩn VLearn Tutor"
                className="hidden xl:flex w-8 h-8 items-center justify-center rounded-lg text-[#45536c] dark:text-slate-400 hover:bg-[#f0f4fa] dark:hover:bg-slate-800"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onNewChat}
                aria-label="Lịch sử trò chuyện"
                title="Lịch sử"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45536c] dark:text-slate-400 hover:bg-[#f0f4fa] dark:hover:bg-slate-800"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 10h10a5 5 0 0 1 0 10h-2" />
                  <path d="M3 10l4-4M3 10l4 4" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onNewChat}
                aria-label="Cuộc trò chuyện mới"
                title="Cuộc trò chuyện mới"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45536c] dark:text-slate-400 hover:bg-[#f0f4fa] dark:hover:bg-slate-800"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <span className="text-[11px] text-muted dark:text-slate-500 px-2 py-1 rounded-pill bg-[#f5f8fb] dark:bg-slate-800 whitespace-nowrap">
                Trang slide: {activePage}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3.5 py-3">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.contextPage !== undefined && <ContextLabel page={msg.contextPage} />}
                {msg.quote && <QuoteCard page={msg.contextPage ?? activePage} text={msg.quote} />}
                <div
                  className={`mb-2 px-3.5 py-2.5 rounded-xl text-[13.5px] leading-relaxed max-w-[85%] ${
                    msg.kind === 'user'
                      ? 'ml-auto bg-[#e6f1ff] dark:bg-blue-900/50 border border-[#d1e4ff] dark:border-blue-800 text-ink dark:text-slate-100'
                      : msg.variant === 'summary'
                        ? 'mx-auto bg-brand-blue text-white rounded-full px-5 max-w-[75%] text-center'
                        : 'bg-[#f5f7fb] dark:bg-slate-800 border border-[#e6eefe] dark:border-slate-700 text-ink dark:text-slate-100'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="px-3.5 pt-2 pb-3.5 border-t border-border dark:border-slate-700 flex-none">
            {pendingQuote && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-[#eef4fb] dark:bg-blue-950/60 border border-[#cdd9ee] dark:border-blue-800">
                <span className="flex-1 text-[12px] text-accent dark:text-blue-200 truncate">
                  Trích dẫn: <em>&ldquo;{pendingQuote.text}&rdquo;</em> (trang {pendingQuote.page})
                </span>
                <button
                  type="button"
                  onClick={onClearPendingQuote}
                  aria-label="Bỏ trích dẫn"
                  className="text-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200 flex-none"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                aria-label="Nhập câu hỏi"
                placeholder="Nhập câu hỏi hoặc bôi đen tài liệu..."
                className="flex-1 px-3 py-2.5 rounded-lg border border-[#d6dee9] dark:border-slate-700 bg-white dark:bg-slate-800 text-ink dark:text-slate-100 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue"
              />
              <button
                type="button"
                onClick={onSend}
                aria-label="Gửi câu hỏi"
                title="Gửi"
                className="w-10 flex-none flex items-center justify-center rounded-lg bg-brand-blue hover:bg-brand-blue-hover text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 12l16-7-6 16-2-7-8-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
