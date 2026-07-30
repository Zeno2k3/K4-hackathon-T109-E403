// Dữ liệu giả
const data = {
  sections: [
    { title: 'Day02', materials: [{ id: 'm1', title: 'day03-tu-chatbot-den-agentic-agent.pdf', slides: 46 }, { id: 'm2', title: 'Day03-D302.pdf', slides: 60 }] },
    { title: 'Day03', materials: [{ id: 'm3', title: 'day04-intro.pdf', slides: 12 }] },
  ]
}

const KEYWORD_DEFS = {
  'Discriminative AI': {
    def: 'Nhóm AI giỏi phân loại và dự đoán: nhận input rồi gán một nhãn hoặc một con số.',
    example: 'Một mô hình quét từng email rồi gắn nhãn "spam" hoặc "không phải spam" — output chỉ là một nhãn, không sinh ra nội dung mới.'
  },
  'Generative AI': {
    def: 'Nhóm AI sinh ra nội dung mới từ một prompt: văn bản, ảnh, code.',
    example: 'Bạn gõ "viết mở bài cho email xin việc", ChatGPT sinh ra một đoạn văn bản hoàn toàn mới chưa từng tồn tại trước đó.'
  },
  'Agentic AI': {
    def: 'Nhóm AI nhận một mục tiêu (goal) rồi tự lập kế hoạch, dùng công cụ và hành động qua nhiều bước để đạt mục tiêu đó.',
    example: 'Giao mục tiêu "đặt vé máy bay rẻ nhất tuần sau" — agent tự tìm chuyến bay, so sánh giá, rồi đặt vé mà không cần bạn làm từng bước.'
  },
  'LLM': {
    def: 'Large Language Model — mô hình ngôn ngữ lớn, là engine chung đứng sau cả Generative AI lẫn Agentic AI.',
    example: 'GPT-4, Claude, Llama đều là LLM — chúng chạy phía sau cả ChatGPT (Generative) lẫn các agent tự động hóa công việc (Agentic).'
  },
  'Prompt': {
    def: 'Đầu vào dạng văn bản mà người dùng đưa cho mô hình để yêu cầu sinh ra nội dung mới.',
    example: '"Tóm tắt bài viết này trong 3 câu" là một prompt — càng mô tả rõ yêu cầu, kết quả trả về càng sát ý muốn.'
  }
}

let state = { material: data.sections[0].materials[0], slideIndex: 1, highlights: {}, notes: {}, mode: 'read', zoom: 100, glossaryTerm: null }

function qs(id) { return document.getElementById(id) }

function renderSections() {
  const el = qs('sections'); el.innerHTML = '';
  data.sections.forEach(sec => {
    const s = document.createElement('div'); s.className = 'section';
    const h = document.createElement('h4'); h.textContent = sec.title; s.appendChild(h);
    sec.materials.forEach(m => {
      const d = document.createElement('div'); d.className = 'material'; d.textContent = m.title;
      d.setAttribute('role', 'button'); d.tabIndex = 0;
      if (m.id === state.material.id) d.classList.add('active');
      const select = () => { state.material = m; state.slideIndex = 1; renderAll(); }
      d.onclick = select;
      d.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } };
      s.appendChild(d);
    })
    el.appendChild(s);
  })
}

function renderSlides() {
  const container = qs('slides'); container.innerHTML = '';
  const slide = document.createElement('div'); slide.className = 'slide-card';
  // mock content
  const title = document.createElement('div'); title.className = 'slide-title';
  const sub = document.createElement('div'); sub.className = 'slide-sub'; sub.textContent = `Tài liệu: ${state.material.title} — Slide ${state.slideIndex}`;
  const body = document.createElement('div'); body.style.marginTop = '20px';

  // Slide 1: nội dung thật mô phỏng slide "Ba nhóm AI chính"
  if (state.slideIndex === 1) {
    slide.classList.add('light');
    title.textContent = 'Ba nhóm AI chính: phân loại · sinh nội dung · hành động';
    body.innerHTML = `
      <div class="ai-groups">
        <div class="ai-card">
          <h3 class="keyword-inline discriminative" data-term="Discriminative AI">Discriminative AI</h3>
          <p>Giỏi <b>phân loại, dự đoán</b>: lọc spam, phát hiện gian lận, nhận diện ảnh.</p>
          <p class="ai-card-io">Input → một nhãn, một con số</p>
        </div>
        <div class="ai-card active">
          <h3 class="keyword-inline generative" data-term="Generative AI">Generative AI</h3>
          <p><b>Sinh ra thứ mới</b>: văn bản, ảnh, code. ChatGPT, Claude, Midjourney.</p>
          <p class="ai-card-io">Prompt → nội dung mới</p>
        </div>
        <div class="ai-card">
          <h3 class="keyword-inline agentic" data-term="Agentic AI">Agentic AI</h3>
          <p>Nhận <b>mục tiêu</b> rồi tự làm nhiều bước: lập kế hoạch, dùng công cụ, hành động.</p>
          <p class="ai-card-io">Goal → Plan → Action</p>
        </div>
      </div>
      <div class="slide-callout"><span class="keyword-inline" data-term="LLM">LLM</span> là <b>engine chung</b> của cả Generative lẫn Agentic — cuối buổi sáng mình sẽ thấy agent khác LLM ở đâu</div>
      <div class="slide-footer">Hành trình khóa học: LLM Foundation → Agent → Multi-Agent → Deploy → Evaluate</div>
    `;
    slide.appendChild(title); slide.appendChild(body);
    body.querySelectorAll('.keyword-inline').forEach(el => {
      const term = el.dataset.term;
      el.tabIndex = 0; el.setAttribute('role', 'button');
      el.title = 'Nhấp để chọn từ này vào chat';
      const openTerm = () => onKeywordClick(term);
      el.onclick = openTerm;
      el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTerm(); } };
    });
  } else {
    title.textContent = `Từ Chatbot Đến Agentic Agent`;
    body.innerHTML = `<p>Đây là nội dung mô phỏng của slide <b>${state.slideIndex}</b>. Bạn có thể bôi đen (highlight), tạo ghi chú và yêu cầu tóm tắt.</p>`;
    slide.appendChild(title); slide.appendChild(sub); slide.appendChild(body);
  }

  // render highlights for this slide
  const hKey = `${state.material.id}#${state.slideIndex}`;
  const hs = state.highlights[hKey] || [];
  hs.forEach(box => { const el = document.createElement('div'); el.className = 'highlight-box'; el.style.left = box.x + 'px'; el.style.top = box.y + 'px'; el.style.width = box.w + 'px'; el.style.height = box.h + 'px'; slide.appendChild(el); })

  // notes pane
  const noteContent = state.notes[hKey];
  if (noteContent) { const n = document.createElement('div'); n.className = 'notes-pane'; n.innerHTML = `<strong>Ghi chú</strong><div style="margin-top:6px">${noteContent}</div>`; slide.appendChild(n); }

  // click to create highlight when in highlightMode
  slide.onclick = (e) => {
    if (window.highlightMode) {
      const r = slide.getBoundingClientRect();
      const w = 120, h = 36; const x = e.clientX - r.left - w / 2; const y = e.clientY - r.top - h / 2;
      addHighlight({ x: Math.max(8, x), y: Math.max(8, y), w, h });
    }
  }

  slide.style.transform = `scale(${state.zoom / 100})`;

  container.appendChild(slide);
  updatePageBadge();
  renderPagination();
  centerSlideScroll();
}

function centerSlideScroll() {
  const container = qs('slides');
  requestAnimationFrame(() => {
    container.scrollLeft = Math.max(0, (container.scrollWidth - container.clientWidth) / 2);
    container.scrollTop = 0;
  });
}

function updatePageBadge() {
  const hKey = `${state.material.id}#${state.slideIndex}`;
  const noteCount = (state.notes[hKey] ? 1 : 0) + (state.highlights[hKey] || []).length;
  qs('pageBadge').textContent = `Trang ${state.slideIndex} · ${noteCount} note`;
}

function setSidebarCollapsed(collapsed, moveFocus) {
  qs('app').classList.toggle('sidebar-collapsed', collapsed);
  qs('sidebarExpandBtn').hidden = !collapsed;
  qs('sidebarCollapseBtn').setAttribute('aria-expanded', String(!collapsed));
  if (moveFocus) {
    if (collapsed) qs('sidebarExpandBtn').focus(); else qs('sidebarCollapseBtn').focus();
  }
}

function setMode(mode) {
  state.mode = mode;
  window.highlightMode = mode === 'highlight';
  ['modeRead', 'modePen', 'modeHighlight'].forEach(id => {
    const btn = qs(id);
    const active = id === 'mode' + mode[0].toUpperCase() + mode.slice(1);
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}

function setZoom(next) {
  state.zoom = Math.min(200, Math.max(50, next));
  qs('zoomLevel').textContent = `${state.zoom}%`;
  const card = document.querySelector('.slide-card');
  if (card) { card.style.transform = `scale(${state.zoom / 100})`; centerSlideScroll(); }
}

function toggleMoreMenu(forceClose) {
  const menu = qs('moreMenu'); const btn = qs('moreBtn');
  const willOpen = forceClose ? false : menu.hidden;
  menu.hidden = !willOpen;
  btn.setAttribute('aria-expanded', String(willOpen));
}

function renderGlossaryList() {
  const list = qs('glossaryList'); list.innerHTML = '';
  Object.keys(KEYWORD_DEFS).forEach(term => {
    const b = document.createElement('button');
    b.type = 'button'; b.role = 'option'; b.textContent = term;
    b.setAttribute('aria-selected', String(term === state.glossaryTerm));
    b.onclick = () => selectGlossaryTerm(term);
    list.appendChild(b);
  });
}

function selectGlossaryTerm(term) {
  state.glossaryTerm = term;
  const info = KEYWORD_DEFS[term];
  const detail = qs('glossaryDetail');
  detail.innerHTML = `
    <h4>${term}</h4>
    <p>${info.def}</p>
    <div class="glossary-example">
      <span class="glossary-example-label">Ví dụ</span>
      <p>${info.example}</p>
    </div>
  `;
  qs('glossaryList').querySelectorAll('button').forEach(b => {
    b.setAttribute('aria-selected', String(b.textContent === term));
  });
}

function toggleGlossaryPanel(forceClose) {
  const panel = qs('glossaryPanel'); const backdrop = qs('glossaryBackdrop'); const btn = qs('glossaryBtn');
  const wasOpen = !panel.hidden;
  const willOpen = forceClose ? false : !wasOpen;
  if (willOpen === wasOpen) return;
  panel.hidden = !willOpen; backdrop.hidden = !willOpen;
  btn.setAttribute('aria-expanded', String(willOpen));
  if (willOpen) {
    if (!state.glossaryTerm) selectGlossaryTerm(Object.keys(KEYWORD_DEFS)[0]);
    qs('glossaryCloseBtn').focus();
  } else {
    btn.focus();
  }
}

function undoLastHighlight() {
  const key = `${state.material.id}#${state.slideIndex}`;
  const list = state.highlights[key];
  if (list && list.length) { list.pop(); renderSlides(); }
}

function clearSlideAnnotations() {
  const key = `${state.material.id}#${state.slideIndex}`;
  delete state.highlights[key]; delete state.notes[key];
  renderSlides();
}

function renderPagination() {
  const p = qs('pagination'); p.innerHTML = '';
  const total = state.material.slides;

  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-nav-btn'; prevBtn.setAttribute('aria-label', 'Trang trước');
  prevBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
  prevBtn.disabled = state.slideIndex <= 1;
  prevBtn.onclick = prev;

  const count = document.createElement('div'); count.className = 'page-count';
  count.innerHTML = `Trang <span class="page-current">${state.slideIndex}</span> <span class="page-sep">/</span> <span class="page-total">${total}</span>`;

  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-nav-btn'; nextBtn.setAttribute('aria-label', 'Trang sau');
  nextBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  nextBtn.disabled = state.slideIndex >= total;
  nextBtn.onclick = next;

  p.appendChild(prevBtn); p.appendChild(count); p.appendChild(nextBtn);
}

function addHighlight(box) {
  const key = `${state.material.id}#${state.slideIndex}`;
  state.highlights[key] = state.highlights[key] || [];
  state.highlights[key].push(box);
  renderSlides();
}

function toggleNote() { const key = `${state.material.id}#${state.slideIndex}`; const current = state.notes[key] || ''; const input = prompt('Nhập ghi chú cho slide này:', current); if (input !== null) { state.notes[key] = input; renderSlides(); } }

function sendChat() {
  const v = qs('chatInput').value.trim(); if (!v) return; appendMessage('user', v); qs('chatInput').value = ''; // mock reply
  setTimeout(() => {
    const up = KEYWORD_DEFS[v];
    if (up) { appendMessage('bot', up.def); }
    else { appendMessage('bot', 'AI hiện không thể trả lời. Vui lòng thử lại sau ít phút.'); }
  }, 600);
}

function onKeywordClick(k) { // put keyword into input and focus
  const inp = qs('chatInput'); inp.value = k; inp.focus();
  // also show a small preview message in chat body (optional)
  appendMessage('bot', `Bạn đã chọn: ${k}`);
}

function appendMessage(kind, text, variant) { const b = qs('chatBody'); const m = document.createElement('div'); m.className = 'message ' + (kind === 'user' ? 'user' : 'bot'); if (variant === 'summary') { m.classList.add('summary', 'center'); } m.textContent = text; b.appendChild(m); b.scrollTop = b.scrollHeight; }

function generateSummary() {
  const summary = `tóm tắt nội dung chính trong slide này`;
  // append a pill-like summary message similar to UI
  appendMessage('bot', summary, 'summary');
}

function prev() { if (state.slideIndex > 1) state.slideIndex--; renderAll(); }
function next() { if (state.slideIndex < state.material.slides) state.slideIndex++; renderAll(); }

function renderAll() { renderSections(); renderSlides(); }

// wire events
qs('prev').onclick = prev; qs('next').onclick = next; qs('sendChat').onclick = sendChat;
qs('noteBtn').onclick = () => { toggleMoreMenu(true); toggleNote(); };
qs('summaryBtn').onclick = () => { toggleMoreMenu(true); generateSummary(); };
qs('chatInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });

qs('modeRead').onclick = () => setMode('read');
qs('modePen').onclick = () => setMode('pen');
qs('modeHighlight').onclick = () => setMode('highlight');

qs('moreBtn').onclick = () => toggleMoreMenu();
qs('glossaryBtn').onclick = () => toggleGlossaryPanel();
qs('glossaryCloseBtn').onclick = () => toggleGlossaryPanel(true);
qs('glossaryBackdrop').onclick = () => toggleGlossaryPanel(true);
document.addEventListener('click', (e) => {
  const moreWrap = document.querySelector('.more-wrap');
  if (moreWrap && !moreWrap.contains(e.target)) toggleMoreMenu(true);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    toggleMoreMenu(true);
    toggleGlossaryPanel(true);
  }
});

qs('zoomIn').onclick = () => setZoom(state.zoom + 10);
qs('zoomOut').onclick = () => setZoom(state.zoom - 10);
qs('downloadBtn').onclick = () => alert('Mô phỏng: tải xuống tài liệu.');
qs('exportBtn').onclick = () => alert(`Mô phỏng: xuất trang ${state.slideIndex} thành PDF.`);
qs('undoBtn').onclick = undoLastHighlight;
qs('clearBtn').onclick = clearSlideAnnotations;

qs('sidebarCollapseBtn').onclick = () => setSidebarCollapsed(true, true);
qs('sidebarExpandBtn').onclick = () => setSidebarCollapsed(false, true);

// init
setSidebarCollapsed(true, false);
setMode('read'); renderGlossaryList();
renderAll(); appendMessage('bot', 'Xin chào! Mình là VLearn Tutor. Bạn có thể bôi đen một đoạn trên slide để ghi chú hoặc gửi câu hỏi.');
qs('zoomLevel').textContent = `${state.zoom}%`;
// keep slide indicator in header updated
function updateSlideIndicator() { const el = qs('slideIndicator'); if (el) el.textContent = state.slideIndex; }
updateSlideIndicator();

// update when slide changes
const origRenderSlides = renderSlides;
renderSlides = function () { origRenderSlides(); updateSlideIndicator(); }
