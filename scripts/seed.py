from app.base.db import SessionLocal
from app.models import User, Subject, Exam, Question, QuestionOption, ExamQuestion, Result, Document, News, UserAnswer
from app.services.auth_service import hash_password

db = SessionLocal()

#xoa du lieu bang (theo thu tu FK dependencies)
db.query(UserAnswer).delete()
db.query(Result).delete()
db.query(Document).delete()
db.query(News).delete()
db.query(QuestionOption).delete()
db.query(ExamQuestion).delete()
db.query(Question).delete()
db.query(Exam).delete()
db.query(Subject).delete()
db.query(User).delete()
db.commit()


# Subjects
subjects = [
    Subject(subject_name="Toán 10"),
    Subject(subject_name="Văn 10"),
    Subject(subject_name="Anh 10"),
    Subject(subject_name="Lý 10"),
    Subject(subject_name="Hóa 10"),
    Subject(subject_name="Sinh 10"),
    Subject(subject_name="Toán 11"),
    Subject(subject_name="Văn 11"),
    Subject(subject_name="Anh 11"),
    Subject(subject_name="Lý 11"),
    Subject(subject_name="Hóa 11"),
    Subject(subject_name="Sinh 11"),
    Subject(subject_name="Toán 12"),
    Subject(subject_name="Văn 12"),
    Subject(subject_name="Anh 12"),
    Subject(subject_name="Lý 12"),
    Subject(subject_name="Hóa 12"),
    Subject(subject_name="Sinh 12"),
]

db.add_all(subjects)
db.flush()

# Get actual subject IDs (they may not be 1-18 due to auto-increment)
subject_ids = {s.subject_name: s.subject_id for s in subjects}
toan_10_id = subject_ids["Toán 10"]
van_10_id = subject_ids["Văn 10"]
anh_10_id = subject_ids["Anh 10"]
toan_12_id = subject_ids["Toán 12"]
anh_12_id = subject_ids["Anh 12"]

db.commit()

# Users
users = [
    User(
        name="Hoang Vu",
        role="student",
        username="hoangvv",
        password=hash_password("123456"),
        email="hoang@gmail.com",
        grade=12
    ),
    User(
        name="Admin",
        role="admin",
        username="admin",
        password=hash_password("admin123"),
        email="admin@gmail.com",
        grade=12
    )
]

db.add_all(users)
db.flush()

user_ids = {u.username: u.user_id for u in users}
user_hoangvv_id = user_ids["hoangvv"]
user_admin_id = user_ids["admin"]

db.commit()

# Exams
exams = [
    Exam(
        title="Đề Toán THPT 2025",
        subject_id=toan_12_id,
        grade=12,
        question_number=2,
        duration=90
    ),
    Exam(
        title="Đề Anh THPT 2025",
        subject_id=anh_12_id,
        grade=12,
        question_number=2,
        duration=60
    )
]

db.add_all(exams)
db.flush()

exam_ids = {e.title: e.exam_id for e in exams}
exam_toan_id = exam_ids["Đề Toán THPT 2025"]
exam_anh_id = exam_ids["Đề Anh THPT 2025"]

db.commit()

# Questions
questions = [
    Question(
        grade=12,
        subject_id=anh_12_id,
        content="1 + 1 bằng bao nhiêu?"
    ),
    Question(
        grade=12,
        subject_id=toan_12_id,
        content="2 x 5 bằng bao nhiêu?"
    ),
    Question(
        grade=12,
        subject_id=anh_12_id,
        content="What is the opposite of 'big'?"
    )
]

db.add_all(questions)
db.flush()

question_ids = [q.question_id for q in questions]

db.commit()

# Question Options
options = [
    QuestionOption(question_id=question_ids[0], content="1", is_correct=False),
    QuestionOption(question_id=question_ids[0], content="2", is_correct=True),
    QuestionOption(question_id=question_ids[1], content="10", is_correct=True),
    QuestionOption(question_id=question_ids[1], content="15", is_correct=False),
    QuestionOption(question_id=question_ids[2], content="Small", is_correct=True),
    QuestionOption(question_id=question_ids[2], content="Tall", is_correct=False),
]

db.add_all(options)
db.commit()

# Link questions to exams
exam_questions = [
    ExamQuestion(exam_id=exam_toan_id, question_id=question_ids[0]),
    ExamQuestion(exam_id=exam_toan_id, question_id=question_ids[1]),
    ExamQuestion(exam_id=exam_anh_id, question_id=question_ids[2]),
]

db.add_all(exam_questions)
db.commit()

# Results
results = [
    Result(score=8.0, user_id=user_hoangvv_id, exam_id=exam_toan_id, time_spent=80),
    Result(score=9.0, user_id=user_admin_id, exam_id=exam_anh_id, time_spent=50),
]

db.add_all(results)
db.commit()

# Documents
documents = [
    Document(subject_id=anh_12_id, grade=12, title="Công thức Toán 12", link="https://example.com/math12"),
    Document(subject_id=toan_12_id, grade=12, title="Ngữ pháp tiếng Anh 12", link="https://example.com/english12"),
]

db.add_all(documents)
db.commit()

# News
news = [
    News(title="Lịch thi THPT Quốc Gia", content="Kỳ thi sẽ diễn ra vào tháng 6", link="https://example.com/news1", date="2026-05-26"),
    News(title="Cấu trúc đề thi mới", content="Bộ GD cập nhật cấu trúc đề thi", link="https://example.com/news2", date="2026-05-26"),
]

db.add_all(news)
db.commit()

print("Seed data success")