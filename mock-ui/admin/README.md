Mock VLearn Admin UI — Upload Slide

Mô phỏng đúng flow trong `flow-b-upload-slide.mermaid`, chỉ dùng dữ liệu giả lập (không gọi LLM/OCR thật):

Upload (A) → Pipeline mô phỏng B→C→D→E→F→G (OCR, extract, LLM phân tích, xác định thuật ngữ, tạo giải thích, tổng hợp) → Duyệt HITL (H/I/J) → Lưu & xuất bản (K) → Sẵn sàng cho học viên (L).

Hướng dẫn:
- Mở `index.html` bằng trình duyệt.
- Ở màn Upload: bấm "Dùng file mẫu có sẵn" (hoặc chọn/kéo-thả 1 file bất kỳ) rồi bấm "Bắt đầu xử lý AI".
- Màn Pipeline tự chạy qua 6 bước (setTimeout mô phỏng, không có LLM call thật) rồi tự chuyển sang màn Duyệt.
- Màn Duyệt (HITL): thuật ngữ + định nghĩa hiển thị theo từng trang (lấy từ đúng các case học viên thật từng bôi đen hỏi trong chatlog — xem `analysis/evidence-findings.md` mục 4). Có thể sửa tên/định nghĩa, xoá thuật ngữ, thêm thuật ngữ thủ công. Sửa một trang đã duyệt sẽ tự chuyển trạng thái về "Chờ duyệt" (mô phỏng nhánh J→H trong flow).
- Nút "Lưu & Xuất bản" chỉ bật khi tất cả trang đã được duyệt (I → K).
- Màn Hoàn tất tóm tắt số thuật ngữ đã lưu; có thể "Tải lên slide khác" để quay lại từ đầu.
