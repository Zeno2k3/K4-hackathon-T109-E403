import type { CourseSection, GlossaryTerm } from './types';

export const COURSE_CODE = 'COMP2010';

export const COURSE_SECTIONS: CourseSection[] = [
  {
    id: 'day01',
    title: 'Day01',
    completionStatus: 'completed',
    materials: [
      { id: 'day01-302', title: 'day01_302.pdf', slideCount: 83, completed: true },
      { id: 'day01-material', title: 'material_mrxpq9zu_t8e6x...', slideCount: 32, completed: true },
    ],
  },
  {
    id: 'day02',
    title: 'Day02',
    completionStatus: 'published',
    materials: [{ id: 'day02-m1', title: 'material_95eb786b4d9e.pdf', slideCount: 76 }],
  },
  {
    id: 'day03',
    title: 'Day03',
    completionStatus: 'published',
    materials: [
      { id: 'day03-m1', title: 'day03-tu-chatbot-den-agentic-agent.pdf', slideCount: 46 },
      { id: 'day03-m2', title: 'Day03-D302.pdf', slideCount: 60 },
    ],
  },
  {
    id: 'day04',
    title: 'Day04',
    completionStatus: 'published',
    materials: [
      { id: 'day04-m1', title: 'day04-intro.pdf', slideCount: 12 },
      { id: 'day04-m2', title: 'day04-tooling.pdf', slideCount: 28 },
      { id: 'day04-m3', title: 'day04-lab-guide.pdf', slideCount: 18 },
    ],
  },
  {
    id: 'day05',
    title: 'Day05',
    completionStatus: 'published',
    materials: [
      { id: 'day05-m1', title: 'day05-multi-agent.pdf', slideCount: 34 },
      { id: 'day05-m2', title: 'day05-orchestration.pdf', slideCount: 22 },
      { id: 'day05-m3', title: 'day05-case-study.pdf', slideCount: 15 },
    ],
  },
  {
    id: 'day06',
    title: 'Day06',
    completionStatus: 'published',
    materials: [{ id: 'day06-m1', title: 'day06-deploy-evaluate.pdf', slideCount: 29 }],
  },
  {
    id: 'day07-lecture-slides',
    title: 'day07-lecture-slides',
    completionStatus: 'locked',
    materials: [{ id: 'day07-m1', title: 'day07-lecture-slides.pdf', slideCount: 20 }],
  },
];

export const KEYWORD_DEFS: Record<string, GlossaryTerm> = {
  'Discriminative AI': {
    term: 'Discriminative AI',
    def: 'Nhóm AI giỏi phân loại và dự đoán: nhận input rồi gán một nhãn hoặc một con số.',
    example:
      'Một mô hình quét từng email rồi gắn nhãn "spam" hoặc "không phải spam" — output chỉ là một nhãn, không sinh ra nội dung mới.',
  },
  'Generative AI': {
    term: 'Generative AI',
    def: 'Nhóm AI sinh ra nội dung mới từ một prompt: văn bản, ảnh, code.',
    example:
      'Bạn gõ "viết mở bài cho email xin việc", ChatGPT sinh ra một đoạn văn bản hoàn toàn mới chưa từng tồn tại trước đó.',
  },
  'Agentic AI': {
    term: 'Agentic AI',
    def: 'Nhóm AI nhận một mục tiêu (goal) rồi tự lập kế hoạch, dùng công cụ và hành động qua nhiều bước để đạt mục tiêu đó.',
    example:
      'Giao mục tiêu "đặt vé máy bay rẻ nhất tuần sau" — agent tự tìm chuyến bay, so sánh giá, rồi đặt vé mà không cần bạn làm từng bước.',
  },
  LLM: {
    term: 'LLM',
    def: 'Large Language Model — mô hình ngôn ngữ lớn, là engine chung đứng sau cả Generative AI lẫn Agentic AI.',
    example:
      'GPT-4, Claude, Llama đều là LLM — chúng chạy phía sau cả ChatGPT (Generative) lẫn các agent tự động hóa công việc (Agentic).',
  },
  'LLM Foundation': {
    term: 'LLM Foundation',
    def: 'Nền tảng kiến thức về cách LLM được huấn luyện và vận hành, làm cơ sở để hiểu Generative AI và Agentic AI.',
    example:
      'Buổi học "LLM Foundation" đi từ kiến trúc Transformer đến cách một prompt được mô hình xử lý thành output.',
  },
  Prompt: {
    term: 'Prompt',
    def: 'Đầu vào dạng văn bản mà người dùng đưa cho mô hình để yêu cầu sinh ra nội dung mới.',
    example:
      '"Tóm tắt bài viết này trong 3 câu" là một prompt — càng mô tả rõ yêu cầu, kết quả trả về càng sát ý muốn.',
  },
};

export const WELCOME_MESSAGE =
  'Xin chào! Mình là VLearn Tutor. Bạn có thể bôi đen một đoạn trên slide để hỏi hoặc gửi câu hỏi tự do nhé!';

export const FALLBACK_REPLY = 'AI hiện không thể trả lời. Vui lòng thử lại sau ít phút.';
