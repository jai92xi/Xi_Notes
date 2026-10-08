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
let sidebarWasCollapsedBeforeMobile = false;
let progressIndicator;

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
  setupMathJax();

  setupTheme();
  setupSearch();
  setupKeyboardShortcuts();
  setupContentsToggle();
  setupMobileMenu();
  setupTopNavigation();
  setupProgressIndicator();

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
   MATHJAX
   ========================================================= */

function setupMathJax() {

  window.MathJax = window.MathJax || {

    tex: {
      inlineMath: [
        ["$", "$"],
        ["\\(", "\\)"]
      ],
      displayMath: [
        ["$$", "$$"],
        ["\\[", "\\]"]
      ]
    },

    options: {
      skipHtmlTags: [
        "script",
        "noscript",
        "style",
        "textarea",
        "pre",
        "code"
      ]
    }

  };

  if (
    typeof window.MathJax.typesetPromise ===
    "function"
  ) {
    return;
  }

  if (
    document.querySelector(
      'script[data-xi-mathjax="true"]'
    )
  ) {
    return;
  }

  const script =
    document.createElement("script");

  script.src =
    "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";

  script.async = true;
  script.dataset.xiMathjax = "true";

  script.onload = () => {
    typesetMath();
  };

  document.head.appendChild(script);

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
          ${escapeHTML(topic.name.toUpperCase())}
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
    typesetMath();


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
   MATH RENDERING
   ========================================================= */

function typesetMath() {

  if (!content) {
    return;
  }

  if (
    typeof window.MathJax === "undefined"
  ) {
    return;
  }

  const typeset =
    window.MathJax.typesetPromise;

  if (typeof typeset !== "function") {
    return;
  }

  typeset.call(
    window.MathJax,
    [content]
  ).catch(
    error => {
      console.warn(
        "MathJax rendering failed:",
        error
      );
    }
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

    sidebarWasCollapsedBeforeMobile =
      sidebar.classList.contains("contents-hidden");

    /*
     * On mobile, the contents list must remain visible even if
     * the desktop sidebar was previously collapsed.
     */
    sidebar.classList.remove("contents-hidden");

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

    if (sidebarWasCollapsedBeforeMobile) {

      sidebar.classList.add("contents-hidden");

    }

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
/* JAGS - checkbox logic */

/* =========================================================
   DAILY REVISION TRACKER
   GitHub-style monthly calendar
   ========================================================= */

const DAILY_REVISION_FILE = "1CheatSheet.md";
const DAILY_REVISION_TIMEZONE = "Asia/Kolkata";
const DAILY_REVISION_STORAGE_PREFIX = "xi-notes-daily:";


/* =========================================================
   DATE HELPERS
   ========================================================= */

function getDailyRevisionDate() {

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: DAILY_REVISION_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(new Date());

}


function parseDailyRevisionDate(dateString) {

  const [year, month, day] =
    dateString.split("-").map(Number);

  return {
    year,
    month,
    day
  };

}


/* =========================================================
   HEADING / STORAGE
   ========================================================= */

function getDailyRevisionStorageKey(heading) {

  return (
    DAILY_REVISION_STORAGE_PREFIX +
    heading.id
  );

}


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
 * Store history like:
 *
 * {
 *   history: {
 *     "2026-10-01": true,
 *     "2026-10-02": false,
 *     "2026-10-05": true
 *   }
 * }
 */
function getDailyRevisionHistory(heading) {

  const key =
    getDailyRevisionStorageKey(
      heading
    );

  try {

    const saved =
      localStorage.getItem(key);

    if (!saved) {
      return {};
    }

    const data =
      JSON.parse(saved);

    return (
      data &&
      data.history
        ? data.history
        : {}
    );

  } catch (error) {

    console.error(
      "Failed to read revision history:",
      error
    );

    return {};

  }

}


function saveDailyRevisionHistory(
  heading,
  history
) {

  const key =
    getDailyRevisionStorageKey(
      heading
    );

  try {

    localStorage.setItem(
      key,
      JSON.stringify({
        history
      })
    );

  } catch (error) {

    console.error(
      "Failed to save revision history:",
      error
    );

  }

}


/* =========================================================
   TODAY STATE
   ========================================================= */

function getDailyRevisionState(
  heading
) {

  const history =
    getDailyRevisionHistory(
      heading
    );

  const today =
    getDailyRevisionDate();

  return (
    history[today] === true
  );

}


function setDailyRevisionState(
  heading,
  checked
) {

  const history =
    getDailyRevisionHistory(
      heading
    );

  const today =
    getDailyRevisionDate();

  history[today] =
    checked === true;

  saveDailyRevisionHistory(
    heading,
    history
  );

}


/* =========================================================
   TODAY STATS
   ========================================================= */

function getTodayRevisionStats() {

  const headings =
    getDailyRevisionHeadings();

  let completed = 0;

  headings.forEach(
    heading => {

      if (
        getDailyRevisionState(
          heading
        )
      ) {

        completed++;

      }

    }
  );


  return {
    completed,
    total: headings.length
  };

}


/* =========================================================
   REVISION CHECKBOXES
   ========================================================= */

function updateDailyRevisionSection(
  heading,
  checked
) {

  const section =
    heading.parentElement;


  if (!section) {
    return;
  }


  section.classList.toggle(
    "revision-completed",
    checked
  );

}


function setupDailyRevisionCheckboxes() {

  if (!content) {
    return;
  }


  const headings =
    getDailyRevisionHeadings();


  headings.forEach(
    heading => {

      if (
        heading.querySelector(
          ".revision-checkbox"
        )
      ) {

        return;

      }


      const checkbox =
        document.createElement(
          "input"
        );


      checkbox.type =
        "checkbox";

      checkbox.className =
        "revision-checkbox";

      checkbox.checked =
        getDailyRevisionState(
          heading
        );

      checkbox.setAttribute(
        "aria-label",
        `Mark ${heading.textContent.trim()} as completed`
      );


      heading.insertBefore(
        checkbox,
        heading.firstChild
      );


      updateDailyRevisionSection(
        heading,
        checkbox.checked
      );


      checkbox.addEventListener(
        "click",
        event => {

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


  addDailyRevisionCalendar();

}


/* =========================================================
   MIDNIGHT IST RESET
   ========================================================= */

function resetDailyRevisionAtMidnight() {

  const now =
    new Date();


  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          DAILY_REVISION_TIMEZONE,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit"
      }
    );


  const today =
    formatter.format(now);


  const delay =
    getMillisecondsUntilNextDay(
      today
    );


  setTimeout(
    () => {

      if (content) {

        setupDailyRevisionCheckboxes();

      }


      resetDailyRevisionAtMidnight();

    },
    delay
  );

}


function getMillisecondsUntilNextDay(
  dateString
) {

  const {
    year,
    month,
    day
  } =
    parseDailyRevisionDate(
      dateString
    );


  const nextDay =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day + 1,
        0,
        0,
        0
      )
    );


  const now =
    new Date();


  const nowParts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          DAILY_REVISION_TIMEZONE,

        year:
          "numeric",

        month:
          "numeric",

        day:
          "numeric",

        hour:
          "numeric",

        minute:
          "numeric",

        second:
          "numeric",

        hour12:
          false
      }
    ).formatToParts(now);


  const values = {};


  nowParts.forEach(
    part => {

      if (
        part.type !== "literal"
      ) {

        values[part.type] =
          Number(part.value);

      }

    }
  );


  const currentIST =
    Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second
    );


  const targetIST =
    Date.UTC(
      year,
      month - 1,
      day + 1,
      0,
      0,
      0
    );


  const delay =
    targetIST -
    currentIST;


  return Math.max(
    delay,
    1000
  );

}


/* =========================================================
   DAILY CALENDAR
   ========================================================= */

function addDailyRevisionCalendar() {

  const calendar =
    document.getElementById(
      "daily-revision-calendar"
    );

  if (!calendar) {
    return;
  }


  updateDailyRevisionCalendar();

}


function updateDailyRevisionCalendar() {

  const calendar =
    document.getElementById(
      "daily-revision-calendar"
    );

  if (!calendar) {
    return;
  }


  calendar.innerHTML = "";


  const headings =
    getDailyRevisionHeadings();


  if (headings.length === 0) {
    return;
  }


  const today =
    getDailyRevisionDate();


  const {
    year,
    month
  } =
    parseDailyRevisionDate(
      today
    );


  const firstDay =
    new Date(
      year,
      month - 1,
      1
    );


  const daysInMonth =
    new Date(
      year,
      month,
      0
    ).getDate();


  const title =
    document.createElement(
      "div"
    );


  title.className =
    "revision-calendar-title";

  title.textContent =
    firstDay.toLocaleString(
      "en-US",
      {
        month: "long",
        year: "numeric"
      }
    );


  calendar.appendChild(
    title
  );


  const grid =
    document.createElement(
      "div"
    );


  grid.className =
    "revision-calendar-grid";


  const firstWeekday =
    firstDay.getDay();


  for (
    let i = 0;
    i < firstWeekday;
    i++
  ) {

    const empty =
      document.createElement(
        "span"
      );

    empty.className =
      "revision-calendar-empty";

    grid.appendChild(
      empty
    );

  }


  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const cell =
      document.createElement(
        "span"
      );

    cell.className =
      "revision-calendar-day";


    const date =
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


    const completed =
      headings.some(
        heading => {

          const history =
            getDailyRevisionHistory(
              heading
            );

          return (
            history[date] === true
          );

        }
      );


    if (completed) {

      cell.classList.add(
        "completed"
      );

    }


    if (date === today) {

      cell.classList.add(
        "today"
      );

    }


    cell.textContent =
      day;


    grid.appendChild(
      cell
    );

  }


  calendar.appendChild(
    grid
  );

}


/* =========================================================
   DAILY REVISION INITIALIZATION
   ========================================================= */

function initializeDailyRevision() {

  setupDailyRevisionCheckboxes();

  resetDailyRevisionAtMidnight();

}
function wasDailyRevisionCompleted(
  heading,
  date
) {

  const history =
    getDailyRevisionHistory(
      heading
    );

  return history[date] === true;

}


function getDailyRevisionState(
  heading
) {

  return wasDailyRevisionCompleted(
    heading,
    getDailyRevisionDate()
  );

}


function setDailyRevisionState(
  heading,
  checked
) {

  const key =
    getDailyRevisionStorageKey(
      heading
    );

  try {

    const history =
      getDailyRevisionHistory(
        heading
      );

    history[
      getDailyRevisionDate()
    ] = checked;


    localStorage.setItem(
      key,
      JSON.stringify({
        history
      })
    );

  } catch (error) {

    console.warn(
      "Could not save revision state:",
      error
    );

  }

}


/* =========================================================
   COMPLETED SECTION
   ========================================================= */

function updateDailyRevisionSection(
  heading,
  checked
) {

  const headingLevel =
    Number(
      heading.tagName.substring(1)
    );


  heading.classList.toggle(
    "daily-revision-completed",
    checked
  );


  let current =
    heading.nextElementSibling;


  while (current) {

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
        currentLevel <=
        headingLevel
      ) {

        break;

      }

    }


    current.classList.toggle(
      "daily-revision-completed-content",
      checked
    );


    current =
      current.nextElementSibling;

  }

}


/* =========================================================
   TODAY'S PROGRESS
   ========================================================= */

function getTodayRevisionStats() {

  const headings =
    getDailyRevisionHeadings();

  const total =
    headings.length;


  const completed =
    headings.filter(
      heading =>
        getDailyRevisionState(
          heading
        )
    ).length;


  return {
    total,
    completed,
    allCompleted:
      total > 0 &&
      completed === total
  };

}


/* =========================================================
   CURRENT STREAK
   ========================================================= */

function getCurrentRevisionStreak() {

  const today =
    parseDailyRevisionDate(
      getDailyRevisionDate()
    );


  let streak = 0;


  /*
   * If today isn't complete, the current
   * streak is zero.
   */
  if (
    !isRevisionDayComplete(
      getDailyRevisionDate()
    )
  ) {

    return 0;

  }


  let date =
    new Date(
      today.year,
      today.month - 1,
      today.day
    );


  while (true) {

    const dateString =
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(
        date.getDate()
      ).padStart(2, "0")}`;


    if (
      !isRevisionDayComplete(
        dateString
      )
    ) {

      break;

    }


    streak++;


    date.setDate(
      date.getDate() - 1
    );

  }


  return streak;

}


/* =========================================================
   CHECK WHETHER AN ENTIRE DAY WAS COMPLETED
   ========================================================= */

function isRevisionDayComplete(
  date
) {

  const headings =
    getDailyRevisionHeadings();


  if (
    headings.length === 0
  ) {

    return false;

  }


  return headings.every(
    heading =>
      wasDailyRevisionCompleted(
        heading,
        date
      )
  );

}


/* =========================================================
   MONTHLY CALENDAR
   ========================================================= */

function getCurrentMonthInfo() {

  const today =
    parseDailyRevisionDate(
      getDailyRevisionDate()
    );


  const firstDay =
    new Date(
      today.year,
      today.month - 1,
      1
    );


  const lastDay =
    new Date(
      today.year,
      today.month,
      0
    );


  return {
    year: today.year,
    month: today.month,
    days: lastDay.getDate(),
    firstWeekday: firstDay.getDay()
  };

}


/* =========================================================
   CALENDAR UI
   ========================================================= */

function addDailyRevisionCalendar() {

  /*
   * Calendar code is retained so the existing
   * revision/storage logic is not changed.
   * The calendar is no longer invoked.
   */

  const old =
    document.querySelector(
      ".daily-revision-panel"
    );


  if (old) {
    old.remove();
  }


  const panel =
    document.createElement(
      "aside"
    );


  panel.className =
    "daily-revision-panel";


  panel.setAttribute(
    "aria-label",
    "Daily revision tracker"
  );


  document.body.appendChild(
    panel
  );


  updateDailyRevisionCalendar();

}


function updateDailyRevisionCalendar() {

  const panel =
    document.querySelector(
      ".daily-revision-panel"
    );


  if (!panel) {
    return;
  }


  panel.innerHTML = "";


  const {
    year,
    month,
    days,
    firstWeekday
  } =
    getCurrentMonthInfo();


  const header =
    document.createElement(
      "div"
    );


  header.className =
    "daily-revision-panel-header";


  const monthName =
    new Intl.DateTimeFormat(
      "en-IN",
      {
        timeZone:
          DAILY_REVISION_TIMEZONE,

        month: "long",

        year: "numeric"
      }
    ).format(
      new Date(
        year,
        month - 1,
        1
      )
    );


  header.innerHTML = `
    <span>${monthName}</span>
  `;


  panel.appendChild(
    header
  );


  const stats =
    getTodayRevisionStats();


  const streak =
    getCurrentRevisionStreak();


  const statsBox =
    document.createElement(
      "div"
    );


  statsBox.className =
    "daily-revision-stats";


  statsBox.innerHTML = `
    <div class="daily-stat">
      <strong>${stats.completed}/${stats.total}</strong>
      <span>today</span>
    </div>

    <div class="daily-stat">
      <strong>${streak}</strong>
      <span>day streak</span>
    </div>
  `;


  panel.appendChild(
    statsBox
  );


  const weekdays =
    document.createElement(
      "div"
    );


  weekdays.className =
    "daily-revision-weekdays";


  [
    "S",
    "M",
    "T",
    "W",
    "T",
    "F",
    "S"
  ].forEach(
    day => {

      const item =
        document.createElement(
          "span"
        );

      item.textContent =
        day;

      weekdays.appendChild(
        item
      );

    }
  );


  panel.appendChild(
    weekdays
  );


  const grid =
    document.createElement(
      "div"
    );


  grid.className =
    "daily-revision-calendar-grid";


  for (
    let i = 0;
    i < firstWeekday;
    i++
  ) {

    const empty =
      document.createElement(
        "span"
      );

    empty.className =
      "daily-revision-day empty";

    grid.appendChild(
      empty
    );

  }


  const today =
    getDailyRevisionDate();


  const todayParts =
    parseDailyRevisionDate(
      today
    );


  const todayValue =
    new Date(
      todayParts.year,
      todayParts.month - 1,
      todayParts.day
    );


  for (
    let day = 1;
    day <= days;
    day++
  ) {

    const date =
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


    const cell =
      document.createElement(
        "span"
      );


    cell.className =
      "daily-revision-day";


    cell.textContent =
      day;


    const dateValue =
      new Date(
        year,
        month - 1,
        day
      );


    const completed =
      isRevisionDayComplete(
        date
      );


    if (completed) {

      cell.classList.add(
        "completed"
      );

    }


    if (
      date === today
    ) {

      cell.classList.add(
        "today"
      );

    }


    if (
      dateValue > todayValue
    ) {

      cell.classList.add(
        "future"
      );

    }


    cell.title =
      completed
        ? `${date} — Completed`
        : `${date} — Not completed`;


    grid.appendChild(
      cell
    );

  }


  panel.appendChild(
    grid
  );


  const legend =
    document.createElement(
      "div"
    );


  legend.className =
    "daily-revision-legend";


  legend.innerHTML = `
    <span>
      <i class="legend-box"></i>
      completed
    </span>

    <span>
      <i class="legend-box legend-today"></i>
      today
    </span>
  `;


  panel.appendChild(
    legend
  );

}


/* =========================================================
   ADD CHECKBOXES TO 1CheatSheet.md
   ========================================================= */

function addDailyRevisionCheckboxes(
  topic
) {

  if (
    !content ||
    !topic ||
    topic.file !==
      DAILY_REVISION_FILE
  ) {

    return;

  }


  const headings =
    getDailyRevisionHeadings();


  headings.forEach(
    heading => {

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


      checkbox.checked =
        getDailyRevisionState(
          heading
        );


      /*
       * Checkbox BEFORE heading.
       */
      heading.insertBefore(
        checkbox,
        heading.firstChild
      );


      updateDailyRevisionSection(
        heading,
        checkbox.checked
      );


      checkbox.addEventListener(
        "click",
        event => {

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


          /*
           * Calendar UI is replaced by
           * the completion indicator.
           */
          updateProgressIndicator();

        }
      );

    }
  );


  /*
   * Do not create the old calendar.
   */
  updateProgressIndicator();

}


/* =========================================================
   MIDNIGHT IST RESET
   ========================================================= */

function resetDailyRevisionAtMidnight() {

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


/* =========================================================
   CONNECT TO EXISTING loadMarkdown()
   ========================================================= */

const xiNotesOriginalLoadMarkdown =
  loadMarkdown;


loadMarkdown =
  async function (
    topic,
    scrollToTop = true
  ) {

    /*
     * Run original application first.
     */
    await xiNotesOriginalLoadMarkdown(
      topic,
      scrollToTop
    );


    /*
     * Only 1CheatSheet.md.
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


/* =========================================================
   START TRACKER
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupDailyRevisionMidnightWatcher();

  }
);
