const form = document.getElementById("loginForm");
const button = document.getElementById("loginButton");
const message = document.getElementById("loginMessage");
const password = document.getElementById("loginPassword");
const toggle = document.getElementById("togglePassword");
const buttonLabel = button.innerHTML;

toggle.addEventListener("click", () => {
  const visible = password.type === "password";
  password.type = visible ? "text" : "password";
  toggle.textContent = visible ? "Sembunyikan" : "Lihat";
  toggle.setAttribute("aria-pressed", String(visible));
  toggle.setAttribute(
    "aria-label",
    visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi",
  );
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (button.disabled) return;
  message.hidden = true;
  button.disabled = true;
  button.textContent = "Sedang masuk…";
  form.setAttribute("aria-busy", "true");
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.getElementById("loginEmail").value.trim(),
        password: password.value,
      }),
      signal: AbortSignal.timeout(12000),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Login gagal. Silakan coba lagi.");
    sessionStorage.setItem("toiletcare.token", data.token);
    window.location.replace("dashboard.html");
  } catch (error) {
    const serverMessage = [
      "TimeoutError",
      "AbortError",
      "TypeError",
      "SyntaxError",
    ].includes(error.name);
    message.textContent = serverMessage
      ? "Tidak dapat menghubungi layanan login. Silakan coba lagi."
      : error.message;
    message.hidden = false;
    message.focus();
  } finally {
    button.disabled = false;
    button.innerHTML = buttonLabel;
    form.removeAttribute("aria-busy");
  }
});
