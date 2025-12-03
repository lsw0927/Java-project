const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization; // "Bearer asdfasdf..."

  if (!authHeader) {
    return res.status(401).json({ error: "토큰이 없습니다." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id: ..., studentId: ... }
    next();
  } catch (err) {
    return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
}

module.exports = authMiddleware;


/* 나중 시간표 매칭 api에서 사용예시
const authMiddleware = require("../middleware/authMiddleware");

router.get("/timetable", authMiddleware, async (req, res) => {
  // req.user.id 를 이용해서 "내 시간표"를 조회
});
*/