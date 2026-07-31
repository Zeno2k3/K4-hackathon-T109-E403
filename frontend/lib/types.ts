export type SlideStatus = 'processing' | 'reviewing' | 'published' | 'failed';
export type SlidePageStatus = 'pending' | 'approved';
export type TermSource = 'db' | 'llm_generated' | 'admin_edited' | 'manual';

export type PageTerm = {
  id: string;
  term_display: string;
  domain_tag_display: string;
  definition: string;
  source: TermSource;
  is_new_domain_tag: boolean;
  has_domain_conflict: boolean;
  conflict_domain_tag_display: string | null;
  created_at: string;
  updated_at: string;
};

export type SlidePage = {
  id: string;
  page_number: number;
  extracted_text: string;
  status: SlidePageStatus;
  terms: PageTerm[];
};

export type SlideDetail = {
  id: string;
  filename: string;
  page_count: number;
  status: SlideStatus;
  uploaded_at: string;
  published_at: string | null;
  pages: SlidePage[];
};

export type SlideSummary = {
  id: string;
  filename: string;
  status: SlideStatus;
  page_count: number;
  uploaded_at: string;
};

export type PageTermUpdate = Partial<{
  term_display: string;
  domain_tag_display: string;
  definition: string;
}>;

export type PageTermCreate = {
  term_display: string;
  domain_tag_display: string;
  definition: string;
};

export type ApiErrorBody = {
  detail: string;
};
