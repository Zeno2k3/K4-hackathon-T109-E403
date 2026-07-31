export type StepName = 'upload' | 'pipeline' | 'review' | 'done';

const STEPS: { key: StepName; number: number; label: string }[] = [
  { key: 'upload', number: 1, label: 'Upload' },
  { key: 'pipeline', number: 2, label: 'Xử lý AI' },
  { key: 'review', number: 3, label: 'Duyệt (HITL)' },
  { key: 'done', number: 4, label: 'Hoàn tất' },
];

type StepperProps = {
  current: StepName;
};

export function Stepper({ current }: StepperProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((step, idx) => {
        const isActive = idx === currentIdx;
        const isDone = idx < currentIdx;
        return (
          <div key={step.key} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-pill text-[13px] font-semibold ${
                isActive ? 'text-brand-blue' : isDone ? 'text-brand-green' : 'text-muted'
              }`}
            >
              <span
                className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive
                    ? 'bg-brand-blue text-white'
                    : isDone
                      ? 'bg-brand-green text-white'
                      : 'bg-[#eef2f8] text-muted'
                }`}
              >
                {step.number}
              </span>
              <span className="label">{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && <span className="w-[22px] h-0.5 bg-border ml-1.5" />}
          </div>
        );
      })}
    </div>
  );
}
