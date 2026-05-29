from fastapi import APIRouter, HTTPException
from fastapi.params import Depends

from app.base.db import SessionLocal
from app.models.news_model import News
from app.schemas.news_schema import CreateNews
from app.dependencies.auth_dependency import get_current_user

router = APIRouter(prefix="/news", dependencies=[Depends(get_current_user)])
db = SessionLocal()

@router.get("/")
def get_news():

    return db.query(News).all()


@router.get("/{news_id}")
def get_single_news(news_id: int):
    news = db.query(News).filter(News.newsID == news_id).first()
    if not news:
        raise HTTPException(404, {
            "code": "NEWS_NOT_FOUND",
            "message": "News not found"
            }
        )
    return news

@router.post("/")
def create_news(news: CreateNews):
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

@router.put("/{news_id}")
def update_news(news_id: int, news: CreateNews):

    n = db.query(News).filter(News.newsID == news_id).first()
    if not n:
        raise HTTPException(404,{
            "code": "NEWS_NOT_FOUND",
            "message": "News not found"
            }
        )
    n.title = news.title
    n.content = news.content
    n.link = news.link
    n.date = news.date
    db.commit()

    return {
        "message": "News updated successfully"
    }


@router.delete("/{news_id}")
def delete_news(news_id: int):
    n = db.query(News).filter(News.newsID == news_id).first()
    if not n:
        raise HTTPException(404,{
            "code": "NEWS_NOT_FOUND",
            "message": "News not found"
            }
        )
    db.delete(n)
    db.commit()
    return {
        "message": "News deleted successfully"
    }

