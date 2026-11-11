const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const tokenOptions = {
  algorithm: "HS256",
  issuer: "toiletcare",
  audience: "toiletcare-web",
};
// Compare a hash even when the account does not exist.
const dummyHash = bcrypt.hashSync("unused-login-comparison", 10);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// REGISTER  (role_id 2 = parent)
router.post("/register", async (req, res) => {
  try {
    const { full_name, email, password } = req.body || {};

    if (
      typeof full_name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !full_name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({ message: "Semua field wajib diisi." });
    }
    const normalizedName = full_name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedName.length > 120) {
      return res.status(400).json({ message: "Nama maksimal 120 karakter." });
    }
    if (normalizedEmail.length > 254 || !emailPattern.test(normalizedEmail)) {
      return res.status(400).json({ message: "Format email tidak valid." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password minimal 6 karakter." });
    }
    if (Buffer.byteLength(password, "utf8") > 72) {
      return res
        .status(400)
        .json({
          message:
            "Kata sandi terlalu panjang. Gunakan kata sandi yang lebih pendek.",
        });
    }

    const hash = await bcrypt.hash(password, 10);

    await db.execute(
      "INSERT INTO users (role_id, full_name, email, password_hash) VALUES (2, ?, ?, ?)",
      [normalizedName, normalizedEmail, hash],
    );

    res
      .set("Cache-Control", "no-store")
      .status(201)
      .json({
        message: "Pendaftaran berhasil. Silakan masuk dengan akun Anda.",
      });
  } catch (err) {
    // The UNIQUE email index handles simultaneous registrations atomically.
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({
          message:
            "Email sudah terdaftar. Silakan masuk atau gunakan email lain.",
        });
    }
    console.error("Pendaftaran gagal:", err.code || err.message);
    const unavailable = [
      "ECONNREFUSED",
      "ETIMEDOUT",
      "PROTOCOL_CONNECTION_LOST",
    ].includes(err.code);
    res.status(unavailable ? 503 : 500).json({
      message: unavailable
        ? "Layanan pendaftaran belum tersedia. Coba lagi sebentar."
        : "Terjadi kesalahan server.",
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res
        .status(400)
        .json({ message: "Email dan password wajib diisi." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (
      normalizedEmail.length > 254 ||
      !emailPattern.test(normalizedEmail) ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res
        .status(400)
        .json({ message: "Format email atau password tidak valid." });
    }

    const [rows] = await db.execute(
      "SELECT user_id, role_id, full_name, email, password_hash FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );
    const user = rows[0];

    const matches = await bcrypt.compare(
      password,
      user ? user.password_hash : dummyHash,
    );
    if (!user || !matches) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role_id: user.role_id },
      process.env.JWT_SECRET,
      { ...tokenOptions, expiresIn: "8h" },
    );

    const [children] = await db.query(
      "SELECT COUNT(*) AS total FROM children WHERE parent_id = ?",
      [user.user_id],
    );

    res.set("Cache-Control", "no-store").json({
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
      },
      has_child: children[0].total > 0,
    });
  } catch (err) {
    console.error("Login gagal:", err.code || err.message);
    const databaseUnavailable = [
      "ECONNREFUSED",
      "ETIMEDOUT",
      "PROTOCOL_CONNECTION_LOST",
    ].includes(err.code);
    res.status(databaseUnavailable ? 503 : 500).json({
      message: databaseUnavailable
        ? "Layanan login belum tersedia. Coba lagi sebentar."
        : "Terjadi kesalahan server.",
    });
  }
});

// Validate the saved login session before showing an authenticated page.
router.get("/me", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const authorization = req.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Silakan masuk terlebih dahulu." });
  }
  let payload;
  try {
    payload = jwt.verify(authorization.slice(7), process.env.JWT_SECRET, {
      algorithms: [tokenOptions.algorithm],
      issuer: tokenOptions.issuer,
      audience: tokenOptions.audience,
    });
    if (!Number.isSafeInteger(payload.user_id) || payload.user_id < 1)
      throw new Error("Invalid subject");
  } catch {
    return res
      .status(401)
      .json({ message: "Sesi berakhir. Silakan masuk kembali." });
  }
  try {
    const [rows] = await db.execute(
      "SELECT user_id, role_id, full_name, email FROM users WHERE user_id = ?",
      [payload.user_id],
    );
    if (!rows[0])
      return res
        .status(401)
        .json({ message: "Sesi tidak valid. Silakan masuk kembali." });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error("Validasi sesi gagal:", err.code || err.message);
    res
      .status(503)
      .json({ message: "Layanan login belum tersedia. Coba lagi sebentar." });
  }
});

module.exports = router;
