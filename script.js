const SHEET_ID =
"1S2yiTEmyVC55bc6TR1dk7TN_mJ_QTyvUxwbNhSqWBN4";

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
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
}[char]));
}

function parseCsv(text) {
const rows = [];

```
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
    else if (
        (c === "\n" || c === "\r") &&
        !quoted
    ) {

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
```

}

function normalizeHeader(value) {
return String(value || "")
.trim()
.toLowerCase()
.replace(/\s+/g, " ");
}

function formatDate(value) {

```
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
```

}

function validUrl(value) {

```
try {

    const url = new URL(String(value).trim());

    if (
        ["http:", "https:"].includes(url.protocol)
    ) {
        return url.href;
    }

    return null;

}
catch {

    return null;

}
```

}

/* --------------------------------------------------
Render sessions
-------------------------------------------------- */

function render(rows) {

```
if (rows.length <= 1) {

    sessionsEl.innerHTML = `
        <p class="empty">
            No sessions have been added yet.
        </p>
    `;

    statusEl.textContent = "";

    return;
}


// Read column names from the first row.
const headers =
    rows[0].map(normalizeHeader);


/*
 * Expected Google Sheet columns:
 *
 * Date
 * Topic
 * Topic Description
 * Presenter
 * Presenter Website
 * Slide Link
 */

const index = {

    date: headers.indexOf("date"),

    topic: headers.indexOf("topic"),

    description:
        headers.indexOf("topic description"),

    presenter:
        headers.indexOf("presenter"),

    website:
        headers.indexOf("presenter website"),

    slides:
        headers.indexOf("slide link")
};


// Convert spreadsheet rows into session objects.
const sessions = rows
    .slice(1)

    .map(row => ({

        date:
            row[index.date] || "",

        topic:
            row[index.topic] || "",

        description:
            row[index.description] || "",

        presenter:
            row[index.presenter] || "",

        website:
            row[index.website] || "",

        slides:
            row[index.slides] || ""

    }))

    .filter(session =>
        session.date ||
        session.topic ||
        session.presenter ||
        session.description ||
        session.slides
    );


// Sort sessions chronologically.
sessions.sort((a, b) => {

    const da =
        new Date(a.date).getTime();

    const db =
        new Date(b.date).getTime();

    if (Number.isNaN(da)) {
        return 1;
    }

    if (Number.isNaN(db)) {
        return -1;
    }

    return da - db;
});


if (sessions.length === 0) {

    sessionsEl.innerHTML = `
        <p class="empty">
            No sessions have been added yet.
        </p>
    `;

    statusEl.textContent = "";

    return;
}


/* --------------------------------------------------
   Create session rows
-------------------------------------------------- */

sessionsEl.innerHTML = sessions.map(
    (session, sessionIndex) => {

        const presenterUrl =
            validUrl(session.website);

        const slidesUrl =
            validUrl(session.slides);


        /*
         * Presenter
         */

        const presenterName =
            escapeHtml(
                session.presenter || "TBA"
            );


        const presenterHtml =
            presenterUrl

                ? `
                    <span class="presenter-label">
                        Presenter:
                    </span>
                    <a
                        class="presenter"
                        href="${escapeHtml(presenterUrl)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        ${presenterName}
                    </a>
                  `

                : `
                    <span class="presenter-label">
                        Presenter:
                    </span>
                    <span class="presenter">
                        ${presenterName}
                    </span>
                  `;


        /*
         * Slides
         */

        const slidesHtml =
            slidesUrl

                ? `
                    <a
                        class="slides"
                        href="${escapeHtml(slidesUrl)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Slides
                    </a>
                  `

                : `
                    <span class="slides unavailable">
                        —
                    </span>
                  `;


        /*
         * Topic description
         */

        const hasDescription =
            session.description.trim() !== "";


        const topicHtml =
            hasDescription

                ? `
                    <button
                        class="topic-button"
                        type="button"
                        aria-expanded="false"
                        aria-controls="description-${sessionIndex}"
                    >
                        ${escapeHtml(
                            session.topic ||
                            "Untitled session"
                        )}
                    </button>

                    <div
                        id="description-${sessionIndex}"
                        class="topic-description"
                    >
                        ${escapeHtml(
                            session.description
                        )}
                    </div>
                  `

                : `
                    <span class="topic-button">
                        ${escapeHtml(
                            session.topic ||
                            "Untitled session"
                        )}
                    </span>
                  `;


        return `
            <article class="session">

                <time class="date">
                    ${escapeHtml(
                        formatDate(session.date)
                    )}
                </time>

                <div class="topic-container">

                    ${topicHtml}

                    <p class="meta">
                        ${presenterHtml}
                    </p>

                </div>

                ${slidesHtml}

            </article>
        `;

    }
).join("");


/*
 * Add click behaviour to topic buttons.
 */

document
    .querySelectorAll(".topic-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const session =
                    button.closest(".session");

                const expanded =
                    session.classList.toggle(
                        "expanded"
                    );

                button.setAttribute(
                    "aria-expanded",
                    expanded
                );

            }
        );

    });


statusEl.textContent =
    `${sessions.length} session${
        sessions.length === 1
            ? ""
            : "s"
    }`;
```

}

/* --------------------------------------------------
Load Google Sheet
-------------------------------------------------- */

async function loadSessions() {

```
try {

    const response =
        await fetch(
            SHEET_CSV_URL,
            {
                cache: "no-store"
            }
        );


    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}`
        );
    }


    const csv =
        await response.text();


    const rows =
        parseCsv(csv);


    render(rows);

}

catch (error) {

    console.error(
        "Unable to load reading sessions:",
        error
    );


    statusEl.textContent =
        "Unable to load";


    sessionsEl.innerHTML = `
        <div class="error">
            Unable to load reading sessions.
            Please try again later.
        </div>
    `;
}
```

}

/* --------------------------------------------------
Dark mode
-------------------------------------------------- */

function setTheme(theme) {

```
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
    theme === "dark"
        ? "☀"
        : "☾";
```

}

const savedTheme =
localStorage.getItem(
"reading-group-theme"
);

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

```
    const currentTheme =
        document.documentElement.classList.contains(
            "dark"
        )
            ? "dark"
            : "light";


    setTheme(
        currentTheme === "dark"
            ? "light"
            : "dark"
    );

}
```

);

/* --------------------------------------------------
Start
-------------------------------------------------- */

loadSessions();
