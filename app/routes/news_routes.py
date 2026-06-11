from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.news_model import News
from app.schemas.news_schema import CreateNews, NewsQueryParams
from app.dependencies.auth_dependency import get_current_user
from app.dependencies.db_dependency import get_db
from app.services import news_service

router = APIRouter(prefix="/news", tags=["News"], dependencies=[Depends(get_current_user)])

@router.get("/")
def get_news(params: NewsQueryParams = Depends(), db: Session = Depends(get_db)):
    return news_service.get_news(params, db)

@router.get("/{news_uuid}")
def get_single_news(news_uuid: UUID, db: Session = Depends(get_db)):
    news = db.query(News).filter(News.uuid == news_uuid).first()
    if not news:
        raise HTTPException(404, {"code": "NEWS_NOT_FOUND", "message": "News not found"})
    return news

@router.post("/")
def create_news(news: CreateNews, db: Session = Depends(get_db)):
    new_news = News(
        title=news.title,
        content=news.content,
        link=news.link,
        date=news.date
    )
    db.add(new_news)
    db.commit()
    return CreateNews(
        title=news.title,
        content=news.content,
        link=news.link,
        date=news.date
    )

@router.put("/{news_uuid}")
def update_news(news_uuid: UUID, news: CreateNews, db: Session = Depends(get_db)):
    news = db.query(News).filter(News.uuid == news_uuid).first()
    if not news:
        raise HTTPException(404, {"code": "NEWS_NOT_FOUND", "message": "News not found"})
    news.title = news.title
    news.content = news.content
    news.link = news.link
    news.date = news.date
    db.commit()
    return {"message": "News updated successfully"}

@router.delete("/{news_uuid}")
def delete_news(news_uuid: UUID, db: Session = Depends(get_db)):
    news = db.query(News).filter(News.uuid == news_uuid).first()
    if not news:
        raise HTTPException(404, {"code": "NEWS_NOT_FOUND", "message": "News not found"})
    db.delete(news)
    db.commit()
    return {"message": "News deleted successfully"}

