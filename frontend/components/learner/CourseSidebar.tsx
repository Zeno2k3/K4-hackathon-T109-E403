'use client';

import { useState } from 'react';
import type { CourseSection, Material, SectionCompletionStatus } from './types';

type CourseSidebarProps = {
  sections: CourseSection[];
  activeMaterialId: string;
  onSelectMaterial: (sectionId: string, material: Material) => void;
  /** Mobile off-canvas drawer visibility. */
  open: boolean;
  onClose: () => void;
  /** Desktop (lg+) column collapse — independent from the mobile drawer. */
  collapsedDesktop: boolean;
  onToggleCollapsedDesktop: () => void;
};

const COMPLETION_PILL: Record<SectionCompletionStatus, string> = {
  completed: 'bg-approved-bg text-approved-fg dark:bg-emerald-950 dark:text-emerald-300',
  published: 'bg-[#eef2f8] text-muted border border-transparent dark:bg-slate-800 dark:text-slate-400',
  locked: 'bg-[#f2f3f5] text-muted border border-transparent dark:bg-slate-800 dark:text-slate-500',
};

const COMPLETION_LABEL: Record<SectionCompletionStatus, string> = {
  completed: 'COMPLETED',
  published: 'PUBLISHED',
  locked: 'LOCKED',
};

function StatusIcon({ status }: { status: SectionCompletionStatus }) {
  if (status === 'locked') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted dark:text-slate-500 flex-none" aria-hidden="true">
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }
  if (status === 'completed') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green flex-none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 12.5l2.3 2.3L16 10" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-blue flex-none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CourseSidebar({
  sections,
  activeMaterialId,
  onSelectMaterial,
  open,
  onClose,
  collapsedDesktop,
  onToggleCollapsedDesktop,
}: CourseSidebarProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    () => sections.find((s) => s.materials.some((m) => m.id === activeMaterialId))?.id ?? null,
  );

  function toggleSection(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function selectMaterial(sectionId: string, material: Material) {
    setExpandedId(sectionId);
    onSelectMaterial(sectionId, material);
    onClose();
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} aria-hidden="true" />}

      {collapsedDesktop && (
        <button
          type="button"
          onClick={onToggleCollapsedDesktop}
          aria-label="Hiện danh sách học liệu"
          title="Hiện danh sách học liệu"
          className="hidden lg:flex fixed left-2 top-1/2 -translate-y-1/2 z-20 w-6 h-14 items-center justify-center rounded-lg border border-border dark:border-slate-700 bg-card dark:bg-slate-900 text-muted dark:text-slate-400 shadow-card hover:text-brand-blue hover:border-[#cdd9ee]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[280px] transform transition-transform duration-200 ease-out
          lg:relative lg:z-auto lg:translate-x-0 lg:transition-[width,opacity] lg:duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          ${collapsedDesktop ? 'lg:w-0 lg:opacity-0 lg:overflow-hidden lg:pointer-events-none' : 'lg:w-[272px] lg:opacity-100'}
          flex-none flex flex-col min-h-0 bg-bg dark:bg-slate-950 lg:bg-transparent p-3 lg:p-0`}
      >
        <div className="flex flex-col min-h-0 flex-1 w-[260px] lg:w-[272px] bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-xl shadow-card overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-border dark:border-slate-700 flex-none">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-accent dark:text-blue-300 font-bold text-[15px] min-w-0">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none" aria-hidden="true">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span className="truncate">Học liệu môn học</span>
              </div>
              <button
                type="button"
                onClick={onToggleCollapsedDesktop}
                aria-label="Ẩn danh sách học liệu"
                title="Ẩn danh sách học liệu"
                className="hidden lg:flex w-6 h-6 flex-none items-center justify-center rounded-md text-muted dark:text-slate-500 hover:bg-[#eef2f8] dark:hover:bg-slate-800 hover:text-ink"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
            </div>
            <p className="mt-1 text-[12px] text-muted dark:text-slate-500 leading-snug">
              Chương, slide và tài liệu đã upload
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-2.5 py-2.5">
            {sections.map((section) => {
              const isLocked = section.completionStatus === 'locked';
              const isCurrent = section.materials.some((m) => m.id === activeMaterialId);
              const isExpanded = !isLocked && expandedId === section.id;
              return (
                <div key={section.id} className="mb-1.5 last:mb-0">
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={isExpanded}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                      isLocked
                        ? 'border-transparent opacity-60 cursor-not-allowed'
                        : 'border-transparent hover:bg-[#f5f9ff] dark:hover:bg-slate-800 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <StatusIcon status={section.completionStatus} />
                      <span className="flex-1 font-semibold text-sm text-ink dark:text-slate-100 truncate">
                        {section.title}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-1.5 py-[1px] rounded-pill tracking-wide bg-[#eef4fb] text-brand-blue border border-[#cdd9ee] dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300 flex-none">
                          STUDYING
                        </span>
                      )}
                      {!isLocked && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`text-muted dark:text-slate-500 flex-none transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap pl-6">
                      <span className="text-[11px] text-muted dark:text-slate-500">
                        {section.materials.length} tài liệu
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-[1px] rounded-pill tracking-wide ${COMPLETION_PILL[section.completionStatus]}`}
                      >
                        {COMPLETION_LABEL[section.completionStatus]}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-1 pl-6 flex flex-col gap-1.5">
                      {section.materials.map((material) => {
                        const isActive = material.id === activeMaterialId;
                        return (
                          <button
                            key={material.id}
                            type="button"
                            onClick={() => selectMaterial(section.id, material)}
                            className={`relative text-left px-3 py-2 rounded-lg border text-[13px] transition-colors ${
                              isActive
                                ? 'bg-gradient-to-r from-[#e8f0ff] to-[#f7fbff] border-[#d0e4ff] dark:from-blue-950 dark:to-slate-900 dark:border-blue-800'
                                : 'border-transparent hover:bg-[#f5f9ff] dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted dark:text-slate-500 flex-none" aria-hidden="true">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
                              </svg>
                              <span className="flex-1 font-medium text-ink dark:text-slate-100 truncate">
                                {material.title}
                              </span>
                            </div>
                            <div className="mt-0.5 pl-[22px] text-[11px] text-muted dark:text-slate-500">
                              {material.slideCount} trang
                            </div>
                            {material.completed && (
                              <span
                                className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-green text-white flex items-center justify-center"
                                aria-label="Đã hoàn thành"
                                title="Đã hoàn thành"
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
