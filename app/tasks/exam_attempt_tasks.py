# app/tasks/exam_attempt_tasks.py

import asyncio

import redis.asyncio as redis

from app.base.db import SessionLocal
from app.core.celery_app import celery_app
from app.models.exam_attempt_model import ExamAttempt
from app.services import exam_attempt_service
from config import get_settings


settings = get_settings()


@celery_app.task(name="tasks.auto_submit_exam_attempt")
def auto_submit_exam_attempt(attempt_uuid: str):
    async def run():
        db = SessionLocal()
        redis_client = redis.Redis.from_url(
            settings.redis_url,
            decode_responses=True,
            max_connections=5,
        )
        try:
            attempt = db.query(ExamAttempt).filter(ExamAttempt.uuid == attempt_uuid).first()
            if not attempt or attempt.status != exam_attempt_service.IN_PROGRESS:
                return

            await exam_attempt_service.submit_attempt(
                db=db,
                attempt_uuid=attempt.uuid,
                current_user=None,
                redis_client=redis_client,
                auto=True,
            )
        finally:
            await redis_client.aclose()
            db.close()

    asyncio.run(run())
