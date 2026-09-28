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
}


/* ========================================
   LOAD MARKDOWN NOTE
======================================== */
async function loadMarkdown(topic) {
  try {

    showLoading();

    /*
      Find the current note in the complete
      topic list.

      This is used by Previous / Next.
    */
    currentTopicIndex =
      topics.findIndex(
        item => item.file === topic.file
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

    /*
      Render the Markdown first.
    */
    content.innerHTML =
      marked.parse(markdown);

    /*
      Update current topic information.
    */
    updateCurrentTopic(topic);

    updateActiveTopic(topic);

    /*
      Add navigation at the TOP.
    */
    addPageNavigation("top");

    /*
      Existing content features.
    */
    addCopyButtons();

    addHeadingIds();

    setupExternalLinks();

    /*
      Add navigation at the BOTTOM.
    */
    addPageNavigation("bottom");

    /*
      Close mobile sidebar after
      selecting a note.
    */
    closeMobileSidebar();

    /*
      Scroll to the top whenever a new
      page/note is opened.
    */
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
   PREVIOUS / NEXT PAGE NAVIGATION
======================================== */
function addPageNavigation(position) {

  /*
    Remove any existing navigation for
    this position.
  */
  const existingNavigation =
    content.querySelector(
      `.page-navigation-${position}`
    );

  if (existingNavigation) {
    existingNavigation.remove();
  }


  /*
    Don't show navigation if there is
    only one note.
  */
  if (topics.length <= 1) {
    return;
  }


  const navigation =
    document.createElement("nav");

  navigation.className =
    `page-navigation page-navigation-${position}`;

  navigation.setAttribute(
    "aria-label",
    "Page navigation"
  );


  /*
    Find Previous and Next notes.
  */
  const previousTopic =
    currentTopicIndex > 0
      ? topics[currentTopicIndex - 1]
      : null;

  const nextTopic =
    currentTopicIndex < topics.length - 1
      ? topics[currentTopicIndex + 1]
      : null;


  /* ======================================
     PREVIOUS BUTTON
  ====================================== */

  const previousButton =
    document.createElement("button");

  previousButton.type = "button";

  previousButton.className =
    "page-nav-button previous-page";


  if (previousTopic) {

    previousButton.innerHTML = `
      <span
        class="page-nav-arrow"
        aria-hidden="true"
      >
        ←
      </span>

      <span class="page-nav-label">
        Previous
      </span>

      <span class="page-nav-title">
        ${escapeHTML(previousTopic.name)}
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
      <span
        class="page-nav-arrow"
        aria-hidden="true"
      >
        ←
      </span>

      <span class="page-nav-label">
        Previous
      </span>
    `;

    previousButton.setAttribute(
      "aria-label",
      "No previous page"
    );
  }


  /* ======================================
     NEXT BUTTON
  ====================================== */

  const nextButton =
    document.createElement("button");

  nextButton.type = "button";

  nextButton.className =
    "page-nav-button next-page";


  if (nextTopic) {

    nextButton.innerHTML = `
      <span class="page-nav-label">
        Next
      </span>

      <span class="page-nav-title">
        ${escapeHTML(nextTopic.name)}
      </span>

      <span
        class="page-nav-arrow"
        aria-hidden="true"
      >
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
      <span class="page-nav-label">
        Next
      </span>

      <span
        class="page-nav-arrow"
        aria-hidden="true"
      >
        →
      </span>
    `;

    nextButton.setAttribute(
      "aria-label",
      "No next page"
    );
  }


  /*
    Add buttons to navigation.
  */
  navigation.appendChild(
    previousButton
  );

  navigation.appendChild(
    nextButton
  );


  /*
    TOP:
      Insert before Markdown content.

    BOTTOM:
      Append after Markdown content.
  */
  if (position === "top") {

    content.insertBefore(
      navigation,
      content.firstChild
    );

  } else {

    content.appendChild(
      navigation
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

        /*
          Restore active item after search
          is cleared.
        */
        if (
          currentTopicIndex >= 0 &&
          topics[currentTopicIndex]
        ) {
          updateActiveTopic(
            topics[currentTopicIndex]
          );
        }

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
        Left arrow:
        Previous page
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
            topics[currentTopicIndex - 1]
          );
        }
      }


      /*
        Right arrow:
        Next page
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
            topics[currentTopicIndex + 1]
          );
        }
      }

    }
  );
}


/* ========================================
   CHECK IF USER IS TYPING
======================================== */
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

    button.className =
      "copy-button";

    button.textContent =
      "Copy";


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

  const usedIds =
    new Set();


  headings.forEach(heading => {

    let baseId =
      heading.textContent
        .toLowerCase()
        .trim()
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

      link.target =
        "_blank";

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


/* ========================================
   ERROR
======================================== */
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


/* ========================================
   CLOSE MOBILE SIDEBAR
======================================== */
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

  div.textContent =
    value;

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
   INITIALIZE
======================================== */
function initialize() {

  configureMarkdown();

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
