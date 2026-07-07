from types import SimpleNamespace

from fastapi import HTTPException
from app.models.exam_model import Exam
from app.models.question_option_model import QuestionOption
from app.models.result_model import Result
from app.models.user_answer_model import UserAnswer
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

def normalize_answers(answers):
    normalized = []
    for answer in answers or []:
        if isinstance(answer, dict):
            question_id = answer.get("question_id") or answer.get("questionID")
            selected_option_id = answer.get("selected_option_id") or answer.get("selectedOptionID")
        else:
            question_id = answer.question_id
            selected_option_id = answer.selected_option_id

        if question_id and selected_option_id:
            normalized.append(SimpleNamespace(
                question_id=int(question_id),
                selected_option_id=int(selected_option_id),
            ))

    return normalized

def calculate_score(answers, answer_map, total_question):
    correct_count = 0
    for ans in answers:
            correct_option_id = answer_map.get(str(ans.question_id))

            if correct_option_id == ans.selected_option_id:
                correct_count += 1
            
    score = round((correct_count / total_question) * 10, 2) if total_question > 0 else 0
    return score, correct_count

def create_result_from_answers(db, user_id, exam_id, answers, score, time_spent, commit: bool = True):
    # Luu ket qua bai thi
    exam_result = Result(
        user_id=user_id,
        exam_id=exam_id,
        score=score,
        time_spent=time_spent
    )

    db.add(exam_result)
    db.flush()

    # Luu dap an user da chon
    for ans in answers:
        user_answers = UserAnswer(
            result_id=exam_result.result_id,
            question_id=ans.question_id,
            selected_option_id=ans.selected_option_id
        )
        db.add(user_answers)

    if commit:
        db.commit()
        db.refresh(exam_result)

    return exam_result

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
