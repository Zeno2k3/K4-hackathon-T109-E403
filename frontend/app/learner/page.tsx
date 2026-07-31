'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/useTheme';
import { LearnerHeader } from '@/components/learner/LearnerHeader';
import { CourseSidebar } from '@/components/learner/CourseSidebar';
import { ViewerToolbar } from '@/components/learner/ViewerToolbar';
import { SlidePagesScroller, type SlidePagesScrollerHandle } from '@/components/learner/SlidePagesScroller';
import { Pagination } from '@/components/learner/Pagination';
import { GlossaryPanel } from '@/components/learner/GlossaryPanel';
import { TutorChatPanel } from '@/components/learner/TutorChatPanel';
import { COURSE_CODE, COURSE_SECTIONS, FALLBACK_REPLY, KEYWORD_DEFS, WELCOME_MESSAGE } from '@/components/learner/mockData';
import type { ChatMessage, HighlightBox, Material, PendingQuote, ViewerMode } from '@/components/learner/types';

let messageSeq = 0;
function nextMessageId(): string {
  messageSeq += 1;
  return `msg-${messageSeq}`;
}

function findMaterial(materialId: string): Material | null {
  for (const section of COURSE_SECTIONS) {
    const material = section.materials.find((m) => m.id === materialId);
    if (material) return material;
  }
  return null;
}

const DEFAULT_MATERIAL_ID = COURSE_SECTIONS[0].materials[0].id;

export default function LearnerPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [activeMaterialId, setActiveMaterialId] = useState(DEFAULT_MATERIAL_ID);
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

  const material = useMemo(() => findMaterial(activeMaterialId), [activeMaterialId]);
  const totalPages = material?.slideCount ?? 1;

  const materialHighlights = highlights[activeMaterialId] ?? {};
  const materialNotes = notes[activeMaterialId] ?? {};

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
    setHighlights((prev) => {
      const forMaterial = prev[activeMaterialId] ?? {};
      const forPage = forMaterial[pageNumber] ?? [];
      return {
        ...prev,
        [activeMaterialId]: { ...forMaterial, [pageNumber]: [...forPage, box] },
      };
    });
    setPendingQuote({ page: pageNumber, text: 'đoạn đã bôi đen' });
    setChatInput(`Giải thích đoạn bôi đen ở Trang ${pageNumber}.`);
  }

  function undoLastHighlight() {
    setHighlights((prev) => {
      const forMaterial = prev[activeMaterialId] ?? {};
      const forPage = forMaterial[page] ?? [];
      if (forPage.length === 0) return prev;
      return {
        ...prev,
        [activeMaterialId]: { ...forMaterial, [page]: forPage.slice(0, -1) },
      };
    });
  }

  function clearPageAnnotations() {
    setHighlights((prev) => {
      const forMaterial = { ...(prev[activeMaterialId] ?? {}) };
      delete forMaterial[page];
      return { ...prev, [activeMaterialId]: forMaterial };
    });
    setNotes((prev) => {
      const forMaterial = { ...(prev[activeMaterialId] ?? {}) };
      delete forMaterial[page];
      return { ...prev, [activeMaterialId]: forMaterial };
    });
  }

  function handleNote() {
    const current = materialNotes[page] ?? '';
    const value = window.prompt('Nhập ghi chú cho slide này:', current);
    if (value === null) return;
    setNotes((prev) => ({
      ...prev,
      [activeMaterialId]: { ...(prev[activeMaterialId] ?? {}), [page]: value },
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
      const known = KEYWORD_DEFS[text];
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

  return (
    <div className="h-screen flex flex-col bg-bg dark:bg-slate-950 overflow-hidden">
      <LearnerHeader
        fileName={material?.title ?? ''}
        courseCode={COURSE_CODE}
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
          sections={COURSE_SECTIONS}
          activeMaterialId={activeMaterialId}
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
          />

          <SlidePagesScroller
            key={activeMaterialId}
            ref={scrollerRef}
            materialTitle={material?.title ?? ''}
            initialPage={page}
            totalPages={totalPages}
            zoom={zoom}
            mode={mode}
            highlights={materialHighlights}
            notes={materialNotes}
            onAddHighlight={addHighlight}
            onKeywordSelect={handleKeywordSelect}
            onActivePageChange={setPage}
          />

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
        terms={KEYWORD_DEFS}
        selectedTerm={glossaryTerm}
        onSelectTerm={setGlossaryTerm}
      />
    </div>
  );
}
