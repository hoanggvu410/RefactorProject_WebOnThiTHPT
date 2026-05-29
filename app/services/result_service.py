from fastapi import HTTPException
from app.models.question_option_model import QuestionOption
from app.models.result_model import Result
from app.models.user_answers import UserAnswers
from app.schemas.exam_schema import SubmitExam


def submit_exam_service(db, data):
    #logic tinh diem
    score = 0
    for ans in data.answers:
        option = db.query(QuestionOption).filter(QuestionOption.questionoptionID == ans.selectedOptionID).first()
        if not option:
            raise HTTPException(404, {
                'code': "OPTION_NOT_FOUND",
                'message': "Option not found"
            })
        if option.is_correct:
            score += 1

    #luu ket qua bai thi
    exam_result = Result(
        userID = data.userID,
        examID = data.examID,
        score = score,
        timeSpent = data.timeSpent
    )

    db.add(exam_result)
    db.commit()
    db.refresh(exam_result)

    #luu dap an user da chon
    for ans in data.answers:
        user_answers = UserAnswers(
            resultID = exam_result.resultID,
            questionID = ans.questionID,
            selectedOptionID = ans.selectedOptionID
        )
        db.add(user_answers)
    db.commit()

    return SubmitExam(
        userID=exam_result.userID,
        examID=exam_result.examID,
        answers=data.answers,
        timeSpent=exam_result.timeSpent
    )
