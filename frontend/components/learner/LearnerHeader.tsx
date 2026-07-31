'use client';

import type { Theme } from '@/lib/useTheme';

type LearnerHeaderProps = {
  fileName: string;
  courseCode: string;
  theme: Theme;
  lang: 'vi' | 'en';
  onBack: () => void;
  onToggleTheme: () => void;
  onToggleLang: () => void;
  onToggleSidebar: () => void;
  onToggleChat: () => void;
};

export function LearnerHeader({
  fileName,
  courseCode,
  theme,
  lang,
  onBack,
  onToggleTheme,
  onToggleLang,
  onToggleSidebar,
  onToggleChat,
}: LearnerHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 md:px-5 py-2.5 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-700 flex-none">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Quay lại"
          title="Quay lại"
          className="w-9 h-9 flex-none flex items-center justify-center rounded-lg text-muted hover:bg-[#f0f4fa] dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Danh sách học liệu"
          title="Danh sách học liệu"
          className="w-9 h-9 flex-none flex items-center justify-center rounded-lg text-muted hover:bg-[#f0f4fa] dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2 font-extrabold text-lg text-accent dark:text-blue-300 flex-none">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2l9 5-9 5-9-5 9-5z" opacity="0.35" />
            <path d="M3 12l9 5 9-5v6l-9 5-9-5v-6z" />
          </svg>
          <span className="hidden sm:inline">VLearn</span>
        </div>

        <span className="hidden md:block w-px h-6 bg-border dark:bg-slate-700 flex-none" aria-hidden="true" />

        <div className="hidden md:flex items-center gap-2 min-w-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted dark:text-slate-500 flex-none" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
            <path d="M14 2v6h6" />
          </svg>
          <div className="min-w-0 leading-tight">
            <div className="text-sm font-semibold text-ink dark:text-slate-100 truncate">{fileName}</div>
            <div className="text-[11px] text-muted dark:text-slate-500">{courseCode}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-none">
        <button
          type="button"
          onClick={onToggleChat}
          aria-label="Trợ lý VLearn Tutor"
          title="Trợ lý VLearn Tutor"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:bg-[#f0f4fa] dark:text-slate-400 dark:hover:bg-slate-800 xl:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onToggleLang}
          aria-pressed={lang === 'en'}
          title="Đổi ngôn ngữ"
          className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-border dark:border-slate-700 text-muted dark:text-slate-400 hover:bg-[#f0f4fa] dark:hover:bg-slate-800"
        >
          {lang.toUpperCase()}
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          title="Đổi giao diện sáng/tối"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:bg-[#f0f4fa] dark:text-slate-400 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.7 15.3A8.5 8.5 0 0 1 8.7 3.3a.5.5 0 0 0-.6-.7A10 10 0 1 0 21.4 15.9a.5.5 0 0 0-.7-.6z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
