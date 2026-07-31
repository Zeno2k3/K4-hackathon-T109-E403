'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { Topbar } from '@/components/Topbar';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ApiError, getSlide } from '@/lib/api';

export default function DonePage() {
  const router = useRouter();
  const params = useParams<{ slideId: string }>();
  const slideId = params.slideId;

  const { data: slide, error, isLoading } = useSWR(slideId ? `slide-${slideId}` : null, () =>
    getSlide(slideId),
  );

  return (
    <>
      <Topbar step="done" />
      <main className="flex-1 flex px-6 py-[26px] max-w-[1400px] mx-auto w-full">
        <section className="flex-1 flex flex-col">
          <Card className="text-center">
            <div className="w-14 h-14 rounded-full bg-brand-green text-white text-[26px] flex items-center justify-center mx-auto mb-[18px]">
              ✓
            </div>
            <h1 className="m-0 mb-2.5 text-2xl text-accent">Slide đã sẵn sàng để học viên xem</h1>

            {isLoading && <p className="text-muted text-sm">Đang tải...</p>}
            {error && (
              <p className="text-brand-red text-sm">
                {error instanceof ApiError ? error.message : 'Không thể tải thông tin slide.'}
              </p>
            )}
            {slide && (
              <p className="text-muted text-sm leading-relaxed mb-0">
                Đã lưu{' '}
                <strong>{slide.pages.reduce((sum, p) => sum + p.terms.length, 0)}</strong> thuật
                ngữ trên <strong>{slide.pages.length}</strong> trang, gắn với slide &quot;
                {slide.filename}&quot;. Học viên có thể tra cứu các thuật ngữ này ngay khi đọc
                slide.
              </p>
            )}

            <div className="flex justify-center gap-2.5 mt-[22px]">
              <Link href={`/slides/${slideId}/review`}>
                <Button variant="ghost">Xem lại danh sách thuật ngữ đã lưu</Button>
              </Link>
              <Button variant="primary" onClick={() => router.push('/')}>
                Tải lên slide khác
              </Button>
            </div>
          </Card>
        </section>
      </main>
    </>
  );
}
