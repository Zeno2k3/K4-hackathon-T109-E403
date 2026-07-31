import type { SlideStatus } from '@/lib/types';

export const SLIDE_STATUS_LABEL: Record<SlideStatus, string> = {
  processing: 'Đang xử lý',
  reviewing: 'Chờ duyệt',
  published: 'Đã xuất bản',
  failed: 'Thất bại',
};

export const SLIDE_STATUS_DOT: Record<SlideStatus, string> = {
  processing: 'bg-amber-400',
  reviewing: 'bg-amber-400',
  published: 'bg-emerald-500',
  failed: 'bg-red-500',
};
