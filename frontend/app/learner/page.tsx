'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { useTheme } from '@/lib/useTheme';
import { listSlides, getSlide, getSlideFileUrl } from '@/lib/api';
import { LearnerHeader } from '@/components/learner/LearnerHeader';
import { CourseSidebar } from '@/components/learner/CourseSidebar';
import { ViewerToolbar } from '@/components/learner/ViewerToolbar';
import type { SlidePagesScrollerHandle } from '@/components/learner/SlidePagesScroller';
import { Pagination } from '@/components/learner/Pagination';
import { GlossaryPanel } from '@/components/learner/GlossaryPanel';
import { TutorChatPanel } from '@/components/learner/TutorChatPanel';
import { SLIDE_STATUS_LABEL } from '@/components/learner/statusLabel';
import { WELCOME_MESSAGE, FALLBACK_REPLY } from '@/components/learner/mockData';
import type { ChatMessage, CourseSection, HighlightBox, Material, PendingQuote, ViewerMode } from '@/components/learner/types';
import type { PageTerm } from '@/lib/types';

const SlidePagesScroller = dynamic(
  () => import('@/components/learner/SlidePagesScroller').then((m) => m.SlidePagesScroller),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 min-h-0 flex items-center justify-center text-muted dark:text-slate-500 text-sm">
        Đang tải trình xem slide...
      </div>
    ),
  },
);

let messageSeq = 0;
function nextMessageId(): string {
  messageSeq += 1;
  return `msg-${messageSeq}`;
}

export default function LearnerPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const { data: slides, error: slidesError, isLoading: slidesLoading } = useSWR('learner-slides', listSlides);

  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [mode, setMode] = useState<ViewerMode>('read');

  const [highlights, setHighlights] = useState<Record<string, Record<number, HighlightBox[]>>>({});
  const [notes, setNotes] = useState<Record<string, Record<number, string>>>({});

  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [glossaryTerm, setGlossaryTerm] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: nextMessageId(), kind: 'bot', text: WELCOME_MESSAGE, contextPage: 1 },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [pendingQuote, setPendingQuote] = useState<PendingQuote | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarCollapsedDesktop, setSidebarCollapsedDesktop] = useState(false);
  const [chatCollapsedDesktop, setChatCollapsedDesktop] = useState(false);

  const scrollerRef = useRef<SlidePagesScrollerHandle>(null);

  useEffect(() => {
    if (slides && slides.length > 0 && !activeMaterialId) {
      setActiveMaterialId(slides[0].id);
    }
  }, [slides, activeMaterialId]);

  const { data: slideDetail } = useSWR(
    activeMaterialId ? `slide-${activeMaterialId}` : null,
    () => getSlide(activeMaterialId as string),
  );

  const materials: Material[] = useMemo(
    () => (slides ?? []).map((s) => ({ id: s.id, title: s.filename, slideCount: s.page_count, status: s.status })),
    [slides],
  );

  const sections: CourseSection[] = useMemo(
    () => [
      {
        id: 'uploaded',
        title: 'Slide đã tải lên',
        completionStatus:
          materials.length > 0 && materials.every((m) => m.status === 'published') ? 'completed' : 'published',
        materials,
      },
    ],
    [materials],
  );

  const material = materials.find((m) => m.id === activeMaterialId) ?? null;
  const totalPages = material?.slideCount ?? 1;
  const fileUrl = activeMaterialId ? getSlideFileUrl(activeMaterialId) : '';

  const pageTerms: Record<number, PageTerm[]> = useMemo(() => {
    const map: Record<number, PageTerm[]> = {};
    slideDetail?.pages.forEach((p) => {
      map[p.page_number] = p.terms;
    });
    return map;
  }, [slideDetail]);

  const glossaryTerms = useMemo(() => {
    const map: Record<string, { term: string; def: string }> = {};
    (pageTerms[page] ?? []).forEach((t) => {
      map[t.term_display] = { term: t.term_display, def: t.definition };
    });
    return map;
  }, [pageTerms, page]);

  useEffect(() => {
    setGlossaryTerm(null);
  }, [page]);

  const materialHighlights = highlights[activeMaterialId ?? ''] ?? {};
  const materialNotes = notes[activeMaterialId ?? ''] ?? {};

  const noteCount = (materialNotes[page] ? 1 : 0) + (materialHighlights[page]?.length ?? 0);
  const pageLabel = `Trang ${page} · ${noteCount} note`;

  function selectMaterial(_sectionId: string, selected: Material) {
    setActiveMaterialId(selected.id);
    setPage(1);
  }

  function goPrev() {
    scrollerRef.current?.scrollToPage(Math.max(1, page - 1));
  }

  function goNext() {
    scrollerRef.current?.scrollToPage(Math.min(totalPages, page + 1));
  }

  function addHighlight(pageNumber: number, box: HighlightBox) {
    if (!activeMaterialId) return;
    const materialId = activeMaterialId;
    setHighlights((prev) => {
      const forMaterial = prev[materialId] ?? {};
      const forPage = forMaterial[pageNumber] ?? [];
      return {
        ...prev,
        [materialId]: { ...forMaterial, [pageNumber]: [...forPage, box] },
      };
    });
    setPendingQuote({ page: pageNumber, text: 'đoạn đã bôi đen' });
    setChatInput(`Giải thích đoạn bôi đen ở Trang ${pageNumber}.`);
  }

  function undoLastHighlight() {
    if (!activeMaterialId) return;
    const materialId = activeMaterialId;
    setHighlights((prev) => {
      const forMaterial = prev[materialId] ?? {};
      const forPage = forMaterial[page] ?? [];
      if (forPage.length === 0) return prev;
      return {
        ...prev,
        [materialId]: { ...forMaterial, [page]: forPage.slice(0, -1) },
      };
    });
  }

  function clearPageAnnotations() {
    if (!activeMaterialId) return;
    const materialId = activeMaterialId;
    setHighlights((prev) => {
      const forMaterial = { ...(prev[materialId] ?? {}) };
      delete forMaterial[page];
      return { ...prev, [materialId]: forMaterial };
    });
    setNotes((prev) => {
      const forMaterial = { ...(prev[materialId] ?? {}) };
      delete forMaterial[page];
      return { ...prev, [materialId]: forMaterial };
    });
  }

  function handleNote() {
    if (!activeMaterialId) return;
    const materialId = activeMaterialId;
    const current = materialNotes[page] ?? '';
    const value = window.prompt('Nhập ghi chú cho slide này:', current);
    if (value === null) return;
    setNotes((prev) => ({
      ...prev,
      [materialId]: { ...(prev[materialId] ?? {}), [page]: value },
    }));
  }

  function handleSummary() {
    setChatMessages((prev) => [
      ...prev,
      { id: nextMessageId(), kind: 'bot', text: 'Tóm tắt nội dung chính trong slide này', variant: 'summary' },
    ]);
  }

  function handleKeywordSelect(term: string) {
    setPendingQuote({ page, text: term });
    setChatInput(`Giải thích đoạn bôi đen ở Trang ${page}.`);
  }

  function sendMessage() {
    const text = chatInput.trim();
    if (!text) return;
    const contextPage = page;
    const quote = pendingQuote?.text;

    setChatMessages((prev) => [...prev, { id: nextMessageId(), kind: 'user', text, contextPage, quote }]);
    setChatInput('');
    setPendingQuote(null);

    setTimeout(() => {
      const known = glossaryTerms[text];
      const replyText = known ? known.def : FALLBACK_REPLY;
      setChatMessages((prev) => [
        ...prev,
        { id: nextMessageId(), kind: 'bot', text: replyText, contextPage, variant: known ? undefined : 'error' },
      ]);
    }, 600);
  }

  function startNewChat() {
    setChatMessages([{ id: nextMessageId(), kind: 'bot', text: WELCOME_MESSAGE, contextPage: page }]);
    setPendingQuote(null);
  }

  if (slidesLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg dark:bg-slate-950">
        <p className="text-muted dark:text-slate-500 text-sm">Đang tải danh sách slide...</p>
      </div>
    );
  }

  if (slidesError) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg dark:bg-slate-950">
        <p className="text-brand-red text-sm">Không thể tải danh sách slide.</p>
      </div>
    );
  }

  if (!slides || slides.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg dark:bg-slate-950">
        <p className="text-muted dark:text-slate-500 text-sm">Chưa có slide nào được tải lên.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-bg dark:bg-slate-950 overflow-hidden">
      <LearnerHeader
        fileName={material?.title ?? ''}
        courseCode={material ? SLIDE_STATUS_LABEL[material.status] : ''}
        theme={theme}
        lang={lang}
        onBack={() => router.push('/')}
        onToggleTheme={toggleTheme}
        onToggleLang={() => setLang((l) => (l === 'vi' ? 'en' : 'vi'))}
        onToggleSidebar={() => setSidebarOpen(true)}
        onToggleChat={() => setChatOpen(true)}
      />

      <div className="flex-1 min-h-0 flex gap-3 p-3 max-w-[1800px] mx-auto w-full">
        <CourseSidebar
          sections={sections}
          activeMaterialId={activeMaterialId ?? ''}
          onSelectMaterial={selectMaterial}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsedDesktop={sidebarCollapsedDesktop}
          onToggleCollapsedDesktop={() => setSidebarCollapsedDesktop((v) => !v)}
        />

        <main className="flex-1 min-w-0 flex flex-col min-h-0">
          <ViewerToolbar
            mode={mode}
            onModeChange={setMode}
            pageLabel={pageLabel}
            zoom={zoom}
            onZoomIn={() => setZoom((z) => Math.min(200, z + 10))}
            onZoomOut={() => setZoom((z) => Math.max(50, z - 10))}
            onNote={handleNote}
            onSummary={handleSummary}
            onDownload={() => window.alert('Mô phỏng: tải xuống tài liệu.')}
            onExport={() => window.alert(`Mô phỏng: xuất trang ${page} thành PDF.`)}
            onUndo={undoLastHighlight}
            onClear={clearPageAnnotations}
            onOpenGlossary={() => setGlossaryOpen(true)}
            glossaryDisabled={Object.keys(glossaryTerms).length === 0}
          />

          {activeMaterialId && (
            <SlidePagesScroller
              key={activeMaterialId}
              ref={scrollerRef}
              materialTitle={material?.title ?? ''}
              fileUrl={fileUrl}
              initialPage={page}
              totalPages={totalPages}
              zoom={zoom}
              mode={mode}
              highlights={materialHighlights}
              notes={materialNotes}
              pageTerms={pageTerms}
              onAddHighlight={addHighlight}
              onKeywordSelect={handleKeywordSelect}
              onActivePageChange={setPage}
            />
          )}

          <Pagination page={page} total={totalPages} onPrev={goPrev} onNext={goNext} />
        </main>

        <TutorChatPanel
          messages={chatMessages}
          activePage={page}
          inputValue={chatInput}
          onInputChange={setChatInput}
          onSend={sendMessage}
          onNewChat={startNewChat}
          pendingQuote={pendingQuote}
          onClearPendingQuote={() => setPendingQuote(null)}
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          collapsedDesktop={chatCollapsedDesktop}
          onToggleCollapsedDesktop={() => setChatCollapsedDesktop((v) => !v)}
        />
      </div>

      <GlossaryPanel
        open={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
        terms={glossaryTerms}
        selectedTerm={glossaryTerm}
        onSelectTerm={setGlossaryTerm}
      />
    </div>
  );
}
