
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import HTTPException

from app.models.exam_attempt_model import ExamAttempt
from app.models.exam_model import Exam
from app.services import exam_service, result_service

IN_PROGRESS = "in_progress"
SUBMITTED = "submitted"
EXPIRED = "expired"

def serialize_attempt(attempt, exam_payload=None):
    remaining_seconds = max(0, int((attempt.deadline_at - datetime.utcnow()).total_seconds()))

    return {
        "attempt_uuid": attempt.uuid,
        "exam_uuid": attempt.exam.uuid,
        "status": attempt.status,
        "answers": attempt.answers_json or {},
        "current_question_id": attempt.current_question_id,
        "started_at": attempt.started_at,
        "deadline_at": attempt.deadline_at,
        "remaining_seconds": remaining_seconds,
        "result_uuid": attempt.result.uuid if attempt.result else None,
        "exam": exam_payload,
    }
async def start_attempt(db, exam_uuid: UUID, current_user, redis_client):
    exam = db.query(Exam).filter(
        Exam.uuid == exam_uuid,
        Exam.is_deleted.is_(False),
    ).first()
    if not exam:
        raise HTTPException(404, {"code": "EXAM_NOT_FOUND", "message": "Exam not found"})

    existing = db.query(ExamAttempt).filter(
        ExamAttempt.user_id == current_user.user_id,
        ExamAttempt.exam_id == exam.exam_id,
        ExamAttempt.status == IN_PROGRESS,
    ).first()

    exam_payload = await exam_service.get_public_exam_cached(exam_uuid, db, redis_client)

    if existing:
        if existing.deadline_at <= datetime.utcnow():
            return await submit_attempt(db, existing.uuid, current_user, redis_client, auto=True)
        return serialize_attempt(existing, exam_payload)

    started_at = datetime.utcnow()
    deadline_at = started_at + timedelta(minutes=exam.duration or 0)

    attempt = ExamAttempt(
        user_id=current_user.user_id,
        exam_id=exam.exam_id,
        status=IN_PROGRESS,
        answers_json={},
        started_at=started_at,
        deadline_at=deadline_at,
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    from app.tasks.exam_attempt_tasks import auto_submit_exam_attempt

    auto_submit_exam_attempt.apply_async(
        args=[str(attempt.uuid)],
        countdown=max(0, int((deadline_at - datetime.utcnow()).total_seconds())),
    )

    return serialize_attempt(attempt, exam_payload)


def save_attempt(db, attempt_uuid: UUID, data, current_user):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.uuid == attempt_uuid).first()
    if not attempt:
        raise HTTPException(404, {"code": "ATTEMPT_NOT_FOUND", "message": "Attempt not found"})

    if attempt.user_id != current_user.user_id:
        raise HTTPException(403, {"code": "PERMISSION_DENIED", "message": "Permission denied"})

    if attempt.status != IN_PROGRESS:
        return serialize_attempt(attempt)

    if attempt.deadline_at <= datetime.utcnow():
        return serialize_attempt(attempt)

    attempt.answers_json = data.answers or {}
    attempt.current_question_id = data.current_question_id
    db.commit()
    db.refresh(attempt)

    return serialize_attempt(attempt)


async def get_current_attempt(db, exam_uuid: UUID, current_user, redis_client):
    exam = db.query(Exam).filter(
        Exam.uuid == exam_uuid,
        Exam.is_deleted.is_(False),
    ).first()
    if not exam:
        raise HTTPException(404, {"code": "EXAM_NOT_FOUND", "message": "Exam not found"})

    attempt = db.query(ExamAttempt).filter(
        ExamAttempt.user_id == current_user.user_id,
        ExamAttempt.exam_id == exam.exam_id,
        ExamAttempt.status == IN_PROGRESS,
    ).first()

    if not attempt:
        return None

    if attempt.deadline_at <= datetime.utcnow():
        return await submit_attempt(db, attempt.uuid, current_user, redis_client, auto=True)

    exam_payload = await exam_service.get_public_exam_cached(exam_uuid, db, redis_client)
    return serialize_attempt(attempt, exam_payload)


async def submit_attempt(db, attempt_uuid: UUID, current_user, redis_client, auto=False):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.uuid == attempt_uuid).first()
    if not attempt:
        raise HTTPException(404, {"code": "ATTEMPT_NOT_FOUND", "message": "Attempt not found"})

    if not auto and attempt.user_id != current_user.user_id:
        raise HTTPException(403, {"code": "PERMISSION_DENIED", "message": "Permission denied"})

    if attempt.result_id:
        return serialize_attempt(attempt)

    answer_payload = await exam_service.get_exam_answers_cached(attempt.exam.uuid, db, redis_client)
    answers = result_service.normalize_answers([
        {"question_id": question_id, "selected_option_id": selected_option_id}
        for question_id, selected_option_id in (attempt.answers_json or {}).items()
    ])

    score, correct_count = result_service.calculate_score(
        answers,
        answer_payload["answers"],
        answer_payload["total_question"],
    )

    total_seconds = max(0, int((datetime.utcnow() - attempt.started_at).total_seconds()))
    duration_seconds = max(0, (attempt.exam.duration or 0) * 60)
    time_spent = max(1, min(duration_seconds or total_seconds, total_seconds) // 60)

    exam_result = result_service.create_result_from_answers(
        db=db,
        user_id=attempt.user_id,
        exam_id=attempt.exam_id,
        answers=answers,
        score=score,
        time_spent=time_spent,
        commit=False,
    )

    attempt.result_id = exam_result.result_id
    attempt.status = EXPIRED if auto else SUBMITTED
    attempt.submitted_at = datetime.utcnow()
    db.commit()
    db.refresh(attempt)
    db.refresh(exam_result)

    payload = serialize_attempt(attempt)
    payload.update({
        "message": "submit exam successfully",
        "result_uuid": exam_result.uuid,
        "score": exam_result.score,
        "correct_count": correct_count,
        "total_question": answer_payload["total_question"],
        "time_spent": exam_result.time_spent,
    })
    return payload
