const SHEET_ID = "1S2yiTEmyVC55bc6TR1dk7TN_mJ_QTyvUxwbNhSqWBN4";

// The sheet's first tab is used. If you later want a particular tab,
// add &sheet=TAB_NAME to this URL.
const SHEET_CSV_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

const sessionsEl = document.getElementById("sessions");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const themeLabel = document.querySelector(".theme-label");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"' && quoted && next === '"') {
      cell += '"';
      i++;
    } else if (c === '"') {
      quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && next === "\n") i++;
      row.push(cell);
      if (row.some(v => v.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += c;
    }
  }

  row.push(cell);
  if (row.some(v => v.trim() !== "")) rows.push(row);
  return rows;
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function formatDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  // Handles common Google Sheets output such as 9/20/2026.
  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(date);
  }
  return raw;
}

function validUrl(value) {
  try {
    const url = new URL(String(value).trim());
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function render(rows) {
  if (rows.length === 0) {
    sessionsEl.innerHTML = '<div class="empty">No sessions have been added yet.</div>';
    statusEl.textContent = "";
    return;
  }

  const headers = rows[0].map(normalizeHeader);
  const index = {
    date: headers.indexOf("date"),
    topic: headers.indexOf("topic"),
    presenter: headers.indexOf("presenter"),
    website: headers.indexOf("presenter website"),
    slides: headers.indexOf("slide link")
  };

  const sessions = rows.slice(1)
    .map(row => ({
      date: row[index.date] || "",
      topic: row[index.topic] || "",
      presenter: row[index.presenter] || "",
      website: row[index.website] || "",
      slides: row[index.slides] || ""
    }))
    .filter(s => s.date || s.topic || s.presenter || s.slides);

  // Newest/soonest dates first, while leaving unparseable dates at the bottom.
  sessions.sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (Number.isNaN(da)) return 1;
    if (Number.isNaN(db)) return -1;
    return da - db;
  });

  sessionsEl.innerHTML = sessions.map(s => {
    const presenterUrl = validUrl(s.website);
    const slidesUrl = validUrl(s.slides);

    const presenterHtml = presenterUrl
      ? `<a class="presenter" href="${escapeHtml(presenterUrl)}" target="_blank" rel="noopener">${escapeHtml(s.presenter)}</a>`
      : `<span class="presenter">${escapeHtml(s.presenter)}</span>`;

    const slidesHtml = slidesUrl
      ? `<a class="slides" href="${escapeHtml(slidesUrl)}" target="_blank" rel="noopener">Slides</a>`
      : "";

    return `
      <article class="session">
        <time class="date">${escapeHtml(formatDate(s.date))}</time>
        <div>
          <h3 class="topic">${escapeHtml(s.topic || "Untitled session")}</h3>
          <div class="meta">${presenterHtml}</div>
        </div>
        ${slidesHtml}
      </article>
    `;
  }).join("");

  statusEl.textContent = `${sessions.length} session${sessions.length === 1 ? "" : "s"}`;
}

async function loadSessions() {
  try {
    const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const csv = await response.text();
    render(parseCsv(csv));
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Unable to load";
    errorEl.hidden = false;
  }
}

function setTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("reading-group-theme", theme);
  themeIcon.textContent = theme === "dark" ? "☀" : "☾";
  themeLabel.textContent = theme === "dark" ? "Light" : "Dark";
}

const savedTheme = localStorage.getItem("reading-group-theme");
const initialTheme = savedTheme ||
  (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

setTheme(initialTheme);

themeToggle.addEventListener("click", () => {
  setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark");
});

loadSessions();
