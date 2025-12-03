const express = require("express");
const router = express.Router();
const db = require("../db");

// 1) 과목 등록: POST /timetable/courses
router.post("/courses", async (req, res) => {
  try {
    const {
      code,
      title,
      instructor,
      day_of_week,
      start_time,
      end_time,
      location,
    } = req.body;

    const sql = `
      INSERT INTO courses
        (code, title, instructor, day_of_week, start_time, end_time, location)
      VALUES
        (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      code,
      title,
      instructor,
      day_of_week,
      start_time,
      end_time,
      location,
    ]);

    res.json({ success: true, courseId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "과목 등록 중 오류가 발생했습니다." });
  }
});

// 2) 과목 목록: GET /timetable/courses
router.get("/courses", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM courses ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "과목 조회 중 오류가 발생했습니다." });
  }
});

// 3) 시간표에 과목 추가(수강신청): POST /timetable/enroll
router.post("/enroll", async (req, res) => {
  try {
    const { user_id, course_id, semester } = req.body;

    const sql = `
      INSERT INTO enrollments (user_id, course_id, semester)
      VALUES (?, ?, ?)
    `;

    await db.query(sql, [user_id, course_id, semester]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    // UNIQUE 제약 위반(중복 수강)도 여기로 떨어짐
    res.status(500).json({ error: "수강 신청 중 오류가 발생했습니다." });
  }
});

// 4) 학생 시간표 조회: GET /timetable/:userId?semester=2025-1
router.get("/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const semester = req.query.semester; // 쿼리스트링으로 받음

    const sql = `
      SELECT
        c.id AS course_id,
        c.code,
        c.title,
        c.instructor,
        c.day_of_week,
        c.start_time,
        c.end_time,
        c.location,
        e.semester
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ?
        AND (? IS NULL OR e.semester = ?)
      ORDER BY c.day_of_week, c.start_time
    `;

    const [rows] = await db.query(sql, [userId, semester, semester]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "시간표 조회 중 오류가 발생했습니다." });
  }
});

module.exports = router;
