# 07 — Data Models

---

## 1. Chiến lược quản lý schema

Dự án **không dùng Alembic migrations**. Toàn bộ bảng được tạo tự động qua `create_all_tables()` được gọi trong `lifespan` của FastAPI mỗi khi server khởi động.

**Hệ quả cần nắm:**
- Thêm cột mới vào ORM model → chỉ có tác dụng nếu bảng **chưa tồn tại**
- `create_all` **không** alter bảng đã tồn tại — muốn đổi schema phải chạy raw SQL thủ công hoặc drop & recreate (chỉ dùng trong dev)
- Phù hợp giai đoạn phát triển ban đầu; khi production ổn định nên xem xét chuyển sang Alembic

---

## 2. Entity Overview

| Bảng | Mô tả | Quan hệ chính |
|------|-------|---------------|
| `users` | Tài khoản người dùng (học sinh, giáo viên, admin) | 1-n với `results`, `refresh_tokens` |
| `refresh_tokens` | JWT refresh token, hỗ trợ revoke | n-1 với `users` |
| `subjects` | Danh mục môn học | 1-n với `exams`, `questions`, `documents` |
| `exams` | Đề thi | n-1 với `subjects`; 1-n với `exam_questions`, `results` |
| `questions` | Ngân hàng câu hỏi | n-1 với `subjects`; 1-n với `question_options`, `exam_questions` |
| `question_options` | Các đáp án (A/B/C/D) của một câu hỏi | n-1 với `questions` |
| `exam_questions` | Bảng trung gian: câu hỏi nào thuộc đề nào | n-1 với `exams`, `questions` |
| `results` | Kết quả một lần làm bài của học sinh | n-1 với `users`, `exams`; 1-n với `user_answers` |
| `user_answers` | Đáp án học sinh chọn cho từng câu | n-1 với `results`, `questions`, `question_options` |
| `documents` | Tài liệu ôn tập (PDF, link ngoài) | n-1 với `subjects` |
| `news` | Tin tức / thông báo hệ thống | Độc lập, không FK |

---

## 3. Chi tiết từng bảng

### 3.1 `users`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `userID` | INTEGER | PK, auto | |
| `name` | VARCHAR | NOT NULL | Họ tên đầy đủ |
| `role` | VARCHAR | NOT NULL | `student` / `teacher` / `admin` |
| `username` | VARCHAR | NOT NULL, UNIQUE | Tên đăng nhập |
| `password` | VARCHAR | NOT NULL | bcrypt hash — không bao giờ lưu plaintext |
| `mail` | VARCHAR | NOT NULL, UNIQUE | Email |
| `grade` | INTEGER | nullable | 10 / 11 / 12 với học sinh; NULL với teacher/admin |

**Ghi chú:** `role` lưu dạng string thay vì Enum để tránh phức tạp khi thay đổi schema về sau.

---

### 3.2 `refresh_tokens`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | INTEGER | PK, auto | |
| `user_id` | INTEGER | FK → `users.userID`, CASCADE DELETE | |
| `token` | VARCHAR | NOT NULL, UNIQUE | SHA256 hash của token thực — không lưu token gốc |
| `is_revoked` | BOOLEAN | NOT NULL, default FALSE | TRUE khi user logout hoặc đổi mật khẩu |
| `expires_at` | TIMESTAMP | NOT NULL | Thời điểm hết hạn |
| `created_at` | TIMESTAMP | NOT NULL, default now() | |

**Ghi chú:** Lưu SHA256 hash thay vì token gốc — nếu DB bị leak, token thực vẫn không bị lộ. Token hết hạn cần được filter hoặc cleanup định kỳ.

---

### 3.3 `subjects`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `subjectID` | INTEGER | PK, auto | |
| `subjectName` | VARCHAR | NOT NULL, UNIQUE | Ví dụ: `Toán`, `Vật lý`, `Hóa học` |

---

### 3.4 `exams`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `examID` | INTEGER | PK, auto | |
| `title` | VARCHAR | NOT NULL | Tên đề thi |
| `subjectID` | INTEGER | FK → `subjects.subjectID` | |
| `grade` | INTEGER | NOT NULL | 10 / 11 / 12 |
| `questionNumber` | INTEGER | NOT NULL | Số câu hỏi trong đề |
| `duration` | INTEGER | NOT NULL | Thời gian làm bài (phút) |

---

### 3.5 `questions`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `questionID` | INTEGER | PK, auto | |
| `grade` | INTEGER | NOT NULL | Khối lớp phù hợp |
| `subjectID` | INTEGER | FK → `subjects.subjectID` | |
| `content` | TEXT | NOT NULL | Nội dung câu hỏi |

---

### 3.6 `question_options`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `questionoptionID` | INTEGER | PK, auto | |
| `questionID` | INTEGER | FK → `questions.questionID`, CASCADE DELETE | |
| `content` | VARCHAR | NOT NULL | Nội dung đáp án |
| `is_correct` | BOOLEAN | NOT NULL, default FALSE | Đúng 1 option mang giá trị TRUE mỗi câu |

**Ghi chú:** Backend phải validate khi tạo câu hỏi — đúng 1 đáp án đúng, tối thiểu 2 đáp án. Xóa câu hỏi sẽ tự xóa toàn bộ options (CASCADE).

---

### 3.7 `exam_questions`

Bảng trung gian thể hiện quan hệ nhiều-nhiều giữa `exams` và `questions`.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `examQuestionID` | INTEGER | PK, auto | |
| `examID` | INTEGER | FK → `exams.examID`, CASCADE DELETE | |
| `questionID` | INTEGER | FK → `questions.questionID` | |
| — | — | UNIQUE (`examID`, `questionID`) | Mỗi câu chỉ xuất hiện 1 lần trong 1 đề |

---

### 3.8 `results`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `resultID` | INTEGER | PK, auto | |
| `score` | FLOAT | NOT NULL | Điểm số (0.0 – 10.0) |
| `userID` | INTEGER | FK → `users.userID` | |
| `examID` | INTEGER | FK → `exams.examID` | |
| `timeSpent` | INTEGER | NOT NULL | Thời gian thực tế làm bài (giây) |

---

### 3.9 `user_answers`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `userAnswerID` | INTEGER | PK, auto | |
| `selectedOptionID` | INTEGER | FK → `question_options.questionoptionID` | Đáp án học sinh chọn |
| `questionID` | INTEGER | FK → `questions.questionID` | |
| `resultID` | INTEGER | FK → `results.resultID`, CASCADE DELETE | |

**Ghi chú:** Tra cứu đúng/sai bằng cách JOIN với `question_options` → lấy `is_correct`. Xóa một `result` sẽ tự xóa toàn bộ câu trả lời thuộc lần thi đó.

---

### 3.10 `documents`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `documentID` | INTEGER | PK, auto | |
| `title` | VARCHAR | NOT NULL | Tên tài liệu |
| `grade` | INTEGER | NOT NULL | Khối lớp |
| `subjectID` | INTEGER | FK → `subjects.subjectID` | |
| `link` | VARCHAR | NOT NULL | URL tài liệu (PDF, Google Drive...) |

---

### 3.11 `news`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `newsID` | INTEGER | PK, auto | |
| `title` | VARCHAR | NOT NULL | Tiêu đề tin |
| `content` | VARCHAR | NOT NULL | Tóm tắt nội dung |
| `date` | VARCHAR | NOT NULL | Ngày đăng, dạng ISO string (`2026-06-01`) |
| `link` | VARCHAR | NOT NULL | Link bài gốc hoặc chi tiết |

---

## 4. Quan hệ tổng hợp

```
users ──────────────── refresh_tokens   (1-n, cascade delete)
users ──────────────── results          (1-n)

subjects ───────────── exams            (1-n)
subjects ───────────── questions        (1-n)
subjects ───────────── documents        (1-n)

exams ──────────────── exam_questions   (1-n, cascade delete)
exams ──────────────── results          (1-n)

questions ──────────── question_options (1-n, cascade delete)
questions ──────────── exam_questions   (1-n)
questions ──────────── user_answers     (1-n)

question_options ────── user_answers    (1-n)

results ────────────── user_answers     (1-n, cascade delete)

news                                    (độc lập, không FK)
```

---

## 5. Luồng dữ liệu khi học sinh nộp bài

```
POST /v1/exams/{examID}/submit
  │
  ├─ SELECT exam_questions WHERE examID = ?
  │   → lấy danh sách questionID có trong đề
  │
  ├─ SELECT question_options WHERE questionID IN (...)
  │   → lấy toàn bộ options, lọc is_correct = TRUE để có đáp án đúng
  │
  ├─ So sánh selectedOptionID của học sinh với correct option từng câu
  │   → đếm số câu đúng → tính score (thang 10)
  │
  ├─ INSERT results { score, userID, examID, timeSpent }
  │   → lấy resultID vừa tạo
  │
  └─ INSERT user_answers (bulk) { selectedOptionID, questionID, resultID }
      → lưu từng câu trả lời để xem lại sau
```

---

## 6. Lưu ý khi phát triển

**Thêm cột vào bảng đã tồn tại** — `create_all` không tự alter, phải chạy thủ công:

```sql
ALTER TABLE questions ADD COLUMN difficulty VARCHAR DEFAULT 'medium';
```

**Reset toàn bộ schema khi dev** — drop tất cả bảng rồi để `lifespan` tạo lại khi restart server. Chỉ dùng trong môi trường development, không bao giờ dùng trên production.

**Thứ tự import models** — tất cả ORM models phải được import vào trước khi `create_all` chạy, nếu không SQLAlchemy sẽ không biết bảng nào cần tạo. Thường được tập trung trong `app/models/__init__.py`.

---

*Cập nhật lần cuối: 2026-06-01*
