const GITHUB_USER = "jai92xi";
const GITHUB_REPO = "Xi_Notes";
const NOTES_FOLDER = "notes";

const sidebar = document.getElementById("sidebar");
const content = document.getElementById("content");
const searchInput = document.getElementById("search");
const currentTopic = document.getElementById("current-topic");

let topics = [];
let currentTopicIndex = -1;


/* ========================================
   GET ALL MARKDOWN FILES
======================================== */
async function loadTopics() {
  try {
    const apiUrl =
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${NOTES_FOLDER}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Could not load notes from GitHub.");
    }

    const files = await response.json();

    topics = files
      .filter(file =>
        file.type === "file" &&
        file.name.toLowerCase().endsWith(".md")
      )
      .map(file => ({
        file: file.name,
        name: formatTopicName(file.name),
        url: file.download_url
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );

    createSidebar(topics);

    if (topics.length > 0) {
      loadMarkdown(topics[0]);
    } else {
      showMessage(
        "No notes yet",
        "Add Markdown files to the notes folder."
      );
    }

  } catch (error) {
    console.error(error);

    showError(
      "Couldn’t load your notes.",
      "Check that the notes folder exists in your GitHub repository."
    );
  }
}


/* ========================================
   FILE NAME → DISPLAY NAME
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
        No notes found
      </div>
    `;

    return;
  }

  items.forEach(topic => {

    const button =
      document.createElement("button");

    button.type = "button";
    button.className = "topic-button";

    button.innerHTML = `
      <span class="tree-symbol">├──</span>
      <span class="topic-name">
        ${escapeHTML(topic.file)}
      </span>
    `;

    button.addEventListener("click", () => {
      loadMarkdown(topic);
    });

    navigation.appendChild(button);
  });

  /*
    Re-apply active state after rebuilding
    the sidebar, for example after searching.
  */
  const currentFile =
    currentTopicIndex >= 0 &&
    topics[currentTopicIndex]
      ? topics[currentTopicIndex].file
      : null;

  if (currentFile) {
    updateActiveTopic(topics[currentTopicIndex]);
  }
}


/* ========================================
   LOAD MARKDOWN NOTE
======================================== */
async function loadMarkdown(topic) {
  try {

    showLoading();

    /*
      Find the actual position of this topic
      in the complete topic list.
    */
    currentTopicIndex =
      topics.findIndex(item =>
        item.file === topic.file
      );

    const response =
      await fetch(
        `notes/${encodeURIComponent(topic.file)}`
      );

    if (!response.ok) {
      throw new Error(
        `Unable to load ${topic.file}`
      );
    }

    const markdown =
      await response.text();

    if (typeof marked === "undefined") {
      throw new Error(
        "Markdown parser is not available."
      );
    }

    content.innerHTML =
      marked.parse(markdown);

    updateCurrentTopic(topic);

    updateActiveTopic(topic);

    addCopyButtons();

    addHeadingIds();

    setupExternalLinks();

    /*
      Add Previous / Next navigation
      after the Markdown content.
    */
    addTopicNavigation();

    closeMobileSidebar();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  } catch (error) {

    console.error(error);

    showError(
      "Couldn’t open this note.",
      topic.file
    );
  }
}


/* ========================================
   CURRENT TOPIC
======================================== */
function updateCurrentTopic(topic) {

  if (!currentTopic) {
    return;
  }

  currentTopic.textContent =
    topic.name;
}


/* ========================================
   ACTIVE SIDEBAR ITEM
======================================== */
function updateActiveTopic(selectedTopic) {

  const buttons =
    document.querySelectorAll(
      ".topic-button"
    );

  buttons.forEach(button => {

    const topicName =
      button.querySelector(
        ".topic-name"
      );

    if (!topicName) {
      return;
    }

    if (
      topicName.textContent.trim() ===
      selectedTopic.file
    ) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}


/* ========================================
   PREVIOUS / NEXT TOPIC NAVIGATION
======================================== */
function addTopicNavigation() {

  /*
    Remove an old navigation block if one
    somehow exists.
  */
  const oldNavigation =
    content.querySelector(".topic-navigation-footer");

  if (oldNavigation) {
    oldNavigation.remove();
  }

  if (
    currentTopicIndex < 0 ||
    topics.length === 0
  ) {
    return;
  }

  const navigation =
    document.createElement("div");

  navigation.className =
    "topic-navigation-footer";

  const previousTopic =
    currentTopicIndex > 0
      ? topics[currentTopicIndex - 1]
      : null;

  const nextTopic =
    currentTopicIndex < topics.length - 1
      ? topics[currentTopicIndex + 1]
      : null;


  /* ----------------------------------------
     PREVIOUS BUTTON
  ---------------------------------------- */
  const previousButton =
    document.createElement("button");

  previousButton.type = "button";
  previousButton.className =
    "topic-nav-button previous-topic";

  if (previousTopic) {

    previousButton.innerHTML = `
      <span class="topic-nav-label">
        ← Previous
      </span>

      <span class="topic-nav-title">
        ${escapeHTML(previousTopic.name)}
      </span>
    `;

    previousButton.addEventListener(
      "click",
      () => {
        loadMarkdown(previousTopic);
      }
    );

  } else {

    previousButton.disabled = true;

    previousButton.innerHTML = `
      <span class="topic-nav-label">
        ← Previous
      </span>

      <span class="topic-nav-title">
        No previous topic
      </span>
    `;
  }


  /* ----------------------------------------
     NEXT BUTTON
  ---------------------------------------- */
  const nextButton =
    document.createElement("button");

  nextButton.type = "button";
  nextButton.className =
    "topic-nav-button next-topic";

  if (nextTopic) {

    nextButton.innerHTML = `
      <span class="topic-nav-label">
        Next →
      </span>

      <span class="topic-nav-title">
        ${escapeHTML(nextTopic.name)}
      </span>
    `;

    nextButton.addEventListener(
      "click",
      () => {
        loadMarkdown(nextTopic);
      }
    );

  } else {

    nextButton.disabled = true;

    nextButton.innerHTML = `
      <span class="topic-nav-label">
        Next →
      </span>

      <span class="topic-nav-title">
        No next topic
      </span>
    `;
  }


  navigation.appendChild(previousButton);
  navigation.appendChild(nextButton);

  content.appendChild(navigation);
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

      /*
        Cmd + K / Ctrl + K
        Focus search
      */
      if (
        (event.metaKey ||
          event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {

        event.preventDefault();

        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }


      /*
        Escape
      */
      if (event.key === "Escape") {

        if (searchInput) {
          searchInput.value = "";
          searchInput.blur();
        }

        createSidebar(topics);

        closeMobileSidebar();
      }


      /*
        Left arrow = Previous topic
        Right arrow = Next topic

        Don't trigger while typing in
        the search box.
      */
      if (
        document.activeElement !== searchInput &&
        !isTypingInInput(event)
      ) {

        if (event.key === "ArrowLeft") {
          navigateToPreviousTopic();
        }

        if (event.key === "ArrowRight") {
          navigateToNextTopic();
        }
      }

    }
  );
}


/* ========================================
   KEYBOARD NAVIGATION
======================================== */
function navigateToPreviousTopic() {

  if (currentTopicIndex <= 0) {
    return;
  }

  const previousTopic =
    topics[currentTopicIndex - 1];

  if (previousTopic) {
    loadMarkdown(previousTopic);
  }
}


function navigateToNextTopic() {

  if (
    currentTopicIndex < 0 ||
    currentTopicIndex >= topics.length - 1
  ) {
    return;
  }

  const nextTopic =
    topics[currentTopicIndex + 1];

  if (nextTopic) {
    loadMarkdown(nextTopic);
  }
}


function isTypingInInput(event) {

  const target =
    event.target;

  if (!target) {
    return false;
  }

  const tagName =
    target.tagName.toLowerCase();

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    target.isContentEditable
  );
}


/* ========================================
   COPY CODE BUTTON
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

    button.type = "button";
    button.className = "copy-button";
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
            "Copied";

          button.classList.add(
            "copied"
          );

          setTimeout(() => {

            button.textContent =
              "Copy";

            button.classList.remove(
              "copied"
            );

          }, 1400);

        } catch (error) {

          console.error(error);

          button.textContent =
            "Failed";

          setTimeout(() => {

            button.textContent =
              "Copy";

          }, 1400);
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
      "h1, h2, h3, h4"
    );

  const usedIds = new Set();

  headings.forEach(heading => {

    let baseId =
      heading.textContent
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

    if (!baseId) {
      return;
    }

    let id = baseId;
    let counter = 2;

    while (usedIds.has(id)) {
      id = `${baseId}-${counter}`;
      counter++;
    }

    usedIds.add(id);

    heading.id = id;
  });
}


/* ========================================
   EXTERNAL LINKS
======================================== */
function setupExternalLinks() {

  const links =
    content.querySelectorAll("a");

  links.forEach(link => {

    const href =
      link.getAttribute("href");

    if (
      href &&
      (
        href.startsWith("http://") ||
        href.startsWith("https://")
      )
    ) {

      link.target = "_blank";

      link.rel =
        "noopener noreferrer";
    }
  });
}


/* ========================================
   LOADING STATE
======================================== */
function showLoading() {

  content.innerHTML = `
    <div class="loading">
      <div class="loading-line"></div>
      <div class="loading-line short"></div>
      <div class="loading-line"></div>
    </div>
  `;
}


/* ========================================
   MESSAGE
======================================== */
function showMessage(title, message) {

  content.innerHTML = `
    <div class="empty-state">

      <h1>
        ${escapeHTML(title)}
      </h1>

      <p>
        ${escapeHTML(message)}
      </p>

    </div>
  `;
}


/* ========================================
   ERROR
======================================== */
function showError(title, message) {

  content.innerHTML = `
    <div class="error">

      <h1>
        ${escapeHTML(title)}
      </h1>

      <p>
        ${escapeHTML(message)}
      </p>

    </div>
  `;
}


/* ========================================
   MOBILE SIDEBAR
======================================== */
function setupMobileMenu() {

  const menuButton =
    document.getElementById(
      "menu-button"
    );

  const closeButton =
    document.getElementById(
      "close-sidebar"
    );

  const overlay =
    document.getElementById(
      "sidebar-overlay"
    );


  if (menuButton) {

    menuButton.addEventListener(
      "click",
      () => {

        sidebar.classList.add(
          "mobile-open"
        );

        if (overlay) {
          overlay.classList.add(
            "active"
          );
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
      closeMobileSidebar
    );
  }


  if (overlay) {

    overlay.addEventListener(
      "click",
      closeMobileSidebar
    );
  }
}


function closeMobileSidebar() {

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

    overlay.classList.remove(
      "active"
    );
  }

  document.body.classList.remove(
    "sidebar-open"
  );
}


/* ========================================
   ESCAPE HTML
======================================== */
function escapeHTML(value) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent = value;

  return div.innerHTML;
}


/* ========================================
   MARKDOWN CONFIGURATION
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
   DESKTOP LAYOUT
========================================
   Keep the left pane compact so the
   Markdown content gets more space.

   This only applies to laptop/desktop.
   Mobile layout is left untouched.
======================================== */
function configureDesktopLayout() {

  const style =
    document.createElement("style");

  style.id =
    "xi-notes-desktop-layout";

  style.textContent = `

    @media (min-width: 769px) {

      /*
        Smaller left sidebar.
        If your current CSS uses a different
        width, this overrides it.
      */
      #sidebar {
        width: 220px !important;
        min-width: 220px !important;
        max-width: 220px !important;
      }

      /*
        Give the note more room.
      */
      #content {
        max-width: 900px;
      }

      /*
        Previous / Next navigation.
      */
      .topic-navigation-footer {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-top: 64px;
        padding-top: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }

      .topic-nav-button {
        appearance: none;
        border: 1px solid rgba(255, 255, 255, 0.10);
        background: transparent;
        color: inherit;
        padding: 16px 18px;
        border-radius: 10px;
        cursor: pointer;
        text-align: left;
        transition:
          background 0.2s ease,
          border-color 0.2s ease,
          transform 0.2s ease;
      }

      .topic-nav-button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.18);
        transform: translateY(-1px);
      }

      .topic-nav-button:disabled {
        opacity: 0.35;
        cursor: default;
      }

      .topic-nav-label {
        display: block;
        font-size: 12px;
        opacity: 0.55;
        margin-bottom: 6px;
      }

      .topic-nav-title {
        display: block;
        font-size: 14px;
        font-weight: 500;
      }

      .next-topic {
        text-align: right;
      }
    }


    /*
      Smaller screens:
      Stack Previous / Next buttons.
    */
    @media (max-width: 768px) {

      .topic-navigation-footer {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }

      .topic-nav-button {
        appearance: none;
        width: 100%;
        border: 1px solid rgba(255, 255, 255, 0.10);
        background: transparent;
        color: inherit;
        padding: 14px 16px;
        border-radius: 10px;
        cursor: pointer;
        text-align: left;
      }

      .topic-nav-button:disabled {
        opacity: 0.35;
        cursor: default;
      }

      .topic-nav-label {
        display: block;
        font-size: 12px;
        opacity: 0.55;
        margin-bottom: 5px;
      }

      .topic-nav-title {
        display: block;
        font-size: 14px;
      }

      .next-topic {
        text-align: left;
      }
    }

  `;

  document.head.appendChild(style);
}


/* ========================================
   INITIALIZE
======================================== */
function initialize() {

  configureMarkdown();

  configureDesktopLayout();

  setupSearch();

  setupKeyboardShortcuts();

  setupMobileMenu();

  loadTopics();
}


/* ========================================
   START
======================================== */
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
