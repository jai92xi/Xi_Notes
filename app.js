/* =========================================================
   AI & ML KEY CONCEPTS
   app.js
   ========================================================= */

const GITHUB_USER = "jai92xi";
const GITHUB_REPO = "Xi_Notes";
const NOTES_FOLDER = "notes";

const NOTES_TITLE = "AI & ML Key Concepts";


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const sidebar = document.getElementById("sidebar");
const content = document.getElementById("content");
const searchInput = document.getElementById("search");
const themeButton = document.getElementById("theme-button");
const menuButton = document.getElementById("menu-button");
const closeSidebarButton = document.getElementById("close-sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");


/* =========================================================
   STATE
   ========================================================= */

let topics = [];
let currentTopicIndex = -1;


/* =========================================================
   INITIALIZE
   ========================================================= */

function initialize() {
  configureMarkdown();
  setupSearch();
  setupKeyboardShortcuts();
  setupMobileMenu();
  setupTheme();
  loadTopics();
}


/* =========================================================
   MARKDOWN CONFIGURATION
   ========================================================= */

function configureMarkdown() {
  if (typeof marked === "undefined") {
    console.error("Marked.js is not loaded.");
    return;
  }

  marked.setOptions({
    gfm: true,
    breaks: true
  });
}


/* =========================================================
   LOAD TOPICS
   ========================================================= */

async function loadTopics() {
  try {
    showLoadingSidebar();

    const apiUrl =
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${NOTES_FOLDER}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(
        `GitHub API returned ${response.status}`
      );
    }

    const files = await response.json();

    if (!Array.isArray(files)) {
      throw new Error("Invalid notes response.");
    }

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
        a.name.localeCompare(
          b.name,
          undefined,
          {
            numeric: true,
            sensitivity: "base"
          }
        )
      );

    createSidebar(topics);

    if (topics.length > 0) {
      await loadMarkdown(topics[0], false);
    } else {
      showMessage(
        "No notes yet",
        "Add Markdown files to the notes folder."
      );
    }

  } catch (error) {
    console.error(
      "Failed to load notes:",
      error
    );

    showError(
      "Couldn’t load your notes.",
      "Please check that the notes folder exists in your GitHub repository."
    );
  }
}


/* =========================================================
   FORMAT TOPIC NAME
   ========================================================= */

function formatTopicName(filename) {

  let name = filename
    .replace(/\.md$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  name = name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(word =>
      word.charAt(0).toUpperCase() +
      word.slice(1)
    )
    .join(" ");

  const abbreviations = {
    "Ai": "AI",
    "Ml": "ML",
    "Llm": "LLM",
    "Llms": "LLMs",
    "Nlp": "NLP",
    "Cv": "CV",
    "Rag": "RAG",
    "Vllm": "vLLM",
    "Gpu": "GPU",
    "Gpus": "GPUs",
    "Cpu": "CPU",
    "Cpus": "CPUs",
    "Api": "API",
    "Apis": "APIs",
    "Mlp": "MLP",
    "Cnn": "CNN",
    "Cnns": "CNNs",
    "Rnn": "RNN",
    "Rnns": "RNNs",
    "Lstm": "LSTM",
    "Lora": "LoRA",
    "Sql": "SQL",
    "Json": "JSON",
    "Pytorch": "PyTorch",
    "Tensorflow": "TensorFlow",
    "Knn": "KNN",
    "Svm": "SVM",
    "Xgboost": "XGBoost",
    "Keras": "Keras"
  };

  name = name
    .split(" ")
    .map(word =>
      abbreviations[word] || word
    )
    .join(" ");

  return name;
}


/* =========================================================
   CREATE SIDEBAR
   ========================================================= */

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
        Nothing found ✦
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
      <span class="topic-dot">✦</span>
      <span class="topic-name">
        ${escapeHTML(topic.name)}
      </span>
    `;

    button.addEventListener(
      "click",
      () => {
        loadMarkdown(topic, true);
        closeMobileSidebar();
      }
    );

    navigation.appendChild(button);
  });

  if (
    currentTopicIndex >= 0 &&
    topics[currentTopicIndex]
  ) {
    updateActiveTopic(
      topics[currentTopicIndex]
    );
  }
}


/* =========================================================
   LOAD MARKDOWN
   ========================================================= */

async function loadMarkdown(
  topic,
  scrollToTop = true
) {

  try {

    showLoading();

    currentTopicIndex =
      topics.findIndex(
        item => item.file === topic.file
      );

    /*
     * Fetch the Markdown from GitHub Pages.
     *
     * Using ./notes/ keeps this compatible
     * with the GitHub Pages project path.
     */

    const markdownURL =
      `./${NOTES_FOLDER}/${encodeURIComponent(topic.file)}`;

    const response =
      await fetch(markdownURL);

    if (!response.ok) {
      throw new Error(
        `Unable to load ${topic.file}`
      );
    }

    const markdown =
      await response.text();

    if (typeof marked === "undefined") {
      throw new Error(
        "Marked.js is not available."
      );
    }


    /* =====================================================
       RENDER MARKDOWN

       marked.parse() allows normal HTML contained inside
       the Markdown document to remain HTML.

       Therefore this works:

       <div style="display:flex; ...">

       <img src="../images/example.png">

       </div>
       ===================================================== */

    const renderedHTML =
      marked.parse(markdown);

    content.innerHTML =
      renderedHTML;

    content.classList.add(
      "note-loaded"
    );


    /*
     * Fix relative image paths.
     */

    fixMarkdownImages();


    /*
     * Add IDs to headings.
     */

    addHeadingIds();


    /*
     * Add copy buttons to code blocks.
     */

    addCopyButtons();


    /*
     * Make external links open in a new tab.
     */

    setupExternalLinks();


    /*
     * Update sidebar and top navigation.
     */

    updateActiveTopic(topic);


    if (scrollToTop) {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }

  } catch (error) {

    console.error(
      "Failed to load note:",
      error
    );

    showError(
      "Couldn’t open this note.",
      topic.file
    );
  }
}


/* =========================================================
   FIX MARKDOWN IMAGES
   ========================================================= */

function fixMarkdownImages() {

  if (!content) {
    return;
  }

  const images =
    content.querySelectorAll("img");

  images.forEach(image => {

    const source =
      image.getAttribute("src");

    if (!source) {
      return;
    }


    /*
     * External images are left untouched.
     */

    if (
      source.startsWith("http://") ||
      source.startsWith("https://") ||
      source.startsWith("//") ||
      source.startsWith("data:") ||
      source.startsWith("blob:")
    ) {
      return;
    }


    /*
     * Root-relative paths are left untouched.
     */

    if (source.startsWith("/")) {
      image.loading = "lazy";
      image.decoding = "async";
      return;
    }


    /*
     * Markdown lives in:
     *
     * /Xi_Notes/notes/
     *
     * So:
     *
     * ../images/file.png
     *
     * correctly becomes:
     *
     * /Xi_Notes/images/file.png
     */

    try {

      const basePath =
        `${window.location.origin}/${GITHUB_REPO}/${NOTES_FOLDER}/`;

      const absoluteURL =
        new URL(
          source,
          basePath
        );

      image.src =
        absoluteURL.href;

    } catch (error) {

      console.warn(
        "Could not resolve image:",
        source,
        error
      );

    }

    image.loading = "lazy";
    image.decoding = "async";

  });
}


/* =========================================================
   TOP PREVIOUS / NEXT NAVIGATION
   ========================================================= */

function updateTopNavigation() {

  const topNavigation =
    document.querySelector(
      ".top-bar .page-navigation"
    );

  if (!topNavigation) {
    return;
  }

  topNavigation.innerHTML = "";

  if (topics.length <= 1) {
    return;
  }


  /* =====================================================
     PREVIOUS
     ===================================================== */

  const previousTopic =
    currentTopicIndex > 0
      ? topics[currentTopicIndex - 1]
      : null;

  const previousButton =
    document.createElement("button");

  previousButton.type = "button";
  previousButton.className =
    "page-nav-button previous-page";

  if (previousTopic) {

    previousButton.innerHTML = `
      <span class="page-nav-arrow">
        ←
      </span>

      <span class="page-nav-copy">

        <span class="page-nav-label">
          Previous
        </span>

        <span class="page-nav-title">
          ${escapeHTML(previousTopic.name)}
        </span>

      </span>
    `;

    previousButton.setAttribute(
      "aria-label",
      `Previous: ${previousTopic.name}`
    );

    previousButton.addEventListener(
      "click",
      () => {
        loadMarkdown(previousTopic, true);
      }
    );

  } else {

    previousButton.disabled = true;

    previousButton.innerHTML = `
      <span class="page-nav-arrow">
        ←
      </span>

      <span class="page-nav-copy">

        <span class="page-nav-label">
          Previous
        </span>

        <span class="page-nav-title">
          Start
        </span>

      </span>
    `;
  }


  /* =====================================================
     NEXT
     ===================================================== */

  const nextTopic =
    currentTopicIndex <
      topics.length - 1
      ? topics[currentTopicIndex + 1]
      : null;

  const nextButton =
    document.createElement("button");

  nextButton.type = "button";
  nextButton.className =
    "page-nav-button next-page";

  if (nextTopic) {

    nextButton.innerHTML = `
      <span class="page-nav-copy">

        <span class="page-nav-label">
          Next
        </span>

        <span class="page-nav-title">
          ${escapeHTML(nextTopic.name)}
        </span>

      </span>

      <span class="page-nav-arrow">
        →
      </span>
    `;

    nextButton.setAttribute(
      "aria-label",
      `Next: ${nextTopic.name}`
    );

    nextButton.addEventListener(
      "click",
      () => {
        loadMarkdown(nextTopic, true);
      }
    );

  } else {

    nextButton.disabled = true;

    nextButton.innerHTML = `
      <span class="page-nav-copy">

        <span class="page-nav-label">
          Next
        </span>

        <span class="page-nav-title">
          You’re caught up ✦
        </span>

      </span>

      <span class="page-nav-arrow">
        →
      </span>
    `;
  }


  topNavigation.appendChild(
    previousButton
  );

  topNavigation.appendChild(
    nextButton
  );
}


/* =========================================================
   UPDATE ACTIVE TOPIC
   ========================================================= */

function updateActiveTopic(
  selectedTopic
) {

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

    const isActive =
      topicName.textContent.trim() ===
      selectedTopic.name;

    button.classList.toggle(
      "active",
      isActive
    );
  });

  updateTopNavigation();
}


/* =========================================================
   SEARCH
   ========================================================= */

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
            topic.name
              .toLowerCase()
              .includes(query)

            ||

            topic.file
              .toLowerCase()
              .includes(query)
          );

        });

      createSidebar(filtered);
    }
  );
}


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

function setupKeyboardShortcuts() {

  document.addEventListener(
    "keydown",
    event => {

      if (
        (event.metaKey || event.ctrlKey) &&
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

        closeMobileSidebar();
      }


      if (
        event.key === "ArrowLeft" &&
        !isTypingInField(event)
      ) {

        if (currentTopicIndex > 0) {

          event.preventDefault();

          loadMarkdown(
            topics[currentTopicIndex - 1]
          );
        }
      }


      if (
        event.key === "ArrowRight" &&
        !isTypingInField(event)
      ) {

        if (
          currentTopicIndex >= 0 &&
          currentTopicIndex <
            topics.length - 1
        ) {

          event.preventDefault();

          loadMarkdown(
            topics[currentTopicIndex + 1]
          );
        }
      }

    }
  );
}


/* =========================================================
   CHECK IF USER IS TYPING
   ========================================================= */

function isTypingInField(event) {

  const element =
    event.target;

  if (!element) {
    return false;
  }

  const tag =
    element.tagName
      ? element.tagName.toLowerCase()
      : "";

  return (
    tag === "input" ||
    tag === "textarea" ||
    element.isContentEditable
  );
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function setupMobileMenu() {

  if (menuButton) {

    menuButton.addEventListener(
      "click",
      openMobileSidebar
    );
  }

  if (closeSidebarButton) {

    closeSidebarButton.addEventListener(
      "click",
      closeMobileSidebar
    );
  }

  if (sidebarOverlay) {

    sidebarOverlay.addEventListener(
      "click",
      closeMobileSidebar
    );
  }

}


/* =========================================================
   OPEN MOBILE SIDEBAR
   ========================================================= */

function openMobileSidebar() {

  if (sidebar) {
    sidebar.classList.add(
      "mobile-open"
    );
  }

  if (sidebarOverlay) {
    sidebarOverlay.classList.add(
      "active"
    );
  }

  document.body.classList.add(
    "sidebar-open"
  );
}


/* =========================================================
   CLOSE MOBILE SIDEBAR
   ========================================================= */

function closeMobileSidebar() {

  if (sidebar) {
    sidebar.classList.remove(
      "mobile-open"
    );
  }

  if (sidebarOverlay) {
    sidebarOverlay.classList.remove(
      "active"
    );
  }

  document.body.classList.remove(
    "sidebar-open"
  );
}


/* =========================================================
   COPY CODE BUTTONS
   ========================================================= */

function addCopyButtons() {

  const codeBlocks =
    content.querySelectorAll("pre");

  codeBlocks.forEach(pre => {

    if (
      pre.querySelector(
        ".copy-button"
      )
    ) {
      return;
    }

    const button =
      document.createElement("button");

    button.type = "button";
    button.className =
      "copy-button";

    button.textContent =
      "Copy";

    button.setAttribute(
      "aria-label",
      "Copy code"
    );

    button.addEventListener(
      "click",
      async () => {

        const code =
          pre.querySelector("code");

        if (!code) {
          return;
        }

        const codeText =
          code.innerText;

        try {

          await navigator.clipboard.writeText(
            codeText
          );

          showCopiedState(button);

        } catch (error) {

          fallbackCopy(
            codeText,
            button
          );
        }
      }
    );

    pre.appendChild(button);
  });
}


/* =========================================================
   COPIED STATE
   ========================================================= */

function showCopiedState(button) {

  button.textContent =
    "Copied ✦";

  button.classList.add(
    "copied"
  );

  setTimeout(
    () => {

      button.textContent =
        "Copy";

      button.classList.remove(
        "copied"
      );

    },
    1400
  );
}


/* =========================================================
   FALLBACK COPY
   ========================================================= */

function fallbackCopy(
  text,
  button
) {

  try {

    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value =
      text;

    textarea.style.position =
      "fixed";

    textarea.style.opacity =
      "0";

    document.body.appendChild(
      textarea
    );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();

    showCopiedState(button);

  } catch (error) {

    console.error(
      "Copy failed:",
      error
    );
  }
}


/* =========================================================
   HEADING IDS
   ========================================================= */

function addHeadingIds() {

  const headings =
    content.querySelectorAll(
      "h1, h2, h3, h4"
    );

  const usedIds =
    new Set();

  headings.forEach(heading => {

    const text =
      heading.textContent
        .toLowerCase()
        .trim();

    let baseId =
      text
        .replace(
          /[^\w\s-]/g,
          ""
        )
        .replace(
          /\s+/g,
          "-"
        );

    if (!baseId) {
      return;
    }

    let id =
      baseId;

    let counter =
      2;

    while (
      usedIds.has(id)
    ) {

      id =
        `${baseId}-${counter}`;

      counter++;
    }

    usedIds.add(id);

    heading.id =
      id;
  });
}


/* =========================================================
   EXTERNAL LINKS
   ========================================================= */

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

      link.target =
        "_blank";

      link.rel =
        "noopener noreferrer";
    }
  });
}


/* =========================================================
   LOADING STATE
   ========================================================= */

function showLoading() {

  content.classList.remove(
    "note-loaded"
  );

  content.innerHTML = `
    <div class="loading">

      <div class="loading-line"></div>

      <div class="loading-line short"></div>

      <div class="loading-line"></div>

    </div>
  `;
}


/* =========================================================
   SIDEBAR LOADING
   ========================================================= */

function showLoadingSidebar() {

  const navigation =
    document.querySelector(
      ".topic-navigation"
    );

  if (!navigation) {
    return;
  }

  navigation.innerHTML = `
    <div class="no-results">
      Loading concepts...
    </div>
  `;
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
  title,
  message
) {

  content.classList.remove(
    "note-loaded"
  );

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


/* =========================================================
   ERROR
   ========================================================= */

function showError(
  title,
  message
) {

  content.classList.remove(
    "note-loaded"
  );

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


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    String(value);

  return div.innerHTML;
}


/* =========================================================
   THEME
   ========================================================= */

function setupTheme() {

  if (!themeButton) {
    return;
  }

  const savedTheme =
    localStorage.getItem(
      "shared-ai-notes-theme"
    );

  /*
   * Light theme is the default.
   */

  if (savedTheme === "dark") {

    document.body.classList.add(
      "dark-theme"
    );

  } else {

    document.body.classList.remove(
      "dark-theme"
    );
  }

  updateThemeButton();

  themeButton.addEventListener(
    "click",
    () => {

      document.body.classList.toggle(
        "dark-theme"
      );

      const isDark =
        document.body.classList.contains(
          "dark-theme"
        );

      localStorage.setItem(
        "shared-ai-notes-theme",
        isDark
          ? "dark"
          : "light"
      );

      updateThemeButton();
    }
  );
}


/* =========================================================
   THEME BUTTON
   ========================================================= */

function updateThemeButton() {

  if (!themeButton) {
    return;
  }

  const isDark =
    document.body.classList.contains(
      "dark-theme"
    );

  themeButton.textContent =
    isDark
      ? "☀"
      : "☾";

  themeButton.setAttribute(
    "aria-label",
    isDark
      ? "Switch to light theme"
      : "Switch to dark theme"
  );

  themeButton.setAttribute(
    "title",
    isDark
      ? "Switch to light theme"
      : "Switch to dark theme"
  );
}


/* =========================================================
   START
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initialize
  );

} else {

  initialize();

}
