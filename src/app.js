// app.js

// 1. dotenv를 가장 먼저 불러서 .env 로드
const dotenv = require("dotenv");
dotenv.config();  // ✅ 이게 최상단에 와야 함

// 2. 나머지 모듈들 require
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

// 테스트용 라우트
app.get("/", (req, res) => {
  res.send("API 서버 정상 동작!");
});

// /auth 라우트
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
