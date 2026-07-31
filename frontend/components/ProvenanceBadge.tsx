import type { TermSource } from '@/lib/types';

const SOURCE_LABEL: Record<TermSource, string> = {
  db: '📚 Từ CSDL',
  llm_generated: '✨ AI tạo mới',
  admin_edited: '✍️ Đã chỉnh sửa',
  manual: '👤 Thêm thủ công',
};

const SOURCE_CLASS: Record<TermSource, string> = {
  db: 'bg-[#eef4fb] text-accent',
  llm_generated: 'bg-[#f3edfb] text-[#6a3ea1]',
  admin_edited: 'bg-[#fff4e0] text-pending-fg',
  manual: 'bg-[#eef2f8] text-muted',
};

type ProvenanceBadgeProps = {
  source: TermSource;
};

export function ProvenanceBadge({ source }: ProvenanceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center text-[11px] font-bold px-2 py-1 rounded-pill whitespace-nowrap ${SOURCE_CLASS[source]}`}
    >
      {SOURCE_LABEL[source]}
    </span>
  );
}
