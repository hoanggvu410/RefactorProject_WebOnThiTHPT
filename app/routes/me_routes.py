from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.orm import Session
from typing import Optional

from app.dependencies.auth_dependency import get_current_user
from app.dependencies.db_dependency import get_db
from app.models.user_model import User
from app.schemas.me_schema import (
    ScoreBoardListResponse, UserMeResponse, UpdateMeRequest, HistoryListResponse
)
from app.services import me_service

router = APIRouter(prefix="/me", tags=["Me"])

@router.get("/", response_model=UserMeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """GET /me - Lấy thông tin cá nhân của user đang login"""
    return current_user

@router.patch("/profile", response_model=UserMeResponse)
def update_me(
    payload: UpdateMeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """PATCH /me/profile - Cập nhật thông tin cá nhân"""
    return me_service.update_profile(db, current_user.user_id, payload)

@router.get("/history", response_model=HistoryListResponse)
def get_my_history(
    subject_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """GET /me/history - Xem lịch sử thi của bản thân (phần trang, lọc theo môn)"""
    return me_service.get_history(db, current_user.user_id, subject_id, page, limit)

@router.patch("/upload-avatar")
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return me_service.upload_avatar(file, db, current_user)

@router.get("/stats")
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """GET /me/stats - Xem thống kê làm bài của bản thân"""
    return me_service.get_user_statistics(db, current_user.user_id)

@router.get("/scoreboard", response_model=ScoreBoardListResponse)
def get_scoreboard(
    subject_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """GET /me/scoreboard - Xem bảng xếp hạng theo môn học"""
    return me_service.get_scoreboard(
        db=db,
        user_id = current_user.user_id,
        subject_id = subject_id,
        page = page,
        limit = limit
    )
