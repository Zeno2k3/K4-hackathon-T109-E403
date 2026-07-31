'use client';

import type { MouseEvent, ReactNode } from 'react';
import type { HighlightBox } from './types';

type SlidePageCardProps = {
  materialTitle: string;
  pageNumber: number;
  totalPages: number;
  zoom: number;
  highlightMode: boolean;
  highlights: HighlightBox[];
  note?: string;
  onAddHighlight: (box: HighlightBox) => void;
  onKeywordSelect: (term: string) => void;
};

function KeywordSpan({
  term,
  className = '',
  onSelect,
  children,
}: {
  term: string;
  className?: string;
  onSelect: (term: string) => void;
  children: ReactNode;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      title="Nhấp để hỏi VLearn Tutor về từ này"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(term);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onSelect(term);
        }
      }}
      className={`cursor-pointer rounded hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue ${className}`}
    >
      {children}
    </span>
  );
}

function CoverSlideContent({ onKeywordSelect }: { onKeywordSelect: (term: string) => void }) {
  return (
    <div className="flex flex-col h-full justify-between text-white">
      <div className="text-[11px] font-semibold tracking-[0.12em] uppercase opacity-80">
        AI IN ACTION — Day 1
      </div>
      <div>
        <h1 className="m-0 mb-3 text-[30px] font-extrabold leading-tight">
          <KeywordSpan term="LLM Foundation" onSelect={onKeywordSelect} className="decoration-white/60">
            AI &amp; LLM Foundation
          </KeywordSpan>
        </h1>
        <p className="m-0 text-[15px] italic opacity-90 max-w-[520px]">
          Bạn đang dùng AI mỗi ngày — nhưng thực sự bên trong nó đang làm gì?
        </p>
      </div>
      <div className="text-[13px] opacity-85">Instructor: Mai Anh Nguyen (Blue)</div>
    </div>
  );
}

function InstructorSlideContent() {
  return (
    <div>
      <h2 className="m-0 mb-1.5 text-[22px] font-bold text-ink dark:text-slate-100">Instructor</h2>
      <p className="text-[12px] text-muted dark:text-slate-500 text-right -mt-6 mb-4">
        Kéo đến trang này để mở note riêng của trang.
      </p>
      <div className="flex items-start gap-4 mt-6">
        <div
          className="w-16 h-16 rounded-full flex-none bg-gradient-to-br from-brand-blue to-accent flex items-center justify-center text-white font-bold text-lg"
          aria-hidden="true"
        >
          MA
        </div>
        <div className="min-w-0">
          <div className="font-bold text-ink dark:text-slate-100 text-[16px]">Mai Anh Nguyen (Blue)</div>
          <div className="text-muted dark:text-slate-500 text-[13px] mb-2">Generalist Product Builder</div>
          <ul className="m-0 p-0 list-none text-[13px] text-ink dark:text-slate-200 space-y-1">
            <li>
              <span className="text-muted dark:text-slate-500 mr-1.5">2026</span>
              FPT Long Châu (PM · Healthcare Product)
            </li>
            <li>
              <span className="text-muted dark:text-slate-500 mr-1.5">2025</span>
              Thongtincuuho.org (Co-founder)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function AiGroupsSlideContent({ onKeywordSelect }: { onKeywordSelect: (term: string) => void }) {
  return (
    <div>
      <h2 className="m-0 mb-5 text-[19px] font-bold text-ink dark:text-slate-100 leading-snug">
        Ba nhóm AI chính: phân loại · sinh nội dung · hành động
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-border dark:border-slate-700 border-t-[3px] border-t-transparent rounded-xl p-4">
          <h3 className="m-0 mb-2.5 text-[15px] font-bold text-[#2f7fc4]">
            <KeywordSpan term="Discriminative AI" onSelect={onKeywordSelect}>Discriminative AI</KeywordSpan>
          </h3>
          <p className="text-[13px] text-ink dark:text-slate-200 leading-relaxed mb-2">
            Giỏi <b>phân loại, dự đoán</b>: lọc spam, phát hiện gian lận, nhận diện ảnh.
          </p>
          <p className="text-[12px] italic text-muted dark:text-slate-500 m-0">Input → một nhãn, một con số</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-border dark:border-slate-700 border-t-[3px] border-t-[#0e8fa0] rounded-xl p-4">
          <h3 className="m-0 mb-2.5 text-[15px] font-bold text-[#0e8fa0]">
            <KeywordSpan term="Generative AI" onSelect={onKeywordSelect}>Generative AI</KeywordSpan>
          </h3>
          <p className="text-[13px] text-ink dark:text-slate-200 leading-relaxed mb-2">
            <b>Sinh ra thứ mới</b>: văn bản, ảnh, code. ChatGPT, Claude, Midjourney.
          </p>
          <p className="text-[12px] italic text-muted dark:text-slate-500 m-0">Prompt → nội dung mới</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-border dark:border-slate-700 border-t-[3px] border-t-transparent rounded-xl p-4">
          <h3 className="m-0 mb-2.5 text-[15px] font-bold text-[#1f9d5a]">
            <KeywordSpan term="Agentic AI" onSelect={onKeywordSelect}>Agentic AI</KeywordSpan>
          </h3>
          <p className="text-[13px] text-ink dark:text-slate-200 leading-relaxed mb-2">
            Nhận <b>mục tiêu</b> rồi tự làm nhiều bước: lập kế hoạch, dùng công cụ, hành động.
          </p>
          <p className="text-[12px] italic text-muted dark:text-slate-500 m-0">Goal → Plan → Action</p>
        </div>
      </div>
      <div className="mt-6 max-w-[640px] mx-auto bg-[#f6cf4d] text-[#20242c] italic text-[13.5px] leading-relaxed text-center px-5 py-4 rounded-xl">
        <KeywordSpan term="LLM" onSelect={onKeywordSelect} className="font-semibold not-italic">
          LLM
        </KeywordSpan>{' '}
        là <b>engine chung</b> của cả Generative lẫn Agentic — cuối buổi sáng mình sẽ thấy agent
        khác LLM ở đâu
      </div>
      <div className="mt-6 pt-3.5 border-t border-[#eee4d0] dark:border-slate-700 text-muted dark:text-slate-500 text-[12px]">
        Hành trình khóa học: LLM Foundation → Agent → Multi-Agent → Deploy → Evaluate
      </div>
    </div>
  );
}

function GenericSlideContent({ pageNumber }: { pageNumber: number }) {
  return (
    <p className="text-[14px] text-ink dark:text-slate-200 leading-relaxed">
      Đây là nội dung mô phỏng của slide <b>{pageNumber}</b>. Bạn có thể bôi đen (highlight), tạo
      ghi chú và yêu cầu tóm tắt từ VLearn Tutor.
    </p>
  );
}

export function SlidePageCard({
  materialTitle,
  pageNumber,
  totalPages,
  zoom,
  highlightMode,
  highlights,
  note,
  onAddHighlight,
  onKeywordSelect,
}: SlidePageCardProps) {
  const isCover = pageNumber === 1;

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
      <div
        onClick={handleClick}
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        className={`relative min-h-[420px] rounded-2xl p-8 shadow-card transition-transform ${
          highlightMode ? 'cursor-crosshair' : ''
        } ${
          isCover
            ? 'bg-gradient-to-br from-[#5f8267] to-[#3f5c48] text-white'
            : 'bg-[#fffdf9] dark:bg-slate-800 text-ink dark:text-slate-100 border border-border dark:border-slate-700'
        }`}
      >
        {isCover && <CoverSlideContent onKeywordSelect={onKeywordSelect} />}
        {pageNumber === 2 && <InstructorSlideContent />}
        {pageNumber === 3 && <AiGroupsSlideContent onKeywordSelect={onKeywordSelect} />}
        {pageNumber > 3 && <GenericSlideContent pageNumber={pageNumber} />}

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
