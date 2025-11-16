const mysql = require("mysql2/promise");

console.log("DB_USER =", process.env.DB_USER);   // 🔍 디버깅용
console.log("DB_PASS =", process.env.DB_PASS);   // 🔍 디버깅용

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

module.exports = db;
