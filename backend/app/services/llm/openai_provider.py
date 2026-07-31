"""Real TermIdentifier/TermDefiner implementation backed by the OpenAI API.

Wired in via app/services/pipeline.py's get_pipeline_service() Depends() —
no other file needs to change to swap this in for the stub.
"""

import logging

from openai import AsyncOpenAI

from app.config import settings
from app.services.llm.interface import (
    ConflictingDefinition,
    DefineResult,
    IdentifyResult,
    PageInput,
    TermDefiner,
    TermIdentifier,
)

logger = logging.getLogger(__name__)

_IDENTIFY_SYSTEM_PROMPT = """\
<role>
Bạn là trợ lý phân tích tài liệu chuyên ngành.
</role>

<task>
Đọc nội dung MỘT LÔ (batch) gồm nhiều trang slide — mỗi trang được đánh dấu bằng một cặp thẻ
`<page-N>...</page-N>` với N là số thứ tự trang — và trích xuất các thuật ngữ chuyên ngành quan
trọng xuất hiện trong TỪNG trang. Phải xử lý lần lượt tất cả các trang được cung cấp, không được
bỏ sót trang nào.
</task>

<term_selection_rules>
- Chỉ chọn thuật ngữ thực sự mang tính kỹ thuật, chuyên ngành — bỏ qua từ thông thường, từ viết hoa đơn thuần, tên riêng không mang nghĩa chuyên môn.
- Hãy dựa trên ngữ cảnh của trang slide và chọn thuật ngữ dựa trên giả thuyết: Người đọc sẽ không hiểu nội dung trang slide nếu như không hiểu thuật ngữ đó.
Nếu độ tự tin của bạn về giả thuyết lớn hơn 70%, thì đó là một thuật ngữ quan trọng đối với trang slide.
- Thuật ngữ phải có căn cứ trực tiếp từ nội dung trang chứa nó — là chuỗi con hoặc cách diễn đạt lại sát nghĩa, không được bịa đặt.
- Không lấy trùng trong cùng một trang: nếu cùng một khái niệm xuất hiện nhiều lần dưới dạng khác nhau trên cùng trang, chỉ giữ một dạng đại diện nhất. Cùng một thuật ngữ xuất hiện ở các trang khác nhau thì vẫn giữ riêng cho từng trang.
</term_selection_rules>

<domain_tag_rules>
- Mỗi thuật ngữ phải gắn đúng một `domain_tag` mô tả lĩnh vực chuyên môn (ví dụ: "AI/ML", "Điện tử", "Tài chính", "Y khoa").
- Nếu danh sách `known_domain_tags` được cung cấp trong input, ƯU TIÊN dùng lại nhãn có sẵn — không tự đặt nhãn mới khi đã có nhãn tương đương.
- Chỉ tạo nhãn mới khi thuật ngữ rõ ràng không thuộc bất kỳ nhãn nào trong `known_domain_tags`.
</domain_tag_rules>

<page_number_rules>
- Mỗi thuật ngữ trong kết quả PHẢI kèm `page_number` là số N lấy đúng từ thẻ `<page-N>` chứa nó.
- `page_number` chỉ được là một trong các số thứ tự trang đã xuất hiện trong input — không được bịa ra số trang khác hoặc lệch số.
</page_number_rules>

<output_format>
Trả về JSON duy nhất, không kèm giải thích hay markdown:

{
  "terms": [
    {"term": "...", "domain_tag": "...", "page_number": ...},
    ...
  ]
}

Nếu không trang nào chứa thuật ngữ chuyên ngành, trả về:
{"terms": []}
</output_format>
"""

_DEFINE_SYSTEM_PROMPT = """\
TODO: instruct the model to write a concise definition for a single term
within its given domain tag, using the page text as grounding context.
If conflicting_definition is provided (the same term already means
something different in another domain), the new definition must stay
scoped to *this* domain_tag and should not blend the two meanings.
"""

# Bước 1 của LLM: Xác định thuật ngữ trong trang slide
class OpenAITermIdentifier(TermIdentifier):
    def __init__(self, client: AsyncOpenAI | None = None, model: str | None = None) -> None:
        self._client = client or AsyncOpenAI(api_key=settings.openai_api_key)
        self._model = model or settings.openai_model

    async def identify(self, pages: list[PageInput], known_domain_tags: list[str]) -> IdentifyResult:
        user_prompt = self._build_identify_prompt(pages, known_domain_tags)
        page_range = f"{pages[0].page_number}-{pages[-1].page_number}"
        logger.info("identify() user prompt (pages %s):\n%s", page_range, user_prompt)

        response = await self._client.beta.chat.completions.parse(
            model=self._model,
            messages=[
                {"role": "system", "content": _IDENTIFY_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format=IdentifyResult,
        )

        result = response.choices[0].message.parsed
        if result is None:
            raise ValueError("OpenAI identify() call returned no parsed result")
        logger.info("identify() response (pages %s):\n%s", page_range, result.model_dump_json())
        return result

    def _build_identify_prompt(self, pages: list[PageInput], known_domain_tags: list[str]) -> str:
        pages_block = "\n".join(
            f"<page-{page.page_number}>\n{page.text}\n</page-{page.page_number}>" for page in pages
        )
        return f"Known domain tags: {known_domain_tags}\n\n{pages_block}"

# Bước 2 của LLM: Generate định nghĩa cho terms
class OpenAITermDefiner(TermDefiner):
    def __init__(self, client: AsyncOpenAI | None = None, model: str | None = None) -> None:
        self._client = client or AsyncOpenAI(api_key=settings.openai_api_key)
        self._model = model or settings.openai_model

    async def define(
        self,
        term: str,
        domain_tag: str,
        page_text: str,
        conflicting_definition: ConflictingDefinition | None = None,
    ) -> DefineResult:
        user_prompt = self._build_define_prompt(term, domain_tag, page_text, conflicting_definition)

        # TODO: log raw request/response to the repo per backend-spec.md's R5
        # requirement, once real calls are actually happening.
        response = await self._client.beta.chat.completions.parse(
            model=self._model,
            messages=[
                {"role": "system", "content": _DEFINE_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format=DefineResult,
        )

        result = response.choices[0].message.parsed
        if result is None:
            raise ValueError("OpenAI define() call returned no parsed result")
        return result

    def _build_define_prompt(
        self,
        term: str,
        domain_tag: str,
        page_text: str,
        conflicting_definition: ConflictingDefinition | None,
    ) -> str:
        # TODO: fill in the actual prompt template.
        conflict_note = ""
        if conflicting_definition is not None:
            conflict_note = (
                f"\n\nNote: this same term already has a different meaning under domain "
                f"'{conflicting_definition.domain_tag}': {conflicting_definition.definition}\n"
                f"Define it specifically for the '{domain_tag}' domain instead."
            )

        return f"Term: {term}\nDomain: {domain_tag}\n\nPage text:\n{page_text}{conflict_note}"


def get_term_identifier() -> OpenAITermIdentifier:
    return OpenAITermIdentifier()


def get_term_definer() -> OpenAITermDefiner:
    return OpenAITermDefiner()
