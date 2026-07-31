import type { SlidePage } from '@/lib/types';

type PageListSidebarProps = {
  pages: SlidePage[];
  activePageId: string;
  onSelect: (pageId: string) => void;
};

export function PageListSidebar({ pages, activePageId, onSelect }: PageListSidebarProps) {
  const approvedCount = pages.filter((p) => p.status === 'approved').length;
  const totalTerms = pages.reduce((sum, p) => sum + p.terms.length, 0);

  return (
    <aside className="w-[280px] flex-none flex flex-col">
      <h2 className="m-0 mb-1.5 text-base text-accent">Trang slide</h2>
      <p className="text-[12.5px] text-muted leading-relaxed mb-3.5">
        Admin kiểm tra danh sách thuật ngữ + định nghĩa do AI tạo (HITL). Sửa/xoá/thêm rồi duyệt
        từng trang.
      </p>
      <div className="flex flex-col gap-1.5 bg-card border border-border rounded-xl p-2 overflow-auto">
        {pages.map((page) => {
          const isActive = page.id === activePageId;
          return (
            <div
              key={page.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(page.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(page.id);
              }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] cursor-pointer text-[13.5px] ${
                isActive
                  ? 'bg-gradient-to-r from-[#e8f0ff] to-[#f7fbff] border border-[#d0e4ff]'
                  : 'hover:bg-[#f5f9ff] border border-transparent'
              }`}
            >
              <span className="flex-1 font-semibold text-ink">Trang {page.page_number}</span>
              <span
                className={`text-[11px] font-bold px-2 py-[3px] rounded-pill ${
                  page.status === 'approved' ? 'bg-approved-bg text-approved-fg' : 'bg-pending-bg text-pending-fg'
                }`}
              >
                {page.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3.5 p-3 rounded-[10px] bg-[#eef4fb] text-accent text-[12.5px] leading-relaxed">
        <strong>
          {approvedCount}/{pages.length}
        </strong>{' '}
        trang đã duyệt · <strong>{totalTerms}</strong> thuật ngữ tổng cộng
      </div>
    </aside>
  );
}
