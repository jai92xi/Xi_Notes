/* =========================================================
   AI & ML KEY CONCEPTS
   app.js — PART 1 OF 2
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

  progressIndicator =
    document.getElementById("progress-indicator");

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

  script.dataset.xiMathjax =
    "true";

  script.onload = () => {

    typesetMath();

  };

  document.head.appendChild(
    script
  );

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

            url:
              file.download_url

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


    createSidebar(
      topics
    );


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

  topicNavigation.innerHTML =
    "";


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

      button.type =
        "button";

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
          ${escapeHTML(
            topic.name.toUpperCase()
          )}
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


    updateURL(
      topic
    );

    updateTopNavigation();


    const markdownURL =
      getMarkdownURL(
        topic
      );


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
      marked.parse(
        markdown
      );


    content.classList.add(
      "note-loaded"
    );


    fixMarkdownImages();

    addHeadingIds();

    addCopyButtons();

    setupExternalLinks();

    replaceConceptHeading();

    normalizeCodeBlocks();

    typesetMath();

    updateActiveTopic(
      topic
    );

    updateTopNavigation();


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
    `${encodeURIComponent(
      topic.file
    )}`
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
    typeof window.MathJax ===
    "undefined"
  ) {

    return;

  }

  const typeset =
    window.MathJax.typesetPromise;

  if (
    typeof typeset !==
    "function"
  ) {

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


/* =========================================================
   CONTENTS TOGGLE
   ========================================================= */

function setupContentsToggle() {

  if (
    !contentsToggle ||
    !sidebar
  ) {

    return;

  }


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


  contentsToggle.addEventListener(
    "click",
    event => {

      event.preventDefault();


      sidebar.classList.toggle(
        "contents-hidden"
      );


      const hidden =
        sidebar.classList.contains(
          "contents-hidden"
        );


      contentsToggle.classList.toggle(
        "collapsed",
        hidden
      );


      contentsToggle.setAttribute(
        "aria-expanded",
        hidden
          ? "false"
          : "true"
      );


      contentsToggle.setAttribute(
        "aria-label",
        hidden
          ? "Show contents"
          : "Hide contents"
      );


      contentsToggle.setAttribute(
        "title",
        hidden
          ? "Show contents"
          : "Hide contents"
      );

    }
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
      sidebar.classList.contains(
        "contents-hidden"
      );


    sidebar.classList.remove(
      "contents-hidden"
    );


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


    if (
      sidebarWasCollapsedBeforeMobile
    ) {

      sidebar.classList.add(
        "contents-hidden"
      );

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
        heading.textContent.trim();


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
/* =========================================================
   PART 2 — DAILY REVISION TRACKER
   Append this directly after Part 1
   ========================================================= */

/*
 * IMPORTANT:
 * This section replaces the duplicated/older
 * daily-revision code from the original app.js.
 *
 * It provides:
 * - Daily checkboxes only for 1CheatSheet.md
 * - Per-heading completion history
 * - IST date handling
 * - Current-day completion
 * - Current streak
 * - Monthly GitHub-style calendar
 * - Automatic refresh at midnight IST
 * - Progress indicator updates
 */


/* =========================================================
   DAILY REVISION CONFIG
   ========================================================= */

const DAILY_REVISION_FILE = "1CheatSheet.md";

const DAILY_REVISION_TIMEZONE = "Asia/Kolkata";

const DAILY_REVISION_STORAGE_PREFIX =
  "xi-notes-daily:";


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

  const [
    year,
    month,
    day
  ] =
    dateString
      .split("-")
      .map(Number);


  return {
    year,
    month,
    day
  };

}


/* =========================================================
   REVISION HEADINGS
   ========================================================= */

function getDailyRevisionHeadings() {

  if (!content) {
    return [];
  }


  return Array.from(
    content.querySelectorAll(
      "h1, h2, h3, h4, h5, h6"
    )
  ).filter(
    heading => {

      return Boolean(
        heading.id
      );

    }
  );

}


/* =========================================================
   STORAGE
   ========================================================= */

function getDailyRevisionStorageKey(
  heading
) {

  return (
    DAILY_REVISION_STORAGE_PREFIX +
    heading.id
  );

}


function getDailyRevisionHistory(
  heading
) {

  const key =
    getDailyRevisionStorageKey(
      heading
    );


  try {

    const saved =
      localStorage.getItem(
        key
      );


    if (!saved) {
      return {};
    }


    const data =
      JSON.parse(
        saved
      );


    if (
      !data ||
      typeof data.history !== "object"
    ) {

      return {};

    }


    return data.history;

  } catch (error) {

    console.warn(
      "Could not read revision history:",
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

    console.warn(
      "Could not save revision history:",
      error
    );

  }

}


/* =========================================================
   DATE-SPECIFIC STATE
   ========================================================= */

function wasDailyRevisionCompleted(
  heading,
  date
) {

  const history =
    getDailyRevisionHistory(
      heading
    );


  return (
    history[date] === true
  );

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

    /*
     * Stop when another heading at the
     * same or higher level is reached.
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
   COMPLETE DAY CHECK
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
   CURRENT STREAK
   ========================================================= */

function getCurrentRevisionStreak() {

  const todayString =
    getDailyRevisionDate();


  if (
    !isRevisionDayComplete(
      todayString
    )
  ) {

    return 0;

  }


  const today =
    parseDailyRevisionDate(
      todayString
    );


  /*
   * Use a calendar date rather than
   * the browser's local timezone.
   */
  let date =
    new Date(
      Date.UTC(
        today.year,
        today.month - 1,
        today.day
      )
    );


  let streak = 0;


  while (true) {

    const year =
      date.getUTCFullYear();


    const month =
      date.getUTCMonth() + 1;


    const day =
      date.getUTCDate();


    const dateString =
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


    if (
      !isRevisionDayComplete(
        dateString
      )
    ) {

      break;

    }


    streak++;


    date.setUTCDate(
      date.getUTCDate() - 1
    );

  }


  return streak;

}


/* =========================================================
   CHECKBOX SETUP
   ========================================================= */

function addDailyRevisionCheckboxes(
  topic
) {

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
       * Prevent duplicate checkboxes
       * if this function is called again.
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


      const checkbox =
        document.createElement(
          "input"
        );


      checkbox.type =
        "checkbox";


      checkbox.className =
        "daily-revision-checkbox";


      checkbox.checked =
        getDailyRevisionState(
          heading
        );


      checkbox.setAttribute(
        "aria-label",
        `Mark ${headingText} as read today`
      );


      checkbox.title =
        "Read today";


      /*
       * Put checkbox before the
       * heading text.
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


          updateDailyRevisionCalendar();

          updateProgressIndicator();

        }
      );

    }
  );


  updateDailyRevisionCalendar();

  updateProgressIndicator();

}


/* =========================================================
   MONTH INFORMATION
   ========================================================= */

function getCurrentMonthInfo() {

  const today =
    parseDailyRevisionDate(
      getDailyRevisionDate()
    );


  const firstDay =
    new Date(
      Date.UTC(
        today.year,
        today.month - 1,
        1
      )
    );


  const lastDay =
    new Date(
      Date.UTC(
        today.year,
        today.month,
        0
      )
    );


  return {

    year: today.year,

    month: today.month,

    days:
      lastDay.getUTCDate(),

    firstWeekday:
      firstDay.getUTCDay()

  };

}


/* =========================================================
   DAILY REVISION CALENDAR
   ========================================================= */

function addDailyRevisionCalendar() {

  let panel =
    document.querySelector(
      ".daily-revision-panel"
    );


  if (!panel) {

    panel =
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

  }


  updateDailyRevisionCalendar();

}


function updateDailyRevisionCalendar() {

  let panel =
    document.querySelector(
      ".daily-revision-panel"
    );


  if (!panel) {

    addDailyRevisionCalendar();

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


  const monthDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        1
      )
    );


  const monthName =
    new Intl.DateTimeFormat(
      "en-US",
      {
        month: "long",
        year: "numeric",
        timeZone: "UTC"
      }
    ).format(
      monthDate
    );


  /*
   * Header
   */
  const header =
    document.createElement(
      "div"
    );


  header.className =
    "daily-revision-panel-header";


  header.innerHTML = `
    <span>${escapeHTML(monthName)}</span>
  `;


  panel.appendChild(
    header
  );


  /*
   * Statistics
   */
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

      <strong>
        ${stats.completed}/${stats.total}
      </strong>

      <span>
        today
      </span>

    </div>


    <div class="daily-stat">

      <strong>
        ${streak}
      </strong>

      <span>
        day streak
      </span>

    </div>

  `;


  panel.appendChild(
    statsBox
  );


  /*
   * Weekday labels
   */
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


  /*
   * Calendar grid
   */
  const grid =
    document.createElement(
      "div"
    );


  grid.className =
    "daily-revision-calendar-grid";


  /*
   * Empty cells before day 1.
   */
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
    Date.UTC(
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
      Date.UTC(
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


  /*
   * Legend
   */
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
   MIDNIGHT IST WATCHER
   ========================================================= */

function setupDailyRevisionMidnightWatcher() {

  let lastDate =
    getDailyRevisionDate();


  window.setInterval(
    () => {

      const currentDate =
        getDailyRevisionDate();


      if (
        currentDate === lastDate
      ) {

        return;

      }


      lastDate =
        currentDate;


      /*
       * A new IST day has started.
       *
       * Reload the note so all checkboxes
       * reflect the new day's state.
       */
      if (
        currentTopicIndex >= 0 &&
        topics[currentTopicIndex] &&
        topics[currentTopicIndex].file ===
          DAILY_REVISION_FILE
      ) {

        loadMarkdown(
          topics[currentTopicIndex],
          false
        );

      }

    },
    30 * 1000
  );

}


/* =========================================================
   PROGRESS INDICATOR
   ========================================================= */

function updateProgressIndicator() {

  /*
   * Use the existing progress indicator
   * if the main application provides one.
   */
  if (
    !progressIndicator
  ) {

    progressIndicator =
      document.getElementById(
        "progress-indicator"
      );

  }


  const stats =
    getTodayRevisionStats();


  /*
   * Only show revision progress for
   * 1CheatSheet.md.
   */
  const currentTopic =
    topics[currentTopicIndex];


  if (
    !currentTopic ||
    currentTopic.file !==
      DAILY_REVISION_FILE
  ) {

    return;

  }


  if (!progressIndicator) {
    return;
  }


  const percentage =
    stats.total > 0
      ? Math.round(
          (
            stats.completed /
            stats.total
          ) * 100
        )
      : 0;


  progressIndicator.textContent =
    `${stats.completed}/${stats.total} · ${percentage}%`;


  progressIndicator.setAttribute(
    "aria-label",
    `Today's revision progress: ${stats.completed} of ${stats.total} completed`
  );


  progressIndicator.dataset.progress =
    String(percentage);

}


/* =========================================================
   PATCH loadMarkdown
   ========================================================= */

/*
 * Save the application's original function.
 *
 * The main application can continue using the same
 * loadMarkdown() API while the tracker adds its
 * checkbox functionality afterward.
 */
const xiNotesOriginalLoadMarkdown =
  loadMarkdown;


loadMarkdown =
  async function (
    topic,
    scrollToTop = true
  ) {

    await xiNotesOriginalLoadMarkdown(
      topic,
      scrollToTop
    );


    if (
      !topic ||
      topic.file !== DAILY_REVISION_FILE
    ) {

      /*
       * Remove tracker panel when viewing
       * another note.
       */
      const panel =
        document.querySelector(
          ".daily-revision-panel"
        );


      if (panel) {
        panel.remove();
      }


      return;

    }


    addDailyRevisionCheckboxes(
      topic
    );


    addDailyRevisionCalendar();

  };


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupDailyRevisionMidnightWatcher();

  }
);


/* =========================================================
   SAFETY INITIALIZATION
   ========================================================= */

/*
 * If DOMContentLoaded has already fired before this
 * appended code executes, initialize immediately.
 */
if (
  document.readyState !== "loading"
) {

  /*
   * Do not duplicate the watcher.
   * The normal DOMContentLoaded handler above handles
   * the standard application startup path.
   */
}
