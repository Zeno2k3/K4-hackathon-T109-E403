import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { SlidePageCard } from './SlidePageCard';
import type { HighlightBox, ViewerMode } from './types';

export type SlidePagesScrollerHandle = {
  scrollToPage: (pageNumber: number) => void;
};

type SlidePagesScrollerProps = {
  materialTitle: string;
  initialPage: number;
  totalPages: number;
  zoom: number;
  mode: ViewerMode;
  highlights: Record<number, HighlightBox[]>;
  notes: Record<number, string>;
  onAddHighlight: (page: number, box: HighlightBox) => void;
  onKeywordSelect: (term: string) => void;
  onActivePageChange: (page: number) => void;
};

export const SlidePagesScroller = forwardRef<SlidePagesScrollerHandle, SlidePagesScrollerProps>(
  function SlidePagesScroller(
    {
      materialTitle,
      initialPage,
      totalPages,
      zoom,
      mode,
      highlights,
      notes,
      onAddHighlight,
      onKeywordSelect,
      onActivePageChange,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef(new Map<number, HTMLDivElement>());

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
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const pageNumber = Number(entry.target.getAttribute('data-page'));
            if (!Number.isNaN(pageNumber)) onActivePageChangeRef.current(pageNumber);
          });
        },
        // Only the band around the vertical center of the viewer counts as "active".
        { root: container, rootMargin: '-45% 0px -45% 0px', threshold: 0 },
      );

      pageRefs.current.forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    }, [totalPages]);

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-4">
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
              onAddHighlight={(box) => onAddHighlight(pageNumber, box)}
              onKeywordSelect={onKeywordSelect}
            />
          </div>
        ))}
      </div>
    );
  },
);
