const SHEET_ID = "1S2yiTEmyVC55bc6TR1dk7TN_mJ_QTyvUxwbNhSqWBN4";

// The first tab of the Google Sheet is used.
const SHEET_CSV_URL =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;


const sessionsEl = document.getElementById("sessions");
const statusEl = document.getElementById("status");

const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");


/* --------------------------------------------------
   Utility functions
-------------------------------------------------- */

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
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
        }
        else if (c === '"') {
            quoted = !quoted;
        }
        else if (c === "," && !quoted) {
            row.push(cell);
            cell = "";
        }
        else if ((c === "\n" || c === "\r") && !quoted) {

            if (c === "\r" && next === "\n") {
                i++;
            }

            row.push(cell);

            if (row.some(v => v.trim() !== "")) {
                rows.push(row);
            }

            row = [];
            cell = "";
        }
        else {
            cell += c;
        }
    }

    row.push(cell);

    if (row.some(v => v.trim() !== "")) {
        rows.push(row);
    }

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

    if (!raw) {
        return "";
    }

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

        if (["http:", "https:"].includes(url.protocol)) {
            return url.href;
        }

        return null;
    }
    catch {
        return null;
    }
}


/* --------------------------------------------------
   Render sessions
-------------------------------------------------- */

function render(rows) {

    if (rows.length <= 1) {
        sessionsEl.innerHTML = `
            <p class="empty">No sessions have been added yet.</p>
        `;

        statusEl.textContent = "";
        return;
    }


    // Read column names from the first row.
    const headers = rows[0].map(normalizeHeader);


    const index = {
        date: headers.indexOf("date"),
        topic: headers.indexOf("topic"),
        description: headers.indexOf("topic description"),
        presenter: headers.indexOf("presenter"),
        website: headers.indexOf("presenter website"),
        slides: headers.indexOf("slide link")
    };


    // Convert spreadsheet rows into session objects.
    const sessions = rows
        .slice(1)
        .map(row => ({
            date: row[index.date] || "",
            topic: row[index.topic] || "",
            description: row[index.description] || "",
            presenter: row[index.presenter] || "",
            website: row[index.website] || "",
            slides: row[index.slides] || ""
        }))
        .filter(s =>
            s.date ||
            s.topic ||
            s.presenter ||
            s.slides
        );


    // Sort sessions chronologically.
    sessions.sort((a, b) => {

        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();

        if (Number.isNaN(da)) return 1;
        if (Number.isNaN(db)) return -1;

        return da - db;
    });


    /* --------------------------------------------------
       Create session rows
    -------------------------------------------------- */

    if (sessions.length === 0) {
        sessionsEl.innerHTML = `
            <p class="empty">No sessions have been added yet.</p>
        `;

        statusEl.textContent = "";
        return;
    }

    sessionsEl.innerHTML = sessions.map((session, i) => {

        const presenterUrl = validUrl(session.website);
        const slidesUrl = validUrl(session.slides);
        const hasDescription = session.description.trim() !== "";
        const descId = `session-desc-${i}`;


        /*
         * Presenter:
         *
         * The presenter's name itself becomes the link
         * to their personal website. Explicitly labelled
         * so it's clear who's presenting.
         */
        const presenterHtml = presenterUrl

            ? `
                <a
                    class="presenter"
                    href="${escapeHtml(presenterUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >${escapeHtml(session.presenter)}</a>
              `

            : `
                <span class="presenter">${escapeHtml(session.presenter)}</span>
              `;

        const metaHtml = session.presenter
            ? `<p class="meta"><span class="meta-label">Presented by</span> ${presenterHtml}</p>`
            : `<p class="meta"></p>`;


        /*
         * Slides:
         *
         * The word "Slides" becomes the link to the
         * presentation.
         */
        const slidesHtml = slidesUrl

            ? `
                <a
                    class="slides"
                    href="${escapeHtml(slidesUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >Slides</a>
              `

            : `<span class="slides unavailable">—</span>`;


        /*
         * Topic:
         *
         * If a description exists, the topic becomes a
         * clickable button that expands to reveal it.
         * Otherwise it's just plain text.
         */
        const topicHtml = hasDescription
            ? `
                <button
                    class="topic"
                    type="button"
                    aria-expanded="false"
                    aria-controls="${descId}"
                >
                    <span>${escapeHtml(session.topic || "Untitled session")}</span>
                    <span class="chevron" aria-hidden="true">⌄</span>
                </button>
              `
            : `<p class="topic">${escapeHtml(session.topic || "Untitled session")}</p>`;

        const descriptionHtml = hasDescription
            ? `<div class="description" id="${descId}" hidden>${escapeHtml(session.description)}</div>`
            : "";


        return `
            <div class="session">
                <time class="date">${escapeHtml(formatDate(session.date))}</time>
                ${topicHtml}
                ${metaHtml}
                ${slidesHtml}
                ${descriptionHtml}
            </div>
        `;

    }).join("");


    statusEl.textContent =
        `${sessions.length} session${sessions.length === 1 ? "" : "s"}`;
}


/* --------------------------------------------------
   Expand / collapse topic descriptions
-------------------------------------------------- */

sessionsEl.addEventListener("click", (event) => {

    const button = event.target.closest(".topic[aria-controls]");

    if (!button) {
        return;
    }

    const description = document.getElementById(
        button.getAttribute("aria-controls")
    );

    if (!description) {
        return;
    }

    const isExpanded = button.getAttribute("aria-expanded") === "true";

    button.setAttribute("aria-expanded", String(!isExpanded));
    description.hidden = isExpanded;
});


/* --------------------------------------------------
   Load Google Sheet
-------------------------------------------------- */

async function loadSessions() {

    try {

        const response = await fetch(
            SHEET_CSV_URL,
            {
                cache: "no-store"
            }
        );


        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }


        const csv = await response.text();

        const rows = parseCsv(csv);

        render(rows);

    }
    catch (error) {

        console.error("Unable to load reading sessions:", error);

        statusEl.textContent = "Unable to load";

        sessionsEl.innerHTML = `
            <div class="error">
                Unable to load reading sessions. Please try again later.
            </div>
        `;
    }
}


/* --------------------------------------------------
   Dark mode
-------------------------------------------------- */

function setTheme(theme) {

    document.documentElement.classList.toggle(
        "dark",
        theme === "dark"
    );


    localStorage.setItem(
        "reading-group-theme",
        theme
    );


    // Moon in light mode, sun in dark mode.
    themeIcon.textContent =
        theme === "dark" ? "☀" : "☾";
}


const savedTheme =
    localStorage.getItem("reading-group-theme");


const initialTheme =
    savedTheme ||
    (
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches
            ? "dark"
            : "light"
    );


setTheme(initialTheme);


themeToggle.addEventListener(
    "click",
    () => {

        const currentTheme =
            document.documentElement.classList.contains("dark")
                ? "dark"
                : "light";


        setTheme(
            currentTheme === "dark"
                ? "light"
                : "dark"
        );
    }
);


/* --------------------------------------------------
   Start
-------------------------------------------------- */

loadSessions();