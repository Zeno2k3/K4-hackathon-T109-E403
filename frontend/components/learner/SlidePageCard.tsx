'use client';

import type { MouseEvent } from 'react';
import { Page } from 'react-pdf';
import type { PageTerm } from '@/lib/types';
import type { HighlightBox } from './types';

const PAGE_RENDER_WIDTH = 680;

type SlidePageCardProps = {
  materialTitle: string;
  pageNumber: number;
  totalPages: number;
  zoom: number;
  highlightMode: boolean;
  highlights: HighlightBox[];
  note?: string;
  terms: PageTerm[];
  onAddHighlight: (box: HighlightBox) => void;
  onKeywordSelect: (term: string) => void;
};

export function SlidePageCard({
  materialTitle,
  pageNumber,
  totalPages,
  zoom,
  highlightMode,
  highlights,
  note,
  terms,
  onAddHighlight,
  onKeywordSelect,
}: SlidePageCardProps) {
  function handleClick(e: MouseEvent<HTMLDivElement>) {
    if (!highlightMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const w = 140;
    const h = 34;
    const x = Math.max(8, e.clientX - rect.left - w / 2);
    const y = Math.max(8, e.clientY - rect.top - h / 2);
    onAddHighlight({ x, y, w, h });
  }

  return (
    <div className="w-full max-w-[760px] mx-auto mb-6">
      <div className="flex items-center justify-between mb-1.5 px-1 text-[11px] text-muted dark:text-slate-500">
        <span>
          Trang {pageNumber} / {totalPages}
        </span>
        <span className="truncate max-w-[50%]">{materialTitle}</span>
      </div>

      {terms.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1.5 px-1">
          {terms.map((term) => (
            <button
              key={term.id}
              type="button"
              onClick={() => onKeywordSelect(term.term_display)}
              title="Nhấp để hỏi VLearn Tutor về thuật ngữ này"
              className="px-2 py-0.5 rounded-pill text-[11px] font-semibold bg-[#eef4fb] text-brand-blue border border-[#cdd9ee] hover:bg-[#e2edfb] dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
            >
              {term.term_display}
            </button>
          ))}
        </div>
      )}

      <div
        onClick={handleClick}
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        className={`relative min-h-[420px] rounded-2xl shadow-card transition-transform overflow-hidden flex justify-center bg-[#fffdf9] dark:bg-slate-800 border border-border dark:border-slate-700 ${
          highlightMode ? 'cursor-crosshair' : ''
        }`}
      >
        <Page
          pageNumber={pageNumber}
          width={PAGE_RENDER_WIDTH}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={
            <div className="flex items-center justify-center min-h-[420px] w-full text-muted dark:text-slate-500 text-sm">
              Đang tải trang {pageNumber}...
            </div>
          }
          error={
            <div className="flex items-center justify-center min-h-[420px] w-full text-brand-red text-sm">
              Không thể tải trang {pageNumber}.
            </div>
          }
        />

        {highlights.map((box, idx) => (
          <div
            key={idx}
            className="absolute rounded-md bg-yellow-300/30 border-2 border-yellow-400/60 pointer-events-none"
            style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
          />
        ))}

        {note && (
          <div className="absolute right-4 bottom-4 max-w-[280px] bg-white/95 dark:bg-slate-900/95 text-ink dark:text-slate-100 rounded-xl shadow-[0_6px_20px_rgba(10,20,40,0.12)] p-3 text-[12.5px]">
            <strong className="text-accent dark:text-blue-300">Ghi chú</strong>
            <div className="mt-1.5 leading-relaxed">{note}</div>
          </div>
        )}
      </div>
    </div>
  );
}
