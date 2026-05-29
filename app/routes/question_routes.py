from fastapi import APIRouter, HTTPException
from fastapi.params import Depends

from app.base.db import SessionLocal
from app.models.question_model import Question
from app.schemas.question_schema import QuestionResponse
from app.dependencies.auth_dependency import get_current_user

router = APIRouter(prefix="/questions", tags=["Questions"], dependencies=[Depends(get_current_user)])
db = SessionLocal()

@router.get("/{question_id}", response_model= QuestionResponse)
def get_questions(question_id: int):
    question = db.query(Question).filter(Question.questionID == question_id).first()
    if not question:
        raise HTTPException(404, {
            "code": "QUESTION_NOT_FOUND",
            "message": "Question not found"
        })
    return QuestionResponse(
        questionID = question.questionID,
        content = question.content,
        questionOptions=question.questionOptions
    )

