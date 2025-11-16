const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");   // 여기 중요!! db.js에서 가져옴

const router = express.Router();

// 회원가입
// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { studentId, email, password, name, gender } = req.body;

    if (!studentId || !email || !password || !name || !gender) {
      return res.status(400).json({ error: "모든 필드를 입력해주세요." });
    }

    // 비밀번호 해시
    const hash = await bcrypt.hash(password, 10);

    // DB에 유저 저장
    const sql = `
      INSERT INTO users (student_id, email, password_hash, name, gender)
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.query(sql, [studentId, email, hash, name, gender]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    // 이메일 중복 등 에러 처리
    res.status(500).json({ error: "회원가입 중 오류가 발생했습니다." });
  }
});

// 로그인
// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ error: "존재하지 않는 이메일입니다." });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(400).json({ error: "비밀번호가 올바르지 않습니다." });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secret");

    res.json({ token, name: user.name, studentId: user.student_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "로그인 중 오류가 발생했습니다." });
  }
});

module.exports = router;
