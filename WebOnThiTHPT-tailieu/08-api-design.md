# 08 — API Design

Base URL: `https://api.example.com`

Response hiện tại của backend:

```json
// Success: đa số endpoint trả trực tiếp object/list/message
{ "message": "..." }

// Error qua HTTPException handler
{ "success": false, "error": { "code": "ERR_CODE", "message": "Mô tả lỗi" } }
```

---

## §1 — Authentication `/auth`

### POST `/auth/register`

```json
// Request
{ "name": "Nguyen Van A", "username": "nguyenvana", "email": "a@example.com", "password": "min6chars", "grade": 12 }

// Response
{ "message": "..." }
```

### POST `/auth/login`

```json
// Request
{ "username": "nguyenvana", "password": "..." }

// Response
{ "message": "...", "access_token": "...", "refresh_token": "..." }
```

### POST `/auth/refresh`

```json
// Request
{ "refresh_token": "..." }

// Response
{ "access_token": "...", "token_type": "bearer" }
```

### POST `/auth/logout`

Header: `Authorization: Bearer <access_token>`

```json
// Request
{ "refresh_token": "..." }

// Response
{ "message": "..." }
```

### POST `/auth/change-password`

Header: `Authorization: Bearer <access_token>`

```json
// Request
{ "current_password": "...", "new_password": "min8chars" }

// Response
{ "message": "..." }
```

### POST `/auth/send-verify-email`

Header: `Authorization: Bearer <access_token>`

```json
// Response
{ "message": "..." }
```

### POST `/auth/verify-email`

```json
// Request
{ "token": "..." }

// Response
{ "message": "..." }
```

### POST `/auth/forgot-password`

```json
// Request
{ "email": "a@example.com" }

// Response
{ "message": "..." }
```

### POST `/auth/verify-reset-otp`

```json
// Request
{ "email": "a@example.com", "otp": "123456" }

// Response
{ "message": "...", "reset_token": "..." }
```

### POST `/auth/reset-password`

```json
// Request
{ "reset_token": "...", "new_password": "min6chars" }

// Response
{ "message": "..." }
```

### GET `/auth/google/login`

Redirect user sang Google OAuth.

### GET `/auth/google/callback`

Google callback, backend tạo token rồi redirect về frontend.

---

## §2 — Subjects `/subjects`

### GET `/subjects/`

```json
// Response
[ { "subject_id": 1, "subject_name": "Toán" } ]
```

### GET `/subjects/{subject_id}`

```json
// Response
{ "subject_id": 1, "subject_name": "Toán" }
```

---

## §3 — Exams `/exam`

### GET `/exam/`

Query params: `subject_id`, `grade`, `keyword`, `sort_by`, `sort_order`, `page`, `limit`

```json
// Response
{ "total": 2, "items": [ { "exam_id": 1, "uuid": "...", "title": "...", "grade": 12, "question_number": 50, "duration": 90 } ], "page": 1, "limit": 10 }
```

### GET `/exam/{exam_uuid}`

```json
// Response: đề thi public, không trả is_correct
{
  "exam_uuid": "...",
  "title": "...",
  "questionNumber": 50,
  "duration": 90,
  "questions": [
    {
      "questionID": 1,
      "question_uuid": "...",
      "content": "...",
      "questionOptions": [ { "questionoptionID": 1, "content": "..." } ]
    }
  ]
}
```

### POST `/exam/create_exam` *(giáo viên, admin)*

```json
// Request
{
  "title": "Đề thi thử Toán",
  "subject_id": 1,
  "grade": 12,
  "duration": 90,
  "questions": [
    {
      "content": "Câu hỏi...",
      "explanation": "Giải thích...",
      "QuestionOptions": [
        { "content": "A", "is_correct": true },
        { "content": "B", "is_correct": false }
      ]
    }
  ]
}

// Response
{ "exam_uuid": "...", "title": "...", "questionNumber": 1, "duration": 90, "questions": [ ... ] }
```

### POST `/exam/import_csv` *(giáo viên, admin)*

Content-Type: `multipart/form-data`

Form field: `file` là CSV.

```json
// Response
{ "message": "Import đề thi thành công", "exam_uuid": "...", "title": "...", "question_number": 50 }
```

### PATCH `/exam/{exam_uuid}` *(giáo viên, admin)*

```json
// Request: gửi field nào thì sửa field đó
{ "title": "Tên mới", "duration": 60 }

// Response
{ "message": "Exam updated successfully" }
```

### DELETE `/exam/{exam_uuid}` *(giáo viên, admin)*

```json
// Response
{ "message": "Exam deleted successfully" }
```

---

## §4 — Questions `/questions`

### GET `/questions/`

Query params: `subject_id`, `grade`, `keyword`, `sort_by`, `sort_order`, `page`, `limit`

```json
// Response
{ "total": 120, "items": [ { "question_id": 1, "uuid": "...", "content": "...", "grade": 12, "subject_id": 1 } ], "page": 1 }
```

### GET `/questions/{question_uuid}`

```json
// Response: không trả is_correct
{
  "questionID": 1,
  "question_uuid": "...",
  "content": "...",
  "questionOptions": [ { "questionoptionID": 1, "content": "..." } ]
}
```

### POST `/questions/create_question` *(giáo viên, admin)*

Chỉ dùng để tạo câu hỏi mới, không dùng để sửa.

```json
// Request
{
  "content": "Câu hỏi...",
  "grade": 12,
  "subject_id": 1,
  "explanation": "Giải thích...",
  "QuestionOptions": [
    { "content": "A", "is_correct": true },
    { "content": "B", "is_correct": false }
  ]
}
```

### PATCH `/questions/{question_uuid}` *(giáo viên, admin)*

Sửa từng phần. Nếu không gửi `QuestionOptions` thì giữ nguyên đáp án cũ.

```json
// Request: ví dụ chỉ sửa nội dung
{ "content": "Nội dung mới" }

// Request: ví dụ sửa lại options
{
  "QuestionOptions": [
    { "content": "A mới", "is_correct": false },
    { "content": "B mới", "is_correct": true }
  ]
}

// Response
{
  "questionID": 1,
  "question_uuid": "...",
  "content": "...",
  "questionOptions": [ { "questionoptionID": 1, "content": "..." } ]
}
```

### DELETE `/questions/{question_uuid}` *(giáo viên, admin)*

```json
// Response
{ "message": "Question deleted successfully" }
```

---

## §5 — Results `/results`

### GET `/results/user/{user_id}`

Header: `Authorization: Bearer <access_token>`

```json
// Response
[ ... ]
```

### POST `/results/submit-exam`

Header: `Authorization: Bearer <access_token>`

```json
// Request
{
  "exam_uuid": "...",
  "answers": [
    { "question_id": 1, "selected_option_id": 4 }
  ],
  "time_spent": 3240
}

// Response
{ "message": "submit exam successfully", "result_uuid": "...", "score": 8.4, "correct_count": 42, "total_question": 50, "time_spent": 3240 }
```

### GET `/results/review/{result_uuid}`

Header: `Authorization: Bearer <access_token>`

```json
// Response
{ "title": "...", "score": 8.4, "time_spent": 3240, "questions": [ ... ] }
```

---

## §6 — Me `/me`

### GET `/me/`

Header: `Authorization: Bearer <access_token>`

```json
// Response
{ "uuid": "...", "name": "...", "username": "...", "email": "...", "email_verified": false, "role": "student", "grade": 12, "avatar_url": null }
```

### PATCH `/me/profile`

```json
// Request: gửi field nào thì sửa field đó
{ "name": "Nguyễn Văn B", "email": "b@example.com", "grade": 12 }
```

### GET `/me/history`

Query params: `subject_id`, `page`, `limit`

```json
// Response
{ "total": 17, "page": 1, "limit": 20, "items": [ { "result_uuid": "...", "exam_uuid": "...", "exam_title": "...", "subject_name": "Toán", "score": 8.4, "correct_count": 42, "total_question": 50, "time_spent": 3240, "submitted_at": "..." } ] }
```

### PATCH `/me/upload-avatar`

Content-Type: `multipart/form-data`

Form field: `file` là ảnh avatar.

```json
// Response
{ "message": "Avatar uploaded successfully", "avatar_url": "..." }
```

### GET `/me/stats`

```json
// Response
{ "total_exams": 17, "avg_score": 7.2, "best_score": 9.6, "by_subject": [ { "subject_id": 1, "subject_name": "Toán", "total_exams": 10, "avg_score": 7.8 } ] }
```

### GET `/me/scoreboard`

Query params: `subject_id`, `page`, `limit`

```json
// Response
{ "total": 10, "page": 1, "limit": 20, "items": [ { "rank": 1, "result_uuid": "...", "exam_uuid": "...", "exam_title": "...", "subject_name": "Toán", "score": 9.6, "total_question": 50, "time_spent": 3000, "submitted_at": "..." } ] }
```

---

## §7 — Documents `/documents`

### GET `/documents/`

Query params: `subject_id`, `grade`, `keyword`, `sort_by`, `sort_order`, `page`, `limit`

```json
// Response
{ "total": 45, "items": [ { "document_id": 1, "uuid": "...", "title": "...", "grade": 12, "subject_id": 1 } ], "page": 1, "limit": 10 }
```

### GET `/documents/{document_uuid}`

```json
// Response
{ "document_id": 1, "uuid": "...", "title": "...", "grade": 12, "subject_id": 1 }
```

### POST `/documents/create_document` *(giáo viên, admin)*

Content-Type: `multipart/form-data`

Form fields: `title`, `grade`, `subject_id`, `file`.

```json
// Response
{ "document_uuid": "...", "title": "...", "grade": 12, "subject_id": 1, "link": "..." }
```

### PUT `/documents/{document_uuid}` *(giáo viên, admin)*

```json
// Request
{ "title": "...", "grade": 12, "subject_id": 1 }

// Response
{ "message": "Document updated successfully" }
```

### DELETE `/documents/{document_uuid}` *(giáo viên, admin)*

```json
// Response
{ "message": "Document deleted successfully" }
```

---

## §8 — News `/news`

### GET `/news/`

Query params: `page`, `limit`, `keyword`, `sort_by`, `sort_order`

```json
// Response
{ "total": 28, "items": [ { "uuid": "...", "title": "...", "content": "...", "date": "2026-06-01", "link": "..." } ], "page": 1, "limit": 10 }
```

### GET `/news/{news_uuid}`

```json
// Response
{ "uuid": "...", "title": "...", "content": "...", "date": "2026-06-01", "link": "..." }
```

### POST `/news/` *(giáo viên, admin)*

```json
// Request
{ "title": "...", "content": "...", "date": "2026-06-01", "link": "https://..." }
```

### PUT `/news/{news_uuid}` *(giáo viên, admin)*

```json
// Request
{ "title": "...", "content": "...", "date": "2026-06-01", "link": "https://..." }

// Response
{ "message": "News updated successfully" }
```

### DELETE `/news/{news_uuid}` *(giáo viên, admin)*

```json
// Response
{ "message": "News deleted successfully" }
```

---

## §9 — Users/Admin `/users`

Tất cả endpoint trong nhóm này yêu cầu role `admin`.

### GET `/users/`

Query params: `username`, `grade`, `is_active`, `keyword`, `sort_by`, `sort_order`, `page`, `limit`

```json
// Response
{ "total": 512, "items": [ { "uuid": "...", "name": "...", "username": "...", "email": "...", "role": "student", "grade": 12, "is_active": true } ], "page": 1 }
```

### GET `/users/stats`

```json
// Response
{ "total_users": 512, "total_students": 480, "total_teachers": 30, "total_exams": 58, "total_questions": 320, "total_submissions": 4821, "avg_score_all_time": 7.1 }
```

### GET `/users/{user_uuid}`

```json
// Response
{ "uuid": "...", "name": "...", "username": "...", "email": "...", "role": "student", "grade": 12, "is_active": true }
```

### PUT `/users/{user_uuid}`

```json
// Request
{ "name": "...", "username": "...", "password": "min6chars", "email": "...", "grade": 12 }

// Response
{ "message": "User updated successfully" }
```

### PATCH `/users/{user_uuid}/is-active`

```json
// Request
{ "is_active": false }

// Response
{ "user_uuid": "...", "is_active": false, "message": "User active status updated successfully" }
```

### DELETE `/users/{user_uuid}`

```json
// Response
{ "message": "User deleted successfully" }
```

---

*Cập nhật lần cuối: 2026-07-03*
