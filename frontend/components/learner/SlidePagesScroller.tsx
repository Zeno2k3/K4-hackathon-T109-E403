import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Document } from 'react-pdf';
import '@/lib/pdfjs';
import { SlidePageCard } from './SlidePageCard';
import type { HighlightBox, ViewerMode } from './types';
import type { PageTerm } from '@/lib/types';

export type SlidePagesScrollerHandle = {
  scrollToPage: (pageNumber: number) => void;
};

type SlidePagesScrollerProps = {
  materialTitle: string;
  fileUrl: string;
  initialPage: number;
  totalPages: number;
  zoom: number;
  mode: ViewerMode;
  highlights: Record<number, HighlightBox[]>;
  notes: Record<number, string>;
  pageTerms: Record<number, PageTerm[]>;
  onAddHighlight: (page: number, box: HighlightBox) => void;
  onKeywordSelect: (term: string) => void;
  onActivePageChange: (page: number) => void;
};

export const SlidePagesScroller = forwardRef<SlidePagesScrollerHandle, SlidePagesScrollerProps>(
  function SlidePagesScroller(
    {
      materialTitle,
      fileUrl,
      initialPage,
      totalPages,
      zoom,
      mode,
      highlights,
      notes,
      pageTerms,
      onAddHighlight,
      onKeywordSelect,
      onActivePageChange,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef(new Map<number, HTMLDivElement>());
    const intersectingRef = useRef(new Map<number, boolean>());

    // Keep the latest callback without re-creating the observer on every render.
    const onActivePageChangeRef = useRef(onActivePageChange);
    onActivePageChangeRef.current = onActivePageChange;

    useImperativeHandle(ref, () => ({
      scrollToPage(pageNumber) {
        pageRefs.current.get(pageNumber)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    }));

    useEffect(() => {
      pageRefs.current.get(initialPage)?.scrollIntoView({ block: 'start' });
      // Only run once per mounted document — this scroller is remounted (key={materialId}) on material switch.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const observer = new IntersectionObserver(
        (entries) => {
          // Entries only report pages whose intersection changed since the last batch, so we
          // merge into a running map rather than deriving the active page from `entries` alone
          // — otherwise a batch with multiple entries picks whichever happens to be last, which
          // doesn't necessarily match the page actually centered in the viewport.
          entries.forEach((entry) => {
            const pageNumber = Number(entry.target.getAttribute('data-page'));
            if (Number.isNaN(pageNumber)) return;
            intersectingRef.current.set(pageNumber, entry.isIntersecting);
          });

          const activePages = Array.from(intersectingRef.current.entries())
            .filter(([, isIntersecting]) => isIntersecting)
            .map(([pageNumber]) => pageNumber);

          if (activePages.length > 0) onActivePageChangeRef.current(Math.min(...activePages));
        },
        // Only the band around the vertical center of the viewer counts as "active".
        { root: container, rootMargin: '-45% 0px -45% 0px', threshold: 0 },
      );

      pageRefs.current.forEach((el) => observer.observe(el));
      return () => {
        observer.disconnect();
        intersectingRef.current.clear();
      };
    }, [totalPages]);

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-4">
        <Document
          file={fileUrl}
          loading={
            <div className="flex items-center justify-center py-14 text-muted dark:text-slate-500 text-sm">
              Đang tải tài liệu PDF...
            </div>
          }
          error={
            <div className="flex items-center justify-center py-14 text-brand-red text-sm">
              Không thể tải file PDF của slide này.
            </div>
          }
        >
          {pageNumbers.map((pageNumber) => (
            <div
              key={pageNumber}
              data-page={pageNumber}
              ref={(el) => {
                if (el) pageRefs.current.set(pageNumber, el);
                else pageRefs.current.delete(pageNumber);
              }}
            >
              <SlidePageCard
                materialTitle={materialTitle}
                pageNumber={pageNumber}
                totalPages={totalPages}
                zoom={zoom}
                highlightMode={mode === 'highlight'}
                highlights={highlights[pageNumber] ?? []}
                note={notes[pageNumber]}
                terms={pageTerms[pageNumber] ?? []}
                onAddHighlight={(box) => onAddHighlight(pageNumber, box)}
                onKeywordSelect={onKeywordSelect}
              />
            </div>
          ))}
        </Document>
      </div>
    );
  },
);
