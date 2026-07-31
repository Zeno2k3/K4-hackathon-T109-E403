import { Stepper, type StepName } from './Stepper';

type TopbarProps = {
  step: StepName;
};

export function Topbar({ step }: TopbarProps) {
  return (
    <header className="flex items-center justify-between px-[26px] py-3.5 bg-card border-b border-border flex-wrap gap-2.5">
      <div className="font-extrabold text-xl text-accent">
        VLearn <span className="font-semibold text-muted ml-1">Admin</span>
      </div>
      <Stepper current={step} />
    </header>
  );
}
