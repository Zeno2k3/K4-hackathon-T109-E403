type DomainTagChipProps = {
  tag: string;
  isNew?: boolean;
};

export function DomainTagChip({ tag, isNew }: DomainTagChipProps) {
  if (!tag) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-pill whitespace-nowrap ${
        isNew ? 'bg-[#e4f6ec] text-approved-fg' : 'bg-[#eef2f8] text-[#45536c]'
      }`}
    >
      {tag}
      {isNew && <span className="opacity-80">· mới</span>}
    </span>
  );
}
