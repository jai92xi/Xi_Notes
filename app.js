const GITHUB_USER = "jai92xi";
const GITHUB_REPO = "Xi_Notes";
const NOTES_FOLDER = "notes";

const sidebar = document.getElementById("sidebar");
const content = document.getElementById("content");
const searchInput = document.getElementById("search");
const currentTopic = document.getElementById("current-topic");

let topics = [];


/* ========================================
   LOAD ALL MARKDOWN FILES
======================================== */

async function loadTopics() {
  try {
    const apiUrl =
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${NOTES_FOLDER}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Could not access GitHub repository");
    }

    const files = await response.json();

    topics = files
      .filter(file =>
        file.type === "file" &&
        file.name.toLowerCase().endsWith(".md")
      )
      .map(file => ({
        name: formatTopicName(file.name),
        file: file.name
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );

    createSidebar(topics);

    if (topics.length > 0) {
      loadMarkdown(topics[0]);
    } else {
      content.innerHTML = `
        <div class="welcome">
          <div class="welcome-icon">✦</div>
          <h1>No notes yet</h1>
          <p>Add Markdown files to the notes folder.</p>
        </div>
      `;
    }

  } catch (error) {

    console.error(error);

    content.innerHTML = `
      <div class="error">
        <div class="error-icon">😵</div>
        <h2>Couldn't load notes</h2>
        <p>
          Make sure your Markdown files are inside the
          <code>notes</code> folder.
        </p>
      </div>
    `;
  }
}


/* ========================================
   FILE NAME → TOPIC NAME
======================================== */

function formatTopicName(filename) {

  return filename
    .replace(/\.md$/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


/* ========================================
   SIDEBAR
======================================== */

function createSidebar(items = topics) {

  const navigation =
    document.querySelector(".topic-navigation");

  if (!navigation) {
    return;
  }

  navigation.innerHTML = "";

  if (items.length === 0) {

    navigation.innerHTML = `
      <div class="no-results">
        No notes found 😶
      </div>
    `;

    return;
  }

  items.forEach(topic => {

    const button =
      document.createElement("button");

    button.className = "topic-button";
    button.type = "button";

    /*
      Display the actual filename.

      Example:
      Early_Stopping.md
      imbalanced data handling.md
    */

    button.textContent = topic.file;

    button.addEventListener("click", () => {
      loadMarkdown(topic);
    });

    navigation.appendChild(button);
  });
}


/* ========================================
   LOAD MARKDOWN
======================================== */

async function loadMarkdown(topic) {

  try {

    content.innerHTML = `
      <div class="loading">
        <div class="loading-spinner"></div>
        <p>Loading note...</p>
      </div>
    `;

    const fileUrl =
      `notes/${encodeURIComponent(topic.file)}`;

    const response =
      await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(
        `Could not load ${topic.file}`
      );
    }

    const markdown =
      await response.text();

    content.innerHTML =
      marked.parse(markdown);

    if (currentTopic) {
      currentTopic.textContent =
        topic.name;
    }

    updateActiveTopic(topic);

    addCopyButtons();

    addHeadingIds();

    setupCodeHighlighting();

    closeMobileMenu();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  } catch (error) {

    console.error(error);

    content.innerHTML = `
      <div class="error">
        <div class="error-icon">😵</div>

        <h2>Couldn't load this note</h2>

        <p>
          The file
          <strong>${escapeHTML(topic.file)}</strong>
          could not be loaded.
        </p>
      </div>
    `;
  }
}


/* ========================================
   ACTIVE TOPIC
======================================== */

function updateActiveTopic(selectedTopic) {

  const buttons =
    document.querySelectorAll(
      ".topic-button"
    );

  buttons.forEach(button => {

    if (
      button.textContent.trim() ===
      selectedTopic.file
    ) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }

  });
}


/* ========================================
   COPY CODE
======================================== */

function addCopyButtons() {

  const codeBlocks =
    content.querySelectorAll("pre");

  codeBlocks.forEach(pre => {

    if (
      pre.querySelector(".copy-button")
    ) {
      return;
    }

    const button =
      document.createElement("button");

    button.className = "copy-button";
    button.type = "button";
    button.textContent = "Copy";

    button.addEventListener(
      "click",
      async () => {

        const code =
          pre.querySelector("code");

        if (!code) {
          return;
        }

        try {

          await navigator.clipboard.writeText(
            code.innerText
          );

          button.textContent =
            "Copied ✓";

          button.classList.add("copied");

          setTimeout(() => {

            button.textContent = "Copy";

            button.classList.remove("copied");

          }, 1500);

        } catch (error) {

          button.textContent = "Failed";

          setTimeout(() => {
            button.textContent = "Copy";
          }, 1500);
        }
      }
    );

    pre.appendChild(button);
  });
}


/* ========================================
   HEADING IDS
======================================== */

function addHeadingIds() {

  const headings =
    content.querySelectorAll(
      "h1, h2, h3"
    );

  headings.forEach(heading => {

    if (heading.id) {
      return;
    }

    const id =
      heading.textContent
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

    if (id) {
      heading.id = id;
    }
  });
}


/* ========================================
   CODE BLOCKS
======================================== */

function setupCodeHighlighting() {

  const codeBlocks =
    content.querySelectorAll(
      "pre code"
    );

  codeBlocks.forEach(code => {
    code.classList.add("code-block");
  });
}


/* ========================================
   SEARCH
======================================== */

function setupSearch() {

  if (!searchInput) {
    return;
  }

  searchInput.addEventListener(
    "input",
    event => {

      const query =
        event.target.value
          .toLowerCase()
          .trim();

      if (!query) {
        createSidebar(topics);
        return;
      }

      const filtered =
        topics.filter(topic => {

          return (
            topic.file
              .toLowerCase()
              .includes(query) ||

            topic.name
              .toLowerCase()
              .includes(query)
          );

        });

      createSidebar(filtered);
    }
  );
}


/* ========================================
   KEYBOARD SHORTCUTS
======================================== */

function setupKeyboardShortcuts() {

  document.addEventListener(
    "keydown",
    event => {

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {

        event.preventDefault();

        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      if (event.key === "Escape") {

        if (searchInput) {
          searchInput.value = "";
          searchInput.blur();
        }

        createSidebar(topics);
      }

    }
  );
}


/* ========================================
   MOBILE MENU
======================================== */

function setupMobileMenu() {

  const menuButton =
    document.getElementById("menu-button");

  const closeButton =
    document.getElementById("close-sidebar");

  const overlay =
    document.getElementById("sidebar-overlay");

  if (menuButton) {

    menuButton.addEventListener(
      "click",
      () => {

        sidebar.classList.add(
          "mobile-open"
        );

        if (overlay) {
          overlay.classList.add("active");
        }

        document.body.classList.add(
          "sidebar-open"
        );
      }
    );
  }

  if (closeButton) {
    closeButton.addEventListener(
      "click",
      closeMobileMenu
    );
  }

  if (overlay) {
    overlay.addEventListener(
      "click",
      closeMobileMenu
    );
  }
}


function closeMobileMenu() {

  if (sidebar) {
    sidebar.classList.remove(
      "mobile-open"
    );
  }

  const overlay =
    document.getElementById(
      "sidebar-overlay"
    );

  if (overlay) {
    overlay.classList.remove("active");
  }

  document.body.classList.remove(
    "sidebar-open"
  );
}


/* ========================================
   HTML ESCAPE
======================================== */

function escapeHTML(value) {

  const div =
    document.createElement("div");

  div.textContent = value;

  return div.innerHTML;
}


/* ========================================
   MARKDOWN CONFIG
======================================== */

function configureMarkdown() {

  if (
    typeof marked === "undefined"
  ) {
    console.error(
      "Marked.js was not loaded."
    );

    return;
  }

  marked.setOptions({
    gfm: true,
    breaks: true
  });
}


/* ========================================
   INITIALIZE
======================================== */

function initialize() {

  configureMarkdown();

  setupSearch();

  setupKeyboardShortcuts();

  setupMobileMenu();

  loadTopics();
}


if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initialize
  );

} else {

  initialize();
}
