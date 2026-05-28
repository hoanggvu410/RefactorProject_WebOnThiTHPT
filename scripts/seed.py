import app.models

from app.base.db import SessionLocal

from app.models.user_model import User
from app.models.subject_model import Subject
from app.models.exam_model import Exam
from app.models.question_model import Question
from app.models.question_option_model import QuestionOption
from app.models.exam_question_model import ExamQuestion
from app.models.result_model import Result
from app.models.document_model import Document
from app.models.news_model import News

db = SessionLocal()
db.query(Result).delete()
db.query(ExamQuestion).delete()
db.query(QuestionOption).delete()
db.query(Question).delete()
db.query(Exam).delete()
db.query(Document).delete()
db.query(News).delete()
db.query(User).delete()
db.query(Subject).delete()

db.commit()

#subject
subjects = [

    Subject(subjectName="Toán 10"),
    Subject(subjectName="Văn 10"),
    Subject(subjectName="Anh 10"),
    Subject(subjectName="Lý 10"),
    Subject(subjectName="Hóa 10"),
    Subject(subjectName="Sinh 10"),

    Subject(subjectName="Toán 11"),
    Subject(subjectName="Văn 11"),
    Subject(subjectName="Anh 11"),
    Subject(subjectName="Lý 11"),
    Subject(subjectName="Hóa 11"),
    Subject(subjectName="Sinh 11"),

    Subject(subjectName="Toán 12"),
    Subject(subjectName="Văn 12"),
    Subject(subjectName="Anh 12"),
    Subject(subjectName="Lý 12"),
    Subject(subjectName="Hóa 12"),
    Subject(subjectName="Sinh 12"),
]

db.add_all(subjects)
db.commit()

#users
users = [

    User(
        name="Hoang Vu",
        role="student",
        username="hoangvv",
        password="123456",
        mail="hoang@gmail.com",
        grade=12
    ),

    User(
        name="Admin",
        role="admin",
        username="admin",
        password="admin123",
        mail="admin@gmail.com",
        grade=12
    )
]

db.add_all(users)
db.commit()

#exams
exams = [

    Exam(
        title="Đề Toán THPT 2025",
        subjectID=1,
        grade=12,
        questionNumber=2,
        duration=90
    ),

    Exam(
        title="Đề Anh THPT 2025",
        subjectID=2,
        grade=12,
        questionNumber=2,
        duration=60
    )
]

db.add_all(exams)
db.commit()

#questions
questions = [

    Question(
        grade=12,
        subjectID=2,
        content="1 + 1 bằng bao nhiêu?"
    ),

    Question(
        grade=12,
        subjectID=1,
        content="2 x 5 bằng bao nhiêu?"
    ),

    Question(
        grade=12,
        subjectID=1,
        content="What is the opposite of 'big'?"
    )
]

db.add_all(questions)
db.commit()

#options
options = [

    # Question 1
    QuestionOption(
        questionID=1,
        content="1",
        is_correct=False
    ),

    QuestionOption(
        questionID=1,
        content="2",
        is_correct=True
    ),

    # Question 2
    QuestionOption(
        questionID=2,
        content="10",
        is_correct=True
    ),

    QuestionOption(
        questionID=2,
        content="15",
        is_correct=False
    ),

    # Question 3
    QuestionOption(
        questionID=3,
        content="Small",
        is_correct=True
    ),

    QuestionOption(
        questionID=3,
        content="Tall",
        is_correct=False
    )
]

db.add_all(options)
db.commit()

exam_questions = [

    ExamQuestion(
        examID=1,
        questionID=1
    ),

    ExamQuestion(
        examID=1,
        questionID=2
    ),

    ExamQuestion(
        examID=2,
        questionID=3
    )
]

db.add_all(exam_questions)
db.commit()

results = [

    Result(
        score=8,
        userID=1,
        examID=1,
        timeSpent=80
    ),

    Result(
        score=9,
        userID=2,
        examID=2,
        timeSpent=50
    )
]

db.add_all(results)
db.commit()

documents = [

    Document(
        subjectID=2,
        grade=12,
        title="Công thức Toán 12",
        link="https://example.com/math12"
    ),

    Document(
        subjectID=1,
        grade=12,
        title="Ngữ pháp tiếng Anh 12",
        link="https://example.com/english12"
    )
]

db.add_all(documents)
db.commit()

news = [

    News(
        title="Lịch thi THPT Quốc Gia",
        content="Kỳ thi sẽ diễn ra vào tháng 6",
        link="https://example.com/news1",
        date="2026-05-26"
    ),

    News(
        title="Cấu trúc đề thi mới",
        content="Bộ GD cập nhật cấu trúc đề thi",
        link="https://example.com/news2",
        date="2026-05-26"
    )
]

db.add_all(news)
db.commit()

print("Seed data success")