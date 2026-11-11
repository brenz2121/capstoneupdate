const signupForm = document.getElementById("signupForm");
const signupButton = document.getElementById("signupButton");
const signupMessage = document.getElementById("signupMessage");
const signupPassword = document.getElementById("password");
const signupToggle = document.getElementById("toggleSignupPassword");
const signupButtonLabel = signupButton.innerHTML;

signupToggle.addEventListener("click", () => {
  const visible = signupPassword.type === "password";
  signupPassword.type = visible ? "text" : "password";
  signupToggle.textContent = visible ? "Sembunyikan" : "Lihat";
  signupToggle.setAttribute("aria-pressed", String(visible));
  signupToggle.setAttribute(
    "aria-label",
    visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi",
  );
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (signupButton.disabled) return;
  signupMessage.hidden = true;
  const fullName = document.getElementById("nama").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = signupPassword.value;
  try {
    if (!fullName) throw new Error("Silakan isi nama lengkap Anda.");
    if (password !== document.getElementById("konfirmasi").value) {
      throw new Error("Konfirmasi kata sandi tidak cocok.");
    }
    if (new TextEncoder().encode(password).length > 72) {
      throw new Error(
        "Kata sandi terlalu panjang. Gunakan kata sandi yang lebih pendek.",
      );
    }
    signupButton.disabled = true;
    signupButton.textContent = "Sedang membuat akun…";
    signupForm.setAttribute("aria-busy", "true");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, email, password }),
      signal: AbortSignal.timeout(12000),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Pendaftaran gagal. Silakan coba lagi.");
    signupForm.reset();
    signupForm.hidden = true;
    document.getElementById("signupLoginLink").hidden = true;
    const success = document.getElementById("signupSuccess");
    success.hidden = false;
    success.focus();
  } catch (error) {
    const networkError = [
      "TimeoutError",
      "AbortError",
      "TypeError",
      "SyntaxError",
    ].includes(error.name);
    signupMessage.textContent = networkError
      ? "Tidak dapat menghubungi layanan pendaftaran. Silakan coba lagi."
      : error.message;
    signupMessage.hidden = false;
    signupMessage.focus();
  } finally {
    signupButton.disabled = false;
    signupButton.innerHTML = signupButtonLabel;
    signupForm.removeAttribute("aria-busy");
  }
});
