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

let progressIndicator;


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
    document.getElementById("revision-progress");

  configureMarkdown();
  setupMathJax();

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


    updateURL(topic);

    updateTopNavigation();


    /*
     * Revision progress must be hidden
     * immediately when leaving 1CheatSheet.
     */
    updateRevisionProgressVisibility(
      topic
    );


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


    replaceConceptHeading();

    normalizeCodeBlocks();

    typesetMath();


    /*
     * IMPORTANT:
     *
     * Revision checkboxes are added ONLY
     * for 1CheatSheet.md.
     */
    if (
      topic.file ===
      DAILY_REVISION_FILE
    ) {

      setupDailyRevisionCheckboxes();

    } else {

      hideRevisionProgress();

    }


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


    hideRevisionProgress();


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


  if (
    typeof typeset !== "function"
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
        source.startsWith("http://") ||
        source.startsWith("https://") ||
        source.startsWith("//") ||
        source.startsWith("data:") ||
        source.startsWith("blob:")
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


      const hidden =
        sidebar.classList.toggle(
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

let sidebarWasCollapsedBeforeMobile =
  false;


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
   DAILY REVISION TRACKER
   PART 2
   ========================================================= */

/*
 * IMPORTANT
 * ----------
 * This section works ONLY for:
 *
 *     1CheatSheet.md
 *
 * Do not add checkboxes to any other note.
 */

const DAILY_REVISION_FILE = "1CheatSheet.md";
const DAILY_REVISION_TIMEZONE = "Asia/Kolkata";
const DAILY_REVISION_STORAGE_PREFIX = "xi-notes-daily:";


/* =========================================================
   DAILY DATE
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


/* =========================================================
   CHECK WHETHER CURRENT NOTE IS 1CheatSheet
   ========================================================= */

function isDailyRevisionNote(topic = null) {

  if (topic) {

    return (
      topic.file === DAILY_REVISION_FILE
    );

  }


  if (
    currentTopicIndex >= 0 &&
    topics[currentTopicIndex]
  ) {

    return (
      topics[currentTopicIndex].file ===
      DAILY_REVISION_FILE
    );

  }


  return false;

}


/* =========================================================
   GET REVISION HEADINGS
   ========================================================= */

/*
 * Every heading in 1CheatSheet is treated as one
 * revision item.
 *
 * Example:
 *
 * # Topic A
 *     related content
 *
 * ## Topic B
 *     related content
 *
 * Each heading gets its own checkbox.
 */

function getDailyRevisionHeadings() {

  if (!content) {
    return [];
  }


  if (!isDailyRevisionNote()) {
    return [];
  }


  return Array.from(
    content.querySelectorAll(
      "h1, h2, h3, h4, h5, h6"
    )
  ).filter(
    heading => {

      /*
       * Ignore the main document title.
       */
      const text =
        heading.textContent
          .replace(
            /\s+/g,
            " "
          )
          .trim();


      return (
        text &&
        text !==
          "🧠 AI & ML Key Concepts" &&
        text !==
          "AI & ML Key Concepts" &&
        text !==
          "AI & ML Notes"
      );

    }
  );

}


/* =========================================================
   STORAGE KEY
   ========================================================= */

function getDailyRevisionStorageKey(
  heading
) {

  /*
   * Heading IDs are generated by addHeadingIds().
   *
   * This keeps each section's history separate.
   */

  return (
    DAILY_REVISION_STORAGE_PREFIX +
    DAILY_REVISION_FILE +
    ":" +
    heading.id
  );

}


/* =========================================================
   READ HISTORY
   ========================================================= */

function getDailyRevisionHistory(
  heading
) {

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


/* =========================================================
   SAVE HISTORY
   ========================================================= */

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
   CHECK CURRENT DAY
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


/* =========================================================
   SAVE CURRENT DAY
   ========================================================= */

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
   SECTION RANGE
   ========================================================= */

/*
 * Find everything belonging to a heading.
 *
 * Example:
 *
 * ## Topic
 * paragraph
 * image
 * code
 * paragraph
 *
 * All of that becomes green/struck-through
 * when Topic is checked.
 *
 * It stops when another heading of the same
 * or higher level is reached.
 */

function getDailyRevisionSectionElements(
  heading
) {

  const elements = [];


  const headingLevel =
    Number(
      heading.tagName.substring(1)
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


    elements.push(
      current
    );


    current =
      current.nextElementSibling;

  }


  return elements;

}


/* =========================================================
   APPLY GREEN + STRIKE
   ========================================================= */

function updateDailyRevisionSection(
  heading,
  checked
) {

  /*
   * Apply state to heading itself.
   */

  heading.classList.toggle(
    "daily-revision-completed",
    checked
  );


  /*
   * Apply state to all related content.
   */

  const elements =
    getDailyRevisionSectionElements(
      heading
    );


  elements.forEach(
    element => {

      element.classList.toggle(
        "daily-revision-completed-content",
        checked
      );

    }
  );

}


/* =========================================================
   COMPLETION COUNT
   ========================================================= */

function getTodayRevisionStats() {

  /*
   * Only 1CheatSheet.
   */

  if (
    !isDailyRevisionNote()
  ) {

    return {
      completed: 0,
      total: 0
    };

  }


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
   TOP BAR COMPLETION INDICATOR
   ========================================================= */

/*
 * IMPORTANT:
 *
 * This is deliberately NOT placed inside
 * the Contents/sidebar.
 *
 * It looks for an existing element first.
 *
 * If your HTML has:
 *
 *     <div id="revision-progress"></div>
 *
 * it will use that.
 *
 * Otherwise it creates one in the top bar.
 */

function getRevisionProgressElement() {

  let indicator =
    document.getElementById(
      "revision-progress"
    );


  if (indicator) {
    return indicator;
  }


  /*
   * Try common top-bar containers.
   */

  const topBar =
    document.querySelector(
      "#top-bar, .top-bar, .header, header, .navbar"
    );


  if (!topBar) {
    return null;
  }


  indicator =
    document.createElement(
      "div"
    );


  indicator.id =
    "revision-progress";


  indicator.className =
    "revision-progress";


  /*
   * Put it in the middle of the top bar.
   */

  topBar.appendChild(
    indicator
  );


  return indicator;

}


/* =========================================================
   UPDATE TOP BAR
   ========================================================= */

function updateProgressIndicator() {

  const indicator =
    getRevisionProgressElement();


  if (!indicator) {
    return;
  }


  /*
   * Hide completely for every note except
   * 1CheatSheet.md.
   */

  if (
    !isDailyRevisionNote()
  ) {

    indicator.textContent =
      "";

    indicator.style.display =
      "none";

    indicator.setAttribute(
      "aria-hidden",
      "true"
    );

    return;

  }


  const stats =
    getTodayRevisionStats();


  indicator.style.display =
    "flex";


  indicator.removeAttribute(
    "aria-hidden"
  );


  indicator.textContent =
    `${stats.completed}/${stats.total} completed`;


  indicator.setAttribute(
    "aria-label",
    `${stats.completed} of ${stats.total} completed today`
  );


  indicator.classList.toggle(
    "complete",
    stats.total > 0 &&
    stats.completed === stats.total
  );

}


/* =========================================================
   ADD CHECKBOXES
   ========================================================= */

function addDailyRevisionCheckboxes(
  topic
) {

  /*
   * HARD RESTRICTION:
   * only 1CheatSheet.md.
   */

  if (
    !content ||
    !topic ||
    topic.file !== DAILY_REVISION_FILE
  ) {

    updateProgressIndicator();

    return;

  }


  const headings =
    getDailyRevisionHeadings();


  headings.forEach(
    heading => {

      /*
       * Prevent duplicate checkbox.
       */

      if (
        heading.querySelector(
          ".daily-revision-checkbox"
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
        "daily-revision-checkbox";


      checkbox.checked =
        getDailyRevisionState(
          heading
        );


      checkbox.setAttribute(
        "aria-label",
        `Mark ${heading.textContent.trim()} as completed`
      );


      checkbox.title =
        "Mark completed";


      /*
       * Insert checkbox before heading text.
       */

      heading.insertBefore(
        checkbox,
        heading.firstChild
      );


      /*
       * Restore today's state.
       */

      updateDailyRevisionSection(
        heading,
        checkbox.checked
      );


      /*
       * Do not let clicking the checkbox
       * interfere with other heading behavior.
       */

      checkbox.addEventListener(
        "click",
        event => {

          event.stopPropagation();

        }
      );


      /*
       * Save + update UI.
       */

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
           * THIS updates:
           *
           * 0/0 completed
           * 1/8 completed
           * 2/8 completed
           * ...
           */

          updateProgressIndicator();

        }
      );

    }
  );


  /*
   * Initial count.
   */

  updateProgressIndicator();

}


/* =========================================================
   REMOVE DAILY CHECKBOXES
   ========================================================= */

/*
 * This protects against a checkbox accidentally
 * remaining when navigating away from 1CheatSheet.
 */

function removeDailyRevisionCheckboxes() {

  if (!content) {
    return;
  }


  const checkboxes =
    content.querySelectorAll(
      ".daily-revision-checkbox"
    );


  checkboxes.forEach(
    checkbox => {

      checkbox.remove();

    }
  );


  const completedHeadings =
    content.querySelectorAll(
      ".daily-revision-completed"
    );


  completedHeadings.forEach(
    heading => {

      heading.classList.remove(
        "daily-revision-completed"
      );

    }
  );


  const completedContent =
    content.querySelectorAll(
      ".daily-revision-completed-content"
    );


  completedContent.forEach(
    element => {

      element.classList.remove(
        "daily-revision-completed-content"
      );

    }
  );

}


/* =========================================================
   LOAD HOOK
   ========================================================= */

/*
 * We hook into the existing loadMarkdown().
 *
 * DO NOT create another loadMarkdown function.
 *
 * This wrapper runs AFTER the original markdown
 * rendering is complete.
 */

const xiNotesLoadMarkdown =
  loadMarkdown;


loadMarkdown =
  async function (
    topic,
    scrollToTop = true
  ) {

    await xiNotesLoadMarkdown(
      topic,
      scrollToTop
    );


    /*
     * Remove tracker UI first.
     *
     * This guarantees that moving from
     * 1CheatSheet -> another note cleans it up.
     */

    removeDailyRevisionCheckboxes();


    /*
     * Only activate tracker for 1CheatSheet.
     */

    if (
      topic &&
      topic.file === DAILY_REVISION_FILE
    ) {

      addDailyRevisionCheckboxes(
        topic
      );

    }


    /*
     * Always update the top bar.
     *
     * It hides itself for other notes.
     */

    updateProgressIndicator();

  };


/* =========================================================
   MIDNIGHT RESET
   ========================================================= */

/*
 * We do NOT delete yesterday's history.
 *
 * At midnight, the current checkbox state is
 * simply read using the new IST date.
 *
 * Therefore the new day starts unchecked.
 */

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
       * Only refresh the currently visible
       * 1CheatSheet.
       */

      if (
        isDailyRevisionNote()
      ) {

        const topic =
          topics[
            currentTopicIndex
          ];


        if (topic) {

          loadMarkdown(
            topic,
            false
          );

        }

      }

    },
    30 * 1000
  );

}


/* =========================================================
   START TRACKER
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /*
     * Start midnight watcher.
     */

    setupDailyRevisionMidnightWatcher();


    /*
     * Initial top-bar state.
     */

    updateProgressIndicator();

  }
);
