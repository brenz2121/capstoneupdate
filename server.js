require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("node:path");

require("./config/db"); // menjalankan tes koneksi database

const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: ["http://127.0.0.1:5173", "http://localhost:5173"] }));
app.use(express.json({ limit: "16kb" }));

app.get("/", (req, res) => {
  res.json({ message: "API Toilet Care berjalan." });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api", (req, res) =>
  res.status(404).json({ message: "Endpoint tidak ditemukan." }),
);
// The build can be served on the same origin as the API.
app.use(express.static(path.join(__dirname, "client", "dist")));
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Format JSON tidak valid." });
  }
  if (err.type === "entity.too.large") {
    return res
      .status(413)
      .json({ message: "Ukuran permintaan terlalu besar." });
  }
  console.error("Request gagal:", err.code || err.message);
  res.status(500).json({ message: "Terjadi kesalahan server." });
});

const PORT = process.env.PORT || 5000;
if (require.main === module)
  app.listen(PORT, process.env.HOST || "127.0.0.1", () => {
    console.log(`🚀 API jalan di http://localhost:${PORT}`);
  });
module.exports = app;
