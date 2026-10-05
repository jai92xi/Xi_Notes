/* =========================================================
   AI & ML KEY CONCEPTS
   app.js
   ========================================================= */

const GITHUB_USER = "jai92xi";
const GITHUB_REPO = "Xi_Notes";
const GITHUB_BRANCH = "main";
const NOTES_FOLDER = "notes";

let topics = [];
let currentTopicIndex = -1;

let sidebar;
let content;
let searchInput;
let themeButton;
let menuButton;
let sidebarOverlay;

let contentsToggle;
let topicNavigation;

let previousButton;
let nextButton;
let previousTitle;
let nextTitle;


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  sidebar = document.getElementById("sidebar");
  content = document.getElementById("content");
  searchInput = document.getElementById("search");

  themeButton =
    document.getElementById("theme-button");

  menuButton =
    document.getElementById("menu-button");

  sidebarOverlay =
    document.getElementById("sidebar-overlay");

  contentsToggle =
    document.getElementById("contents-toggle");

  topicNavigation =
    document.getElementById("topic-navigation");

  previousButton =
    document.getElementById("previous-button");

  nextButton =
    document.getElementById("next-button");

  previousTitle =
    document.getElementById("previous-title");

  nextTitle =
    document.getElementById("next-title");

  configureMarkdown();

  setupTheme();
  setupSearch();
  setupKeyboardShortcuts();
  setupContentsToggle();
  setupMobileMenu();
  setupTopNavigation();

  loadTopics();

});


/* =========================================================
   MARKDOWN
   ========================================================= */

function configureMarkdown() {

  if (typeof marked === "undefined") {

    console.error(
      "Marked.js was not loaded."
    );

    return;
  }

  marked.setOptions({

    gfm: true,

    breaks: true,

    headerIds: true,

    mangle: false

  });

}


/* =========================================================
   LOAD TOPICS
   ========================================================= */

async function loadTopics() {

  try {

    showLoadingSidebar();

    const apiURL =
      `https://api.github.com/repos/` +
      `${GITHUB_USER}/${GITHUB_REPO}/contents/` +
      `${NOTES_FOLDER}?ref=${GITHUB_BRANCH}`;

    const response =
      await fetch(
        apiURL,
        {
          cache: "no-cache"
        }
      );

    if (!response.ok) {

      throw new Error(
        `GitHub API error: ${response.status}`
      );

    }

    const files =
      await response.json();

    topics =
      files

        .filter(
          file =>
            file.type === "file" &&
            file.name
              .toLowerCase()
              .endsWith(".md")
        )

        .map(
          file => ({

            file: file.name,

            name:
              formatTopicName(
                file.name
              ),

            url: file.download_url

          })
        )

        .sort(
          (a, b) =>
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

      const requestedTopic =
        getTopicFromURL();

      const initialTopic =
        requestedTopic ||
        topics[0];

      await loadMarkdown(
        initialTopic,
        false
      );

    } else {

      showMessage(
        "No notes yet",
        "Add Markdown files to the notes folder."
      );

    }

  } catch (error) {

    console.error(
      "Could not load topics:",
      error
    );

    showError(
      "Couldn't load your notes.",
      "Please check your GitHub repository and notes folder."
    );

  }

}


/* =========================================================
   FORMAT TOPIC NAME
   ========================================================= */

function formatTopicName(filename) {

  let name =
    filename

      .replace(
        /\.md$/i,
        ""
      )

      .replace(
        /[_-]+/g,
        " "
      )

      .replace(
        /([a-z0-9])([A-Z])/g,
        "$1 $2"
      )

      .replace(
        /([A-Z]+)([A-Z][a-z])/g,
        "$1 $2"
      )

      .replace(
        /\s+/g,
        " "
      )

      .trim();


  name =
    name
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map(
        word =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");


  const replacements = {

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

    "Keras": "Keras",

    "Knn": "KNN",

    "Svm": "SVM",

    "Xgboost": "XGBoost"

  };


  return name
    .split(" ")
    .map(
      word =>
        replacements[word] || word
    )
    .join(" ");

}


/* =========================================================
   URL TOPIC SUPPORT
   ========================================================= */

function getTopicFromURL() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const file =
    params.get("note");

  if (!file) {
    return null;
  }

  return (
    topics.find(
      topic =>
        topic.file === file
    ) || null
  );

}


function updateURL(topic) {

  if (!topic) {
    return;
  }

  const url =
    new URL(
      window.location.href
    );

  url.searchParams.set(
    "note",
    topic.file
  );

  window.history.replaceState(
    {},
    "",
    url
  );

}


/* =========================================================
   SIDEBAR
   ========================================================= */

function createSidebar(items) {

  if (!topicNavigation) {
    return;
  }

  topicNavigation.innerHTML = "";


  if (items.length === 0) {

    topicNavigation.innerHTML = `
      <div class="no-results">
        No concepts found ✦
      </div>
    `;

    return;
  }


  items.forEach(
    topic => {

      const button =
        document.createElement(
          "button"
        );

      button.type = "button";

      button.className =
        "topic-button";

      button.dataset.file =
        topic.file;

      button.innerHTML = `

        <span
          class="topic-dot"
          aria-hidden="true"
        >
          ✦
        </span>

        <span class="topic-name">
          ${escapeHTML(topic.name)}
        </span>

      `;


      button.addEventListener(
        "click",
        () => {

          loadMarkdown(
            topic,
            true
          );

          closeMobileSidebar();

        }
      );


      topicNavigation.appendChild(
        button
      );

    }
  );


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

  if (
    !topic ||
    !content
  ) {

    return;

  }


  try {

    showLoading();


    const index =
      topics.findIndex(
        item =>
          item.file === topic.file
      );


    if (index === -1) {
      return;
    }


    currentTopicIndex =
      index;


    updateURL(topic);

    updateTopNavigation();


    const markdownURL =
      getMarkdownURL(topic);


    const response =
      await fetch(
        markdownURL,
        {
          cache: "no-cache"
        }
      );


    if (!response.ok) {

      throw new Error(
        `Could not load ${topic.file} ` +
        `(HTTP ${response.status})`
      );

    }


    const markdown =
      await response.text();


    if (
      typeof marked === "undefined"
    ) {

      throw new Error(
        "Marked.js is unavailable."
      );

    }


    content.innerHTML =
      marked.parse(markdown);


    content.classList.add(
      "note-loaded"
    );


    fixMarkdownImages();

    addHeadingIds();

    addCopyButtons();

    setupExternalLinks();

    updateActiveTopic(topic);

    updateTopNavigation();


    /*
     * Make sure the main concept heading uses
     * the requested brain icon.
     *
     * This does not change the actual note data.
     */

    replaceConceptHeading();


    /*
     * Make Markdown fenced code blocks use the
     * normal code styling supplied by style.css.
     */

    normalizeCodeBlocks();


    if (scrollToTop) {

      window.scrollTo({

        top: 0,

        behavior: "smooth"

      });

    }


  } catch (error) {

    console.error(
      "Markdown loading error:",
      error
    );


    showError(
      "Couldn't open this note.",
      topic.file
    );

  }

}


/* =========================================================
   MARKDOWN URL
   ========================================================= */

function getMarkdownURL(topic) {

  return (
    `https://raw.githubusercontent.com/` +
    `${GITHUB_USER}/` +
    `${GITHUB_REPO}/` +
    `${GITHUB_BRANCH}/` +
    `${NOTES_FOLDER}/` +
    `${encodeURIComponent(topic.file)}`
  );

}


/* =========================================================
   IMAGE HANDLING
   ========================================================= */

function fixMarkdownImages() {

  if (!content) {
    return;
  }


  const images =
    content.querySelectorAll(
      "img"
    );


  images.forEach(
    image => {

      const source =
        image.getAttribute(
          "src"
        );


      if (!source) {
        return;
      }


      if (
        source.startsWith(
          "http://"
        ) ||
        source.startsWith(
          "https://"
        ) ||
        source.startsWith(
          "//"
        ) ||
        source.startsWith(
          "data:"
        ) ||
        source.startsWith(
          "blob:"
        )
      ) {

        image.loading =
          "lazy";

        image.decoding =
          "async";

        return;

      }


      try {

        const notesBaseURL =
          `https://raw.githubusercontent.com/` +
          `${GITHUB_USER}/` +
          `${GITHUB_REPO}/` +
          `${GITHUB_BRANCH}/` +
          `${NOTES_FOLDER}/`;


        const imageURL =
          new URL(
            source,
            notesBaseURL
          );


        image.src =
          imageURL.href;


      } catch (error) {

        console.warn(
          "Could not resolve image:",
          source,
          error
        );

      }


      image.loading =
        "lazy";

      image.decoding =
        "async";

    }
  );

}


/* =========================================================
   ACTIVE TOPIC
   ========================================================= */

function updateActiveTopic(topic) {

  if (!topicNavigation) {
    return;
  }


  const buttons =
    topicNavigation.querySelectorAll(
      ".topic-button"
    );


  buttons.forEach(
    button => {

      const active =
        button.dataset.file ===
        topic.file;


      button.classList.toggle(
        "active",
        active
      );


      if (active) {

        button.setAttribute(
          "aria-current",
          "page"
        );

      } else {

        button.removeAttribute(
          "aria-current"
        );

      }

    }
  );

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

        createSidebar(
          topics
        );

        return;

      }


      const filtered =
        topics.filter(
          topic => {

            const name =
              topic.name.toLowerCase();

            const filename =
              topic.file.toLowerCase();


            return (
              name.includes(query) ||
              filename.includes(query)
            );

          }
        );


      createSidebar(
        filtered
      );

    }
  );

}


/* =========================================================
   PREVIOUS / NEXT
   ========================================================= */

function setupTopNavigation() {

  if (previousButton) {

    previousButton.addEventListener(
      "click",
      event => {

        event.preventDefault();

        goToPrevious();

      }
    );

  }


  if (nextButton) {

    nextButton.addEventListener(
      "click",
      event => {

        event.preventDefault();

        goToNext();

      }
    );

  }


  updateTopNavigation();

}


function goToPrevious() {

  if (
    currentTopicIndex <= 0
  ) {

    return;

  }


  const previous =
    topics[
      currentTopicIndex - 1
    ];


  if (!previous) {
    return;
  }


  loadMarkdown(
    previous,
    true
  );

}


function goToNext() {

  if (
    currentTopicIndex < 0 ||
    currentTopicIndex >=
      topics.length - 1
  ) {

    return;

  }


  const next =
    topics[
      currentTopicIndex + 1
    ];


  if (!next) {
    return;
  }


  loadMarkdown(
    next,
    true
  );

}


function updateTopNavigation() {

  if (
    !previousButton ||
    !nextButton
  ) {

    return;

  }


  const hasPrevious =
    currentTopicIndex > 0;


  previousButton.disabled =
    !hasPrevious;


  if (previousTitle) {

    previousTitle.textContent =
      hasPrevious
        ? topics[
            currentTopicIndex - 1
          ].name
        : "Start";

  }


  const hasNext =
    currentTopicIndex >= 0 &&
    currentTopicIndex <
      topics.length - 1;


  nextButton.disabled =
    !hasNext;


  if (nextTitle) {

    nextTitle.textContent =
      hasNext
        ? topics[
            currentTopicIndex + 1
          ].name
        : "You're caught up ✦";

  }

}


/* =========================================================
   COLLAPSE / EXPAND CONTENTS
   ========================================================= */

function setupContentsToggle() {

  if (
    !contentsToggle ||
    !sidebar
  ) {

    return;

  }


  contentsToggle.addEventListener(
    "click",
    event => {

      event.preventDefault();

      event.stopPropagation();


      const isHidden =
        sidebar.classList.contains(
          "contents-hidden"
        );


      /*
       * SHOW CONTENTS
       *
       * The sidebar is restored completely.
       * There must be no leftover vertical bar.
       */

      if (isHidden) {

        sidebar.classList.remove(
          "contents-hidden"
        );

        contentsToggle.classList.remove(
          "collapsed"
        );

        contentsToggle.setAttribute(
          "aria-expanded",
          "true"
        );

        contentsToggle.setAttribute(
          "aria-label",
          "Hide contents"
        );

        contentsToggle.setAttribute(
          "title",
          "Hide contents"
        );

        return;

      }


      /*
       * HIDE CONTENTS
       *
       * The entire sidebar contents disappear.
       * Only the floating show icon remains.
       */

      sidebar.classList.add(
        "contents-hidden"
      );

      contentsToggle.classList.add(
        "collapsed"
      );

      contentsToggle.setAttribute(
        "aria-expanded",
        "false"
      );

      contentsToggle.setAttribute(
        "aria-label",
        "Show contents"
      );

      contentsToggle.setAttribute(
        "title",
        "Show contents"
      );

    }
  );


  /*
   * Correct initial icon state.
   */

  const initiallyHidden =
    sidebar.classList.contains(
      "contents-hidden"
    );


  contentsToggle.classList.toggle(
    "collapsed",
    initiallyHidden
  );


  contentsToggle.setAttribute(
    "aria-expanded",
    initiallyHidden
      ? "false"
      : "true"
  );


  contentsToggle.setAttribute(
    "aria-label",
    initiallyHidden
      ? "Show contents"
      : "Hide contents"
  );


  contentsToggle.setAttribute(
    "title",
    initiallyHidden
      ? "Show contents"
      : "Hide contents"
  );

}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function setupMobileMenu() {

  if (menuButton) {

    menuButton.addEventListener(
      "click",
      event => {

        event.preventDefault();

        openMobileSidebar();

      }
    );

  }


  if (sidebarOverlay) {

    sidebarOverlay.addEventListener(
      "click",
      closeMobileSidebar
    );

  }

}


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
   THEME
   ========================================================= */

function setupTheme() {

  if (!themeButton) {
    return;
  }


  const saved =
    localStorage.getItem(
      "shared-ai-notes-theme"
    );


  if (saved === "dark") {

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
    event => {

      event.preventDefault();


      document.body.classList.toggle(
        "dark-theme"
      );


      const dark =
        document.body.classList.contains(
          "dark-theme"
        );


      localStorage.setItem(
        "shared-ai-notes-theme",
        dark
          ? "dark"
          : "light"
      );


      updateThemeButton();

    }
  );

}


function updateThemeButton() {

  if (!themeButton) {
    return;
  }


  const dark =
    document.body.classList.contains(
      "dark-theme"
    );


  const icon =
    themeButton.querySelector(
      ".theme-icon"
    );


  if (icon) {

    icon.textContent =
      dark
        ? "☀"
        : "☾";

  } else {

    themeButton.textContent =
      dark
        ? "☀"
        : "☾";

  }


  themeButton.setAttribute(
    "aria-label",
    dark
      ? "Switch to light theme"
      : "Switch to dark theme"
  );


  themeButton.setAttribute(
    "title",
    dark
      ? "Switch to light theme"
      : "Switch to dark theme"
  );

}


/* =========================================================
   COPY BUTTONS
   ========================================================= */

function addCopyButtons() {

  if (!content) {
    return;
  }


  const codeBlocks =
    content.querySelectorAll(
      "pre > code"
    );


  codeBlocks.forEach(
    code => {

      const pre =
        code.parentElement;


      if (
        pre.querySelector(
          ".copy-button"
        )
      ) {

        return;

      }


      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";

      button.className =
        "copy-button";

      button.textContent =
        "Copy";


      button.addEventListener(
        "click",
        async event => {

          event.preventDefault();

          event.stopPropagation();


          try {

            await navigator.clipboard.writeText(
              code.innerText
            );


            showCopiedState(
              button
            );


          } catch (error) {

            fallbackCopy(
              code.innerText,
              button
            );

          }

        }
      );


      pre.appendChild(
        button
      );

    }
  );

}


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

  const textarea =
    document.createElement(
      "textarea"
    );


  textarea.value =
    text;


  textarea.style.position =
    "fixed";

  textarea.style.left =
    "-9999px";


  document.body.appendChild(
    textarea
  );


  textarea.select();


  try {

    document.execCommand(
      "copy"
    );


    showCopiedState(
      button
    );


  } catch (error) {

    console.error(
      "Copy failed:",
      error
    );

  }


  textarea.remove();

}


/* =========================================================
   HEADING IDS
   ========================================================= */

function addHeadingIds() {

  if (!content) {
    return;
  }


  const headings =
    content.querySelectorAll(
      "h1, h2, h3, h4, h5, h6"
    );


  const used =
    new Set();


  headings.forEach(
    heading => {

      const text =
        heading.textContent
          .toLowerCase()
          .trim();


      let id =
        text
          .replace(
            /[^\w\s-]/g,
            ""
          )
          .replace(
            /\s+/g,
            "-"
          );


      if (!id) {
        return;
      }


      const original =
        id;


      let counter = 2;


      while (
        used.has(id)
      ) {

        id =
          `${original}-${counter}`;

        counter++;

      }


      used.add(id);


      heading.id =
        id;

    }
  );

}


/* =========================================================
   CONCEPT HEADING
   ========================================================= */

function replaceConceptHeading() {

  if (!content) {
    return;
  }


  const headings =
    content.querySelectorAll(
      "h1, h2"
    );


  headings.forEach(
    heading => {

      const text =
        heading.textContent
          .trim();


      if (
        text === "AI & ML Key Concepts" ||
        text === "AI & ML Notes"
      ) {

        heading.textContent =
          "🧠 AI & ML Key Concepts";

      }

    }
  );

}


/* =========================================================
   CODE BLOCKS
   ========================================================= */

function normalizeCodeBlocks() {

  if (!content) {
    return;
  }


  const codeBlocks =
    content.querySelectorAll(
      "pre code"
    );


  codeBlocks.forEach(
    code => {

      code.style.color =
        "inherit";

    }
  );

}


/* =========================================================
   EXTERNAL LINKS
   ========================================================= */

function setupExternalLinks() {

  if (!content) {
    return;
  }


  const links =
    content.querySelectorAll(
      "a"
    );


  links.forEach(
    link => {

      const href =
        link.getAttribute(
          "href"
        );


      if (
        href &&
        (
          href.startsWith(
            "http://"
          ) ||
          href.startsWith(
            "https://"
          )
        )
      ) {

        link.target =
          "_blank";


        link.rel =
          "noopener noreferrer";

      }

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
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "k"
      ) {

        event.preventDefault();


        if (searchInput) {

          /*
           * If contents are collapsed,
           * expand them before focusing search.
           */

          if (
            sidebar &&
            sidebar.classList.contains(
              "contents-hidden"
            )
          ) {

            sidebar.classList.remove(
              "contents-hidden"
            );

            if (contentsToggle) {

              contentsToggle.classList.remove(
                "collapsed"
              );

              contentsToggle.setAttribute(
                "aria-expanded",
                "true"
              );

              contentsToggle.setAttribute(
                "aria-label",
                "Hide contents"
              );

              contentsToggle.setAttribute(
                "title",
                "Hide contents"
              );

            }

          }


          searchInput.focus();

          searchInput.select();

        }

      }


      if (
        event.key === "Escape"
      ) {

        if (searchInput) {

          searchInput.value = "";

          searchInput.blur();


          createSidebar(
            topics
          );

        }


        closeMobileSidebar();

      }


      if (
        event.key === "ArrowLeft" &&
        !isTyping(event)
      ) {

        if (
          currentTopicIndex > 0
        ) {

          event.preventDefault();

          goToPrevious();

        }

      }


      if (
        event.key === "ArrowRight" &&
        !isTyping(event)
      ) {

        if (
          currentTopicIndex >= 0 &&
          currentTopicIndex <
            topics.length - 1
        ) {

          event.preventDefault();

          goToNext();

        }

      }

    }
  );

}


/* =========================================================
   TYPING CHECK
   ========================================================= */

function isTyping(event) {

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
   LOADING
   ========================================================= */

function showLoading() {

  if (!content) {
    return;
  }


  content.innerHTML = `

    <div class="loading">

      <div class="loading-line"></div>

      <div class="loading-line short"></div>

      <div class="loading-line"></div>

    </div>

  `;


  content.classList.remove(
    "note-loaded"
  );

}


function showLoadingSidebar() {

  if (!topicNavigation) {
    return;
  }


  topicNavigation.innerHTML = `

    <div class="no-results">
      Loading concepts...
    </div>

  `;

}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function showMessage(
  title,
  message
) {

  if (!content) {
    return;
  }


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

  if (!content) {
    return;
  }


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
/* check box logic */
/* =========================================================
   DAILY REVISION CHECKLIST
   ========================================================= */

const DAILY_REVISION_FILE = "1CheatSheet.md";
const DAILY_REVISION_TIMEZONE = "Asia/Kolkata";
const DAILY_REVISION_STORAGE_PREFIX = "xi-notes-daily:";

function getDailyRevisionDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_REVISION_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function getDailyRevisionStorageKey(heading) {
  return (
    DAILY_REVISION_STORAGE_PREFIX +
    heading.id
  );
}

function getDailyRevisionState(heading) {
  const key = getDailyRevisionStorageKey(heading);

  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return false;
    }

    const data = JSON.parse(saved);

    if (
      !data ||
      data.date !== getDailyRevisionDate()
    ) {
      localStorage.removeItem(key);
      return false;
    }

    return data.checked === true;

  } catch (error) {
    console.warn(
      "Could not read daily revision state:",
      error
    );

    return false;
  }
}

function setDailyRevisionState(heading, checked) {
  const key = getDailyRevisionStorageKey(heading);

  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        date: getDailyRevisionDate(),
        checked: checked
      })
    );

  } catch (error) {
    console.warn(
      "Could not save daily revision state:",
      error
    );
  }
}


/*
 * Get all checklist headings.
 */
function getDailyRevisionHeadings() {

  if (!content) {
    return [];
  }

  return Array.from(
    content.querySelectorAll(
      "h1, h2, h3, h4, h5, h6"
    )
  ).filter(
    heading => heading.id
  );
}


/*
 * Apply/remove strike-through from the
 * heading and everything belonging to it.
 */
function updateDailyRevisionSection(
  heading,
  checked
) {

  const headingLevel =
    Number(
      heading.tagName.substring(1)
    );

  let current =
    heading.nextElementSibling;

  const elements = [];


  while (current) {

    /*
     * Stop when we reach another heading
     * of the same or higher level.
     */
    if (
      /^H[1-6]$/.test(
        current.tagName
      )
    ) {

      const currentLevel =
        Number(
          current.tagName.substring(1)
        );

      if (
        currentLevel <= headingLevel
      ) {
        break;
      }
    }


    elements.push(current);

    current =
      current.nextElementSibling;
  }


  /*
   * Include the heading itself.
   */
  heading.classList.toggle(
    "daily-revision-completed",
    checked
  );


  /*
   * Strike the complete section.
   */
  elements.forEach(
    element => {

      element.classList.toggle(
        "daily-revision-completed-content",
        checked
      );

    }
  );
}


/*
 * Update the calendar/date indicator.
 */
function updateDailyRevisionCalendar() {

  const calendar =
    document.querySelector(
      ".daily-revision-calendar"
    );

  if (!calendar) {
    return;
  }


  const headings =
    getDailyRevisionHeadings();


  const completed =
    headings.filter(
      heading =>
        getDailyRevisionState(
          heading
        )
    ).length;


  const total =
    headings.length;


  const allCompleted =
    total > 0 &&
    completed === total;


  const date =
    getDailyRevisionDate();


  /*
   * Convert YYYY-MM-DD into a compact
   * readable date.
   */
  const parts =
    date.split("-");


  const displayDate =
    `${parts[2]}/${parts[1]}`;


  calendar.textContent =
    `▣ ${displayDate}`;


  calendar.classList.toggle(
    "daily-revision-day-complete",
    allCompleted
  );


  calendar.title =
    allCompleted
      ? `All topics completed for ${date}`
      : `${completed}/${total} topics completed today`;

}
/* =========================================================
   CREATE DAILY CHECKBOXES
   ========================================================= */

function addDailyRevisionCheckboxes(topic) {

  if (
    !content ||
    !topic ||
    topic.file !== DAILY_REVISION_FILE
  ) {
    return;
  }


  const headings =
    getDailyRevisionHeadings();


  headings.forEach(
    heading => {

      /*
       * Prevent duplicates.
       */
      if (
        heading.querySelector(
          ".daily-revision-checkbox"
        )
      ) {
        return;
      }


      const headingText =
        heading.textContent.trim();


      if (!headingText) {
        return;
      }


      /*
       * Checkbox.
       */
      const checkbox =
        document.createElement(
          "input"
        );


      checkbox.type =
        "checkbox";

      checkbox.className =
        "daily-revision-checkbox";


      checkbox.setAttribute(
        "aria-label",
        `Mark ${headingText} as read today`
      );


      checkbox.title =
        "Read today";


      /*
       * Restore today's state.
       */
      checkbox.checked =
        getDailyRevisionState(
          heading
        );


      /*
       * Insert checkbox BEFORE
       * the heading text.
       *
       * Example:
       *
       * ☐ OVERFITTING
       */
      heading.insertBefore(
        checkbox,
        heading.firstChild
      );


      /*
       * Apply initial strike-through.
       */
      updateDailyRevisionSection(
        heading,
        checkbox.checked
      );


      /*
       * Handle clicking.
       */
      checkbox.addEventListener(
        "click",
        event => {

          /*
           * Don't let the checkbox click
           * trigger any heading behavior.
           */
          event.stopPropagation();

        }
      );


      checkbox.addEventListener(
        "change",
        () => {

          const checked =
            checkbox.checked;


          setDailyRevisionState(
            heading,
            checked
          );


          updateDailyRevisionSection(
            heading,
            checked
          );


          updateDailyRevisionCalendar();

        }
      );

    }
  );


  /*
   * Add the small calendar indicator.
   */
  addDailyRevisionCalendar();


  /*
   * Calculate initial state.
   */
  updateDailyRevisionCalendar();

}


/*
 * Create the calendar indicator.
 */
function addDailyRevisionCalendar() {

  /*
   * Don't create it twice.
   */
  if (
    document.querySelector(
      ".daily-revision-calendar"
    )
  ) {
    return;
  }


  const calendar =
    document.createElement(
      "div"
    );


  calendar.className =
    "daily-revision-calendar";


  calendar.setAttribute(
    "aria-label",
    "Daily revision status"
  );


  /*
   * Put it at the top-right of the
   * rendered note.
   */
  if (content) {

    content.prepend(
      calendar
    );

  }

}
/* =========================================================
   MIDNIGHT RESET + CONNECT TO EXISTING LOADER
   ========================================================= */


/*
 * Reload the current note after the
 * IST calendar date changes.
 */
function resetDailyRevisionAtMidnight() {

  if (
    typeof currentTopicIndex ===
      "undefined" ||
    typeof topics ===
      "undefined"
  ) {
    return;
  }


  if (
    currentTopicIndex < 0 ||
    !topics[currentTopicIndex]
  ) {
    return;
  }


  const currentTopic =
    topics[currentTopicIndex];


  if (
    currentTopic.file !==
    DAILY_REVISION_FILE
  ) {
    return;
  }


  loadMarkdown(
    currentTopic,
    false
  );

}


/*
 * Watch for IST midnight.
 */
function setupDailyRevisionMidnightWatcher() {

  let lastDate =
    getDailyRevisionDate();


  window.setInterval(
    () => {

      const currentDate =
        getDailyRevisionDate();


      if (
        currentDate ===
        lastDate
      ) {
        return;
      }


      lastDate =
        currentDate;


      resetDailyRevisionAtMidnight();

    },
    30 * 1000
  );

}


/*
 * Start the midnight watcher once.
 */
document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupDailyRevisionMidnightWatcher();

  }
);


/* =========================================================
   WRAP EXISTING MARKDOWN LOADER
   ========================================================= */


/*
 * Keep the original loadMarkdown()
 * completely intact.
 */
const xiNotesOriginalLoadMarkdown =
  loadMarkdown;


/*
 * Run the existing application first,
 * then add our checklist.
 */
loadMarkdown =
  async function (
    topic,
    scrollToTop = true
  ) {

    await xiNotesOriginalLoadMarkdown(
      topic,
      scrollToTop
    );


    /*
     * Only 1CheatSheet.md gets
     * the daily checklist.
     */
    if (
      !topic ||
      topic.file !==
        DAILY_REVISION_FILE
    ) {
      return;
    }


    addDailyRevisionCheckboxes(
      topic
    );

  };
