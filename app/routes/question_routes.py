from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends, Query, dependencies
from sqlalchemy.orm import Session
from app.models.question_model import Question
from app.schemas.question_schema import CreateQuestion, QuestionResponse
from app.dependencies.auth_dependency import get_current_user, require_roles
from app.dependencies.db_dependency import get_db
from app.services import question_service
from app.schemas.question_schema import QuestionQueryParams

router = APIRouter(prefix="/questions", tags=["Questions"], dependencies=[Depends(get_current_user)])

@router.get("/{question_uuid}", response_model=QuestionResponse)
def get_questions_by_id(question_uuid: UUID, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.uuid == question_uuid).first()
    if not question:
        raise HTTPException(404, {"code": "QUESTION_NOT_FOUND", "message": "Question not found"})
    return QuestionResponse(
        questionID=question.question_id,
        question_uuid=question_uuid,
        content=question.content,
        questionOptions=question.question_options
    )

@router.get("/")
def get_quesions(params: QuestionQueryParams = Depends(),
        db: Session = Depends(get_db)
    ):
    return question_service.get_questions(params, db)

@router.post("/create_question")
def create_question(question_data: CreateQuestion, db: Session = Depends(get_db), current_user=[Depends(require_roles("giáo viên", "admin"))]):
    return question_service.create_question(question_data, db, current_user)