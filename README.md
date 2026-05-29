# 1. Tổng quan hệ thống

Đây là project Web Ôn Thi THPT được xây dựng bằng FastAPI theo mô hình Layered Architecture nhằm tách biệt rõ:
- API Layer
- Business Logic
- Database Access
- Data Validation

Mục tiêu của project:
- Dễ mở rộng
- Dễ maintain
- Tổ chức code theo chuẩn backend thực tế
- Học và áp dụng kiến trúc backend hiện đại

## 2. Tech Stack
Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Uvicorn

Database:  PostgreSQL

Authentication: JWT (Access Token / Refresh Token)

## Hướng dẫn triển khai môi trường Local
1. Clone source code
git clone <repo-url>
cd RefactorProject_WebOnThiTHPT
2. Tạo virtual environment
Linux / Ubuntu
python3 -m venv .venv
source .venv/bin/activate
Windows
python -m venv .venv
.venv\Scripts\activate
3. Cài dependencies
pip install -r requirements.txt
4. Tạo file .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/examdb

SECRET_KEY=your_secret_key

ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=30
5. Khởi động PostgreSQL

Tạo database:

CREATE DATABASE examdb;
6. Chạy server
uvicorn main:app --reload

Server chạy tại:

http://127.0.0.1:8000

Swagger docs:

http://127.0.0.1:8000/docs