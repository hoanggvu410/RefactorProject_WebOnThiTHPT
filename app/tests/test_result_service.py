from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID

from fastapi import HTTPException
from flask_migrate import current
import pytest
from app.schemas.result_schema import ReviewResultResponse
from app.services import result_service
from app.tests.conftest import make_db_with_first_result

#test submit exam
@pytest.mark.asyncio
async def test_submit_exam_success(): #nop bai va tinh diem
    db = MagicMock()
    redis_client = AsyncMock()
    current_user = SimpleNamespace(user_id = 1)
    input_data = SimpleNamespace(
        exam_uuid= "exam-uuid",
        time_spent = 60,
        answers = [
            SimpleNamespace(question_id= 1, selected_option_id = 1),
            SimpleNamespace(question_id= 2, selected_option_id = 2),
        ]
    )
    
    #gia lap dap an lay tu cache
    cached_answers = {
        "exam_id":1,
        "total_question":2,
        "answers": {
            "1":1,
            "2": 3,
        }
    }

    with patch("app.services.exam_service.get_exam_answers_cached", return_value= cached_answers):
        result = await result_service.submit_exam(db, input_data, current_user, redis_client)

    assert result["score"] == 1
    assert result["correct_count"] ==1
    assert result["total_question"]==2
    assert db.add.call_count ==3 #luu 1 cho result va 2 cho user ans
    assert db.commit.call_count ==2 

#test review result
def test_review_result_success():
    question = SimpleNamespace(
        question_id=1,
        uuid=UUID("11111111-1111-1111-1111-111111111111"),
        content="Question 1",
        question_options=[
            SimpleNamespace(question_option_id=1, content="A"),
            SimpleNamespace(question_option_id=2, content="B"),
        ],
    )

    user_answer = SimpleNamespace(
        question=question,
        selected_option_id=1,
    )

    mock_result = SimpleNamespace(
        user_id=1,
        uuid="result-uuid",
        score=1,
        time_spent=60,
        exam=SimpleNamespace(
            uuid="exam-uuid",
            title="Math Exam",
        ),
        user_answers=[user_answer],
    )

    correct_answer = SimpleNamespace(
        question_option_id=1,
    )

    db = MagicMock()
    db.query.return_value.filter.return_value.first.side_effect = [
        mock_result,
        correct_answer,
    ]

    current_user = SimpleNamespace(user_id=1)

    result = result_service.review_result("result-uuid", db, current_user)

    assert result.title == "Math Exam"
    assert result.score == 1
    assert result.time_spent == 60
    assert len(result.questions) == 1
    assert result.questions[0].is_correct is True

def test_review_result_wrong_user():
    result = SimpleNamespace(
        user_id =1,
        result_uuid = "result-uuid",
    )
    db = make_db_with_first_result(result)
    current_user= SimpleNamespace(user_id=2) #user khac
    result_uuid = "result-uuid"

    with pytest.raises(HTTPException) as exc_info:
        result_service.review_result(result_uuid, db, current_user)

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["code"] == "PERMISSION_DENIED"

def test_review_result_not_found():
    result = SimpleNamespace(
        user_id= 1,
        result_uuid = "result-uuid",
    )
    db = make_db_with_first_result(None)
    current_user= SimpleNamespace(user_id=1)
    result_uuid = "wrong-result-uuid"

    with pytest.raises(HTTPException) as exc_info:
        result_service.review_result(result_uuid, db, current_user)

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail["code"] == "RESULT_NOT_FOUND"
