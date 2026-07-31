type ConflictWarningProps = {
  existingDomain: string | null;
};

export function ConflictWarning({ existingDomain }: ConflictWarningProps) {
  return (
    <div className="flex items-start gap-2 text-[12.5px] text-brand-red bg-[#fdeceb] border border-[#f3c9c5] rounded-lg px-3 py-2">
      <span aria-hidden="true">⚠️</span>
      <span>
        Thuật ngữ này đã tồn tại ở lĩnh vực khác
        {existingDomain ? ` (${existingDomain})` : ''} — kiểm tra xem đây có phải nghĩa khác không.
      </span>
    </div>
  );
}
