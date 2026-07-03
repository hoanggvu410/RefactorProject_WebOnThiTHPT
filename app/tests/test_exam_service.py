import json
from types import SimpleNamespace
from unittest import mock
from unittest.mock import AsyncMock, MagicMock

from fastapi import HTTPException
from httpx import HTTPError
import pytest

from app.services import exam_service
from app.tests.conftest import make_db_with_first_result

#test ham get_public_exam_cached
@pytest.mark.asyncio
async def test_get_public_exam_cached_hit():
    db = MagicMock()
    redis_client = AsyncMock()

    #gia lap lay data tu redis
    redis_client.get.return_value = '{"exam_uuid": "1", "title":"math exam"}'

    result = await exam_service.get_public_exam_cached("1", db, redis_client)

    assert result["title"]
    db.query.assert_not_called() #khong query tu db, dam bao lay data tu cache redis

@pytest.mark.asyncio
async def test_get_public_exam_cached_miss():
    redis_client = AsyncMock()

    #gia lap cache miss
    redis_client.get.return_value = None

    #mock du lieu lay ra tu DB
    exam_uuid = "exam-uuid"
    mock_option = SimpleNamespace(question_option_id = 1, content="abc")
    mock_question=SimpleNamespace(
        question_id = 1,
        uuid = "quesion-uuid",
        content="Question 1",
        question_options = [mock_option]
    )
    mock_exam = SimpleNamespace(
        exam_id=1,
        uuid = exam_uuid,
        title="Math Exam",
        question_number=1,
        duration=90,
        questions=[mock_question]
    )
    db= make_db_with_first_result(mock_exam)

    result = await exam_service.get_public_exam_cached(exam_uuid, db, redis_client)

    #kiem tra da check redis 1 lan
    redis_client.get.assert_awaited_once_with(f"exam:public:{exam_uuid}")

    #kiem tra da query db
    db.query.assert_called_once()

    #kiem tra da luu exam vao redis voi TTL =3600s chua
    expected_payload = exam_service.build_public_exam_payload(mock_exam)
    redis_client.set.assert_awaited_once_with(
        f"exam:public:{exam_uuid}",
        json.dumps(expected_payload),  # import json ở đầu file test
        ex=3600
    )
    assert result["title"] =="Math Exam"
    assert len(result["questions"]) == 1

@pytest.mark.asyncio
async def test_get_public_exam_cached_not_found():
    mock_option = SimpleNamespace(question_option_id = 1, content="abc")
    mock_question=SimpleNamespace(
        question_id = 1,
        uuid = "quesion-uuid",
        content="Question 1",
        question_options = [mock_option]
    )
    mock_exam = SimpleNamespace(
        exam_id=1,
        uuid = "1",
        title="Math Exam",
        question_number=1,
        duration=90,
        questions=[mock_question]
    )
    db= make_db_with_first_result(None)

    exam_uuid = "wrong_exam_uuid"
    redis_client = AsyncMock()
    redis_client.get.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await exam_service.get_public_exam_cached(exam_uuid, db, redis_client)

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail["code"] == "EXAM_NOT_FOUND"

def test_create_exam_uses_question_service_without_intermediate_commit(monkeypatch):
    class FakeExam:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)
            self.uuid = "exam-uuid"
            self.questions = []

    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = SimpleNamespace(subject_id=1)
    current_user = SimpleNamespace(user_id=1, uuid="user-uuid")
    created_question = SimpleNamespace(question_id=1)
    create_question_mock = MagicMock(return_value=created_question)

    monkeypatch.setattr(exam_service, "Exam", FakeExam)
    monkeypatch.setattr(exam_service, "create_question", create_question_mock)

    exam_data = SimpleNamespace(
        title="Math Exam",
        subject_id=1,
        grade=12,
        duration=90,
        questions=[
            SimpleNamespace(
                content="Question 1",
                explanation="Because",
                QuestionOptions=[
                    {"content": "A", "is_correct": True},
                    {"content": "B", "is_correct": False},
                ],
            )
        ],
    )

    result = exam_service.create_exam(exam_data, db, current_user)

    assert result["exam_uuid"] == "exam-uuid"
    assert result["questionNumber"] == 1
    create_question_mock.assert_called_once()
    _, _, kwargs = create_question_mock.mock_calls[0]
    assert kwargs["current_user"] is current_user
    assert kwargs["commit"] is False
    db.commit.assert_called_once()
