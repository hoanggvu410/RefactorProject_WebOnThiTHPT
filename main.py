
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from app.base.db import engine, Base
from app.routes.user_routes import router as user_router
from app.routes.auth_routes import router as auth_router
from app.routes.subject_routes import router as subject_router
from app.routes.news_routes import router as news_router
from app.routes.document_routes import router as document_router
from app.routes.question_routes import router as question_router
from app.routes.exam_routes import router as exam_router
from app.routes.results_routes import router as result_router
from app.routes.me_routes import router as me_router
from app.models.user_model import User
from app.models.result_model import Result
from app.models.exam_model import Exam
from app.models.question_model import Question
from app.models.question_option_model import QuestionOption
from app.models.exam_question_model import ExamQuestion
from app.models.subject_model import Subject
from app.models.document_model import Document
from app.models.news_model import News
from app.models.user_answer_model import UserAnswer
from app.models.refresh_token_model import RefreshToken


from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from config import get_settings

Base.metadata.create_all(bind=engine)
BASE_DIR: Path = Path(__file__).resolve().parent
FRONTEND_DIR: Path = BASE_DIR / "frontend"
FRONTEND_DIST_DIR: Path = FRONTEND_DIR / "dist"
STATIC_DIR: Path = BASE_DIR / "app" / "static"

settings = get_settings()

def create_app() -> FastAPI:
    app = FastAPI()

    app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-url.vercel.app",
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
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

    if FRONTEND_DIST_DIR.exists():
        app.mount("/assets", StaticFiles(directory=FRONTEND_DIST_DIR / "assets"), name="assets")
    else:
        app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")

    @app.get("/")
    def serve_frontend():
        if FRONTEND_DIST_DIR.exists():
            return FileResponse(FRONTEND_DIST_DIR / "index.html")
        return FileResponse(FRONTEND_DIR / "index.html")

    return app

app = create_app()
