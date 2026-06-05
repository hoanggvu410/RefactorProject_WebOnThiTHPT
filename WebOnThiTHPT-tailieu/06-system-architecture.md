# 06 — System Architecture

---

## 1. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│  Clients                                                        │
│  - Học sinh: Web App (React + Vite)                             │
│  - Giáo viên: Web App (React + Vite) — cùng domain, role-based │
│  - Admin: Web App (React + Vite) — /admin route                 │
│  Giao tiếp qua REST API + JWT                                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
               ┌───────────────▼────────────────┐
               │      THPT-Prep API               │
               │      FastAPI + Uvicorn           │
               │      :8000                       │
               │                                  │
               │  ┌──────────────────────────┐   │
               │  │  PostgreSQL 16  (:5432)   │   │
               │  └──────────────────────────┘   │
               │  ┌──────────────────────────┐   │
               │  │  Redis 7       (:6379)    │   │
               │  └──────────────────────────┘   │
               └───────────────┬────────────────┘
                               │ Internal HTTP (không expose)
               ┌───────────────▼────────────────┐
               │   AI Service (self-hosted)       │
               │   :11434 hoặc internal network   │
               │                                  │
               │   Chat API / Grading API         │
               └─────────────────────────────────┘
```

**Nguyên tắc:**
- AI Service **không** expose ra internet — chỉ accessible từ THPT-Prep API qua internal network
- Client không bao giờ gọi AI Service trực tiếp
- API keys và secrets được encrypt, chỉ decrypt trong memory khi cần
- Role-based access: `student` / `teacher` / `admin` — phân quyền tại middleware

---

## 2. Request Flow — Làm bài thi (submit & chấm điểm)

```
Client (học sinh)
  │  POST /v1/exams/{exam_id}/submit
  │  Authorization: Bearer <jwt>
  │  Body: { answers: [{ question_id, selected_option }] }
  ▼
FastAPI handler
  │
  ├─ [1] HTTPBearer → decode JWT (RS256) → get user_id
  ├─ [2] RoleRequired("student") → check user.role
  ├─ [3] SELECT exams WHERE id=exam_id AND is_published=true
  ├─ [4] SELECT questions WHERE exam_id=? (+ correct_answers)
  │
  ├─ [5] GradingService.grade(answers, questions)
  │       → tính điểm, phân tích từng câu đúng/sai
  │
  ├─ [6] INSERT exam_results { user_id, exam_id, score, answers_json, duration }
  ├─ [7] UPDATE user_stats { total_exams, avg_score, weak_topics[] }
  │
  └─ [8] Return ExamResultResponse { score, correct_count, review[] }
  ▼
Client nhận kết quả ngay (không streaming)
```

---

## 3. Request Flow — AI giải thích đáp án (streaming)

```
Client (học sinh)
  │  POST /v1/questions/{question_id}/explain
  │  Authorization: Bearer <jwt>
  │  Body: { user_answer, context? }
  ▼
FastAPI handler
  │
  ├─ [1] Auth + RoleRequired("student")
  ├─ [2] SELECT questions WHERE id=question_id (+ answer, explanation)
  ├─ [3] Check daily_ai_quota (Redis) → không vượt 20 lần/ngày/user
  │
  ├─ [4] AIClient.explain_stream(question, user_answer, correct_answer)
  │       → httpx stream POST ai-service:11434/api/chat
  │
  ├─ [5] INCR Redis key: ai_quota:{user_id}:{date}
  └─ [6] StreamingResponse(event_stream())
          └─ yield SSE chunks về client
  ▼
Client nhận giải thích từng chữ (SSE stream)
```

---

## 4. Request Flow — Giáo viên tạo đề thi

```
Client (giáo viên)
  │  POST /v1/exams
  │  Authorization: Bearer <jwt>
  │  Body: { title, subject, grade, time_limit, questions[] }
  ▼
FastAPI handler
  │
  ├─ [1] Auth + RoleRequired("teacher")
  ├─ [2] Validate questions schema (min 10, max 100 câu)
  ├─ [3] INSERT exams { title, subject, grade, created_by=user_id, is_published=false }
  ├─ [4] INSERT questions (bulk) { exam_id, content, options[], correct_option, explanation }
  └─ [5] Return ExamResponse { exam_id, question_count, status="draft" }

  Publish exam:
  │  PATCH /v1/exams/{exam_id}/publish
  ├─ [1] Auth + OwnerOrAdmin check
  ├─ [2] Validate: exam có ít nhất 1 câu hỏi
  ├─ [3] UPDATE exams SET is_published=true, published_at=now()
  └─ [4] Invalidate Redis cache: exams_list:*
```

---

## 5. Module Structure

```
app/
├── main.py                    ← FastAPI app factory, CORS, exception handlers
├── core/
│   ├── config.py              ← Pydantic Settings (tất cả env vars)
│   ├── database.py            ← async SQLAlchemy engine, get_db dependency
│   ├── redis.py               ← async Redis client (singleton)
│   ├── security.py            ← JWT RS256, bcrypt, Fernet encrypt/decrypt
│   ├── deps.py                ← get_current_user, RoleRequired, OwnerOrAdmin
│   └── permissions.py         ← RBAC: student / teacher / admin
├── models/
│   ├── user.py                ← User, RefreshToken
│   ├── exam.py                ← Exam
│   ├── question.py            ← Question
│   ├── result.py              ← ExamResult, AnswerDetail
│   └── stats.py               ← UserStats (weak topics, progress)
├── schemas/
│   ├── auth.py
│   ├── exam.py
│   ├── question.py
│   ├── result.py
│   └── stats.py
├── routers/
│   ├── auth.py                ← /v1/auth/*
│   ├── exams.py               ← /v1/exams/* (CRUD + publish)
│   ├── questions.py           ← /v1/questions/* (+ AI explain)
│   ├── results.py             ← /v1/exams/{id}/submit, /v1/results/*
│   ├── stats.py               ← /v1/me/stats, /v1/me/history
│   ├── admin.py               ← /v1/admin/* (admin only)
│   └── health.py              ← GET /health
├── services/
│   ├── auth_service.py
│   ├── exam_service.py
│   ├── grading_service.py     ← Tính điểm, phân tích kết quả
│   ├── stats_service.py       ← Cập nhật progress, gợi ý ôn tập
│   └── ai_service.py          ← Gọi AI explain, kiểm tra quota
└── integrations/
    └── ai_client.py           ← AIClient (httpx async, SSE stream)

frontend/
├── src/
│   ├── pages/
│   │   ├── student/           ← Dashboard, làm bài, xem kết quả
│   │   ├── teacher/           ← Tạo đề, quản lý câu hỏi
│   │   └── admin/             ← Quản lý user, thống kê toàn hệ thống
│   ├── components/
│   │   ├── ExamPlayer/        ← Giao diện làm bài (timer, câu hỏi, điều hướng)
│   │   ├── QuestionEditor/    ← Soạn câu hỏi (rich text, upload ảnh)
│   │   └── ResultReview/      ← Xem lại bài, AI giải thích
│   └── services/
│       └── api.ts             ← Axios instance + interceptors (JWT auto-refresh)

tests/
├── conftest.py
├── test_auth.py
├── test_exams.py
├── test_grading.py
├── test_results.py
└── test_ai_explain.py
```

---

## 6. Auth Architecture

```
Đăng ký
  ├─ Validate email chưa tồn tại
  ├─ bcrypt.hash(password) → lưu vào DB
  ├─ Gửi OTP qua email → store Redis otp:{email} TTL 15min
  └─ Yêu cầu verify trước khi login

Login
  ├─ bcrypt.verify(password, hash)
  ├─ Check account_locked:{email} trong Redis
  ├─ create_access_token(user_id, role) → JWT RS256, exp=15min
  ├─ create_refresh_token() → random 64 bytes urlsafe
  ├─ store SHA256(refresh_token) in DB (refresh_tokens table)
  └─ return { access_token, refresh_token }

Protected request
  ├─ HTTPBearer → extract "Bearer <token>"
  ├─ jwt.decode(token, PUBLIC_KEY, algorithms=["RS256"])
  ├─ payload["sub"] → user_id, payload["role"] → role
  ├─ SELECT User WHERE id=user_id AND is_active=true
  └─ return User object

Role check (RoleRequired)
  ├─ So sánh user.role với required_roles
  ├─ student < teacher < admin (hierarchy)
  └─ 403 Forbidden nếu không đủ quyền
```

---

## 7. Database Schema (tóm tắt)

```
users
  id, email, hashed_password, full_name
  role: enum(student, teacher, admin)
  grade: int (10, 11, 12) — null nếu là teacher/admin
  is_active, is_verified, created_at

exams
  id, title, subject, grade
  time_limit_minutes: int
  created_by → users.id
  is_published, published_at, created_at

questions
  id, exam_id → exams.id
  content: text, image_url: nullable
  option_a/b/c/d: text
  correct_option: enum(A, B, C, D)
  explanation: text (AI hoặc giáo viên nhập)
  difficulty: enum(easy, medium, hard)
  topic: text (Chương/chủ đề, dùng cho phân tích điểm yếu)

exam_results
  id, user_id → users.id, exam_id → exams.id
  score: float (0-10), correct_count: int
  answers_json: jsonb  ← { question_id: selected_option }
  duration_seconds: int
  submitted_at

user_stats
  user_id → users.id (PK)
  total_exams: int, avg_score: float
  weak_topics: jsonb  ← ["Hàm số", "Tích phân", ...]
  last_active_at
```

---

## 8. Redis Key Schema

| Key | Type | TTL | Mục đích |
|-----|------|-----|---------|
| `otp:{email}` | string | 900s (15 min) | Email verify OTP |
| `otp_cooldown:{email}` | string | 60s | Rate limit gửi lại OTP |
| `login_attempts:{email}` | string | 600s (10 min) | Đếm login thất bại |
| `account_locked:{email}` | string | 900s (15 min) | Khóa tài khoản |
| `reset_token:{hash}` | string | 900s (15 min) | Password reset token |
| `ai_quota:{user_id}:{date}` | string | 86400s (1 ngày) | Giới hạn AI explain 20 lần/ngày |
| `exams_list:{subject}:{grade}` | string | 300s (5 min) | Cache danh sách đề thi |
| `exam:{exam_id}` | string | 600s (10 min) | Cache chi tiết đề (sau publish) |

---

## 9. Environment

| Service | Host:Port | Notes |
|---------|-----------|-------|
| THPT-Prep API | 0.0.0.0:8000 | Uvicorn |
| React Frontend | 0.0.0.0:5173 | Vite dev server |
| PostgreSQL | localhost:5432 | Docker |
| Redis | localhost:6379 | Docker |
| AI Service | ai-service:11434 (internal) | Không expose ra ngoài |

---

## 10. API Route Overview

| Method | Route | Role | Mô tả |
|--------|-------|------|-------|
| POST | `/v1/auth/register` | Public | Đăng ký tài khoản |
| POST | `/v1/auth/login` | Public | Đăng nhập, nhận JWT |
| POST | `/v1/auth/refresh` | Public | Làm mới access token |
| GET | `/v1/exams` | Student+ | Danh sách đề thi (filter theo môn, khối) |
| GET | `/v1/exams/{id}` | Student+ | Chi tiết đề thi |
| POST | `/v1/exams/{id}/submit` | Student | Nộp bài, nhận kết quả |
| POST | `/v1/questions/{id}/explain` | Student | AI giải thích đáp án (SSE) |
| POST | `/v1/exams` | Teacher+ | Tạo đề thi mới |
| PATCH | `/v1/exams/{id}/publish` | Teacher+ | Publish đề thi |
| GET | `/v1/me/stats` | Student | Thống kê cá nhân, điểm yếu |
| GET | `/v1/me/history` | Student | Lịch sử các bài đã làm |
| GET | `/v1/admin/users` | Admin | Quản lý user |
| GET | `/v1/admin/stats` | Admin | Thống kê toàn hệ thống |

---

*Cập nhật lần cuối: 2026-06-01*
