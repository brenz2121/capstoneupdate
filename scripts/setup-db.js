// Run only against the isolated local MySQL installed by install-mysql.ps1.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const root = path.resolve(__dirname, "..");
const local = path.join(root, ".local");

async function setup() {
  const admin = JSON.parse(
    fs.readFileSync(path.join(local, "mysql-admin.json"), "utf8"),
  );
  const connection = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: admin.password,
  });
  try {
    const schema = fs.readFileSync(
      path.join(root, "database/schema.sql"),
      "utf8",
    );
    for (const sql of schema
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean))
      await connection.query(sql);
    let credentials;
    const credentialsPath = path.join(local, "app-credentials.json");
    if (fs.existsSync(credentialsPath))
      credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
    else {
      credentials = {
        password: crypto.randomBytes(24).toString("hex"),
        jwt: crypto.randomBytes(48).toString("hex"),
      };
      fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    }
    await connection.query(
      "CREATE USER IF NOT EXISTS 'toiletcare'@'127.0.0.1' IDENTIFIED BY ?",
      [credentials.password],
    );
    await connection.query(
      "ALTER USER 'toiletcare'@'127.0.0.1' IDENTIFIED BY ?",
      [credentials.password],
    );
    await connection.query(
      "GRANT SELECT, INSERT ON vr_toilet_training.users TO 'toiletcare'@'127.0.0.1'",
    );
    await connection.query(
      "GRANT SELECT ON vr_toilet_training.children TO 'toiletcare'@'127.0.0.1'",
    );
    const demo = {
      full_name: "Dewi Lestari",
      email: "demo@toiletcare.local",
      password: "ToiletCare!2026",
    };
    const hash = await bcrypt.hash(demo.password, 10);
    // Idempotent: leave an existing account and its password untouched.
    await connection.execute(
      "INSERT IGNORE INTO users (role_id, full_name, email, password_hash) VALUES (2, ?, ?, ?)",
      [demo.full_name, demo.email, hash],
    );
    fs.writeFileSync(
      path.join(local, "demo-account.json"),
      JSON.stringify(demo, null, 2),
    );
    const envPath = path.join(root, ".env");
    if (
      fs.existsSync(envPath) &&
      !fs.existsSync(path.join(local, "env-before-setup.txt"))
    ) {
      fs.copyFileSync(envPath, path.join(local, "env-before-setup.txt"));
    }
    fs.writeFileSync(
      envPath,
      `DB_HOST=127.0.0.1\nDB_USER=toiletcare\nDB_PASSWORD=${credentials.password}\nDB_NAME=vr_toilet_training\nDB_PORT=3306\nHOST=127.0.0.1\nPORT=5000\nJWT_SECRET=${credentials.jwt}\n`,
    );
    console.log(
      "Database, limited application account, and local demo login are ready.",
    );
  } finally {
    await connection.end();
  }
}
setup().catch((error) => {
  console.error(error.code || error.message);
  process.exitCode = 1;
});
