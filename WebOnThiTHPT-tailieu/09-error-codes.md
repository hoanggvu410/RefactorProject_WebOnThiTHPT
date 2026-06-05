# 09 — Error Codes

Format response lỗi chuẩn:
```json
{
  "success": false,
  "error": {
    "code": "ERR_CODE",
    "message": "Mô tả lỗi cho end-user"
  }
}
```

---

## AUTH — Authentication errors

| Code | HTTP | Mô tả |
|------|------|-------|
| `AUTH_USERNAME_EXISTS` | 409 | Username đã được đăng ký |
| `AUTH_EMAIL_EXISTS` | 409 | Email đã được đăng ký |
| `AUTH_INVALID_CREDENTIALS` | 401 | Username hoặc mật khẩu không đúng |
| `AUTH_ACCOUNT_LOCKED` | 403 | Tài khoản bị tạm khoá (5 lần sai / 10 phút) |
| `AUTH_ACCOUNT_DISABLED` | 403 | Tài khoản đã bị vô hiệu hoá bởi admin |
| `AUTH_TOKEN_INVALID` | 401 | Access token không hợp lệ hoặc đã hết hạn |
| `AUTH_REFRESH_TOKEN_INVALID` | 401 | Refresh token không hợp lệ, đã dùng hoặc hết hạn |
| `AUTH_WRONG_PASSWORD` | 401 | Mật khẩu hiện tại không đúng (đổi mật khẩu) |

---

## PERM — Permission errors

| Code | HTTP | Mô tả |
|------|------|-------|
| `PERM_INSUFFICIENT_ROLE` | 403 | Role hiện tại không đủ quyền thực hiện |
| `PERM_RESULT_FORBIDDEN` | 403 | Không có quyền xem kết quả này |
| `PERM_CANNOT_DELETE_ADMIN` | 403 | Không thể xoá tài khoản admin |

---

## EXAM — Exam errors

| Code | HTTP | Mô tả |
|------|------|-------|
| `EXAM_NOT_FOUND` | 404 | Đề thi không tồn tại |
| `EXAM_INVALID_QUESTIONS` | 400 | Một hoặc nhiều questionID không hợp lệ, không cùng môn hoặc khối |

---

## QUESTION — Question errors

| Code | HTTP | Mô tả |
|------|------|-------|
| `QUESTION_NOT_FOUND` | 404 | Câu hỏi không tồn tại |
| `QUESTION_INVALID_OPTIONS` | 400 | Phải có đúng 1 đáp án đúng và tối thiểu 2 đáp án |
| `QUESTION_IN_USE` | 409 | Câu hỏi đang thuộc một đề thi, không thể xoá |

---

## RESULT — Result errors

| Code | HTTP | Mô tả |
|------|------|-------|
| `RESULT_NOT_FOUND` | 404 | Kết quả không tồn tại |
| `RESULT_INVALID_ANSWERS` | 400 | Thiếu câu trả lời hoặc selectedOptionID không thuộc câu hỏi tương ứng |

---

## SUBJECT — Subject errors

| Code | HTTP | Mô tả |
|------|------|-------|
| `SUBJECT_NOT_FOUND` | 404 | Môn học không tồn tại |

---

## DOC — Document errors

| Code | HTTP | Mô tả |
|------|------|-------|
| `DOC_NOT_FOUND` | 404 | Tài liệu không tồn tại |
| `DOC_INVALID_LINK` | 400 | URL tài liệu không hợp lệ |
| `DOC_INVALID_SUBJECT` | 400 | Môn học không tồn tại |

---

## NEWS — News errors

| Code | HTTP | Mô tả |
|------|------|-------|
| `NEWS_NOT_FOUND` | 404 | Tin tức không tồn tại |

---

## USER — User errors

| Code | HTTP | Mô tả |
|------|------|-------|
| `USER_NOT_FOUND` | 404 | Người dùng không tồn tại |

---

## RATE — Rate limit errors

| Code | HTTP | Mô tả |
|------|------|-------|
| `RATE_LIMIT_EXCEEDED` | 429 | Quá nhiều request, vui lòng thử lại sau |

---

## Validation errors (Pydantic)

HTTP 422 — FastAPI tự sinh, format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [
      { "field": "grade", "message": "grade phải là 10, 11 hoặc 12" }
    ]
  }
}
```

---

## Implementation

```python
# main.py — custom exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail:
        error = detail
    else:
        error = {"code": "UNKNOWN_ERROR", "message": str(detail)}
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": error},
    )

# Dùng trong service
raise HTTPException(
    404,
    {"code": "EXAM_NOT_FOUND", "message": "Đề thi không tồn tại."}
)
```

---

*Cập nhật lần cuối: 2026-06-01*
