export const subjects = [
  { name: "Tiếng Anh", icon: "🌍", desc: "Luyện thi THPT môn Tiếng Anh" },
  { name: "Toán", icon: "🔢", desc: "Luyện thi THPT môn Toán" },
  { name: "Vật Lý", icon: "⚛️", desc: "Luyện thi THPT môn Vật Lý" },
  { name: "Hóa Học", icon: "🧪", desc: "Luyện thi THPT môn Hóa Học" },
  { name: "Sinh Học", icon: "🧬", desc: "Luyện thi THPT môn Sinh Học" },
  { name: "Lịch Sử", icon: "📖", desc: "Luyện thi THPT môn Lịch Sử" },
  { name: "Địa Lý", icon: "🌏", desc: "Luyện thi THPT môn Địa Lý" },
  { name: "Ngữ Văn", icon: "📚", desc: "Luyện thi THPT môn Ngữ Văn" }
];

export const demoResults = [
  { result_id: 101, result_uuid: "demo-101", exam_id: 12, score: 8.5, time_spent: 42 },
  { result_id: 102, result_uuid: "demo-102", exam_id: 15, score: 9.0, time_spent: 38 }
];

export const demoReview = {
  title: "Đề ôn tập Toán THPT",
  score: 8.5,
  time_spent: 42,
  questions: [
    {
      content: "1 + 1 bằng bao nhiêu?",
      selectedOptionID: 2,
      is_correct: true,
      questionOptions: [
        { questionoptionID: 1, content: "1" },
        { questionoptionID: 2, content: "2" }
      ]
    },
    {
      content: "2 x 3 bằng bao nhiêu?",
      selectedOptionID: 3,
      is_correct: false,
      questionOptions: [
        { questionoptionID: 3, content: "5" },
        { questionoptionID: 4, content: "6" }
      ]
    }
  ]
};

export const demoExams = [
  { exam_id: 12, title: "Đề Toán", question_number: 50, duration: 90 },
  { exam_id: 15, title: "Đề Văn", question_number: 40, duration: 120 }
];

export const demoDocuments = [
  { document_id: 1, title: "Công thức Toán", grade: 12, link: "#" },
  { document_id: 2, title: "Ngữ văn trọng tâm", grade: 12, link: "#" }
];

export const demoNews = [
  { news_id: 1, title: "Lịch thi THPT cập nhật", content: "Lịch thi chính thức...", date: "2026-06-01" },
  { news_id: 2, title: "Mẹo ôn thi hiệu quả", content: "Hãy học tập chăm chỉ...", date: "2026-06-01" }
];
