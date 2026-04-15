const overviewPages = [
  {
    slug: "students-overview",
    title: "Students Overview",
    description: "See each student with their class and main class teacher.",
    summary: "Readable joined data for student names, class placement, and teacher assignment.",
    loadFromApi: true,
    limit: 100,
    columns: ["student_id", "class_id", "teacher_id", "student_name", "class_name", "class_teacher"],
    sql: `
      SELECT
        s.student_id,
        c.class_id,
        t.teacher_id,
        CONCAT_WS(' ', s.first_name, s.last_name) AS student_name,
        CONCAT(c.class_number, c.class_letter) AS class_name,
        CONCAT_WS(' ', t.first_name, t.last_name) AS class_teacher
      FROM students s
      JOIN classes c ON s.class_id = c.class_id
      LEFT JOIN teachers t ON c.main_teacher_id = t.teacher_id
      ORDER BY c.class_number, c.class_letter, s.last_name, s.first_name
    `
  },
  {
    slug: "classes-overview",
    title: "Classes Overview",
    description: "View each class with its main class teacher.",
    summary: "Simple class list that is easier to read than raw IDs.",
    limit: 100,
    columns: ["class_name", "class_teacher"],
    sql: `
      SELECT
        CONCAT(c.class_number, c.class_letter) AS class_name,
        CONCAT_WS(' ', t.first_name, t.last_name) AS class_teacher
      FROM classes c
      JOIN teachers t ON c.main_teacher_id = t.teacher_id
      ORDER BY c.class_number, c.class_letter
    `
  },
  {
    slug: "teachers-subjects",
    title: "Teachers & Subjects",
    description: "Check which teacher is connected to which subject.",
    summary: "Joined view for teaching assignments across your school subjects.",
    limit: 100,
    columns: ["teacher_name", "subject_name"],
    sql: `
      SELECT
        CONCAT_WS(' ', t.first_name, t.last_name) AS teacher_name,
        s.subject_name
      FROM subjects_teachers st
      JOIN teachers t ON st.teacher_id = t.teacher_id
      JOIN subjects s ON st.subject_id = s.subject_id
      ORDER BY teacher_name, s.subject_name
    `
  },
  {
    slug: "attendance-overview",
    title: "Attendance Overview",
    description: "Track student attendance with class and subject details.",
    summary: "Attendance records with student, class, subject, date, and status.",
    limit: 100,
    columns: ["student_name", "class_name", "subject_name", "attendance_date", "status"],
    sql: `
      SELECT
        CONCAT_WS(' ', s.first_name, s.last_name) AS student_name,
        CONCAT(c.class_number, c.class_letter) AS class_name,
        sub.subject_name,
        a.attendance_date,
        a.status
      FROM attendance a
      JOIN students s ON a.student_id = s.student_id
      JOIN classes c ON s.class_id = c.class_id
      JOIN subjects sub ON a.subject_id = sub.subject_id
      ORDER BY a.attendance_date DESC, student_name
    `
  },
  {
    slug: "marks-overview",
    title: "Marks Overview",
    description: "See marks together with student, class, subject, and teacher.",
    summary: "Academic performance view that brings together the most important columns.",
    limit: 100,
    columns: ["student_name", "class_name", "subject_name", "teacher_name", "marks_value", "grade_date", "teacher_comment"],
    sql: `
      SELECT
        CONCAT_WS(' ', s.first_name, s.last_name) AS student_name,
        CONCAT(c.class_number, c.class_letter) AS class_name,
        sub.subject_name,
        CONCAT_WS(' ', t.first_name, t.last_name) AS teacher_name,
        m.marks_value,
        m.grade_date,
        m.comments AS teacher_comment
      FROM marks m
      JOIN students s ON m.student_id = s.student_id
      JOIN classes c ON s.class_id = c.class_id
      JOIN subjects sub ON m.subject_id = sub.subject_id
      JOIN teachers t ON m.teacher_id = t.teacher_id
      ORDER BY m.grade_date DESC, student_name
    `
  }
];

function isAllowedOverview(overviewSlug) {
  return overviewPages.some((overview) => overview.slug === overviewSlug);
}

function getOverviewMeta(overviewSlug) {
  return overviewPages.find((overview) => overview.slug === overviewSlug);
}

module.exports = {
  overviewPages,
  isAllowedOverview,
  getOverviewMeta
};
