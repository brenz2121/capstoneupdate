const tokenKey = "toiletcare.token";
const token = sessionStorage.getItem(tokenKey);
const pageName = window.location.pathname.split("/").pop();
const links = [
  ["dashboard.html", "Beranda", "⌂"],
  ["progress.html", "Progress", "↗"],
  ["riwayat-latihan.html", "Riwayat", "◷"],
  ["profil-anak.html", "Profil anak", "♧"],
  ["laporan-harian.html", "Laporan harian", "▤"],
  ["pengaturan.html", "Pengaturan", "⚙"],
];
function logout() {
  sessionStorage.removeItem(tokenKey);
  window.location.replace("login.html");
}
function renderNavigation() {
  const navigation = document.createElement("aside");
  navigation.className = "app-nav";
  navigation.innerHTML = `<a class="brand" href="dashboard.html"><span class="brand-mark" aria-hidden="true">✦</span> ToiletCare <span class="brand-tag">VR</span></a>
    <p class="nav-caption">RUANG PENDAMPING</p><nav class="nav-links" aria-label="Navigasi utama">${links
      .map(
        ([href, label, icon]) =>
          `<a href="${href}" class="nav-link" ${pageName === href ? 'aria-current="page"' : ""}><span aria-hidden="true">${icon}</span><span>${label}</span></a>`,
      )
      .join("")}</nav>
    <div class="nav-bottom"><p>Setiap langkah kecil<br>layak dirayakan.</p><button type="button" class="nav-logout" data-logout>Keluar <span aria-hidden="true">↗</span></button></div>`;
  document.body.prepend(navigation);
  document.body.classList.add("app-body");
  const page = document.querySelector("main, .page");
  if (page) {
    page.id = "main-content";
    if (page.tagName !== "MAIN") page.setAttribute("role", "main");
    const skip = document.createElement("a");
    skip.className = "skip-link";
    skip.href = "#main-content";
    skip.textContent = "Lewati ke konten";
    document.body.prepend(skip);
    const demo = document.createElement("p");
    demo.className = "demo-note";
    demo.textContent =
      "Data contoh · Fitur selain login belum terhubung ke server.";
    page.append(demo);
  }
  document
    .querySelectorAll("[data-logout], .logout-button")
    .forEach((button) => {
      button.removeAttribute("onclick");
      button.addEventListener("click", logout);
    });
  document
    .querySelectorAll(".profile-form, .profile-form-section form")
    .forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        let notice = form.querySelector('[role="status"]');
        if (!notice) {
          notice = document.createElement("p");
          notice.setAttribute("role", "status");
          notice.className = "demo-note";
          form.append(notice);
        }
        notice.textContent =
          "Penyimpanan profil belum tersedia. Data belum disimpan ke server.";
      });
    });
}
async function validateSession() {
  if (!token) {
    logout();
    return;
  }
  try {
    const response = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (response.status === 401) {
      logout();
      return;
    }
    if (!response.ok) throw new Error("Session service unavailable");
    const { user } = await response.json();
    renderNavigation();
    document.querySelectorAll("[data-user-name]").forEach((element) => {
      element.textContent = user.full_name;
    });
    document.documentElement.setAttribute("data-session-ready", "");
  } catch {
    const panel = document.createElement("main");
    panel.className = "session-error";
    panel.innerHTML =
      '<h1>Koneksi belum tersedia</h1><p>Sesi Anda belum dapat diperiksa. Coba sambungkan kembali.</p><button class="main-button" type="button">Coba lagi</button><a href="login.html">Kembali ke halaman masuk</a>';
    panel
      .querySelector("button")
      .addEventListener("click", () => window.location.reload());
    document.body.replaceChildren(panel);
    document.documentElement.setAttribute("data-session-ready", "");
  }
}
validateSession();
window.addEventListener("pageshow", (event) => {
  if (event.persisted) window.location.reload();
});
