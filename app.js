const GITHUB_USER = "jai92xi";
const GITHUB_REPO = "Xi_Notes";
const NOTES_FOLDER = "notes";

const sidebar = document.getElementById("sidebar");
const content = document.getElementById("content");
const searchInput = document.getElementById("search");
const themeButton = document.getElementById("theme-button");

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
   LOAD NOTES FROM GITHUB
   ========================================================= */

async function loadTopics() {
  try {
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
        a.name.localeCompare(b.name)
      );

    createSidebar(topics);

    if (topics.length === 0) {
      showMessage(
        "No notes yet ✦",
        "Add Markdown files to the notes folder."
      );

      return;
    }

    /*
      Open the first note automatically.
    */
    loadMarkdown(topics[0]);

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
   FORMAT NOTE NAME
   ========================================================= */

function formatTopicName(filename) {
  return filename
    .replace(/\.md$/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

    button.className =
      "topic-button";

    /*
      Cute replacement for ├──
    */
    button.innerHTML = `
      <span class="topic-dot">✦</span>

      <span class="topic-name">
        ${escapeHTML(topic.file)}
      </span>
    `;

    button.addEventListener(
      "click",
      () => loadMarkdown(topic)
    );

    navigation.appendChild(button);
  });

  /*
    Restore active note after search/sidebar rebuild.
  */
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
   LOAD MARKDOWN NOTE
   ========================================================= */

async function loadMarkdown(topic) {
  try {

    showLoading();

    /*
      Find current note in the complete notes list.
    */
    currentTopicIndex =
      topics.findIndex(
        item => item.file === topic.file
      );

    /*
      Fetch the Markdown file from the local
      GitHub Pages notes directory.

      This is preferable to GitHub API content because
      the site itself is hosted from GitHub Pages.
    */
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

    if (
      typeof marked === "undefined"
    ) {
      throw new Error(
        "Marked.js is not available."
      );
    }

    /*
      Convert Markdown to HTML.
    */
    const renderedHTML =
      marked.parse(markdown);

    /*
      Render the note.
    */
    content.innerHTML =
      renderedHTML;

    /*
      Tell CSS that this is a real note,
      not the homepage.
    */
    content.classList.add(
      "note-loaded"
    );

    /*
      Add Previous / Next at the TOP.
    */
    addPageNavigation();

    /*
      Additional enhancements.
    */
    addHeadingIds();
    addCopyButtons();
    setupExternalLinks();

    /*
      Highlight the active note.
    */
    updateActiveTopic(topic);

    /*
      Close mobile sidebar.
    */
    closeMobileSidebar();

    /*
      Start at the top of the note.
    */
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

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
   PREVIOUS / NEXT NAVIGATION
   =========================================================

   Navigation appears ONLY at the top.

   There is intentionally no bottom navigation.
   ========================================================= */

function addPageNavigation() {

  /*
    Remove an existing navigation if one exists.
  */
  const existingNavigation =
    content.querySelector(
      ".page-navigation"
    );

  if (existingNavigation) {
    existingNavigation.remove();
  }

  /*
    No navigation if there is only one note.
  */
  if (topics.length <= 1) {
    return;
  }

  const navigation =
    document.createElement("nav");

  navigation.className =
    "page-navigation";

  navigation.setAttribute(
    "aria-label",
    "Note navigation"
  );


  /* =======================================================
     PREVIOUS
     ======================================================= */

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
        loadMarkdown(previousTopic);
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


  /* =======================================================
     NEXT
     ======================================================= */

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
        loadMarkdown(nextTopic);
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


  /*
    Add buttons.
  */
  navigation.appendChild(
    previousButton
  );

  navigation.appendChild(
    nextButton
  );


  /*
    IMPORTANT:
    Navigation is inserted BEFORE the note content.
  */
  content.insertBefore(
    navigation,
    content.firstChild
  );
}


/* =========================================================
   ACTIVE SIDEBAR NOTE
   ========================================================= */

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

    const isActive =
      topicName.textContent.trim() ===
      selectedTopic.file;

    button.classList.toggle(
      "active",
      isActive
    );
  });
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


      /*
        Empty search:
        restore everything.
      */
      if (!query) {

        createSidebar(topics);

        return;
      }


      /*
        Search filename and formatted name.
      */
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


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

function setupKeyboardShortcuts() {

  document.addEventListener(
    "keydown",
    event => {

      /*
        CMD + K / CTRL + K
        Focus search.
      */
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


      /*
        ESCAPE
      */
      if (
        event.key === "Escape"
      ) {

        if (searchInput) {

          searchInput.value = "";

          searchInput.blur();
        }

        createSidebar(topics);

        closeMobileSidebar();
      }


      /*
        LEFT ARROW
        Previous note.
      */
      if (
        event.key === "ArrowLeft" &&
        !isTypingInField(event)
      ) {

        if (
          currentTopicIndex > 0
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
        RIGHT ARROW
        Next note.
      */
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
   COPY CODE BLOCKS
   ========================================================= */

function addCopyButtons() {

  const codeBlocks =
    content.querySelectorAll(
      "pre"
    );


  codeBlocks.forEach(pre => {

    /*
      Don't add twice.
    */
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
          pre.querySelector(
            "code"
          );

        if (!code) {
          return;
        }


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

          console.error(
            "Copy failed:",
            error
          );


          /*
            Fallback for browsers where
            clipboard API isn't available.
          */
          try {

            const range =
              document.createRange();

            range.selectNodeContents(
              code
            );


            const selection =
              window.getSelection();

            selection.removeAllRanges();

            selection.addRange(
              range
            );


            document.execCommand(
              "copy"
            );

            selection.removeAllRanges();


            button.textContent =
              "Copied ✦";


            setTimeout(
              () => {
                button.textContent =
                  "Copy";
              },
              1400
            );

          } catch (fallbackError) {

            console.error(
              "Clipboard fallback failed:",
              fallbackError
            );

            button.textContent =
              "Failed";

            setTimeout(
              () => {
                button.textContent =
                  "Copy";
              },
              1400
            );
          }
        }
      }
    );


    pre.appendChild(
      button
    );

  });
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


  headings.forEach(
    heading => {

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


      /*
        Make IDs unique.
      */
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
   LOADING STATE
   ========================================================= */

function showLoading() {

  /*
    Remove note styling while loading.
  */
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
   EMPTY MESSAGE
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
   ERROR MESSAGE
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
   MOBILE SIDEBAR
   ========================================================= */

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


  /*
    OPEN
  */
  if (menuButton) {

    menuButton.addEventListener(
      "click",
      () => {

        if (sidebar) {

          sidebar.classList.add(
            "mobile-open"
          );
        }


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


  /*
    CLOSE BUTTON
  */
  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeMobileSidebar
    );
  }


  /*
    CLICK OUTSIDE
  */
  if (overlay) {

    overlay.addEventListener(
      "click",
      closeMobileSidebar
    );
  }
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
   THEME
   =========================================================

   LIGHT = DEFAULT

   Clicking the button:
   LIGHT → DARK
   DARK  → LIGHT

   The selection is remembered using localStorage.
   ========================================================= */

function setupTheme() {

  if (!themeButton) {
    return;
  }


  const savedTheme =
    localStorage.getItem(
      "ai-curiosity-theme"
    );


  /*
    Default is LIGHT.
  */
  if (
    savedTheme === "dark"
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


  /*
    Toggle theme.
  */
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
        "ai-curiosity-theme",
        isDark
          ? "dark"
          : "light"
      );


      updateThemeButton();

    }
  );
}


/* =========================================================
   UPDATE THEME BUTTON
   ========================================================= */

function updateThemeButton() {

  if (!themeButton) {
    return;
  }


  const isDark =
    document.body.classList.contains(
      "dark-theme"
    );


  /*
    Light mode:
      show moon

    Dark mode:
      show sun
  */
  themeButton.textContent =
    isDark
      ? "☀"
      : "☾";


  themeButton.setAttribute(
    "aria-label",
    isDark
      ? "Switch to light mode"
      : "Switch to dark mode"
  );


  themeButton.setAttribute(
    "title",
    isDark
      ? "Switch to light mode"
      : "Switch to dark mode"
  );
}


/* =========================================================
   START APP
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
