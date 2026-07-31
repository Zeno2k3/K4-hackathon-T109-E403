type PaginationProps = {
  page: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
};

export function Pagination({ page, total, onPrev, onNext }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-5 py-3.5 flex-none">
      <button
        type="button"
        onClick={onPrev}
        disabled={page <= 1}
        aria-label="Trang trước"
        className="w-11 h-11 flex-none flex items-center justify-center rounded-full border border-border dark:border-slate-700 bg-card dark:bg-slate-900 text-muted dark:text-slate-400 hover:enabled:bg-[#f3f6fb] hover:enabled:border-[#cdd9ee] hover:enabled:text-brand-blue disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>

      <div className="text-[15px] text-muted dark:text-slate-400">
        Trang <span className="font-bold text-accent dark:text-blue-300 text-base">{page}</span>{' '}
        <span className="text-[#b7bfcc] dark:text-slate-600 mx-0.5">/</span>{' '}
        <span className="text-[#9aa3b5] dark:text-slate-500">{total}</span>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={page >= total}
        aria-label="Trang sau"
        className="w-11 h-11 flex-none flex items-center justify-center rounded-full border border-border dark:border-slate-700 bg-card dark:bg-slate-900 text-muted dark:text-slate-400 hover:enabled:bg-[#f3f6fb] hover:enabled:border-[#cdd9ee] hover:enabled:text-brand-blue disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}
