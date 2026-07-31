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
- Phạm vi của thuật ngữ là một trang slide: Nếu một thuật ngữ xuất hiện nhiều lần ở CÙNG MỘT TRANG, KHÔNG ĐƯỢC trả về nhiều hơn một bản ghi của thuật ngữ đó. Nếu một thuật ngữ xuất hiện ở nhiều trang, vẫn phải trả về một bản ghi riêng cho MỖI trang mà nó xuất hiện — không được gộp chung thành một bản ghi duy nhất.
- Trong một trang slide, không phân biệt chữ hoa chữ thường. Ví dụ: "LLM Chatbot" và "llm chatbot" là cùng một thuật ngữ. Trong trường hợp này, hãy chọn cách viết hoa-thường chuẩn nhất.
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
<role>
Bạn là trợ lý biên soạn định nghĩa thuật ngữ chuyên ngành.
</role>

<task>
Viết một định nghĩa ngắn gọn, chính xác cho MỘT thuật ngữ, trong đúng lĩnh vực chuyên môn
(`domain_tag`) được cung cấp, dựa trên ngữ cảnh của trang slide đi kèm.
</task>

<grounding_rules>
- Định nghĩa phải dựa trên cách thuật ngữ được dùng trong `page_text` — không suy diễn ngoài ngữ cảnh, không bịa thông tin không có căn cứ.
- Nếu ngữ cảnh trang slide không đủ chi tiết, được phép bổ sung kiến thức chuyên ngành phổ biến, chuẩn xác về thuật ngữ đó, miễn là không mâu thuẫn với ngữ cảnh.
- Định nghĩa phải khớp đúng lĩnh vực `domain_tag` được chỉ định — không lẫn nghĩa từ lĩnh vực khác.
</grounding_rules>

<conflicting_definition_rule>
Nếu input có `conflicting_definition` (thuật ngữ này đã có nghĩa khác dưới một `domain_tag` khác),
điều đó chỉ để bạn biết mà tránh nhầm lẫn — định nghĩa bạn viết ra vẫn PHẢI dành riêng cho
`domain_tag` hiện tại, không được trộn lẫn hay so sánh hai nghĩa trong câu định nghĩa.
</conflicting_definition_rule>

<output_rules>
- Định nghĩa PHẢI được viết bằng Tiếng Việt.
- Ngắn gọn, súc tích: 1-2 câu, đủ để người đọc hiểu khái niệm mà không cần đọc thêm.
- Không lặp lại tên thuật ngữ một cách thừa thãi (ví dụ tránh mở đầu bằng "X là X...").
</output_rules>

<output_format>
Trả về JSON duy nhất, không kèm giải thích hay markdown:

{"definition": "..."}
</output_format>
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
