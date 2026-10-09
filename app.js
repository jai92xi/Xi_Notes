const REPO_OWNER = "jai92xi";
const REPO_NAME = "Xi_Notes";
const NOTES_PATH = "notes";

const API_URL =
  `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${NOTES_PATH}`;

let notebooks = [];
let currentIndex = 0;


/* =========================================
   DOM
========================================= */

const contentsList = document.getElementById("contentsList");
const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");

const previousBtn = document.getElementById("previousBtn");
const nextBtn = document.getElementById("nextBtn");
const themeToggle = document.getElementById("themeToggle");

const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");


/* =========================================
   SEARCH BOX
========================================= */

let searchBox = null;

document.addEventListener("DOMContentLoaded", () => {

  initializeTheme();

  createSearchBox();

  loadNotebooks();

  previousBtn.addEventListener("click", showPrevious);
  nextBtn.addEventListener("click", showNext);
  themeToggle.addEventListener("click", toggleTheme);

});


/* =========================================
   CREATE SEARCH BOX
========================================= */

function createSearchBox() {

  const sidebarHeader =
    document.querySelector(".sidebar-header");

  if (!sidebarHeader) return;

  searchBox = document.createElement("input");

  searchBox.type = "search";
  searchBox.placeholder = "Search topics...";
  searchBox.className = "search-box";
  searchBox.setAttribute(
    "aria-label",
    "Search notes"
  );

  sidebarHeader.insertAdjacentElement(
    "afterend",
    searchBox
  );

  searchBox.addEventListener(
    "input",
    filterTopics
  );
}


/* =========================================
   SEARCH TOPICS
========================================= */

function filterTopics() {

  const query =
    searchBox.value
      .trim()
      .toLowerCase();

  const items =
    document.querySelectorAll(".content-item");

  items.forEach((item, index) => {

    const notebook = notebooks[index];

    if (!notebook) return;

    const title =
      cleanTitle(notebook.name)
        .toLowerCase();

    const matches =
      title.includes(query);

    item.style.display =
      matches ? "block" : "none";
  });
}


/* =========================================
   LOAD NOTEBOOKS
========================================= */

async function loadNotebooks() {

  showLoading(true);

  try {

    const response =
      await fetch(API_URL);

    if (!response.ok) {
      throw new Error(
        "Could not load notes from GitHub."
      );
    }

    const files =
      await response.json();

    notebooks =
      files
        .filter(file =>
          file.type === "file" &&
          /\.(md|markdown)$/i.test(file.name)
        )
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            undefined,
            {
              numeric: true,
              sensitivity: "base"
            }
          )
        );

    renderContents();

    if (notebooks.length > 0) {
      loadNotebook(0);
    } else {
      showError(
        "No Markdown notebooks were found."
      );
    }

  } catch (error) {

    console.error(error);

    showError(
      "Unable to load your notebooks from GitHub."
    );
  }

  showLoading(false);
}


/* =========================================
   RENDER CONTENTS
========================================= */

function renderContents() {

  contentsList.innerHTML = "";

  notebooks.forEach(
    (notebook, index) => {

      const button =
        document.createElement("button");

      button.className =
        "content-item";

      button.type = "button";

      button.textContent =
        cleanTitle(notebook.name);

      button.addEventListener(
        "click",
        () => loadNotebook(index)
      );

      contentsList.appendChild(button);
    }
  );
}


/* =========================================
   LOAD NOTE
========================================= */

async function loadNotebook(index) {

  if (!notebooks[index]) return;

  currentIndex = index;

  updateActiveContent();
  updateNavigationButtons();

  const notebook =
    notebooks[index];

  noteTitle.textContent =
    cleanTitle(notebook.name);

  noteContent.innerHTML = `
    <div class="note-loading">
      Loading note...
    </div>
  `;

  try {

    const response =
      await fetch(
        notebook.download_url
      );

    if (!response.ok) {
      throw new Error(
        "Could not load notebook."
      );
    }

    const markdown =
      await response.text();

    noteContent.innerHTML =
      markdownToHTML(markdown);

    renderMath();

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


/* =========================================
   ACTIVE CONTENT
========================================= */

function updateActiveContent() {

  const items =
    document.querySelectorAll(
      ".content-item"
    );

  items.forEach(
    (item, index) => {

      item.classList.toggle(
        "active",
        index === currentIndex
      );
    }
  );
}


/* =========================================
   PREVIOUS / NEXT
========================================= */

function showPrevious() {

  if (currentIndex <= 0) return;

  loadNotebook(
    currentIndex - 1
  );
}


function showNext() {

  if (
    currentIndex >=
    notebooks.length - 1
  ) {
    return;
  }

  loadNotebook(
    currentIndex + 1
  );
}


/* =========================================
   NAVIGATION BUTTONS
========================================= */

function updateNavigationButtons() {

  const previousNotebook =
    notebooks[currentIndex - 1];

  const nextNotebook =
    notebooks[currentIndex + 1];


  if (previousNotebook) {

    previousBtn.disabled = false;

    previousBtn.textContent =
      `← ${cleanTitle(
        previousNotebook.name
      )}`;

  } else {

    previousBtn.disabled = true;

    previousBtn.textContent =
      "← Previous";
  }


  if (nextNotebook) {

    nextBtn.disabled = false;

    nextBtn.textContent =
      `${cleanTitle(
        nextNotebook.name
      )} →`;

  } else {

    nextBtn.disabled = true;

    nextBtn.textContent =
      "Next →";
  }
}


/* =========================================
   MARKDOWN PARSER
========================================= */

function markdownToHTML(markdown) {

  let text = markdown;


  /*
   * Protect LaTeX before HTML escaping.
   */

  const mathBlocks = [];
  const inlineMath = [];


  text = text.replace(
    /\$\$([\s\S]*?)\$\$/g,
    (_, formula) => {

      const id =
        `MATHBLOCK_${mathBlocks.length}`;

      mathBlocks.push(
        formula.trim()
      );

      return `@@${id}@@`;
    }
  );


  text = text.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_, formula) => {

      const id =
        `MATHBLOCK_${mathBlocks.length}`;

      mathBlocks.push(
        formula.trim()
      );

      return `@@${id}@@`;
    }
  );


  text = text.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_, formula) => {

      const id =
        `MATHINLINE_${inlineMath.length}`;

      inlineMath.push(
        formula.trim()
      );

      return `@@${id}@@`;
    }
  );


  text = escapeHTML(text);


  /*
   * Restore block math.
   */

  mathBlocks.forEach(
    (formula, index) => {

      const escapedFormula =
        escapeHTML(formula);

      text = text.replace(
        `@@MATHBLOCK_${index}@@`,
        `<div class="formula-box">
          \\[
          ${escapedFormula}
          \\]
        </div>`
      );
    }
  );


  /*
   * Restore inline math.
   */

  inlineMath.forEach(
    (formula, index) => {

      const escapedFormula =
        escapeHTML(formula);

      text = text.replace(
        `@@MATHINLINE_${index}@@`,
        `\\(${escapedFormula}\\)`
      );
    }
  );


  /*
   * Markdown headings.
   */

  text = text.replace(
    /^###### (.*)$/gm,
    "<h6>$1</h6>"
  );

  text = text.replace(
    /^##### (.*)$/gm,
    "<h5>$1</h5>"
  );

  text = text.replace(
    /^#### (.*)$/gm,
    "<h4>$1</h4>"
  );

  text = text.replace(
    /^### (.*)$/gm,
    "<h3>$1</h3>"
  );

  text = text.replace(
    /^## (.*)$/gm,
    "<h2>$1</h2>"
  );

  text = text.replace(
    /^# (.*)$/gm,
    "<h1>$1</h1>"
  );


  /*
   * Highlight / mark.
   *
   * Example:
   *
   * <mark>Bagging vs Boosting</mark>
   */

  text = text.replace(
    /&lt;mark&gt;([\s\S]*?)&lt;\/mark&gt;/gi,
    '<mark>$1</mark>'
  );


  /*
   * Bold.
   */

  text = text.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );


  /*
   * Italic.
   */

  text = text.replace(
    /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
    "<em>$1</em>"
  );


  /*
   * Inline code.
   */

  text = text.replace(
    /`([^`\n]+)`/g,
    "<code>$1</code>"
  );


  /*
   * Links.
   */

  text = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );


  /*
   * Horizontal rule.
   */

  text = text.replace(
    /^---$/gm,
    "<hr>"
  );


  /*
   * Images.
   */

  text = text.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" loading="lazy">'
  );


  /*
   * Unordered lists.
   */

  text = text.replace(
    /^(?:- |\* )(.*)$/gm,
    "<li>$1</li>"
  );


  /*
   * Ordered lists.
   */

  text = text.replace(
    /^\d+\. (.*)$/gm,
    "<li>$1</li>"
  );


  /*
   * Convert consecutive list items
   * into one list.
   */

  text = text.replace(
    /((?:<li>.*<\/li>\n?)+)/g,
    match => {

      const isOrdered =
        /^\d+\./.test(
          match.trim()
        );

      return `<ul>${match}</ul>`;
    }
  );


  /*
   * Paragraphs.
   */

  const lines =
    text.split("\n");

  const result = [];

  let inCodeBlock = false;
  let inList = false;


  lines.forEach(line => {

    const trimmed =
      line.trim();


    if (
      trimmed.startsWith("<pre>")
    ) {
      inCodeBlock = true;

      result.push(line);

      return;
    }


    if (
      trimmed.endsWith("</pre>")
    ) {
      inCodeBlock = false;

      result.push(line);

      return;
    }


    if (inCodeBlock) {

      result.push(line);

      return;
    }


    if (
      trimmed === ""
    ) {

      result.push("");

      return;
    }


    if (
      /^<(h[1-6]|ul|ol|li|hr|blockquote|pre|div|img)/i
        .test(trimmed)
    ) {

      result.push(line);

      return;
    }


    if (
      trimmed.startsWith("</")
    ) {

      result.push(line);

      return;
    }


    result.push(
      `<p>${line}</p>`
    );
  });


  text =
    result.join("\n");


  /*
   * Blockquotes.
   */

  text = text.replace(
    /^&gt; (.*)$/gm,
    "<blockquote>$1</blockquote>"
  );


  /*
   * Code fences.
   */

  text = text.replace(
    /```(?:\w+)?\n?([\s\S]*?)```/g,
    (_, code) => `
      <pre><code>${code.trim()}</code></pre>
    `
  );


  /*
   * Clean excessive empty paragraphs.
   */

  text = text.replace(
    /<p>\s*<\/p>/g,
    ""
  );


  return text;
}


/* =========================================
   MATHJAX
========================================= */

function renderMath() {

  if (
    typeof MathJax !== "undefined" &&
    MathJax.typesetPromise
  ) {

    MathJax.typesetClear([
      noteContent
    ]);

    MathJax.typesetPromise([
      noteContent
    ]).catch(error => {
      console.error(
        "MathJax rendering error:",
        error
      );
    });
  }
}


/* =========================================
   TITLE CLEANUP
========================================= */

function cleanTitle(filename) {

  return filename
    .replace(
      /\.(md|markdown)$/i,
      ""
    )
    .replace(
      /[-_]+/g,
      " "
    )
    .replace(
      /\b\w/g,
      letter =>
        letter.toUpperCase()
    );
}


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHTML(value) {

  return value
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


/* =========================================
   LOADING
========================================= */

function showLoading(show) {

  if (!loading) return;

  loading.style.display =
    show ? "flex" : "none";
}


/* =========================================
   ERROR
========================================= */

function showError(message) {

  if (!errorMessage) return;

  errorMessage.textContent =
    message;

  errorMessage.style.display =
    "block";
}


/* =========================================
   THEME
========================================= */

function initializeTheme() {

  const savedTheme =
    localStorage.getItem(
      "xi-notes-theme"
    );

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

  updateThemeButton(
    newTheme
  );
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


/* =========================================
   KEYBOARD NAVIGATION
========================================= */

document.addEventListener(
  "keydown",
  event => {

    const tag =
      document.activeElement?.tagName;

    if (
      tag === "INPUT" ||
      tag === "TEXTAREA"
    ) {
      return;
    }


    if (
      event.key === "ArrowLeft"
    ) {
      showPrevious();
    }


    if (
      event.key === "ArrowRight"
    ) {
      showNext();
    }
  }
);
/* =========================================================
   XI NOTES — CHEAT SHEET CHECKLIST
   Adds persistent checkboxes to 1CheatSheet.md headings.
   ========================================================= */

(function initCheatSheetChecklist() {
  "use strict";

  const CHECKLIST_FILE = "1CheatSheet.md";
  const STORAGE_PREFIX = "xi-notes-checklist-v1:";
  const COMPLETE_CLASS = "xi-section-complete";

  function getCurrentFile() {
    if (
      typeof currentTopicIndex === "number" &&
      Array.isArray(topics) &&
      topics[currentTopicIndex]
    ) {
      return topics[currentTopicIndex].file;
    }

    return "";
  }

  function getStorageKey(file) {
    return STORAGE_PREFIX + file;
  }

  function readCompleted(file) {
    try {
      const saved = localStorage.getItem(getStorageKey(file));
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn("Could not read checklist progress:", error);
      return {};
    }
  }

  function saveCompleted(file, completed) {
    try {
      localStorage.setItem(
        getStorageKey(file),
        JSON.stringify(completed)
      );
    } catch (error) {
      console.warn("Could not save checklist progress:", error);
    }
  }

  function getHeadingKey(heading, index) {
    const text = heading.textContent
      .replace(/\s+/g, " ")
      .trim();

    return `${heading.tagName}:${index}:${text}`;
  }

  function getSectionElements(heading) {
    const elements = [];
    const level = Number(heading.tagName.slice(1));
    let sibling = heading.nextElementSibling;

    while (sibling) {
      const isHeading = /^H[1-6]$/.test(sibling.tagName);

      if (
        isHeading &&
        Number(sibling.tagName.slice(1)) <= level
      ) {
        break;
      }

      elements.push(sibling);
      sibling = sibling.nextElementSibling;
    }

    return elements;
  }

  function applyCompletion(heading, section, checked) {
    heading.classList.toggle(COMPLETE_CLASS, checked);

    heading.style.textDecoration = checked
      ? "line-through 2px #16a34a"
      : "";

    heading.style.textDecorationColor = checked
      ? "#16a34a"
      : "";

    heading.style.textDecorationThickness = checked
      ? "2px"
      : "";

    section.forEach(element => {
      element.classList.toggle(COMPLETE_CLASS, checked);

      element.style.textDecoration = checked
        ? "line-through 2px #16a34a"
        : "";

      element.style.textDecorationColor = checked
        ? "#16a34a"
        : "";

      element.style.textDecorationThickness = checked
        ? "2px"
        : "";
    });
  }

  function addChecklist() {
    if (!content || getCurrentFile() !== CHECKLIST_FILE) {
      return;
    }

    const headings = Array.from(
      content.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );

    if (!headings.length) return;

    const completed = readCompleted(CHECKLIST_FILE);

    headings.forEach((heading, index) => {
      // Prevent duplicate checkboxes if this function runs again.
      if (heading.querySelector(".xi-checklist-checkbox")) {
        return;
      }

      const key = getHeadingKey(heading, index);
      const section = getSectionElements(heading);
      const label = document.createElement("label");
      const checkbox = document.createElement("input");

      label.className = "xi-checklist-label";
      label.title = "Mark this section as completed";

      checkbox.type = "checkbox";
      checkbox.className = "xi-checklist-checkbox";
      checkbox.checked = Boolean(completed[key]);
      checkbox.setAttribute(
        "aria-label",
        `Mark ${heading.textContent.trim()} as completed`
      );

      // Keep the checkbox separate from the heading text.
      label.appendChild(checkbox);
      heading.insertBefore(label, heading.firstChild);

      applyCompletion(heading, section, checkbox.checked);

      checkbox.addEventListener("change", () => {
        completed[key] = checkbox.checked;

        saveCompleted(CHECKLIST_FILE, completed);

        // Recalculate the section in case the document changed.
        applyCompletion(
          heading,
          getSectionElements(heading),
          checkbox.checked
        );
      });
    });
  }

  // Add the checkbox styling without requiring a separate CSS edit.
  function addChecklistStyles() {
    if (document.getElementById("xi-checklist-styles")) return;

    const style = document.createElement("style");
    style.id = "xi-checklist-styles";

    style.textContent = `
      .xi-checklist-label {
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
        margin-right: 0.55em;
        cursor: pointer;
      }

      .xi-checklist-checkbox {
        appearance: auto;
        width: 1.05em;
        height: 1.05em;
        margin: 0;
        accent-color: #16a34a;
        cursor: pointer;
        flex-shrink: 0;
      }

      .xi-section-complete {
        text-decoration-line: line-through;
        text-decoration-color: #16a34a;
        text-decoration-thickness: 2px;
      }

      .xi-section-complete code,
      .xi-section-complete pre {
        text-decoration: inherit;
        text-decoration-color: #16a34a;
      }

      .xi-checklist-checkbox:focus-visible {
        outline: 2px solid #16a34a;
        outline-offset: 3px;
      }
    `;

    document.head.appendChild(style);
  }

  function runChecklist() {
    addChecklistStyles();
    addChecklist();
  }

  // Expose a function for the existing Markdown-loading routine.
  window.refreshXiChecklist = runChecklist;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runChecklist);
  } else {
    runChecklist();
  }
})();
One required integration
In your existing loadMarkdown() function, find the part immediately after the Markdown has been rendered into content and the heading IDs have been added. Add:

javascript
if (window.refreshXiChecklist) {
  window.refreshXiChecklist();
}
