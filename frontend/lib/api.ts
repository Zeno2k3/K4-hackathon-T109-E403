import type {
  PageTerm,
  PageTermCreate,
  PageTermUpdate,
  SlideDetail,
  SlidePage,
  SlideSummary,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (typeof body?.detail === 'string') message = body.detail;
    } catch {
      // ignore body parse failure, fall back to statusText
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function listSlides(): Promise<SlideSummary[]> {
  return request<SlideSummary[]>('/api/slides');
}

export function getSlide(slideId: string): Promise<SlideDetail> {
  return request<SlideDetail>(`/api/slides/${slideId}`);
}

export function getSlideFileUrl(slideId: string): string {
  return `${API_BASE_URL}/api/slides/${slideId}/file`;
}

export async function uploadSlide(file: File): Promise<SlideDetail> {
  const formData = new FormData();
  formData.append('file', file);
  return request<SlideDetail>('/api/slides', {
    method: 'POST',
    body: formData,
  });
}

export function publishSlide(slideId: string): Promise<SlideDetail> {
  return request<SlideDetail>(`/api/slides/${slideId}/publish`, { method: 'POST' });
}

export function updateTerm(
  slideId: string,
  pageId: string,
  termId: string,
  patch: PageTermUpdate,
): Promise<PageTerm> {
  return request<PageTerm>(`/api/slides/${slideId}/pages/${pageId}/terms/${termId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

export function createTerm(
  slideId: string,
  pageId: string,
  body: PageTermCreate,
): Promise<PageTerm> {
  return request<PageTerm>(`/api/slides/${slideId}/pages/${pageId}/terms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function deleteTerm(slideId: string, pageId: string, termId: string): Promise<void> {
  return request<void>(`/api/slides/${slideId}/pages/${pageId}/terms/${termId}`, {
    method: 'DELETE',
  });
}

export function approvePage(slideId: string, pageId: string): Promise<SlidePage> {
  return request<SlidePage>(`/api/slides/${slideId}/pages/${pageId}/approve`, {
    method: 'POST',
  });
}

export function rejectPage(slideId: string, pageId: string): Promise<SlidePage> {
  return request<SlidePage>(`/api/slides/${slideId}/pages/${pageId}/reject`, {
    method: 'POST',
  });
}
