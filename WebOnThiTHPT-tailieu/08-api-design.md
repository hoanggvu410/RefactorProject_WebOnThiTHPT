# 08 — API Design

Base URL: `https://api.example.com`
Version: `/v1`

Response format chuẩn:
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "ERR_CODE", "message": "Mô tả lỗi" } }
```

---

## §1 — Authentication `/v1/auth`

### POST /v1/auth/register

```json
// Request
{ "name": "Nguyen Van A", "username": "nguyenvana", "email": "a@example.com", "password": "min8chars", "role": "student", "grade": 12 }

// Response 201
{ "success": true, "data": { "user_uuid": "550e8400-e29b-41d4-a716-446655440010", "name": "Nguyen Van A", "username": "nguyenvana", "email": "a@example.com", "role": "student", "grade": 12 } }

// Errors
409 AUTH_USERNAME_EXISTS | AUTH_EMAIL_EXISTS
422 Validation error
```

---

### POST /v1/auth/login

```json
// Request
{ "username": "nguyenvana", "password": "..." }

// Response 200
{ "success": true, "data": { "access_token": "...", "refresh_token": "...", "token_type": "bearer", "user": { "user_uuid": "550e8400-e29b-41d4-a716-446655440010", "name": "...", "role": "student", "grade": 12 } } }

// Errors
401 AUTH_INVALID_CREDENTIALS
403 AUTH_ACCOUNT_LOCKED
```

---

### POST /v1/auth/refresh

```json
// Request
{ "refresh_token": "..." }

// Response 200
{ "success": true, "data": { "access_token": "...", "token_type": "bearer" } }

// Errors
401 AUTH_REFRESH_TOKEN_INVALID
```

---

### POST /v1/auth/logout

```
Authorization: Bearer <access_token>
```
```json
// Request
{ "refresh_token": "..." }

// Response 200
{ "success": true, "data": { "message": "Đăng xuất thành công" } }
```

---

### POST /v1/auth/change-password

```
Authorization: Bearer <access_token>
```
```json
// Request
{ "current_password": "...", "new_password": "min8chars" }

// Response 200
{ "success": true, "data": { "message": "Đổi mật khẩu thành công" } }

// Errors
401 AUTH_WRONG_PASSWORD
```

---

## §2 — Subjects `/v1/subjects`

### GET /v1/subjects

```json
// Response 200 — danh sách môn học (hard-coded, không có CUD)
{ "success": true, "data": [ { "subject_id": 1, "subject_name": "Toán" }, { "subject_id": 2, "subject_name": "Vật lý" }, { "subject_id": 3, "subject_name": "Hóa học" }, { "subject_id": 4, "subject_name": "Sinh học" }, { "subject_id": 5, "subject_name": "Ngữ văn" }, { "subject_id": 6, "subject_name": "Lịch sử" }, { "subject_id": 7, "subject_name": "Địa lý" }, { "subject_id": 8, "subject_name": "Tiếng Anh" } ] }
```

---

## §3 — Exams `/v1/exam`

### GET /v1/exam

```
Authorization: Bearer <access_token>
Query params: ?subject_id=1&grade=12&page=1&limit=20
```
```json
// Response 200
{ "success": true, "data": { "total": 2, "page": 1, "limit": 20, "items": [ { "exam_uuid": "550e8400-e29b-41d4-a716-446655440000", "title": "Đề thi thử THPT Toán 2026 - Đề số 1", "grade": 12, "questionNumber": 50, "duration": 90 } ] } }
```

---

### GET /v1/exam/{exam_uuid}

```
Authorization: Bearer <access_token>
```
```json
// Response 200 — trả về đề thi kèm câu hỏi, KHÔNG có is_correct
{ "success": true, "data": { "exam_uuid": "550e8400-e29b-41d4-a716-446655440000", "title": "Đề thi thử THPT Toán 2026 - Đề số 1", "grade": 12, "questionNumber": 50, "duration": 90, "questions": [ { "question_uuid": "660e8400-e29b-41d4-a716-446655440001", "content": "Cho hàm số y = x³ - 3x + 2. Hàm số đồng biến trên khoảng nào?", "questionOptions": [ { "questionoptionID": 1, "content": "(-∞; -1)" }, { "questionoptionID": 2, "content": "(-1; 1)" }, { "questionoptionID": 3, "content": "(1; +∞)" }, { "questionoptionID": 4, "content": "(-∞; -1) và (1; +∞)" } ] } ] } }

// Errors
404 EXAM_NOT_FOUND
```

---

### POST /v1/exam *(teacher, admin)*

```
Authorization: Bearer <access_token>
```
```json
// Request
{ "title": "Đề thi thử Vật lý - Đề số 5", "subject_id": 2, "grade": 11, "question_number": 40, "duration": 50, "question_ids": [1, 2, 3] }

// Response 201
{ "success": true, "data": { "exam_uuid": "550e8400-e29b-41d4-a716-446655440000", "title": "...", "grade": 11, "question_number": 40, "duration": 50 } }

// Errors
400 EXAM_INVALID_QUESTIONS
403 PERM_INSUFFICIENT_ROLE
```

---

### PATCH /v1/exam/{exam_uuid} *(teacher, admin)*

```json
// Request (partial)
{ "title": "...", "duration": 60, "question_ids": [1, 2, 5] }

// Response 200 — updated exam object (không có questions)
// Errors
403 PERM_INSUFFICIENT_ROLE
404 EXAM_NOT_FOUND
```

---

### DELETE /v1/exam/{exam_uuid} *(teacher, admin)*

```json
// Response 200
{ "success": true, "data": { "message": "Xoá đề thi thành công" } }

// Errors
403 PERM_INSUFFICIENT_ROLE
404 EXAM_NOT_FOUND
```

---

## §4 — Questions `/v1/questions`

### GET /v1/questions

```
Authorization: Bearer <access_token>
Query params: ?subject_id=1&grade=12&sort_by=created_at&order_by=desc&page=1&limit=20
```
```json
// Response 200
{ "success": true, "data": { "total": 120, "page": 1, "limit": 20, "items": [ { "question_uuid": "660e8400-e29b-41d4-a716-446655440001", "content": "Cho A = {1, 2, 3}. Số tập hợp con của A là?", "grade": 10, "subject_id": 1 } ] } }
```

---

### GET /v1/questions/{question_uuid}

```
Authorization: Bearer <access_token>
```
```json
// Response 200 — trả về câu hỏi kèm options, KHÔNG có is_correct
{ "success": true, "data": { "question_uuid": "660e8400-e29b-41d4-a716-446655440001", "content": "Cho A = {1, 2, 3}. Số tập hợp con của A là?", "grade": 10, "subject_id": 1, "questionOptions": [ { "questionoptionID": 1, "content": "6" }, { "questionoptionID": 2, "content": "8" }, { "questionoptionID": 3, "content": "9" }, { "questionoptionID": 4, "content": "3" } ] } }

// Errors
404 QUESTION_NOT_FOUND
```

---

### POST /v1/questions *(teacher, admin)*

```
Authorization: Bearer <access_token>
```
```json
// Request
{ "content": "Phương trình 2x + 5 = 11 có nghiệm là?", "subject_id": 1, "grade": 10, "question_options": [ { "content": "x = 3", "is_correct": true }, { "content": "x = 2", "is_correct": false }, { "content": "x = 5", "is_correct": false } ] }

// Response 201
{ "success": true, "data": { "question_uuid": "660e8400-e29b-41d4-a716-446655440002", "content": "...", "grade": 10, "subject_id": 1 } }

// Errors
400 QUESTION_INVALID_OPTIONS
403 PERM_INSUFFICIENT_ROLE
```

---

### PATCH /v1/questions/{question_uuid} *(teacher, admin)*

```json
// Request (partial)
{ "content": "Phương trình 3x - 2 = 10 có nghiệm là?" }

// Response 200
// Errors
403 PERM_INSUFFICIENT_ROLE
404 QUESTION_NOT_FOUND
```

---

### DELETE /v1/questions/{question_uuid} *(teacher, admin)*

```json
// Response 200
{ "success": true, "data": { "message": "Xoá câu hỏi thành công" } }

// Errors
403 PERM_INSUFFICIENT_ROLE
404 QUESTION_NOT_FOUND
```

---

## §5 — Results `/v1`

### POST /v1/exam/{exam_uuid}/submit *(student)*

```
Authorization: Bearer <access_token>
```
```json
// Request
{ "answers": [ { "question_uuid": "660e8400-e29b-41d4-a716-446655440001", "selectedOptionID": 4 }, { "question_uuid": "660e8400-e29b-41d4-a716-446655440002", "selectedOptionID": 2 } ], "time_spent": 3240 }

// Response 201
{ "success": true, "data": { "result_uuid": "770e8400-e29b-41d4-a716-446655440020", "score": 8.4, "correctCount": 42, "totalQuestion": 50, "timeSpent": 3240, "review": [ { "question_uuid": "660e8400-e29b-41d4-a716-446655440001", "content": "Cho hàm số...", "selectedOptionID": 4, "correctOptionID": 4, "isCorrect": true } ] } }

// Errors
400 RESULT_INVALID_ANSWERS
404 EXAM_NOT_FOUND
```

---

### GET /v1/results/{result_uuid}

```
Authorization: Bearer <access_token>
```
```json
// Response 200 — cùng format response submit ở trên
// Errors
403 PERM_RESULT_FORBIDDEN  (không phải kết quả của mình)
404 RESULT_NOT_FOUND
```

---

### GET /v1/exam/{exam_uuid}/results *(teacher, admin)*

```
Query params: ?page=1&limit=20
```
```json
// Response 200
{ "success": true, "data": { "total": 134, "page": 1, "limit": 20, "items": [ { "result_uuid": "770e8400-e29b-41d4-a716-446655440020", "user_uuid": "550e8400-e29b-41d4-a716-446655440010", "name": "Nguyễn Văn A", "score": 8.4, "correctCount": 42, "timeSpent": 3240, "submittedAt": "2026-06-01T14:30:00Z" } ] } }
```

---

## §6 — Me `/v1/me`

### GET /v1/me

```
Authorization: Bearer <access_token>
```
```json
// Response 200
{ "success": true, "data": { "user_uuid": "550e8400-e29b-41d4-a716-446655440010", "name": "Nguyễn Văn A", "username": "nguyenvana", "email": "a@example.com", "role": "student", "grade": 12 } }
```

---

### PATCH /v1/me

```json
// Request (partial)
{ "name": "Nguyễn Văn B", "email": "b@example.com" }

// Response 200 — updated user object
// Errors
409 AUTH_EMAIL_EXISTS
```

---

### GET /v1/me/history *(student)*

```
Query params: ?subject_id=1&page=1&limit=20
```
```json
// Response 200
{ "success": true, "data": { "total": 17, "page": 1, "limit": 20, "items": [ { "result_uuid": "770e8400-e29b-41d4-a716-446655440020", "exam_uuid": "550e8400-e29b-41d4-a716-446655440000", "examTitle": "Đề thi thử THPT Toán 2026 - Đề số 1", "subject_name": "Toán", "score": 8.4, "correctCount": 42, "totalQuestion": 50, "timeSpent": 3240, "submittedAt": "2026-06-01T14:30:00Z" } ] } }
```

---

### GET /v1/me/stats *(student)*

```json
// Response 200
{ "success": true, "data": { "totalExams": 17, "avgScore": 7.2, "bestScore": 9.6, "bySubject": [ { "subject_id": 1, "subject_name": "Toán", "totalExams": 10, "avgScore": 7.8 } ] } }
```

---

## §7 — Documents `/v1/documents`

### GET /v1/documents

```
Query params: ?subject_id=1&grade=12&page=1&limit=20
```
```json
// Response 200
{ "success": true, "data": { "total": 45, "page": 1, "limit": 20, "items": [ { "document_uuid": "880e8400-e29b-41d4-a716-446655440030", "title": "Tổng hợp lý thuyết Toán 12", "grade": 12, "subject_id": 1, "subject_name": "Toán", "link": "https://drive.google.com/..." } ] } }
```

---

### POST /v1/documents *(teacher, admin)*

```json
// Request
{ "title": "Tổng hợp lý thuyết Toán 12", "grade": 12, "subject_id": 1, "link": "https://drive.google.com/..." }

// Response 201 — document object vừa tạo
// Errors
400 DOC_INVALID_LINK | DOC_INVALID_SUBJECT
403 PERM_INSUFFICIENT_ROLE
```

---

### DELETE /v1/documents/{document_uuid} *(teacher, admin)*

```json
// Response 200
{ "success": true, "data": { "message": "Xoá tài liệu thành công" } }

// Errors
403 PERM_INSUFFICIENT_ROLE
404 DOC_NOT_FOUND
```

---

## §8 — News `/v1/news`

### GET /v1/news

```
Query params: ?page=1&limit=10
```
```json
// Response 200
{ "success": true, "data": { "total": 28, "page": 1, "limit": 10, "items": [ { "news_uuid": "990e8400-e29b-41d4-a716-446655440040", "title": "Bộ GD&ĐT công bố đề minh hoạ THPT 2026", "content": "Sáng nay Bộ Giáo dục...", "date": "2026-05-20", "link": "https://moet.gov.vn/..." } ] } }
```

---

### GET /v1/news/{news_uuid}

```json
// Response 200 — news object đầy đủ
// Errors
404 NEWS_NOT_FOUND
```

---

### POST /v1/news *(admin)*

```json
// Request
{ "title": "...", "content": "...", "date": "2026-06-01", "link": "https://..." }

// Response 201 — news object vừa tạo
// Errors
403 PERM_INSUFFICIENT_ROLE
```

---

### DELETE /v1/news/{news_uuid} *(admin)*

```json
// Response 200
{ "success": true, "data": { "message": "Xoá tin tức thành công" } }

// Errors
403 PERM_INSUFFICIENT_ROLE
404 NEWS_NOT_FOUND
```

---

## §9 — Admin `/v1/admin`

### GET /v1/admin/users

```
Authorization: Bearer <access_token>  (admin only)
Query params: ?role=student&grade=12&page=1&limit=20
```
```json
// Response 200
{ "success": true, "data": { "total": 512, "page": 1, "limit": 20, "items": [ { "user_uuid": "550e8400-e29b-41d4-a716-446655440010", "name": "Nguyễn Văn A", "username": "nguyenvana", "email": "a@example.com", "role": "student", "grade": 12 } ] } }
```

---

### PATCH /v1/admin/users/{user_uuid}

```json
// Request
{ "is_active": false }

// Response 200
{ "success": true, "data": { "user_uuid": "550e8400-e29b-41d4-a716-446655440010", "is_active": false, "message": "Đã khoá tài khoản" } }

// Errors
404 USER_NOT_FOUND
```

---

### POST /v1/admin/users/{user_uuid}/reset-password

```json
// Request
{ "new_password": "newpass123" }

// Response 200
{ "success": true, "data": { "message": "Đặt lại mật khẩu thành công" } }

// Errors
404 USER_NOT_FOUND
```

---

### DELETE /v1/admin/users/{user_uuid}

```json
// Response 200
{ "success": true, "data": { "message": "Xoá tài khoản thành công" } }

// Errors
403 PERM_CANNOT_DELETE_ADMIN
404 USER_NOT_FOUND
```

---

### GET /v1/admin/stats

```json
// Response 200
{ "success": true, "data": { "totalUsers": 512, "totalStudents": 480, "totalTeachers": 30, "totalExams": 58, "totalQuestions": 320, "totalSubmissions": 4821, "avgScoreAllTime": 7.1, "activeToday": 143 } }
```

---

*Cập nhật lần cuối: 2026-06-01*
