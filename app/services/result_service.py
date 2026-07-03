from fastapi import HTTPException
from app.models.exam_model import Exam
from app.models.question_option_model import QuestionOption
from app.models.result_model import Result
from app.models.user_answer_model import UserAnswer
from app.schemas.exam_schema import SubmitExam
from app.schemas.question_schema import ReviewQuestionResponse
from app.schemas.result_schema import ReviewResultResponse
from app.services import exam_service


def get_my_result(exam_uuid, current_user, db):
    exam = db.query(Exam).filter(Exam.uuid == exam_uuid).first()
    if not exam:
        raise HTTPException(404, {"code": "EXAM_NOT_FOUND", "message": "Exam not found"})
    result = db.query(Result).filter(
        Result.exam_id == exam.exam_id,
        Result.user_id == current_user.user_id
    ).first()
    if not result:
        raise HTTPException(404, {"code": "RESULT_NOT_FOUND", "message": "Result not found"})
    return result

async def submit_exam(db, data, current_user, redis_client):
    #lay dap an
    answer_payload = await exam_service.get_exam_answers_cached(data.exam_uuid, db, redis_client)
    exam_id = answer_payload["exam_id"]
    total_question = answer_payload["total_question"]
    answer_map = answer_payload["answers"]

    correct_count = 0

    for ans in data.answers:
            correct_option_id = answer_map.get(str(ans.question_id))

            if correct_option_id == ans.selected_option_id:
                correct_count += 1
            
    score = round((correct_count / total_question) * 10, 2) if total_question > 0 else 0

    # Luu ket qua bai thi
    exam_result = Result(
        user_id = current_user.user_id,
        exam_id = exam_id,
        score = score,
        time_spent = data.time_spent
    )

    db.add(exam_result)
    db.commit()
    db.refresh(exam_result)

    # Luu dap an user da chon
    for ans in data.answers:
        user_answers = UserAnswer(
            result_id = exam_result.result_id,
            question_id = ans.question_id,
            selected_option_id = ans.selected_option_id
        )
        db.add(user_answers)
    db.commit()

    return {
        "message": "submit exam successfully",
        "result_uuid": exam_result.uuid,
        "score": exam_result.score,
        "correct_count": correct_count,
        "total_question": total_question,
        "time_spent": exam_result.time_spent
    }

def review_result(result_uuid, db, current_user):
    result = db.query(Result).filter(Result.uuid== result_uuid).first()
    if not result:
        raise HTTPException(404, {"code": "RESULT_NOT_FOUND", "message": "Result not found"})

    if result.user_id != current_user.user_id:
        raise HTTPException(403, {"code": "PERMISSION_DENIED", "message": "Permission denied"})

    answers_by_question_id = {}
    for answer in result.user_answers:
        question_id = getattr(answer, "question_id", None)
        if question_id is None and getattr(answer, "question", None):
            question_id = answer.question.question_id
        answers_by_question_id[question_id] = answer

    questions = getattr(result.exam, "questions", None)
    if questions is None:
        questions = [
            answer.question for answer in result.user_answers
            if getattr(answer, "question", None)
        ]
    
    #duyet qua toan bo cau hoi trong bai thi va lay dap an dung tu db
    review_questions = []
    for question in questions:
        correct_answer = db.query(QuestionOption).filter(
            QuestionOption.question_id == question.question_id,
            QuestionOption.is_correct == True
        ).first()
        if not correct_answer:
            raise HTTPException(404, {"code": "QUESTION_NOT_FOUND", "message": "Question not found"})

        selected_answer = answers_by_question_id.get(question.question_id)
        selected_option_id = selected_answer.selected_option_id if selected_answer else None

        review_questions.append(ReviewQuestionResponse(
            questionID=question.question_id,
            question_uuid=question.uuid,
            content=question.content,
            questionOptions=question.question_options,
            selectedOptionID=selected_option_id,
            correctOptionID=correct_answer.question_option_id,
            is_correct=(
                selected_option_id == correct_answer.question_option_id
                if selected_option_id is not None else None
            ),
            explanation=getattr(question, "explanation", None)
        ))
    
    return ReviewResultResponse(
        exam_uuid = result.exam.uuid,
        title = result.exam.title,
        score=result.score,
        time_spent=result.time_spent,
        questions=review_questions
    )
