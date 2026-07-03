
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import app
from app.routes.user_routes import router as user_router
from app.routes.auth_routes import router as auth_router
from app.routes.subject_routes import router as subject_router
from app.routes.news_routes import router as news_router
from app.routes.document_routes import router as document_router
from app.routes.question_routes import router as question_router
from app.routes.exam_routes import router as exam_router
from app.routes.results_routes import router as result_router
from app.routes.me_routes import router as me_router



from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from config import get_settings

BASE_DIR: Path = Path(__file__).resolve().parent
FRONTEND_DIR: Path = BASE_DIR / "frontend"
FRONTEND_DIST_DIR: Path = FRONTEND_DIR / "dist"
STATIC_DIR: Path = BASE_DIR / "app" / "static"

settings = get_settings()

tags_metadata = [
    {
        "name": "Auth",
        "description": "Đăng ký, đăng nhập, refresh token, logout, đổi mật khẩu và khôi phục mật khẩu.",
    },
    {
        "name": "Me",
        "description": "Thông tin cá nhân của user đang đăng nhập, cập nhật hồ sơ và lịch sử làm bài.",
    },
    {
        "name": "Exam",
        "description": "Danh sách đề thi, chi tiết đề thi, tạo đề và import đề bằng CSV.",
    },
    {
        "name": "Results",
        "description": "Nộp bài, xem kết quả và review đáp án sau khi làm bài.",
    },
    {
        "name": "Questions",
        "description": "Quản lý câu hỏi và đáp án cho đề thi.",
    },
    {
        "name": "Subjects",
        "description": "Danh sách môn học và thông tin từng môn.",
    },
    {
        "name": "Documents",
        "description": "Tài liệu học tập, upload tài liệu và quản lý tài liệu.",
    },
    {
        "name": "News",
        "description": "Tin tức, thông báo và bài viết trong hệ thống.",
    },
    {
        "name": "Users",
        "description": "Quản trị user, chỉ dành cho admin.",
    },
]

def create_app() -> FastAPI:
    app = FastAPI(
        title="Sĩ Tử Chiến API",
        description="Backend API cho hệ thống ôn thi THPT: auth, đề thi, kết quả, tài liệu, tin tức.",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        openapi_tags=tags_metadata,
    )

    app.add_middleware(
        SessionMiddleware,
        secret_key = settings.secret_key
    )

    app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "refactor-project-web-on-thi-thpt-orcin.vercel.app",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail
        if isinstance(detail, dict) and "code" in detail:
            error = detail
        else:
            error = {"code": "UNKNOWN_ERROR", "message": str(detail)}
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "error": error},
        )

    app.include_router(auth_router)
    app.include_router(user_router)
    app.include_router(subject_router)
    app.include_router(news_router)
    app.include_router(document_router)
    app.include_router(question_router)
    app.include_router(exam_router)
    app.include_router(result_router)
    app.include_router(me_router)

    if STATIC_DIR.exists():
        app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    if FRONTEND_DIST_DIR.exists():
        app.mount("/assets", StaticFiles(directory=FRONTEND_DIST_DIR / "assets"), name="assets")
    else:
        app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")

# CORS configuration - cho phep frontend goi api tu cac nguon/domain khac nhau
    origins = ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,           # Chỉ cho phép các domain trong danh sách trên gọi tới
        allow_credentials=True,
        allow_methods=["*"],             # Cho phép dùng mọi phương thức (GET, POST, PUT, DELETE)
        allow_headers=["*"],             # Cho phép truyền mọi loại Header (ví dụ: Token đăng nhập)
    )

    return app

app = create_app()
