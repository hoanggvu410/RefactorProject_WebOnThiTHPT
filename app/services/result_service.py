from fastapi import HTTPException
from app.models.question_option_model import QuestionOption
from app.models.result_model import Result
from app.models.user_answers import UserAnswers


def submit_exam_service(db, data):
    #logic tinh diem
    score = 0
    for ans in data.answers:
        option = db.query(QuestionOption).filter(QuestionOption.questionoptionID == ans.selectedOptionID).first()
        if not option:
            raise HTTPException(status_code=404, detail="Option not found")
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

    return {
        "message": "Exam submitted successfully",
        "diem": score,
        "thoi gian lam bai": exam_result.timeSpent
    }

