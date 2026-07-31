'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Topbar } from '@/components/Topbar';
import { Button } from '@/components/Button';
import { PageListSidebar } from '@/components/PageListSidebar';
import { TermRow } from '@/components/TermRow';
import { PublishBar } from '@/components/PublishBar';
import {
  ApiError,
  approvePage,
  createTerm,
  deleteTerm,
  getSlide,
  publishSlide,
  rejectPage,
  updateTerm,
} from '@/lib/api';
import type { PageTerm } from '@/lib/types';

const DEBOUNCE_MS = 500;

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams<{ slideId: string }>();
  const slideId = params.slideId;

  const { data: slide, error, isLoading, mutate } = useSWR(
    slideId ? `slide-${slideId}` : null,
    () => getSlide(slideId),
  );

  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [newRowFocusId, setNewRowFocusId] = useState<string | null>(null);
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (slide && slide.pages.length > 0 && !activePageId) {
      setActivePageId(slide.pages[0].id);
    }
  }, [slide, activePageId]);

  useEffect(() => {
    if (newRowFocusId) setNewRowFocusId(null);
    // Only fire once right after a focus target is set — the effect body
    // clears it immediately, so this never re-triggers on unrelated renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newRowFocusId]);

  const activePage = useMemo(
    () => slide?.pages.find((p) => p.id === activePageId) ?? null,
    [slide, activePageId],
  );

  if (isLoading) {
    return (
      <>
        <Topbar step="review" />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted text-sm">Đang tải dữ liệu slide...</p>
        </main>
      </>
    );
  }

  if (error || !slide) {
    return (
      <>
        <Topbar step="review" />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-brand-red text-sm">
            {error instanceof ApiError ? error.message : 'Không tìm thấy slide.'}
          </p>
        </main>
      </>
    );
  }

  const approvedCount = slide.pages.filter((p) => p.status === 'approved').length;

  function scheduleTermUpdate(pageId: string, termId: string, patch: Partial<PageTerm>) {
    const key = termId;
    const existing = debounceTimers.current.get(key);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      try {
        await updateTerm(slideId, pageId, termId, {
          term_display: patch.term_display,
          domain_tag_display: patch.domain_tag_display,
          definition: patch.definition,
        });
        await mutate();
      } catch (err) {
        setActionError(err instanceof ApiError ? err.message : 'Không thể lưu thay đổi.');
      }
    }, DEBOUNCE_MS);
    debounceTimers.current.set(key, timer);
  }

  async function handleAddTerm() {
    if (!activePage) return;
    try {
      const created = await createTerm(slideId, activePage.id, {
        term_display: '',
        domain_tag_display: '',
        definition: '',
      });
      await mutate();
      setNewRowFocusId(created.id);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Không thể thêm thuật ngữ.');
    }
  }

  async function handleRemoveTerm(termId: string) {
    if (!activePage) return;
    try {
      await deleteTerm(slideId, activePage.id, termId);
      await mutate();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Không thể xoá thuật ngữ.');
    }
  }

  async function handleApprove() {
    if (!activePage) return;
    try {
      await approvePage(slideId, activePage.id);
      await mutate();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Không thể duyệt trang này.');
    }
  }

  async function handleReject() {
    if (!activePage) return;
    try {
      await rejectPage(slideId, activePage.id);
      await mutate();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Không thể cập nhật trạng thái trang.');
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setActionError(null);
    try {
      await publishSlide(slideId);
      router.push(`/slides/${slideId}/done`);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Không thể xuất bản slide.');
      setPublishing(false);
    }
  }

  return (
    <>
      <Topbar step="review" />
      <main className="flex-1 flex flex-col px-6 py-[26px] max-w-[1400px] mx-auto w-full min-h-0">
        <div className="flex gap-[22px] flex-1 min-h-0">
          {activePageId && (
            <PageListSidebar
              pages={slide.pages}
              activePageId={activePageId}
              onSelect={setActivePageId}
            />
          )}

          {activePage && (
            <section className="flex-1 flex flex-col bg-card border border-border rounded-2xl p-6 min-w-0">
              <div className="flex items-center justify-between mb-3.5">
                <h1 className="text-[19px] m-0">Trang {activePage.page_number}</h1>
                <span
                  className={`text-xs font-bold px-3 py-[5px] rounded-pill ${
                    activePage.status === 'approved'
                      ? 'bg-approved-bg text-approved-fg'
                      : 'bg-pending-bg text-pending-fg'
                  }`}
                >
                  {activePage.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                </span>
              </div>

              {actionError && (
                <p className="mb-3 text-sm text-brand-red bg-[#fdeceb] border border-[#f3c9c5] rounded-[10px] px-3.5 py-2.5">
                  {actionError}
                </p>
              )}

              <div className="flex flex-col gap-2.5 overflow-auto flex-1">
                {activePage.terms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center gap-1.5 py-14 px-6 border border-dashed border-border rounded-xl text-muted">
                    <p className="text-sm font-semibold text-ink">
                      Không phát hiện thuật ngữ nào trên trang này
                    </p>
                    <p className="text-[13px] max-w-[380px]">
                      AI không tìm thấy thuật ngữ đáng chú ý trong nội dung trang. Bạn có thể thêm
                      thủ công nếu thấy cần thiết, hoặc duyệt trang này nếu đúng là không có thuật
                      ngữ nào.
                    </p>
                  </div>
                ) : (
                  activePage.terms.map((term) => (
                    <TermRow
                      key={term.id}
                      ref={term.id === newRowFocusId ? (el) => el?.focus() : undefined}
                      term={term}
                      onChange={(patch) => {
                        const merged = { ...term, ...patch };
                        scheduleTermUpdate(activePage.id, term.id, merged);
                      }}
                      onRemove={() => handleRemoveTerm(term.id)}
                    />
                  ))
                )}
              </div>

              <Button variant="dashed" className="mt-3.5 mb-1" onClick={handleAddTerm}>
                + Thêm thuật ngữ thủ công
              </Button>

              <div className="flex justify-end gap-2.5 mt-4">
                <Button variant="ghost" onClick={handleReject}>
                  Cần chỉnh sửa thêm
                </Button>
                <Button variant="primary" onClick={handleApprove}>
                  ✓ Đồng ý — Duyệt trang này
                </Button>
              </div>
            </section>
          )}
        </div>

        <PublishBar
          approvedCount={approvedCount}
          totalCount={slide.pages.length}
          publishing={publishing}
          onPublish={handlePublish}
        />
      </main>
    </>
  );
}
