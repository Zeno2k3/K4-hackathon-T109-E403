'use client';

import { forwardRef, useEffect, useState } from 'react';
import { ProvenanceBadge } from './ProvenanceBadge';
import { DomainTagChip } from './DomainTagChip';
import { ConflictWarning } from './ConflictWarning';
import type { PageTerm } from '@/lib/types';

type TermRowProps = {
  term: PageTerm;
  onChange: (patch: Partial<Pick<PageTerm, 'term_display' | 'domain_tag_display' | 'definition'>>) => void;
  onRemove: () => void;
};

export const TermRow = forwardRef<HTMLInputElement, TermRowProps>(function TermRow(
  { term, onChange, onRemove },
  ref,
) {
  const [termDisplay, setTermDisplay] = useState(term.term_display);
  const [domainTag, setDomainTag] = useState(term.domain_tag_display);
  const [definition, setDefinition] = useState(term.definition);

  useEffect(() => {
    setTermDisplay(term.term_display);
    setDomainTag(term.domain_tag_display);
    setDefinition(term.definition);
    // Re-sync local edit buffers only when the server-confirmed value changes
    // (new term, or a save round-trip completed) — not on every parent render,
    // otherwise in-flight keystrokes would be clobbered before the debounce fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term.id, term.updated_at]);

  return (
    <div className="flex flex-col gap-2.5 border border-border rounded-xl p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <ProvenanceBadge source={term.source} />
        <DomainTagChip tag={term.domain_tag_display} isNew={term.is_new_domain_tag} />
        <input
          type="text"
          value={domainTag}
          onChange={(e) => {
            setDomainTag(e.target.value);
            onChange({ domain_tag_display: e.target.value });
          }}
          aria-label="Lĩnh vực"
          placeholder="Lĩnh vực"
          className="text-xs border border-transparent rounded-lg px-2 py-1 bg-[#f7fbff] focus:border-brand-blue focus:outline-none focus:bg-white w-[140px]"
        />
      </div>

      {term.has_domain_conflict && (
        <ConflictWarning existingDomain={term.conflict_domain_tag_display} />
      )}

      <div className="flex gap-3">
        <div className="w-[190px] flex-none">
          <input
            ref={ref}
            type="text"
            value={termDisplay}
            onChange={(e) => {
              setTermDisplay(e.target.value);
              onChange({ term_display: e.target.value });
            }}
            aria-label="Thuật ngữ"
            className="w-full font-bold text-ink border border-transparent rounded-lg px-2 py-1.5 bg-[#f7fbff] text-[13.5px] focus:border-brand-blue focus:outline-none focus:bg-white"
          />
        </div>
        <div className="flex-1">
          <textarea
            value={definition}
            onChange={(e) => {
              setDefinition(e.target.value);
              onChange({ definition: e.target.value });
            }}
            aria-label="Định nghĩa"
            className="w-full min-h-[56px] resize-y border border-border rounded-lg px-2.5 py-2 text-[13.5px] leading-relaxed font-sans focus:border-brand-blue focus:outline-none"
          />
        </div>
        <button
          type="button"
          aria-label="Xoá thuật ngữ"
          title="Xoá thuật ngữ"
          onClick={onRemove}
          className="flex-none self-start border-none bg-transparent text-muted cursor-pointer p-1.5 rounded-lg hover:bg-[#fdeceb] hover:text-brand-red"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0l1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12" />
          </svg>
        </button>
      </div>
    </div>
  );
});
