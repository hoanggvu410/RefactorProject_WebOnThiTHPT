from fastapi import HTTPException
from uuid import UUID
from app.models.exam_model import Exam
from app.models.question_option_model import QuestionOption
from app.models.result_model import Result
from app.models.user_answer_model import UserAnswer
from app.schemas.exam_schema import SubmitExam


def submit_exam(db, data, current_user):
    # Get exam by uuid
    exam = db.query(Exam).filter(Exam.uuid == data.exam_uuid).first()
    if not exam:
        raise HTTPException(404, {
            'code': "EXAM_NOT_FOUND",
            'message': "Exam not found"
        })
    
    # Logic tinh diem
    score = 0
    for ans in data.answers:
        option = db.query(QuestionOption).filter(QuestionOption.question_option_id == ans.selected_option_id).first()
        if not option:
            raise HTTPException(404, {
                'code': "OPTION_NOT_FOUND",
                'message': "Option not found"
            })
        if option.is_correct:
            score += 1

    # Luu ket qua bai thi
    exam_result = Result(
        user_id = current_user.user_id,
        exam_id = exam.exam_id,
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

    return {"message": "submit exam successfully"}