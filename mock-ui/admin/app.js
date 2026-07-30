(function () {
  "use strict";

  // ---------- Mock data: giả lập kết quả OCR + LLM cho 1 file slide đã "upload" ----------
  // Thuật ngữ lấy từ đúng các case học viên thật từng bôi đen hỏi trong chatlog (xem analysis/evidence-findings.md, mục 4)
  const MOCK_FILE = {
    name: "day03-tu-chatbot-den-agentic-agent-react.pdf",
    pages: 46,
    sizeMb: 3.2,
  };

  const PIPELINE_STEPS = [
    { key: "ocr", label: "OCR Service xử lý từng trang slide", ms: 900 },
    { key: "extract", label: "Extract dữ liệu text từ từng trang slide", ms: 700 },
    { key: "analyze", label: "LLM phân tích text của từng trang", ms: 1100 },
    { key: "identify", label: "LLM xác định thuật ngữ quan trọng trong trang slide", ms: 1000 },
    { key: "define", label: "LLM tạo giải thích cho từng thuật ngữ", ms: 1300 },
    { key: "aggregate", label: "Hệ thống tổng hợp danh sách thuật ngữ + định nghĩa", ms: 600 },
  ];

  function freshPages() {
    return [
      {
        page: 4,
        title: "Agentic Fit",
        status: "pending",
        terms: [
          { term: "Agentic Fit", def: "Bộ khung giúp đánh giá xem một bài toán có thực sự cần dùng Agent hay không, dựa trên các tiêu chí như mức độ cần công cụ, độ dài chuỗi suy luận." },
          { term: "Tool Interaction", def: "Một trong các tiêu chí của Agentic Fit — bài toán có cần Agent chủ động gọi công cụ/API bên ngoài để hoàn thành hay không." },
          { term: "Long Horizon", def: "Tiêu chí đánh giá bài toán có cần suy luận/thực hiện nhiều bước nối tiếp nhau trong thời gian dài hay chỉ cần 1-2 bước." },
          { term: "Scoring Matrix", def: "Bảng ma trận chấm điểm dùng để so sánh nhiều bài toán theo các tiêu chí Agentic Fit, hỗ trợ quyết định có nên xây Agent hay không." },
        ],
      },
      {
        page: 13,
        title: "Khi nào KHÔNG nên dùng Agent",
        status: "pending",
        terms: [
          { term: "deterministic", def: "Tính tất định — cùng một đầu vào luôn cho ra đúng một kết quả, không thay đổi. Agent (dựa trên LLM xác suất) không phù hợp cho các bài toán đòi hỏi tính này." },
          { term: "Anti-Patterns", def: "Các cách dùng Agent sai lầm phổ biến, ví dụ dùng Agent cho việc có thể giải quyết bằng rule/workflow đơn giản hơn." },
          { term: "safeguard", def: "Cơ chế bảo vệ/rào chắn được thêm vào hệ thống Agent để giới hạn hành vi sai hoặc rủi ro khi vận hành." },
          { term: "overkill", def: "Dùng giải pháp phức tạp hơn mức cần thiết cho một bài toán đơn giản — ví dụ dùng Agent cho việc chỉ cần 1 quy tắc cố định." },
        ],
      },
      {
        page: 17,
        title: "Kiến trúc Agent",
        status: "pending",
        terms: [
          { term: "Perception", def: "Khối tiếp nhận thông tin đầu vào của Agent, gồm input người dùng và kết quả trả về từ các công cụ (tool results)." },
          { term: "Chatbot baseline", def: "Phiên bản chatbot đơn giản nhất, chỉ trả lời dựa trên prompt + dữ liệu có sẵn, chưa có khả năng gọi công cụ hay tự suy luận nhiều bước." },
          { term: "augmented chatbot", def: "Chatbot được tăng cường thêm khả năng truy cập tài liệu/công cụ ngoài, nhưng chưa tới mức tự-quyết-định như Agent đầy đủ." },
        ],
      },
      {
        page: 28,
        title: "Text-based ReAct",
        status: "pending",
        terms: [
          { term: "parse", def: "Phân tích cú pháp — bước hệ thống đọc và tách văn bản đầu ra của LLM thành các phần có cấu trúc (Thought/Action/Observation) để xử lý tiếp." },
          { term: "regex/string matching", def: "Kỹ thuật dùng biểu thức chính quy hoặc so khớp chuỗi để tìm và trích xuất phần Action/tên hàm trong văn bản do LLM sinh ra." },
          { term: "Function Calling", def: "Cơ chế cho phép LLM chủ động gọi hàm/API bên ngoài theo định dạng có cấu trúc, thay vì chỉ tạo văn bản tự do rồi parse thủ công." },
          { term: "fine-tune", def: "Huấn luyện chuyên biệt thêm cho một mô hình đã có sẵn, để mô hình làm tốt hơn ở một tác vụ/miền cụ thể." },
        ],
      },
    ];
  }

  let pages = freshPages();
  let currentPageIdx = 0;

  // ---------- Helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function showScreen(name) {
    $$(".screen").forEach((s) => (s.hidden = true));
    $(`#screen-${name}`).hidden = false;

    const order = ["upload", "pipeline", "review", "done"];
    const idx = order.indexOf(name);
    $$(".step").forEach((el) => {
      const stepIdx = order.indexOf(el.dataset.step);
      el.classList.remove("active", "done");
      if (stepIdx < idx) el.classList.add("done");
      else if (stepIdx === idx) el.classList.add("active");
    });
  }

  // ---------- Screen A: Upload ----------
  const dropzone = $("#dropzone");
  const fileInput = $("#fileInput");
  const filePicked = $("#filePicked");
  const fileNameEl = $("#fileName");
  const fileMetaEl = $("#fileMeta");
  const startProcessBtn = $("#startProcessBtn");

  function pickFile(name, pagesCount, sizeMb) {
    fileNameEl.textContent = name;
    fileMetaEl.textContent = `${pagesCount} trang · ${sizeMb} MB`;
    filePicked.hidden = false;
    startProcessBtn.disabled = false;
  }

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("drag-over");
  });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag-over"));
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("drag-over");
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f.name, MOCK_FILE.pages, MOCK_FILE.sizeMb);
  });
  fileInput.addEventListener("change", () => {
    const f = fileInput.files[0];
    if (f) pickFile(f.name, MOCK_FILE.pages, MOCK_FILE.sizeMb);
  });
  $("#fileRemoveBtn").addEventListener("click", () => {
    filePicked.hidden = true;
    fileInput.value = "";
    startProcessBtn.disabled = true;
  });
  $("#useSampleBtn").addEventListener("click", () => {
    pickFile(MOCK_FILE.name, MOCK_FILE.pages, MOCK_FILE.sizeMb);
  });

  startProcessBtn.addEventListener("click", () => {
    showScreen("pipeline");
    runPipelineSimulation();
  });

  // ---------- Screen B: Pipeline simulation (không gọi LLM thật) ----------
  const pipelineListEl = $("#pipelineList");
  const pipelineProgressBar = $("#pipelineProgressBar");
  const pipelineLog = $("#pipelineLog");

  function runPipelineSimulation() {
    pipelineListEl.querySelectorAll("li").forEach((li) => li.classList.remove("active", "done"));
    pipelineProgressBar.style.width = "0%";
    pipelineLog.textContent = "";

    let i = 0;
    function step() {
      if (i > 0) {
        const prevLi = pipelineListEl.querySelector(`li[data-key="${PIPELINE_STEPS[i - 1].key}"]`);
        prevLi.classList.remove("active");
        prevLi.classList.add("done");
      }
      if (i >= PIPELINE_STEPS.length) {
        pipelineLog.textContent = "Hoàn tất — chuyển sang màn hình duyệt (HITL)...";
        setTimeout(() => {
          pages = freshPages();
          currentPageIdx = 0;
          renderReview();
          showScreen("review");
        }, 500);
        return;
      }
      const s = PIPELINE_STEPS[i];
      const li = pipelineListEl.querySelector(`li[data-key="${s.key}"]`);
      li.classList.add("active");
      pipelineLog.textContent = `Đang chạy: ${s.label}...`;
      pipelineProgressBar.style.width = `${Math.round(((i + 1) / PIPELINE_STEPS.length) * 100)}%`;
      i++;
      setTimeout(step, s.ms);
    }
    step();
  }

  // ---------- Screen C: Review (HITL) ----------
  const pageListEl = $("#pageList");
  const reviewSummaryEl = $("#reviewSummary");
  const reviewPageTitle = $("#reviewPageTitle");
  const reviewPageBadge = $("#reviewPageBadge");
  const termTableEl = $("#termTable");
  const publishStatus = $("#publishStatus");
  const publishBtn = $("#publishBtn");

  function renderReview() {
    renderPageList();
    renderPageDetail();
    renderPublishBar();
  }

  function renderPageList() {
    pageListEl.innerHTML = "";
    pages.forEach((p, idx) => {
      const item = document.createElement("div");
      item.className = "page-item" + (idx === currentPageIdx ? " active" : "");
      item.innerHTML = `
        <span class="p-title">Trang ${p.page} — ${p.title}</span>
        <span class="p-status ${p.status === "approved" ? "approved" : "pending"}">${p.status === "approved" ? "Đã duyệt" : "Chờ duyệt"}</span>
      `;
      item.addEventListener("click", () => {
        currentPageIdx = idx;
        renderReview();
      });
      pageListEl.appendChild(item);
    });

    const approvedCount = pages.filter((p) => p.status === "approved").length;
    const totalTerms = pages.reduce((sum, p) => sum + p.terms.length, 0);
    reviewSummaryEl.innerHTML = `<strong>${approvedCount}/${pages.length}</strong> trang đã duyệt · <strong>${totalTerms}</strong> thuật ngữ tổng cộng`;
  }

  function renderPageDetail() {
    const p = pages[currentPageIdx];
    reviewPageTitle.textContent = `Trang ${p.page} — ${p.title}`;
    reviewPageBadge.textContent = p.status === "approved" ? "Đã duyệt" : "Chờ duyệt";
    reviewPageBadge.classList.toggle("approved", p.status === "approved");

    termTableEl.innerHTML = "";
    p.terms.forEach((t, tIdx) => {
      const row = document.createElement("div");
      row.className = "term-row";
      row.innerHTML = `
        <div class="term-name"><input type="text" value="${escapeHtml(t.term)}" aria-label="Thuật ngữ" /></div>
        <div class="term-def"><textarea aria-label="Định nghĩa">${escapeHtml(t.def)}</textarea></div>
        <button class="term-remove" aria-label="Xoá thuật ngữ" title="Xoá thuật ngữ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0l1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12"/></svg>
        </button>
      `;
      row.querySelector(".term-name input").addEventListener("input", (e) => {
        t.term = e.target.value;
        markEdited(p);
      });
      row.querySelector(".term-def textarea").addEventListener("input", (e) => {
        t.def = e.target.value;
        markEdited(p);
      });
      row.querySelector(".term-remove").addEventListener("click", () => {
        p.terms.splice(tIdx, 1);
        markEdited(p);
        renderReview();
      });
      termTableEl.appendChild(row);
    });
  }

  function markEdited(p) {
    if (p.status === "approved") {
      p.status = "pending";
      renderPageList();
      const badge = reviewPageBadge;
      badge.textContent = "Chờ duyệt";
      badge.classList.remove("approved");
      renderPublishBar();
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  $("#addTermBtn").addEventListener("click", () => {
    const p = pages[currentPageIdx];
    p.terms.push({ term: "", def: "" });
    markEdited(p);
    renderPageDetail();
    const rows = termTableEl.querySelectorAll(".term-row");
    const lastInput = rows[rows.length - 1].querySelector(".term-name input");
    lastInput.focus();
  });

  $("#rejectBtn").addEventListener("click", () => {
    const p = pages[currentPageIdx];
    p.status = "pending";
    renderReview();
  });

  $("#approvePageBtn").addEventListener("click", () => {
    const p = pages[currentPageIdx];
    p.status = "approved";
    renderReview();
  });

  function renderPublishBar() {
    const approvedCount = pages.filter((p) => p.status === "approved").length;
    publishStatus.textContent = `${approvedCount}/${pages.length} trang đã duyệt`;
    publishBtn.disabled = approvedCount !== pages.length;
  }

  publishBtn.addEventListener("click", () => {
    publishBtn.disabled = true;
    publishBtn.textContent = "Đang lưu...";
    setTimeout(() => {
      const totalTerms = pages.reduce((sum, p) => sum + p.terms.length, 0);
      $("#doneSummary").textContent =
        `Đã lưu ${totalTerms} thuật ngữ trên ${pages.length} trang, gắn với slide "${MOCK_FILE.name}". ` +
        `Học viên có thể tra cứu các thuật ngữ này ngay khi đọc slide, không cần chờ chatbot tìm kiếm lại.`;
      showScreen("done");
      publishBtn.textContent = "Lưu & Xuất bản slide cho học viên";
    }, 700);
  });

  // ---------- Screen D: Done ----------
  $("#uploadAnotherBtn").addEventListener("click", () => {
    filePicked.hidden = true;
    fileInput.value = "";
    startProcessBtn.disabled = true;
    pages = freshPages();
    currentPageIdx = 0;
    showScreen("upload");
  });

  $("#viewGlossaryBtn").addEventListener("click", () => {
    renderReview();
    showScreen("review");
  });

  // init
  showScreen("upload");
})();
