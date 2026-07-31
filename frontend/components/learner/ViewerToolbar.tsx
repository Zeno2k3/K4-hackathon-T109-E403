'use client';

import { useEffect, useRef, useState } from 'react';
import type { ViewerMode } from './types';

type ViewerToolbarProps = {
  mode: ViewerMode;
  onModeChange: (mode: ViewerMode) => void;
  pageLabel: string;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onNote: () => void;
  onSummary: () => void;
  onDownload: () => void;
  onExport: () => void;
  onUndo: () => void;
  onClear: () => void;
  onOpenGlossary: () => void;
};

const MODE_ITEMS: { key: ViewerMode; label: string; path: string }[] = [
  { key: 'read', label: 'Đọc', path: 'M3 11l18-8-8 18-2-8-8-2z' },
  { key: 'pen', label: 'Bút', path: 'M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z' },
  { key: 'highlight', label: 'Highlight', path: 'M9 11l6-6 4 4-6 6H9v-4z' },
];

export function ViewerToolbar({
  mode,
  onModeChange,
  pageLabel,
  zoom,
  onZoomIn,
  onZoomOut,
  onNote,
  onSummary,
  onDownload,
  onExport,
  onUndo,
  onClear,
  onOpenGlossary,
}: ViewerToolbarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setMoreOpen(false);
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  return (
    <div
      role="toolbar"
      aria-label="Công cụ xem tài liệu"
      className="flex flex-wrap items-center gap-1.5 px-2.5 py-2 mx-1 mb-2.5 bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-2xl shadow-card"
    >
      <div role="group" aria-label="Chế độ tương tác" className="flex items-center gap-0.5 bg-[#f3f6fb] dark:bg-slate-800 rounded-xl p-[3px]">
        {MODE_ITEMS.map((item) => {
          const active = mode === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onModeChange(item.key)}
              aria-pressed={active}
              title={`Chế độ ${item.label.toLowerCase()}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap ${
                active
                  ? 'bg-white dark:bg-slate-700 text-brand-blue dark:text-blue-300 shadow-sm'
                  : 'text-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200'
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={item.path} />
              </svg>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}

        <div ref={moreRef} className="relative">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={moreOpen}
            aria-label="Thêm tùy chọn"
            title="Thêm tùy chọn"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="19" cy="12" r="1.8" />
            </svg>
          </button>
          {moreOpen && (
            <div
              role="menu"
              aria-label="Tùy chọn khác"
              className="absolute top-[calc(100%+8px)] left-0 min-w-[220px] bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl shadow-[0_8px_24px_rgba(10,20,40,0.14)] p-1.5 z-20"
            >
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  onNote();
                }}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] text-ink dark:text-slate-100 hover:bg-[#f3f6fb] dark:hover:bg-slate-700 text-left"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted dark:text-slate-400" aria-hidden="true">
                  <path d="M4 4h16v12H8l-4 4V4z" />
                </svg>
                Ghi chú cho trang này
              </button>
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  onSummary();
                }}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] text-ink dark:text-slate-100 hover:bg-[#f3f6fb] dark:hover:bg-slate-700 text-left"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted dark:text-slate-400" aria-hidden="true">
                  <path d="M4 6h16M4 12h10M4 18h7" />
                </svg>
                Tóm tắt nội dung slide
              </button>
            </div>
          )}
        </div>
      </div>

      <span className="hidden md:block w-px h-6 bg-border dark:bg-slate-700" aria-hidden="true" />

      <div role="status" className="px-3.5 py-1.5 rounded-pill bg-[#eef4fb] dark:bg-blue-950 text-accent dark:text-blue-300 text-[13px] font-semibold whitespace-nowrap">
        {pageLabel}
      </div>

      <span className="hidden md:block w-px h-6 bg-border dark:bg-slate-700" aria-hidden="true" />

      <div role="group" aria-label="Thu phóng" className="flex items-center gap-0.5 bg-[#f7f9fc] dark:bg-slate-800 rounded-lg p-1">
        <button type="button" onClick={onZoomOut} aria-label="Thu nhỏ" className="flex items-center justify-center rounded-md text-ink dark:text-slate-200 hover:bg-[#eaf0f9] dark:hover:bg-slate-700 text-base leading-none w-[26px] h-[26px]">
          −
        </button>
        <span className="min-w-[48px] text-center text-[13px] font-semibold text-ink dark:text-slate-200">{zoom}%</span>
        <button type="button" onClick={onZoomIn} aria-label="Phóng to" className="flex items-center justify-center rounded-md text-ink dark:text-slate-200 hover:bg-[#eaf0f9] dark:hover:bg-slate-700 text-base leading-none w-[26px] h-[26px]">
          +
        </button>
      </div>

      <span className="hidden md:block w-px h-6 bg-border dark:bg-slate-700" aria-hidden="true" />

      <div className="flex items-center gap-0.5">
        <button type="button" onClick={onDownload} aria-label="Tải xuống tài liệu" title="Tải xuống tài liệu" className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45536c] dark:text-slate-400 hover:bg-[#f0f4fa] dark:hover:bg-slate-800">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" />
          </svg>
        </button>
        <button type="button" onClick={onExport} aria-label="Xuất trang hiện tại" title="Xuất trang hiện tại" className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45536c] dark:text-slate-400 hover:bg-[#f0f4fa] dark:hover:bg-slate-800">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
            <path d="M12 12v6m0 0l-2.5-2.5M12 18l2.5-2.5" />
          </svg>
        </button>
        <button type="button" onClick={onUndo} aria-label="Hoàn tác thao tác gần nhất" title="Hoàn tác" className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45536c] dark:text-slate-400 hover:bg-[#f0f4fa] dark:hover:bg-slate-800">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 10h10a5 5 0 0 1 0 10h-2" />
            <path d="M3 10l4-4M3 10l4 4" />
          </svg>
        </button>
        <button type="button" onClick={onClear} aria-label="Xóa toàn bộ highlight và ghi chú của trang" title="Xóa toàn bộ trên trang này" className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45536c] dark:text-slate-400 hover:bg-[#fdeceb] hover:text-[#c93a3a] dark:hover:bg-red-950">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0l1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12" />
          </svg>
        </button>
      </div>

      <div className="ml-auto flex-none">
        <button
          type="button"
          onClick={onOpenGlossary}
          aria-haspopup="true"
          title="Từ điển thuật ngữ"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cdd9ee] dark:border-blue-800 bg-white dark:bg-slate-800 text-brand-blue dark:text-blue-300 text-[13px] font-semibold hover:bg-[#f5f9ff] dark:hover:bg-slate-700"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span className="hidden sm:inline">Từ khóa</span>
        </button>
      </div>
    </div>
  );
}
