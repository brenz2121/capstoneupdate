const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: 5,
  connectTimeout: 5000,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Database gagal terhubung:", err.code || err.message);
    return;
  }

  console.log("✅ Database MySQL berhasil terhubung!");
  connection.release();
});

module.exports = db.promise();
