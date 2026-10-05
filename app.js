/* =========================================================
   🧠 AI & ML KEY CONCEPTS
   app.js
   ========================================================= */

(() => {
  "use strict";

  /* =======================================================
     CONFIG
     ======================================================= */

  const NOTES_BASE_PATH = "notes/";

  const NOTES_INDEX = [
    {
      title: "Tokens",
      file: "tokens.md"
    },
    {
      title: "Confusion Matrix",
      file: "confusion-matrix.md"
    }
  ];

  /*
   If your existing repository already exposes a notes list
   through another JavaScript/data source, this fallback list
   is used only when that list is not available.
   */

  const STORAGE_KEYS = {
    theme: "xi-notes-theme",
    selectedNote: "xi-notes-selected-note",
    sidebarHidden: "xi-notes-sidebar-hidden"
  };


  /* =======================================================
     DOM
     ======================================================= */

  const sidebar = document.getElementById("sidebar");
  const sidebarHeader = document.getElementById("sidebar-header");
  const sidebarOverlay = document.getElementById("sidebar-overlay");

  const contentsToggle =
    document.getElementById("contents-toggle");

  const topicNavigation =
    document.getElementById("topic-navigation");

  const searchInput =
    document.getElementById("search");

  const menuButton =
    document.getElementById("menu-button");

  const content =
    document.getElementById("content");

  const previousButton =
    document.getElementById("previous-button");

  const nextButton =
    document.getElementById("next-button");

  const previousTitle =
    document.getElementById("previous-title");

  const nextTitle =
    document.getElementById("next-title");

  const themeButton =
    document.getElementById("theme-button");

  const themeIcon =
    themeButton
      ? themeButton.querySelector(".theme-icon")
      : null;


  /* =======================================================
     STATE
     ======================================================= */

  let notes = [];

  let currentIndex = -1;

  let sidebarHidden = false;

  let mobileSidebarOpen = false;


  /* =======================================================
     HELPERS
     ======================================================= */

  function escapeHtml(value) {
    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
  }


  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }


  function isMobile() {
    return window.matchMedia("(max-width: 760px)").matches;
  }


  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEYS.theme);
    } catch {
      return null;
    }
  }


  function setStoredTheme(theme) {
    try {
      localStorage.setItem(
        STORAGE_KEYS.theme,
        theme
      );
    } catch {
      // Ignore storage errors.
    }
  }


  function getStoredNote() {
    try {
      return localStorage.getItem(
        STORAGE_KEYS.selectedNote
      );
    } catch {
      return null;
    }
  }


  function setStoredNote(index) {
    try {
      localStorage.setItem(
        STORAGE_KEYS.selectedNote,
        String(index)
      );
    } catch {
      // Ignore storage errors.
    }
  }


  function getStoredSidebarState() {
    try {
      return localStorage.getItem(
        STORAGE_KEYS.sidebarHidden
      ) === "true";
    } catch {
      return false;
    }
  }


  function setStoredSidebarState(hidden) {
    try {
      localStorage.setItem(
        STORAGE_KEYS.sidebarHidden,
        String(hidden)
      );
    } catch {
      // Ignore storage errors.
    }
  }


  /* =======================================================
     THEME
     ======================================================= */

  function applyTheme(theme) {
    const dark =
      theme === "dark";

    document.body.classList.toggle(
      "dark-theme",
      dark
    );

    if (themeIcon) {
      themeIcon.textContent =
        dark ? "☀" : "☾";
    }

    if (themeButton) {
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
  }


  function initializeTheme() {
    const savedTheme =
      getStoredTheme();

    if (
      savedTheme === "dark" ||
      savedTheme === "light"
    ) {
      applyTheme(savedTheme);
      return;
    }

    const prefersDark =
      window.matchMedia &&
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

    applyTheme(
      prefersDark
        ? "dark"
        : "light"
    );
  }


  function toggleTheme() {
    const dark =
      document.body.classList.contains(
        "dark-theme"
      );

    const nextTheme =
      dark
        ? "light"
        : "dark";

    applyTheme(nextTheme);

    setStoredTheme(nextTheme);
  }


  /* =======================================================
     SIDEBAR
     ======================================================= */

  function updateSidebarButton() {
    if (!contentsToggle) {
      return;
    }

    /*
     * When contents are visible:
     * three horizontal lines = HIDE
     *
     * When contents are hidden:
     * chevron = SHOW
     */

    contentsToggle.classList.toggle(
      "collapsed",
      sidebarHidden
    );

    contentsToggle.setAttribute(
      "aria-expanded",
      String(!sidebarHidden)
    );

    contentsToggle.setAttribute(
      "aria-label",
      sidebarHidden
        ? "Show contents"
        : "Hide contents"
    );

    contentsToggle.setAttribute(
      "title",
      sidebarHidden
        ? "Show contents"
        : "Hide contents"
    );
  }


  function setSidebarHidden(hidden) {
    sidebarHidden = Boolean(hidden);

    if (!sidebar) {
      return;
    }

    /*
     * Desktop:
     * The sidebar becomes completely invisible.
     *
     * Mobile:
     * the mobile drawer remains controlled by the menu.
     */

    if (!isMobile()) {
      sidebar.classList.toggle(
        "contents-hidden",
        sidebarHidden
      );

      sidebar.classList.remove(
        "mobile-open"
      );

      mobileSidebarOpen = false;

      closeOverlay();
    } else {
      /*
       * On mobile the "hide contents" action means
       * close the contents drawer rather than leaving
       * a vertical strip on screen.
       */

      sidebar.classList.remove(
        "contents-hidden"
      );

      if (hidden) {
        sidebar.classList.remove(
          "mobile-open"
        );

        mobileSidebarOpen = false;

        closeOverlay();
      }
    }

    updateSidebarButton();

    setStoredSidebarState(
      sidebarHidden
    );
  }


  function toggleSidebar() {
    if (isMobile()) {
      if (mobileSidebarOpen) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }

      return;
    }

    setSidebarHidden(
      !sidebarHidden
    );
  }


  function openMobileSidebar() {
    if (!sidebar) {
      return;
    }

    mobileSidebarOpen = true;

    sidebarHidden = false;

    sidebar.classList.remove(
      "contents-hidden"
    );

    sidebar.classList.add(
      "mobile-open"
    );

    openOverlay();

    updateSidebarButton();
  }


  function closeMobileSidebar() {
    if (!sidebar) {
      return;
    }

    mobileSidebarOpen = false;

    sidebar.classList.remove(
      "mobile-open"
    );

    closeOverlay();
  }


  function openOverlay() {
    if (!sidebarOverlay) {
      return;
    }

    sidebarOverlay.classList.add(
      "active"
    );

    sidebarOverlay.setAttribute(
      "aria-hidden",
      "false"
    );
  }


  function closeOverlay() {
    if (!sidebarOverlay) {
      return;
    }

    sidebarOverlay.classList.remove(
      "active"
    );

    sidebarOverlay.setAttribute(
      "aria-hidden",
      "true"
    );
  }


  /* =======================================================
     NOTE DISCOVERY
     ======================================================= */

  async function loadNotesIndex() {
    /*
     * Try common data files first.
     * This keeps the application flexible if the repository
     * already contains an index file.
     */

    const possibleIndexes = [
      "notes.json",
      "notes/index.json",
      "data/notes.json",
      "notes.js"
    ];

    for (const source of possibleIndexes) {
      try {
        const response =
          await fetch(source, {
            cache: "no-store"
          });

        if (!response.ok) {
          continue;
        }

        const contentType =
          response.headers.get(
            "content-type"
          ) || "";

        if (
          source.endsWith(".json") ||
          contentType.includes("json")
        ) {
          const data =
            await response.json();

          const parsed =
            normalizeNotes(data);

          if (parsed.length) {
            return parsed;
          }
        }
      } catch {
        // Try the next source.
      }
    }

    return normalizeNotes(
      NOTES_INDEX
    );
  }


  function normalizeNotes(data) {
    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map((item, index) => {
        if (typeof item === "string") {
          return {
            title: item,
            file: `${slugify(item)}.md`,
            index
          };
        }

        if (!item || typeof item !== "object") {
          return null;
        }

        const title =
          item.title ||
          item.name ||
          item.label ||
          `Concept ${index + 1}`;

        const file =
          item.file ||
          item.path ||
          item.url ||
          `${slugify(title)}.md`;

        return {
          ...item,
          title,
          file,
          index
        };
      })
      .filter(Boolean)
      .map((item, index) => ({
        ...item,
        index
      }));
  }


  /* =======================================================
     NAVIGATION RENDERING
     ======================================================= */

  function renderNavigation(list = notes) {
    if (!topicNavigation) {
      return;
    }

    topicNavigation.innerHTML = "";

    if (!list.length) {
      const empty =
        document.createElement("div");

      empty.className =
        "no-results";

      empty.textContent =
        "No concepts found.";

      topicNavigation.appendChild(
        empty
      );

      return;
    }

    const fragment =
      document.createDocumentFragment();

    list.forEach(note => {
      const button =
        document.createElement("button");

      button.type = "button";

      button.className =
        "topic-button";

      button.dataset.index =
        String(note.index);

      button.setAttribute(
        "aria-label",
        `Open ${note.title}`
      );

      if (
        note.index === currentIndex
      ) {
        button.classList.add(
          "active"
        );

        button.setAttribute(
          "aria-current",
          "page"
        );
      }

      const dot =
        document.createElement("span");

      dot.className =
        "topic-dot";

      dot.setAttribute(
        "aria-hidden",
        "true"
      );

      const title =
        document.createElement("span");

      title.className =
        "topic-name";

      title.textContent =
        note.title;

      button.appendChild(dot);

      button.appendChild(title);

      button.addEventListener(
        "click",
        () => {
          const index =
            Number(button.dataset.index);

          openNote(index);

          if (isMobile()) {
            closeMobileSidebar();
          }
        }
      );

      fragment.appendChild(button);
    });

    topicNavigation.appendChild(
      fragment
    );
  }


  function updateNavigationButtons() {
    if (!previousButton || !nextButton) {
      return;
    }

    const hasPrevious =
      currentIndex > 0;

    const hasNext =
      currentIndex >= 0 &&
      currentIndex <
        notes.length - 1;

    previousButton.disabled =
      !hasPrevious;

    nextButton.disabled =
      !hasNext;

    if (hasPrevious) {
      previousTitle.textContent =
        notes[currentIndex - 1].title;
    } else {
      previousTitle.textContent =
        "Start";
    }

    if (hasNext) {
      nextTitle.textContent =
        notes[currentIndex + 1].title;
    } else {
      nextTitle.textContent =
        "You're caught up ✦";
    }
  }


  /* =======================================================
     MARKDOWN
     ======================================================= */

  function configureMarked() {
    if (
      typeof marked === "undefined"
    ) {
      return;
    }

    if (
      typeof marked.setOptions ===
      "function"
    ) {
      marked.setOptions({
        gfm: true,
        breaks: true
      });
    }
  }


  function markdownToHtml(markdown) {
    if (
      typeof marked === "undefined"
    ) {
      return escapeHtml(
        markdown
      ).replace(
        /\n/g,
        "<br>"
      );
    }

    if (
      typeof marked.parse ===
      "function"
    ) {
      return marked.parse(
        markdown
      );
    }

    return marked(
      markdown
    );
  }


  /* =======================================================
     NOTE LOADING
     ======================================================= */

  async function fetchNote(note) {
    const candidates = [];

    if (note.file) {
      candidates.push(
        note.file
      );

      if (
        !note.file.startsWith(
          NOTES_BASE_PATH
        ) &&
        !note.file.startsWith("./") &&
        !note.file.startsWith("/")
      ) {
        candidates.push(
          `${NOTES_BASE_PATH}${note.file}`
        );
      }
    }

    if (note.path) {
      candidates.push(
        note.path
      );
    }

    if (note.url) {
      candidates.push(
        note.url
      );
    }

    const uniqueCandidates =
      [...new Set(candidates)];

    for (
      const source
      of uniqueCandidates
    ) {
      try {
        const response =
          await fetch(
            source,
            {
              cache: "no-store"
            }
          );

        if (!response.ok) {
          continue;
        }

        const markdown =
          await response.text();

        return markdown;
      } catch {
        // Try next candidate.
      }
    }

    throw new Error(
      `Could not load ${note.title}`
    );
  }


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
  }


  function showError(message) {
    if (!content) {
      return;
    }

    content.innerHTML = `
      <div class="error">
        <h1>Unable to load this note</h1>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }


  function enhanceContent() {
    if (!content) {
      return;
    }

    addCopyButtons();

    addHeadingIds();

    addConceptIcon();
  }


  /* =======================================================
     CONTENT ENHANCEMENTS
     ======================================================= */

  function addHeadingIds() {
    const headings =
      content.querySelectorAll(
        "h1, h2, h3, h4, h5, h6"
      );

    const usedIds =
      new Set();

    headings.forEach(
      heading => {
        if (heading.id) {
          usedIds.add(
            heading.id
          );

          return;
        }

        const base =
          slugify(
            heading.textContent
          ) ||
          "section";

        let id = base;

        let count = 2;

        while (
          usedIds.has(id)
        ) {
          id =
            `${base}-${count}`;
          count += 1;
        }

        heading.id = id;

        usedIds.add(id);
      }
    );
  }


  function addConceptIcon() {
    if (!content) {
      return;
    }

    const headings =
      content.querySelectorAll(
        "h1"
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
            `🧠 ${text.replace(
              /^AI & ML Notes$/,
              "AI & ML Key Concepts"
            )}`;

          return;
        }
      }
    );
  }


  function addCopyButtons() {
    const blocks =
      content.querySelectorAll(
        "pre"
      );

    blocks.forEach(pre => {
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

          const text =
            code
              ? code.textContent
              : pre.textContent;

          try {
            await navigator.clipboard.writeText(
              text
            );

            button.textContent =
              "Copied";

            button.classList.add(
              "copied"
            );

            window.setTimeout(
              () => {
                button.textContent =
                  "Copy";

                button.classList.remove(
                  "copied"
                );
              },
              1400
            );
          } catch {
            button.textContent =
              "Copy failed";

            window.setTimeout(
              () => {
                button.textContent =
                  "Copy";
              },
              1400
            );
          }
        }
      );

      pre.appendChild(
        button
      );
    });
  }


  /* =======================================================
     OPEN NOTE
     ======================================================= */

  async function openNote(index, updateUrl = true) {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= notes.length
    ) {
      return;
    }

    const note =
      notes[index];

    currentIndex =
      index;

    setStoredNote(index);

    renderNavigation(
      getFilteredNotes()
    );

    updateNavigationButtons();

    showLoading();

    if (updateUrl) {
      updateUrlForNote(
        note,
        index
      );
    }

    try {
      const markdown =
        await fetchNote(note);

      if (
        currentIndex !== index
      ) {
        return;
      }

      if (!content) {
        return;
      }

      content.innerHTML =
        markdownToHtml(
          markdown
        );

      content.classList.remove(
        "note-loaded"
      );

      /*
       * Force animation restart when changing notes.
       */
      void content.offsetWidth;

      content.classList.add(
        "note-loaded"
      );

      enhanceContent();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } catch (error) {
      showError(
        error?.message ||
        "Please check that the note file exists."
      );
    }
  }


  /* =======================================================
     URL
     ======================================================= */

  function updateUrlForNote(
    note,
    index
  ) {
    try {
      const params =
        new URLSearchParams(
          window.location.search
        );

      params.set(
        "note",
        note.title
      );

      params.set(
        "index",
        String(index)
      );

      const newUrl =
        `${window.location.pathname}?${params.toString()}${window.location.hash}`;

      window.history.replaceState(
        {
          note: index
        },
        "",
        newUrl
      );
    } catch {
      // Ignore URL errors.
    }
  }


  function getInitialNoteIndex() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const indexParam =
      params.get("index");

    if (indexParam !== null) {
      const index =
        Number(indexParam);

      if (
        Number.isInteger(index) &&
        index >= 0 &&
        index < notes.length
      ) {
        return index;
      }
    }

    const titleParam =
      params.get("note");

    if (titleParam) {
      const normalized =
        titleParam
          .trim()
          .toLowerCase();

      const found =
        notes.findIndex(
          note =>
            note.title
              .trim()
              .toLowerCase() ===
            normalized
        );

      if (found >= 0) {
        return found;
      }
    }

    const hash =
      window.location.hash
        .replace(/^#/, "")
        .trim();

    if (hash) {
      const found =
        notes.findIndex(
          note =>
            slugify(note.title) ===
            slugify(hash)
        );

      if (found >= 0) {
        return found;
      }
    }

    const stored =
      Number(
        getStoredNote()
      );

    if (
      Number.isInteger(stored) &&
      stored >= 0 &&
      stored < notes.length
    ) {
      return stored;
    }

    return 0;
  }


  /* =======================================================
     SEARCH
     ======================================================= */

  function getFilteredNotes() {
    const query =
      searchInput
        ? searchInput.value
            .trim()
            .toLowerCase()
        : "";

    if (!query) {
      return notes;
    }

    return notes.filter(
      note =>
        note.title
          .toLowerCase()
          .includes(query)
    );
  }


  function filterNavigation() {
    renderNavigation(
      getFilteredNotes()
    );
  }


  /* =======================================================
     KEYBOARD NAVIGATION
     ======================================================= */

  function handleKeyboard(event) {
    /*
     * Do not intercept keyboard navigation while
     * typing/searching.
     */

    const target =
      event.target;

    const tag =
      target?.tagName;

    if (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      target?.isContentEditable
    ) {
      return;
    }

    if (
      event.key === "ArrowLeft" &&
      currentIndex > 0
    ) {
      event.preventDefault();

      openNote(
        currentIndex - 1
      );
    }

    if (
      event.key === "ArrowRight" &&
      currentIndex <
        notes.length - 1
    ) {
      event.preventDefault();

      openNote(
        currentIndex + 1
      );
    }
  }


  /* =======================================================
     EVENTS
     ======================================================= */

  function bindEvents() {
    if (contentsToggle) {
      contentsToggle.addEventListener(
        "click",
        toggleSidebar
      );
    }

    if (themeButton) {
      themeButton.addEventListener(
        "click",
        toggleTheme
      );
    }

    if (menuButton) {
      menuButton.addEventListener(
        "click",
        () => {
          if (mobileSidebarOpen) {
            closeMobileSidebar();
          } else {
            openMobileSidebar();
          }
        }
      );
    }

    if (sidebarOverlay) {
      sidebarOverlay.addEventListener(
        "click",
        closeMobileSidebar
      );
    }

    if (searchInput) {
      searchInput.addEventListener(
        "input",
        filterNavigation
      );

      searchInput.addEventListener(
        "keydown",
        event => {
          if (
            event.key === "Escape"
          ) {
            searchInput.value = "";

            filterNavigation();

            searchInput.blur();
          }
        }
      );
    }

    if (previousButton) {
      previousButton.addEventListener(
        "click",
        () => {
          if (
            currentIndex > 0
          ) {
            openNote(
              currentIndex - 1
            );
          }
        }
      );
    }

    if (nextButton) {
      nextButton.addEventListener(
        "click",
        () => {
          if (
            currentIndex <
            notes.length - 1
          ) {
            openNote(
              currentIndex + 1
            );
          }
        }
      );
    }

    document.addEventListener(
      "keydown",
      handleKeyboard
    );

    window.addEventListener(
      "resize",
      handleResize
    );

    window.addEventListener(
      "popstate",
      () => {
        const index =
          getInitialNoteIndex();

        openNote(
          index,
          false
        );
      }
    );
  }


  function handleResize() {
    if (!sidebar) {
      return;
    }

    if (!isMobile()) {
      sidebar.classList.remove(
        "mobile-open"
      );

      mobileSidebarOpen = false;

      closeOverlay();

      sidebar.classList.toggle(
        "contents-hidden",
        sidebarHidden
      );

      updateSidebarButton();

      return;
    }

    /*
     * On mobile, never leave the desktop
     * hidden-sidebar state as a visible strip.
     */

    sidebar.classList.remove(
      "contents-hidden"
    );

    if (!mobileSidebarOpen) {
      sidebar.classList.remove(
        "mobile-open"
      );
    }

    updateSidebarButton();
  }


  /* =======================================================
     INITIALIZATION
     ======================================================= */

  async function initialize() {
    initializeTheme();

    bindEvents();

    configureMarked();

    /*
     * Do not restore "hidden" as a physical sidebar
     * strip on mobile.
     */

    sidebarHidden =
      getStoredSidebarState();

    if (isMobile()) {
      sidebarHidden = false;
    }

    updateSidebarButton();

    notes =
      await loadNotesIndex();

    if (!notes.length) {
      if (content) {
        content.innerHTML = `
          <div class="empty-state">
            <h1>🧠 AI &amp; ML Key Concepts</h1>
            <p>
              No concepts are available yet.
            </p>
          </div>
        `;
      }

      updateNavigationButtons();

      return;
    }

    const initialIndex =
      getInitialNoteIndex();

    renderNavigation(
      notes
    );

    updateNavigationButtons();

    await openNote(
      initialIndex,
      false
    );

    /*
     * Apply sidebar state after the initial render
     * so the show button remains available without
     * displaying a vertical bar.
     */

    if (!isMobile()) {
      sidebar.classList.toggle(
        "contents-hidden",
        sidebarHidden
      );

      updateSidebarButton();
    }
  }


  /* =======================================================
     START
     ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      {
        once: true
      }
    );
  } else {
    initialize();
  }

})();
