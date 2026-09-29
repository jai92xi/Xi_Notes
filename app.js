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


/* =========================================================
   DOM
   ========================================================= */

const sidebar =
  document.getElementById("sidebar");

const content =
  document.getElementById("content");

const searchInput =
  document.getElementById("search");

const themeButton =
  document.getElementById("theme-button");

const menuButton =
  document.getElementById("menu-button");

const closeSidebarButton =
  document.getElementById("close-sidebar");

const sidebarOverlay =
  document.getElementById("sidebar-overlay");


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    configureMarkdown();

    setupTheme();

    setupSearch();

    setupKeyboardShortcuts();

    setupMobileMenu();

    setupContentsToggle();

    loadTopics();

  }
);


/* =========================================================
   MARKDOWN CONFIGURATION
   ========================================================= */

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


/* =========================================================
   LOAD TOPICS
   ========================================================= */

async function loadTopics() {

  try {

    showLoadingSidebar();


    const apiURL =
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${NOTES_FOLDER}?ref=${GITHUB_BRANCH}`;


    const response =
      await fetch(apiURL);


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

            /*
             * IMPORTANT:
             *
             * Keep the REAL filename exactly
             * as GitHub returns it.
             *
             * Do not generate this filename
             * from the display name.
             */

            file: file.name,

            /*
             * Human-friendly display name.
             */

            name:
              formatTopicName(
                file.name
              ),

            /*
             * Keep GitHub's download URL too.
             */

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


    createSidebar(topics);


    if (topics.length > 0) {

      await loadMarkdown(
        topics[0],
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
      "Couldn’t load your notes.",
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
   SIDEBAR
   ========================================================= */

function createSidebar(items) {

  const navigation =
    document.querySelector(
      ".topic-navigation"
    );


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
      document.createElement(
        "button"
      );


    button.type = "button";

    button.className =
      "topic-button";


    button.innerHTML = `
      <span class="topic-dot">✦</span>

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


    navigation.appendChild(
      button
    );

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
   GET RAW MARKDOWN URL
   ========================================================= */

function getMarkdownURL(topic) {

  /*
   * Use the EXACT filename returned by
   * GitHub's API.
   *
   * This avoids GitHub Pages relative-path
   * problems.
   */

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
        item =>
          item.file === topic.file
      );


    /*
     * Fetch the exact Markdown file
     * from GitHub raw content.
     */

    const markdownURL =
      getMarkdownURL(topic);


    console.log(
      "Loading note:",
      topic.file
    );

    console.log(
      "Markdown URL:",
      markdownURL
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


    /*
     * Render Markdown.
     *
     * HTML written inside the .md
     * file is preserved.
     */

    const html =
      marked.parse(
        markdown
      );


    content.innerHTML =
      html;


    content.classList.add(
      "note-loaded"
    );


    /*
     * Fix relative images.
     */

    fixMarkdownImages();


    /*
     * Other content processing.
     */

    addHeadingIds();

    addCopyButtons();

    setupExternalLinks();

    updateActiveTopic(
      topic
    );


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


      /*
       * Absolute images don't need
       * any modification.
       */

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


      /*
       * Markdown images are relative
       * to the /notes/ folder.
       *
       * Example:
       *
       * ../images/early_stopping1.png
       *
       * becomes:
       *
       * https://raw.githubusercontent.com/
       * jai92xi/Xi_Notes/main/images/
       * early_stopping1.png
       */

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
   TOP NAVIGATION
   ========================================================= */

function updateTopNavigation() {

  const navigation =
    document.querySelector(
      ".page-navigation"
    );


  if (!navigation) {
    return;
  }


  navigation.innerHTML = "";


  if (topics.length <= 1) {
    return;
  }


  /*
   * PREVIOUS
   */

  const previous =
    currentTopicIndex > 0
      ? topics[
          currentTopicIndex - 1
        ]
      : null;


  const previousButton =
    document.createElement(
      "button"
    );


  previousButton.type =
    "button";

  previousButton.className =
    "page-nav-button previous-page";


  if (previous) {

    previousButton.innerHTML = `
      <span class="page-nav-arrow">
        ←
      </span>

      <span class="page-nav-copy">

        <span class="page-nav-label">
          Previous
        </span>

        <span class="page-nav-title">
          ${escapeHTML(
            previous.name
          )}
        </span>

      </span>
    `;


    previousButton.addEventListener(
      "click",
      () => {

        loadMarkdown(
          previous,
          true
        );

      }
    );


  } else {

    previousButton.disabled =
      true;


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


  /*
   * NEXT
   */

  const next =
    currentTopicIndex <
      topics.length - 1

      ? topics[
          currentTopicIndex + 1
        ]

      : null;


  const nextButton =
    document.createElement(
      "button"
    );


  nextButton.type =
    "button";

  nextButton.className =
    "page-nav-button next-page";


  if (next) {

    nextButton.innerHTML = `
      <span class="page-nav-copy">

        <span class="page-nav-label">
          Next
        </span>

        <span class="page-nav-title">
          ${escapeHTML(
            next.name
          )}
        </span>

      </span>

      <span class="page-nav-arrow">
        →
      </span>
    `;


    nextButton.addEventListener(
      "click",
      () => {

        loadMarkdown(
          next,
          true
        );

      }
    );


  } else {

    nextButton.disabled =
      true;


    nextButton.innerHTML = `
      <span class="page-nav-copy">

        <span class="page-nav-label">
          Next
        </span>

        <span class="page-nav-title">
          You're caught up ✦
        </span>

      </span>

      <span class="page-nav-arrow">
        →
      </span>
    `;

  }


  navigation.appendChild(
    previousButton
  );

  navigation.appendChild(
    nextButton
  );

}


/* =========================================================
   ACTIVE TOPIC
   ========================================================= */

function updateActiveTopic(
  topic
) {

  const buttons =
    document.querySelectorAll(
      ".topic-button"
    );


  buttons.forEach(
    button => {

      const name =
        button.querySelector(
          ".topic-name"
        );


      if (!name) {
        return;
      }


      const active =
        name.textContent.trim() ===
        topic.name;


      button.classList.toggle(
        "active",
        active
      );

    }
  );


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

        createSidebar(
          topics
        );

        return;
      }


      const filtered =
        topics.filter(
          topic =>

            topic.name
              .toLowerCase()
              .includes(query)

            ||

            topic.file
              .toLowerCase()
              .includes(query)
        );


      createSidebar(
        filtered
      );

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

      /*
       * CMD/CTRL + K
       */

      if (

        (event.ctrlKey ||
          event.metaKey) &&

        event.key.toLowerCase() ===
          "k"

      ) {

        event.preventDefault();


        if (searchInput) {

          searchInput.focus();

          searchInput.select();

        }

      }


      /*
       * ESC
       */

      if (
        event.key ===
        "Escape"
      ) {

        if (searchInput) {

          searchInput.value =
            "";

          searchInput.blur();

        }


        createSidebar(
          topics
        );


        closeMobileSidebar();

      }


      /*
       * LEFT ARROW
       */

      if (

        event.key ===
          "ArrowLeft" &&

        !isTyping(event)

      ) {

        if (
          currentTopicIndex >
          0
        ) {

          event.preventDefault();


          loadMarkdown(
            topics[
              currentTopicIndex - 1
            ]
          );

        }

      }


      /*
       * RIGHT ARROW
       */

      if (

        event.key ===
          "ArrowRight" &&

        !isTyping(event)

      ) {

        if (

          currentTopicIndex >=
            0 &&

          currentTopicIndex <
            topics.length - 1

        ) {

          event.preventDefault();


          loadMarkdown(
            topics[
              currentTopicIndex + 1
            ]
          );

        }

      }

    }
  );

}


/* =========================================================
   CONTENTS TOGGLE
   ========================================================= */

function setupContentsToggle() {

  const toggle =
    document.getElementById(
      "contents-toggle"
    );


  const sidebarElement =
    document.getElementById(
      "sidebar"
    );


  if (
    !toggle ||
    !sidebarElement
  ) {

    return;

  }


  /*
   * Contents open by default.
   */

  sidebarElement.classList.remove(
    "contents-hidden"
  );


  toggle.setAttribute(
    "aria-label",
    "Hide contents"
  );


  toggle.setAttribute(
    "title",
    "Hide contents"
  );


  toggle.setAttribute(
    "aria-expanded",
    "true"
  );


  toggle.addEventListener(
    "click",
    () => {

      const hidden =
        sidebarElement.classList.toggle(
          "contents-hidden"
        );


      toggle.setAttribute(
        "aria-label",
        hidden
          ? "Show contents"
          : "Hide contents"
      );


      toggle.setAttribute(
        "title",
        hidden
          ? "Show contents"
          : "Hide contents"
      );


      toggle.setAttribute(
        "aria-expanded",
        hidden
          ? "false"
          : "true"
      );

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
   COPY BUTTONS
   ========================================================= */

function addCopyButtons() {

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
        async () => {

          try {

            await navigator.clipboard.writeText(
              code.innerText
            );


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

  const headings =
    content.querySelectorAll(
      "h1, h2, h3, h4"
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


      let counter =
        2;


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
   EXTERNAL LINKS
   ========================================================= */

function setupExternalLinks() {

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
          )

          ||

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


  /*
   * Default = LIGHT
   */

  if (
    saved === "dark"
  ) {

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


  themeButton.textContent =
    dark
      ? "☀"
      : "☾";


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
   LOADING
   ========================================================= */

function showLoading() {

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
   EMPTY STATE
   ========================================================= */

function showMessage(
  title,
  message
) {

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

function escapeHTML(
  value
) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    String(value);


  return div.innerHTML;

}
