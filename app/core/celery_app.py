from celery import Celery
from config import get_settings

settings = get_settings()

#tao instance Celery va redis lam hang doi(Broker)
celery_app = Celery(
    "onthi_tasks",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_ignore_result=True, #khong luu kqua vao Redis de do ton RAM
    task_serializer="json",
    accept_content=["json"],
    broker_pool_limit=1
)

celery_app.autodiscover_tasks(["app.tasks"])