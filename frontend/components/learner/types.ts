/** Content state of a section, independent of whether the learner is currently viewing it. */
export type SectionCompletionStatus = 'completed' | 'published' | 'locked';

export type Material = {
  id: string;
  title: string;
  slideCount: number;
  completed?: boolean;
};

export type CourseSection = {
  id: string;
  title: string;
  completionStatus: SectionCompletionStatus;
  materials: Material[];
};

export type ViewerMode = 'read' | 'pen' | 'highlight';

export type HighlightBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type GlossaryTerm = {
  term: string;
  def: string;
  example: string;
};

export type ChatMessageKind = 'user' | 'bot';

export type ChatMessage = {
  id: string;
  kind: ChatMessageKind;
  text: string;
  /** Slide page this turn refers to — renders the small "Ngữ cảnh: Slide trang N" label above the bubble. */
  contextPage?: number;
  /** Quoted passage the message is grounded in — renders the blue citation card above the bubble. */
  quote?: string;
  variant?: 'summary' | 'error';
};

export type PendingQuote = {
  page: number;
  text: string;
};
