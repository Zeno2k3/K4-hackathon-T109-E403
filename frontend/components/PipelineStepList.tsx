'use client';

export const PIPELINE_STEPS = [
  { key: 'extract', label: 'Trích xuất nội dung text từng trang slide' },
  { key: 'identify', label: 'LLM xác định thuật ngữ + gắn tag lĩnh vực' },
  { key: 'lookup', label: 'Tra cứu thuật ngữ đã có trong cơ sở dữ liệu' },
  { key: 'define', label: 'LLM tạo định nghĩa cho thuật ngữ chưa có trong CSDL' },
  { key: 'aggregate', label: 'Tổng hợp danh sách thuật ngữ theo từng trang' },
] as const;

type PipelineStepListProps = {
  activeIndex: number;
  progressPercent: number;
  logText: string;
};

export function PipelineStepList({ activeIndex, progressPercent, logText }: PipelineStepListProps) {
  return (
    <>
      <ol className="list-none m-0 mb-[22px] p-0 flex flex-col gap-1">
        {PIPELINE_STEPS.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isActive = idx === activeIndex;
          return (
            <li
              key={step.key}
              className={`flex items-center gap-3 px-2.5 py-3 rounded-[10px] text-sm transition-colors ${
                isActive ? 'bg-[#f5f9ff] text-brand-blue font-bold' : isDone ? 'text-ink' : 'text-muted'
              }`}
            >
              <span
                className={`relative w-[22px] h-[22px] rounded-full border-2 flex-none flex items-center justify-center text-xs ${
                  isDone
                    ? 'border-brand-green bg-brand-green text-white'
                    : isActive
                      ? 'border-brand-blue'
                      : 'border-[#dbe3ee]'
                }`}
              >
                {isDone && '✓'}
                {isActive && (
                  <span className="absolute -inset-0.5 rounded-full border-2 border-transparent border-t-brand-blue animate-spin" />
                )}
              </span>
              <span>{step.label}</span>
            </li>
          );
        })}
      </ol>

      <div className="h-2 rounded-pill bg-[#eef2f8] overflow-hidden mb-3.5">
        <div
          className="h-full bg-brand-blue rounded-pill transition-[width] duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="text-[12.5px] text-muted min-h-[18px]" aria-live="polite">
        {logText}
      </div>
    </>
  );
}
