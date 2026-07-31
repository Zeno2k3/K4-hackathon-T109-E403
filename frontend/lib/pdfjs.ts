'use client';

import { pdfjs } from 'react-pdf';

// Served as a static asset (copied to public/ by scripts/copy-pdf-worker.js) instead of
// bundled via import.meta.url, because Next.js's build-time minifier chokes on the
// worker's top-level `import.meta`/import/export syntax when it tries to inline it.
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
