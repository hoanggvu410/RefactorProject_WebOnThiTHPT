from importlib.resources import contents

from fastapi import APIRouter, HTTPException

from app.models.result_model import Result
from app.base.db import SessionLocal
from app.schemas.exam_schema import SubmitExam
from app.services.result_service import submit_exam_service
from app.schemas.result_schema import ReviewResultResponse
from app.models.question_option_model import QuestionOption
from app.schemas.question_schema import ReviewQuestionResponse

router = APIRouter(prefix="/results", tags=["Results"])
db = SessionLocal()
@router.get("/user/{user_id}")
def get_result_by_userID(user_id:int):
    result = db.query(Result).filter(Result.userID == user_id).all()
    if not result:
        raise HTTPException(404, {
            "code": "USER_NOT_FOUND",
            "message": "User not found"
        })
    return result

@router.get("/user/{user_id}/exam/{exam_id}")
def get_result_by_examID(user_id: int, exam_id:int):
    result = db.query(Result).filter(Result.userID == user_id, Result.examID == exam_id).first()
    if not result:
        raise HTTPException(404, {
            "code": "RESULT_NOT_FOUND",
            "message": "Result not found"
        })
    

@router.post("/submit")
def submit_exam(exam: SubmitExam):
    return submit_exam_service(db, exam)

@router.post("/review/{result_id}", response_model=ReviewResultResponse)
def review_result_by_id(result_id: int):
    result = db.query(Result).filter(Result.resultID == result_id).first()
    if not result:
        raise HTTPException(404, {
            "code": "RESULT_NOT_FOUND",
            "message": "Result not found"
        })

    review_questions = []
    for answer in result.userAnswers:
        question = answer.question
    #tim dap an cua cau hoi
        correct_answer = db.query(QuestionOption).filter(QuestionOption.questionID == question.questionID, QuestionOption.is_correct == True).first()
        if not correct_answer:
            raise HTTPException(404, {
                "code": "QUESTION_NOT_FOUND",
                "message": "Question not found"
            })
        review_questions.append(ReviewQuestionResponse (
            questionID = question.questionID,
            content = question.content,
            questionOptions = question.questionOptions,
            is_correct = (answer.selectedOptionID == correct_answer.questionoptionID),
            selectedOptionID = answer.selectedOptionID
        )
        )

    return ReviewResultResponse(
        title=result.title,
        score=result.score,
        timeSpent=result.timeSpent,
        questions=review_questions
    )
