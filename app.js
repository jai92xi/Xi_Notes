/* =========================================================
   Xi Notes — Simple AI / ML Revision Reader
   ========================================================= */

const REPO_OWNER = "jai92xi";
const REPO_NAME = "Xi_Notes";
const NOTES_PATH = "notes";

const API_URL =
  `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${NOTES_PATH}`;

let notebooks = [];
let currentIndex = 0;

/* ---------------------------------------------------------
   DOM
--------------------------------------------------------- */

const contentsList = document.getElementById("contentsList");
const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");

const previousBtn = document.getElementById("previousBtn");
const nextBtn = document.getElementById("nextBtn");
const themeToggle = document.getElementById("themeToggle");

const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");


/* ---------------------------------------------------------
   INITIALIZE
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initializeTheme();
  loadNotebooks();

  previousBtn.addEventListener("click", showPrevious);
  nextBtn.addEventListener("click", showNext);
  themeToggle.addEventListener("click", toggleTheme);
});


/* ---------------------------------------------------------
   LOAD NOTEBOOKS FROM GITHUB
--------------------------------------------------------- */

async function loadNotebooks() {
  showLoading(true);

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Could not load notes from GitHub.");
    }

    const files = await response.json();

    notebooks = files
      .filter(file =>
        file.type === "file" &&
        /\.(md|markdown)$/i.test(file.name)
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: "base"
        })
      );

    renderContents();

    if (notebooks.length > 0) {
      loadNotebook(0);
    } else {
      showError("No Markdown notebooks were found.");
    }

  } catch (error) {
    console.error(error);

    showError(
      "Unable to load your notebooks. Please check the GitHub repository."
    );
  }

  showLoading(false);
}


/* ---------------------------------------------------------
   CONTENTS / LEFT SIDEBAR
--------------------------------------------------------- */

function renderContents() {
  contentsList.innerHTML = "";

  notebooks.forEach((notebook, index) => {
    const button = document.createElement("button");

    button.className = "content-item";

    button.textContent = cleanTitle(notebook.name);

    button.addEventListener("click", () => {
      loadNotebook(index);
    });

    contentsList.appendChild(button);
  });
}


/* ---------------------------------------------------------
   LOAD NOTE
--------------------------------------------------------- */

async function loadNotebook(index) {
  if (!notebooks[index]) return;

  currentIndex = index;

  updateActiveContent();
  updateNavigationButtons();

  const notebook = notebooks[index];

  noteTitle.textContent = cleanTitle(notebook.name);

  noteContent.innerHTML = `
    <div class="note-loading">
      Loading note...
    </div>
  `;

  try {
    const response = await fetch(notebook.download_url);

    if (!response.ok) {
      throw new Error("Could not load notebook.");
    }

    const markdown = await response.text();

    noteContent.innerHTML = markdownToHTML(markdown);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  } catch (error) {
    console.error(error);

    noteContent.innerHTML = `
      <div class="note-error">
        <h3>Unable to load this note</h3>
        <p>
          The notebook could not be loaded from GitHub.
        </p>
      </div>
    `;
  }
}


/* ---------------------------------------------------------
   ACTIVE CONTENT
--------------------------------------------------------- */

function updateActiveContent() {
  const items =
    document.querySelectorAll(".content-item");

  items.forEach((item, index) => {
    item.classList.toggle(
      "active",
      index === currentIndex
    );
  });
}


/* ---------------------------------------------------------
   PREVIOUS / NEXT
--------------------------------------------------------- */

function showPrevious() {
  if (currentIndex <= 0) return;

  loadNotebook(currentIndex - 1);
}

function showNext() {
  if (currentIndex >= notebooks.length - 1) return;

  loadNotebook(currentIndex + 1);
}


/* ---------------------------------------------------------
   NAVIGATION BUTTONS
--------------------------------------------------------- */

function updateNavigationButtons() {
  const previousNotebook =
    notebooks[currentIndex - 1];

  const nextNotebook =
    notebooks[currentIndex + 1];

  if (previousNotebook) {
    previousBtn.disabled = false;

    previousBtn.innerHTML = `
      ← ${escapeHTML(
        cleanTitle(previousNotebook.name)
      )}
    `;
  } else {
    previousBtn.disabled = true;
    previousBtn.textContent = "← Previous";
  }


  if (nextNotebook) {
    nextBtn.disabled = false;

    nextBtn.innerHTML = `
      ${escapeHTML(
        cleanTitle(nextNotebook.name)
      )} →
    `;
  } else {
    nextBtn.disabled = true;
    nextBtn.textContent = "Next →";
  }
}


/* ---------------------------------------------------------
   SIMPLE MARKDOWN PARSER
--------------------------------------------------------- */

function markdownToHTML(markdown) {
  let html = escapeHTML(markdown);

  /* Code blocks */

  html = html.replace(
    /```([\s\S]*?)```/g,
    (_, code) => `
      <pre><code>${code.trim()}</code></pre>
    `
  );

  /* Headings */

  html = html.replace(
    /^###### (.*)$/gm,
    "<h6>$1</h6>"
  );

  html = html.replace(
    /^##### (.*)$/gm,
    "<h5>$1</h5>"
  );

  html = html.replace(
    /^#### (.*)$/gm,
    "<h4>$1</h4>"
  );

  html = html.replace(
    /^### (.*)$/gm,
    "<h3>$1</h3>"
  );

  html = html.replace(
    /^## (.*)$/gm,
    "<h2>$1</h2>"
  );

  html = html.replace(
    /^# (.*)$/gm,
    "<h1>$1</h1>"
  );

  /* Bold */

  html = html.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  /* Italic */

  html = html.replace(
    /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
    "<em>$1</em>"
  );

  /* Inline code */

  html = html.replace(
    /`([^`\n]+)`/g,
    "<code>$1</code>"
  );

  /* Links */

  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  /* Horizontal rule */

  html = html.replace(
    /^---$/gm,
    "<hr>"
  );

  /* Unordered lists */

  html = html.replace(
    /^(?:- |\* )(.*)$/gm,
    "<li>$1</li>"
  );

  html = html.replace(
    /(<li>.*<\/li>)/gs,
    "<ul>$1</ul>"
  );

  /* Ordered lists */

  html = html.replace(
    /^\d+\. (.*)$/gm,
    "<li>$1</li>"
  );

  /* Paragraphs */

  const lines = html.split("\n");

  const result = [];

  let insideBlock = false;

  lines.forEach(line => {
    const trimmed = line.trim();

    if (
      trimmed.startsWith("<pre>") ||
      trimmed.startsWith("<ul>") ||
      trimmed.startsWith("<ol>")
    ) {
      insideBlock = true;
    }

    if (
      trimmed.startsWith("</pre>") ||
      trimmed.startsWith("</ul>") ||
      trimmed.startsWith("</ol>")
    ) {
      insideBlock = false;
    }

    if (
      trimmed === "" ||
      trimmed.startsWith("<h") ||
      trimmed.startsWith("</h") ||
      trimmed.startsWith("<pre") ||
      trimmed.startsWith("</pre") ||
      trimmed.startsWith("<ul") ||
      trimmed.startsWith("</ul") ||
      trimmed.startsWith("<li") ||
      trimmed.startsWith("<hr") ||
      trimmed.startsWith("<blockquote")
    ) {
      result.push(line);
      return;
    }

    if (!insideBlock) {
      result.push(`<p>${line}</p>`);
    } else {
      result.push(line);
    }
  });

  html = result.join("\n");

  /* Blockquotes */

  html = html.replace(
    /^&gt; (.*)$/gm,
    "<blockquote>$1</blockquote>"
  );

  return html;
}


/* ---------------------------------------------------------
   TITLE CLEANUP
--------------------------------------------------------- */

function cleanTitle(filename) {
  return filename
    .replace(/\.(md|markdown)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, letter =>
      letter.toUpperCase()
    );
}


/* ---------------------------------------------------------
   ESCAPE HTML
--------------------------------------------------------- */

function escapeHTML(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* ---------------------------------------------------------
   LOADING / ERROR
--------------------------------------------------------- */

function showLoading(show) {
  if (!loading) return;

  loading.style.display =
    show ? "flex" : "none";
}

function showError(message) {
  if (!errorMessage) return;

  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}


/* ---------------------------------------------------------
   THEME
--------------------------------------------------------- */

function initializeTheme() {
  const savedTheme =
    localStorage.getItem("xi-notes-theme");

  /*
   * Light theme is the default.
   */

  const theme =
    savedTheme || "light";

  document.documentElement.dataset.theme =
    theme;

  updateThemeButton(theme);
}


function toggleTheme() {
  const currentTheme =
    document.documentElement.dataset.theme;

  const newTheme =
    currentTheme === "light"
      ? "dark"
      : "light";

  document.documentElement.dataset.theme =
    newTheme;

  localStorage.setItem(
    "xi-notes-theme",
    newTheme
  );

  updateThemeButton(newTheme);
}


function updateThemeButton(theme) {
  if (!themeToggle) return;

  themeToggle.textContent =
    theme === "light"
      ? "☾"
      : "☀";

  themeToggle.setAttribute(
    "aria-label",
    theme === "light"
      ? "Switch to dark theme"
      : "Switch to light theme"
  );
}


/* ---------------------------------------------------------
   KEYBOARD NAVIGATION
--------------------------------------------------------- */

document.addEventListener("keydown", event => {
  /*
   * Don't interfere while typing.
   */

  const tag =
    document.activeElement?.tagName;

  if (
    tag === "INPUT" ||
    tag === "TEXTAREA"
  ) {
    return;
  }

  if (event.key === "ArrowLeft") {
    showPrevious();
  }

  if (event.key === "ArrowRight") {
    showNext();
  }
});
