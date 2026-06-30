from unittest.mock import AsyncMock, patch
from uuid import UUID


def test_get_exam_by_uuid_success(client):
    exam_uuid = UUID("11111111-1111-1111-1111-111111111111")
    fake_result = {
        "exam_uuid": exam_uuid,
        "title": "Math Exam",
        "questionNumber": 1,
        "duration": 90,
        "questions": [],
    }

    with patch("app.routes.exam_routes.exam_service.get_public_exam_cached", new_callable=AsyncMock) as mock_get_exam:
        mock_get_exam.return_value = fake_result


    response = client.get(f"/exam/{exam_uuid}")

    assert response.status_code == 200
    assert response.json()["title"] == "Math Exam"