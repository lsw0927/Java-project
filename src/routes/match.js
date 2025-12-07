// backend/src/routes/match.js

const express = require("express");
const router = express.Router();
const db = require("../db"); // db.js에서 pool 생성해놨다고 가정

// 1) 좋아요 누르기: POST /match/like
router.post("/like", async (req, res) => {
  try {
    const { from_user_id, to_user_id } = req.body;

    if (!from_user_id || !to_user_id) {
      return res
        .status(400)
        .json({ error: "from_user_id, to_user_id가 필요합니다." });
    }

    // 자기 자신 좋아요 방지
    if (from_user_id === to_user_id) {
      return res
        .status(400)
        .json({ error: "자기 자신에게는 좋아요를 보낼 수 없습니다." });
    }

    // 1. likes 테이블에 좋아요 기록 (중복이면 그냥 무시)
    const insertLikeSql = `
      INSERT IGNORE INTO likes (from_user_id, to_user_id)
      VALUES (?, ?)
    `;
    await db.query(insertLikeSql, [from_user_id, to_user_id]);

    // 2. 상대방이 나에게도 이미 좋아요 했는지 확인
    const checkSql = `
      SELECT id FROM likes
      WHERE from_user_id = ? AND to_user_id = ?
    `;
    const [rows] = await db.query(checkSql, [to_user_id, from_user_id]);
    const isMutual = rows.length > 0;

    let matched = false;

    if (isMutual) {
      // 항상 작은 id를 user_a, 큰 id를 user_b로 정규화
      const userA = Math.min(from_user_id, to_user_id);
      const userB = Math.max(from_user_id, to_user_id);

      // 3. 이미 matches 테이블에 이 두 사람이 있는지 확인
      const checkMatchSql = `
        SELECT id FROM matches
        WHERE user_a_id = ? AND user_b_id = ?
      `;
      const [matchRows] = await db.query(checkMatchSql, [userA, userB]);

      // 4. 없을 때만 새 매칭 INSERT
      if (matchRows.length === 0) {
        const insertMatchSql = `
          INSERT INTO matches (user_a_id, user_b_id, status)
          VALUES (?, ?, 'CONFIRMED')
        `;
        await db.query(insertMatchSql, [userA, userB]);
      }

      matched = true;
    }

    res.json({ success: true, matched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "좋아요 처리 중 오류가 발생했습니다." });
  }
});

// 2) 내 매칭 목록 조회: GET /match/list?user_id=1
router.get("/list", async (req, res) => {
  try {
    const userId = parseInt(req.query.user_id, 10);
    if (!userId) {
      return res
        .status(400)
        .json({ error: "user_id 쿼리 파라미터가 필요합니다." });
    }

    const sql = `
      SELECT
        m.id AS match_id,
        m.created_at,
        CASE
          WHEN m.user_a_id = ? THEN m.user_b_id
          ELSE m.user_a_id
        END AS partner_id,
        u.name AS partner_name,
        u.email AS partner_email,
        u.gender AS partner_gender
      FROM matches m
      JOIN users u
        ON u.id = CASE
                    WHEN m.user_a_id = ? THEN m.user_b_id
                    ELSE m.user_a_id
                  END
      WHERE (m.user_a_id = ? OR m.user_b_id = ?)
        AND m.status = 'CONFIRMED'
      ORDER BY m.created_at DESC
    `;

    const [rows] = await db.query(sql, [userId, userId, userId, userId]);

    // 그대로 보내도 되고, 필요하면 가공해서 보내도 됨
    res.json(rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "매칭 목록 조회 중 오류가 발생했습니다." });
  }
});

module.exports = router;
