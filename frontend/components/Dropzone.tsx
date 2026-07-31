'use client';

import { useRef, useState, type DragEvent } from 'react';

type DropzoneProps = {
  selectedFile: File | null;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
};

function formatSizeMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export function Dropzone({ selectedFile, onFileSelected, onRemove }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelected(file);
  }

  if (selectedFile) {
    return (
      <div className="flex items-center gap-2.5 mt-4 px-3.5 py-3 border border-border rounded-[10px] bg-[#f7fbff] text-[13.5px]">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-brand-blue flex-none"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
          <path d="M14 2v6h6" />
        </svg>
        <span className="font-bold text-ink">{selectedFile.name}</span>
        <span className="text-muted ml-auto">{formatSizeMb(selectedFile.size)} MB</span>
        <button
          type="button"
          className="border-none bg-transparent text-brand-blue text-[13px] font-semibold cursor-pointer p-0 underline"
          onClick={onRemove}
        >
          Chọn file khác
        </button>
      </div>
    );
  }

  return (
    <label
      className={`flex flex-col items-center gap-2.5 text-center px-5 py-[38px] border-2 border-dashed rounded-[14px] cursor-pointer transition-colors ${
        dragOver ? 'border-brand-blue bg-[#f5f9ff] text-brand-blue' : 'border-[#cdd9ee] text-muted hover:border-brand-blue hover:bg-[#f5f9ff] hover:text-brand-blue'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" />
      </svg>
      <div>
        <strong className="text-ink">Kéo-thả file vào đây</strong> hoặc bấm để chọn (.pdf)
      </div>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept=".pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
        }}
      />
    </label>
  );
}
