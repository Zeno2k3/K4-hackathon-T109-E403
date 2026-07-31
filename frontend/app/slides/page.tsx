'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { Topbar } from '@/components/Topbar';
import { listSlides } from '@/lib/api';
import type { SlideStatus } from '@/lib/types';

const STATUS_LABEL: Record<SlideStatus, string> = {
  processing: 'Đang xử lý',
  reviewing: 'Đang chờ duyệt',
  published: 'Đã xuất bản',
  failed: 'Thất bại',
};

const STATUS_CLASS: Record<SlideStatus, string> = {
  processing: 'bg-pending-bg text-pending-fg',
  reviewing: 'bg-pending-bg text-pending-fg',
  published: 'bg-approved-bg text-approved-fg',
  failed: 'bg-[#fdeceb] text-brand-red',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN');
}

export default function SlideListPage() {
  const { data: slides, error, isLoading } = useSWR('slides', listSlides);

  return (
    <>
      <Topbar step="review" />
      <main className="flex-1 flex px-6 py-[26px] max-w-[1400px] mx-auto w-full">
        <section className="flex-1 flex flex-col max-w-[900px] mx-auto w-full">
          <div className="bg-card border border-border rounded-card shadow-card p-9">
            <h1 className="m-0 mb-2.5 text-2xl text-accent">Danh sách slide đã upload</h1>
            <p className="text-muted text-sm leading-relaxed mb-[22px]">
              Chọn một slide để tiếp tục duyệt thuật ngữ, hoặc quay lại nếu bị mất phiên làm việc.
            </p>

            {isLoading && <p className="text-muted text-sm">Đang tải...</p>}
            {error && <p className="text-brand-red text-sm">Không thể tải danh sách slide.</p>}
            {slides && slides.length === 0 && (
              <p className="text-muted text-sm">Chưa có slide nào được upload.</p>
            )}

            {slides && slides.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {slides.map((slide) => (
                  <Link
                    key={slide.id}
                    href={`/slides/${slide.id}/review`}
                    className="flex items-center gap-3 border border-border rounded-xl px-4 py-3.5 hover:bg-[#f5f9ff] transition-colors"
                  >
                    <span className="flex-1 font-semibold text-ink">{slide.filename}</span>
                    <span className="text-muted text-[13px]">{slide.page_count} trang</span>
                    <span className="text-muted text-[13px]">{formatDate(slide.uploaded_at)}</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-1 rounded-pill ${STATUS_CLASS[slide.status]}`}
                    >
                      {STATUS_LABEL[slide.status]}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
