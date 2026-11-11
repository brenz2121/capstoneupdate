const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
require("dotenv").config({ quiet: true });
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = require("../server");
const db = require("../config/db");
let server, admin, base, userId, validToken;
const email = `auth-test-${crypto.randomUUID()}@example.invalid`;
const password = " Login Test!2026 ";
const registeredEmail = `register-test-${crypto.randomUUID()}@example.invalid`;
const concurrentEmail = `register-race-${crypto.randomUUID()}@example.invalid`;
const registrationPassword = " Register Test!2026 ";
async function register(body) {
  return fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
async function login(body) {
  return fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
before(async () => {
  const credentials = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../.local/mysql-admin.json"), "utf8"),
  );
  admin = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: credentials.password,
    database: process.env.DB_NAME,
  });
  const [result] = await admin.execute(
    "INSERT INTO users (role_id, full_name, email, password_hash) VALUES (2, ?, ?, ?)",
    ["Test Parent", email, await bcrypt.hash(password, 10)],
  );
  userId = result.insertId;
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (admin) {
    await admin.execute("DELETE FROM users WHERE email = ?", [email]);
    await admin.execute("DELETE FROM users WHERE email IN (?, ?)", [
      registeredEmail,
      concurrentEmail,
    ]);
    await admin.end();
  }
  if (server) await new Promise((resolve) => server.close(resolve));
  await db.end();
});
test("valid login uses MySQL and returns a verifiable token without the hash", async () => {
  const response = await login({
    email: `  ${email.toUpperCase()}  `,
    password,
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const data = await response.json();
  assert.equal(data.user.user_id, userId);
  assert.equal(data.user.password_hash, undefined);
  assert.equal(data.has_child, false);
  const claims = jwt.verify(data.token, process.env.JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: "toiletcare",
    audience: "toiletcare-web",
  });
  assert.equal(claims.user_id, userId);
  assert.equal(claims.exp - claims.iat, 8 * 3600);
  validToken = data.token;
});
test("wrong password, trimmed password and unknown account receive the same error", async () => {
  const results = [];
  for (const body of [
    { email, password: "wrong-password" },
    { email, password: password.trim() },
    { email: "missing@example.invalid", password },
  ]) {
    const response = await login(body);
    assert.equal(response.status, 401);
    results.push(await response.json());
  }
  assert.deepEqual(results[0], results[1]);
  assert.deepEqual(results[1], results[2]);
});
test("missing, non-string, invalid email and oversized passwords are rejected", async () => {
  for (const body of [
    {},
    null,
    { email: [], password },
    { email, password: {} },
    { email: "bad-email", password },
    { email, password: "x".repeat(73) },
  ]) {
    assert.equal((await login(body)).status, 400);
  }
});
test("SQL injection does not authenticate", async () => {
  const response = await login({
    email: "a'OR'1'='1@example.invalid",
    password,
  });
  assert.equal(response.status, 401);
});
test("session lookup returns the authenticated account", async () => {
  const response = await fetch(`${base}/api/auth/me`, {
    headers: { Authorization: `Bearer ${validToken}` },
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.email, email);
});
test("missing, forged, expired and deleted-account tokens are rejected", async () => {
  const options = {
    algorithm: "HS256",
    issuer: "toiletcare",
    audience: "toiletcare-web",
  };
  const tokens = [
    null,
    `${validToken}tampered`,
    jwt.sign({ user_id: userId }, process.env.JWT_SECRET, {
      ...options,
      expiresIn: -1,
    }),
    jwt.sign({ user_id: 999999999 }, process.env.JWT_SECRET, options),
  ];
  for (const token of tokens) {
    const response = await fetch(`${base}/api/auth/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    assert.equal(response.status, 401);
  }
});
test("malformed JSON receives 400 and unknown API route receives 404", async () => {
  const response = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(response.status, 400);
  assert.equal((await fetch(`${base}/api/unknown`)).status, 404);
});

test("registration persists a normalized parent account with a bcrypt hash, then permits login", async () => {
  const response = await register({
    full_name: "  Registered Parent  ",
    email: `  ${registeredEmail.toUpperCase()}  `,
    password: registrationPassword,
    role_id: 1,
  });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const data = await response.json();
  assert.equal(data.password, undefined);
  assert.equal(data.password_hash, undefined);
  const [rows] = await admin.execute(
    "SELECT full_name, email, role_id, password_hash FROM users WHERE email = ?",
    [registeredEmail],
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].full_name, "Registered Parent");
  assert.equal(rows[0].role_id, 2);
  assert.notEqual(rows[0].password_hash, registrationPassword);
  assert.equal(
    await bcrypt.compare(registrationPassword, rows[0].password_hash),
    true,
  );
  const signedIn = await login({
    email: registeredEmail,
    password: registrationPassword,
  });
  assert.equal(signedIn.status, 200);
  const { token } = await signedIn.json();
  const session = await fetch(`${base}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(session.status, 200);
  assert.equal((await session.json()).user.email, registeredEmail);
});

test("duplicate registration is rejected regardless of email case or whitespace", async () => {
  const response = await register({
    full_name: "Duplicate",
    email: ` ${registeredEmail.toUpperCase()} `,
    password: "Different!2026",
  });
  assert.equal(response.status, 409);
  assert.equal(
    (await login({ email: registeredEmail, password: registrationPassword }))
      .status,
    200,
  );
});

test("registration rejects missing, wrong-type, whitespace, malformed, oversized and short fields", async () => {
  const valid = {
    full_name: "Validation Parent",
    email: registeredEmail,
    password: registrationPassword,
  };
  for (const body of [
    null,
    {},
    { ...valid, full_name: [] },
    { ...valid, full_name: "   " },
    { ...valid, full_name: "x".repeat(121) },
    { ...valid, email: {} },
    { ...valid, email: "invalid-email" },
    { ...valid, email: "x".repeat(250) + "@example.invalid" },
    { ...valid, password: [] },
    { ...valid, password: "12345" },
    { ...valid, password: "x".repeat(73) },
    { ...valid, password: "😀".repeat(19) },
  ]) {
    assert.equal((await register(body)).status, 400);
  }
});

test("simultaneous registration creates only one account and returns 201 plus 409", async () => {
  const body = {
    full_name: "Concurrent Parent",
    email: concurrentEmail,
    password: registrationPassword,
  };
  const responses = await Promise.all([register(body), register(body)]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
  const [rows] = await admin.execute(
    "SELECT COUNT(*) AS total FROM users WHERE email = ?",
    [concurrentEmail],
  );
  assert.equal(rows[0].total, 1);
});
