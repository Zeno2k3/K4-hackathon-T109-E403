import { Button } from './Button';

type PublishBarProps = {
  approvedCount: number;
  totalCount: number;
  publishing: boolean;
  onPublish: () => void;
};

export function PublishBar({ approvedCount, totalCount, publishing, onPublish }: PublishBarProps) {
  const allApproved = totalCount > 0 && approvedCount === totalCount;

  return (
    <div className="sticky bottom-0 mt-4.5 flex items-center justify-between bg-card border border-border rounded-card px-5 py-3.5 shadow-publish-bar">
      <div className="text-[13.5px] font-bold text-accent">
        {approvedCount}/{totalCount} trang đã duyệt
      </div>
      <Button variant="success" disabled={!allApproved || publishing} onClick={onPublish}>
        {publishing ? 'Đang lưu...' : 'Lưu & Xuất bản slide cho học viên'}
      </Button>
    </div>
  );
}
