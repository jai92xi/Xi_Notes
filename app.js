
/* =========================================================
   XI NOTES — COMPLETE APPLICATION
   GitHub Pages + Markdown + KaTeX + Daily Revision
   ========================================================= */

(() => {
  "use strict";

  const CONFIG = {
    owner: "jai92xi",
    repo: "Xi_Notes",
    branch: "main",
    notesFolder: "notes",
    cheatSheet: "1CheatSheet.md",
    apiBase: "https://api.github.com/repos/jai92xi/Xi_Notes",
    rawBase: "https://raw.githubusercontent.com/jai92xi/Xi_Notes/main",
    cdnBase: "https://cdn.jsdelivr.net/gh/jai92xi/Xi_Notes@main"
  };

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const state = {
    notes: [],
    currentPath: "",
    currentIndex: -1,
    searchTerm: "",
    requestId: 0,
    checkedSections: {},
    istDate: getISTDate(),
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    tocOpen: false
  };

  const el = {
    shell: $("#appShell"),
    sidebar: $("#sidebar"),
    sidebarToggle: $("#sidebarToggle"),
    topbarMenu: $("#topbarMenu"),
    backdrop: $("#sidebarBackdrop"),
    search: $("#noteSearch"),
    noteCount: $("#notesCount"),
    navigation: $("#notesNavigation"),
    workspace: $("#readingWorkspace"),
    welcome: $("#welcomePanel"),
    start: $("#startRevision"),
    card: $("#contentCard"),
    banner: $("#revisionBanner"),
    article: $("#articleContent"),
    title: $("#currentNoteName"),
    previous: $("#previousNote"),
    next: $("#nextNote"),
    footerNext: $("#footerNextNote"),
    progressFill: $("#readingProgressFill"),
    progressText: $("#readingProgressText"),
    error: $("#errorPanel"),
    errorMessage: $("#errorMessage"),
    retry: $("#retryLoad")
  };

  /* ---------------------------------------------------------
     HELPERS
     --------------------------------------------------------- */

  function normalizePath(path) {
    return String(path || "")
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\/+/g, "/")
      .replace(/^(?:\.\/)+/, "");
  }

  function encodePath(path) {
    return normalizePath(path)
      .split("/")
      .map(encodeURIComponent)
      .join("/");
  }

  function getTitle(path) {
    return (path.split("/").pop() || path)
      .replace(/\.md$/i, "")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isCheatSheet(path) {
    return normalizePath(path).toLowerCase() ===
      `${CONFIG.notesFolder}/${CONFIG.cheatSheet}`.toLowerCase();
  }

  function getRequestedPath() {
    return normalizePath(
      new URLSearchParams(location.search).get("note") || ""
    );
  }

  function setURL(path, replace = false) {
    const url = new URL(location.href);
    url.searchParams.set("note", normalizePath(path));

    if (replace) {
      history.replaceState({ note: path }, "", url);
    } else {
      history.pushState({ note: path }, "", url);
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function setHidden(element, hidden) {
    if (element) element.hidden = hidden;
  }

  function showError(message) {
    setHidden(el.welcome, true);
    setHidden(el.card, true);
    setHidden(el.error, false);

    if (el.errorMessage) {
      el.errorMessage.textContent = message;
    }
  }

  function hideError() {
    setHidden(el.error, true);
  }

  function isMobile() {
    return window.matchMedia("(max-width: 760px)").matches;
  }

  /* ---------------------------------------------------------
     GITHUB NOTE DISCOVERY
     --------------------------------------------------------- */

  async function fetchJSON(url) {
    const response = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`GitHub request failed: ${response.status}`);
    }

    return response.json();
  }

  async function discoverNotes() {
    let notes = [];

    try {
      const data = await fetchJSON(
        `${CONFIG.apiBase}/git/trees/${CONFIG.branch}?recursive=1`
      );

      if (Array.isArray(data.tree)) {
        notes = data.tree
          .filter(file =>
            file.type === "blob" &&
            file.path.startsWith(`${CONFIG.notesFolder}/`) &&
            /\.md$/i.test(file.path) &&
            !file.path.split("/").some(part => part.startsWith("."))
          )
          .map(file => ({
            path: normalizePath(file.path),
            title: getTitle(file.path),
            sha: file.sha
          }));
      }
    } catch (error) {
      console.warn("GitHub tree API unavailable; trying folder API.", error);
    }

    // Fallback: list the notes folder and any subfolders.
    if (!notes.length) {
      notes = await discoverFolder(CONFIG.notesFolder);
    }

    if (!notes.length) {
      throw new Error(
        "No Markdown notes found. Check the repository and notes folder."
      );
    }

    const unique = new Map();
    notes.forEach(note => unique.set(note.path, note));

    state.notes = Array.from(unique.values()).sort((a, b) =>
      a.path.localeCompare(b.path, undefined, {
        numeric: true,
        sensitivity: "base"
      })
    );

    if (el.noteCount) {
      el.noteCount.textContent = String(state.notes.length);
    }

    renderNotesList();
  }

  async function discoverFolder(folder) {
    const result = [];

    async function walk(path) {
      const data = await fetchJSON(
        `${CONFIG.apiBase}/contents/${encodePath(path)}?ref=${CONFIG.branch}`
      );

      if (!Array.isArray(data)) return;

      for (const item of data) {
        if (item.type === "dir") {
          if (!item.name.startsWith(".")) {
            await walk(item.path);
          }
        } else if (
          item.type === "file" &&
          /\.md$/i.test(item.name)
        ) {
          result.push({
            path: normalizePath(item.path),
            title: getTitle(item.path),
            sha: item.sha
          });
        }
      }
    }

    await walk(folder);
    return result;
  }

  /* ---------------------------------------------------------
     SIDEBAR
     --------------------------------------------------------- */

  function renderNotesList() {
    if (!el.navigation) return;

    const term = state.searchTerm.trim().toLowerCase();
    const notes = state.notes.filter(note =>
      note.title.toLowerCase().includes(term) ||
      note.path.toLowerCase().includes(term)
    );

    el.navigation.replaceChildren();

    if (!notes.length) {
      const empty = document.createElement("div");
      empty.className = "empty-search";
      empty.textContent = state.notes.length
        ? "No matching notes. Try another search."
        : "Loading notes...";
      el.navigation.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();

    notes.forEach(note => {
      const link = document.createElement("a");
      link.className = "note-link";
      link.href = `?note=${encodeURIComponent(note.path)}`;
      link.dataset.notePath = note.path;

      if (note.path === state.currentPath) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }

      const icon = document.createElement("span");
      icon.className = "note-icon";
      icon.textContent = "◇";
      icon.setAttribute("aria-hidden", "true");

      const title = document.createElement("span");
      title.className = "note-title";
      title.textContent = note.title;

      link.append(icon, title);
      fragment.appendChild(link);
    });

    el.navigation.appendChild(fragment);
  }

  function syncSidebar() {
    if (!el.shell) return;

    el.shell.classList.toggle(
      "sidebar-collapsed",
      state.sidebarCollapsed && !isMobile()
    );

    el.shell.classList.toggle(
      "mobile-sidebar-open",
      state.mobileSidebarOpen && isMobile()
    );

    [el.sidebarToggle, el.topbarMenu].forEach(button => {
      if (!button) return;

      button.setAttribute(
        "aria-expanded",
        String(isMobile()
          ? state.mobileSidebarOpen
          : !state.sidebarCollapsed)
      );

      button.setAttribute(
        "aria-label",
        isMobile()
          ? (state.mobileSidebarOpen ? "Close navigation" : "Open navigation")
          : (state.sidebarCollapsed ? "Open sidebar" : "Collapse sidebar")
      );
    });

    if (el.backdrop) {
      el.backdrop.hidden = !(isMobile() && state.mobileSidebarOpen);
    }
  }

  function toggleSidebar() {
    if (isMobile()) {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    } else {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    }

    syncSidebar();
  }

  function closeMobileSidebar() {
    state.mobileSidebarOpen = false;
    syncSidebar();
  }

  /* ---------------------------------------------------------
     MARKDOWN AND MATH
     --------------------------------------------------------- */

  async function ensureLibraries() {
    if (!window.marked) {
      throw new Error("Markdown library did not load. Refresh the page.");
    }

    if (!window.DOMPurify) {
      throw new Error("HTML sanitizer did not load. Refresh the page.");
    }

    if (window.marked.setOptions) {
      window.marked.setOptions({
        gfm: true,
        breaks: false
      });
    }
  }

  async function fetchMarkdown(path) {
    const encoded = encodePath(path);
    const urls = [
      `${CONFIG.rawBase}/${encoded}`,
      `${CONFIG.cdnBase}/${encoded}`
    ];

    let lastError;

    for (const url of urls) {
      try {
        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`Unable to fetch note (${response.status}).`);
        }

        return await response.text();
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Unable to load Markdown.");
  }

  function renderMarkdown(markdown) {
    const html = window.marked.parse(markdown);
    return window.DOMPurify.sanitize(html);
  }

  function renderMath(container) {
    if (!window.renderMathInElement) return;

    try {
      window.renderMathInElement(container, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false,
        strict: "ignore",
        ignoredTags: [
          "script", "noscript", "style", "textarea", "pre", "code"
        ]
      });
    } catch (error) {
      console.warn("KaTeX rendering warning:", error);
    }
  }

  function configureLinks(container) {
    $$("a", container).forEach(link => {
      const href = link.getAttribute("href");
      if (!href) return;

      if (/^https?:\/\//i.test(href)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }

      if (href.startsWith("#")) {
        link.addEventListener("click", event => {
          const id = decodeURIComponent(href.slice(1));
          const target = document.getElementById(id);

          if (target) {
            event.preventDefault();
            target.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }
        });
      }
    });
  }

  /* ---------------------------------------------------------
     CONTENTS / CONTEXT PANEL
     --------------------------------------------------------- */

  function createTOC() {
    if (!el.article || !el.card) return;

    let panel = $("#xiContentsPanel");
    let toggle = $("#xiContentsToggle");

    if (!panel) {
      panel = document.createElement("aside");
      panel.id = "xiContentsPanel";
      panel.className = "xi-contents-panel";
      panel.hidden = true;
      panel.setAttribute("aria-label", "Note contents");

      const heading = document.createElement("div");
      heading.className = "xi-contents-heading";
      heading.textContent = "ON THIS PAGE";

      const list = document.createElement("nav");
      list.id = "xiContentsList";
      list.className = "xi-contents-list";
      list.setAttribute("aria-label", "Headings in this note");

      panel.append(heading, list);

      // Place the contents panel before the Markdown article.
      el.article.before(panel);
    }

    if (!toggle) {
      toggle = document.createElement("button");
      toggle.id = "xiContentsToggle";
      toggle.className = "xi-contents-toggle";
      toggle.type = "button";
      toggle.textContent = "☷ Contents";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", "xiContentsPanel");

      panel.before(toggle);
    }

    toggle.onclick = () => {
      state.tocOpen = !state.tocOpen;
      panel.hidden = !state.tocOpen;
      toggle.setAttribute("aria-expanded", String(state.tocOpen));
      toggle.textContent = state.tocOpen ? "▤ Hide contents" : "☷ Contents";
    };

    const list = $("#xiContentsList");
    list.replaceChildren();

    const headings = $$("h1, h2, h3, h4", el.article);
    const usedIds = new Set();

    headings.forEach((heading, index) => {
      let base = heading.id ||
        heading.textContent.trim().toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") ||
        `section-${index + 1}`;

      let id = base;
      let suffix = 2;

      while (usedIds.has(id) || (
        document.getElementById(id) &&
        document.getElementById(id) !== heading
      )) {
        id = `${base}-${suffix++}`;
      }

      usedIds.add(id);
      heading.id = id;
      heading.style.scrollMarginTop = "90px";

      const link = document.createElement("a");
      link.href = `#${id}`;
      link.className = "xi-contents-link";
      link.textContent = heading.textContent.trim();
      link.dataset.level = heading.tagName.toLowerCase();

      link.addEventListener("click", event => {
        event.preventDefault();
        heading.scrollIntoView({ behavior: "smooth", block: "start" });

        history.replaceState(
          history.state,
          "",
          `${location.pathname}${location.search}#${encodeURIComponent(id)}`
        );
      });

      list.appendChild(link);
    });

    // Show the contents toggle only when there are headings.
    toggle.hidden = headings.length === 0;
    panel.hidden = true;
    state.tocOpen = false;
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "☷ Contents";
  }

  /* ---------------------------------------------------------
     DAILY CHEAT-SHEET CHECKLIST
     --------------------------------------------------------- */

  function getISTDate(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);

    const values = Object.fromEntries(
      parts.map(part => [part.type, part.value])
    );

    return `${values.year}-${values.month}-${values.day}`;
  }

  function checklistKey() {
    return `xi-cheatsheet-checks-${state.istDate}`;
  }

  function loadChecklist() {
    try {
      state.checkedSections = JSON.parse(
        localStorage.getItem(checklistKey()) || "{}"
      );
    } catch {
      state.checkedSections = {};
    }
  }

  function saveChecklist() {
    try {
      localStorage.setItem(
        checklistKey(),
        JSON.stringify(state.checkedSections)
      );
    } catch (error) {
      console.warn("Checklist could not be saved.", error);
    }
  }

  function checkDailyReset() {
    const today = getISTDate();

    if (today !== state.istDate) {
      state.istDate = today;
      state.checkedSections = {};
      loadChecklist();

      if (isCheatSheet(state.currentPath)) {
        buildChecklist();
      }
    }
  }

  function sectionKey(heading, index) {
    const text = heading.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 90);

    return `${text || "topic"}-${index}`;
  }

  function buildChecklist() {
    if (!el.article) return;

    const headings = $$("h1, h2, h3, h4, h5, h6", el.article);
    if (!headings.length) return;

    const originalNodes = Array.from(el.article.childNodes);
    const sections = [];
    let current = null;
    let index = 0;

    originalNodes.forEach(node => {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        /^H[1-6]$/.test(node.tagName)
      ) {
        current = {
          heading: node,
          nodes: [],
          index: index++
        };

        sections.push(current);
      } else if (current) {
        current.nodes.push(node);
      }
    });

    if (!sections.length) return;

    const fragment = document.createDocumentFragment();

    sections.forEach(section => {
      const text = section.heading.textContent.trim();
      const key = sectionKey(text, section.index);

      const wrapper = document.createElement("section");
      wrapper.className = "cheat-sheet-section";
      wrapper.dataset.revisionSection = key;

      const headingRow = document.createElement("div");
      headingRow.className = "cheat-sheet-heading";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "cheat-sheet-checkbox";
      checkbox.dataset.revisionKey = key;
      checkbox.checked = Boolean(state.checkedSections[key]);
      checkbox.setAttribute("aria-label", `Mark ${text} as revised`);

      if (checkbox.checked) wrapper.classList.add("is-checked");

      headingRow.append(checkbox, section.heading);
      wrapper.appendChild(headingRow);

      section.nodes.forEach(node => wrapper.appendChild(node));
      fragment.appendChild(wrapper);
    });

    el.article.replaceChildren(fragment);
  }

  /* ---------------------------------------------------------
     NAVIGATION AND PROGRESS
     --------------------------------------------------------- */

  function updateTitleAndButtons() {
    if (el.title) {
      el.title.textContent = state.currentPath
        ? getTitle(state.currentPath)
        : "Choose a topic";
    }

    const index = state.currentIndex;
    const hasPrevious = index > 0;
    const hasNext = index >= 0 && index < state.notes.length - 1;

    [el.previous].forEach(button => {
      if (button) button.disabled = !hasPrevious;
    });

    [el.next, el.footerNext].forEach(button => {
      if (button) button.disabled = !hasNext;
    });

    if (el.previous) {
      el.previous.title = hasPrevious
        ? `Previous: ${state.notes[index - 1].title}`
        : "No previous note";
    }

    if (el.next) {
      el.next.title = hasNext
        ? `Next: ${state.notes[index + 1].title}`
        : "No next note";
    }

    if (el.banner) {
      el.banner.hidden = !isCheatSheet(state.currentPath);
    }
  }

  async function navigate(offset) {
    const index = state.currentIndex + offset;

    if (index < 0 || index >= state.notes.length) return;

    await openNote(state.notes[index].path);
  }

  function updateProgress() {
    if (!el.workspace) return;

    const distance = el.workspace.scrollHeight - el.workspace.clientHeight;
    const percentage = distance <= 0
      ? 100
      : Math.max(0, Math.min(
          100,
          Math.round((el.workspace.scrollTop / distance) * 100)
        ));

    if (el.progressFill) {
      el.progressFill.style.width = `${percentage}%`;
    }

    if (el.progressText) {
      el.progressText.textContent = `${percentage}% read`;
    }
  }

  /* ---------------------------------------------------------
     OPEN A NOTE
     --------------------------------------------------------- */

  async function openNote(path, options = {}) {
    const normalized = normalizePath(path);
    const note = state.notes.find(item => item.path === normalized);

    if (!note) {
      showError(`Note not found: ${normalized}`);
      return;
    }

    const requestId = ++state.requestId;

    state.currentPath = normalized;
    state.currentIndex = state.notes.findIndex(
      item => item.path === normalized
    );

    if (options.updateHistory !== false) {
      setURL(normalized, options.replaceHistory === true);
    }

    renderNotesList();
    updateTitleAndButtons();
    closeMobileSidebar();
    hideError();

    setHidden(el.welcome, true);
    setHidden(el.card, false);

    if (el.article) {
      el.article.innerHTML = `
        <div class="loading-notes">
          <span class="loading-spinner" aria-hidden="true"></span>
          <span>Loading your notes...</span>
        </div>`;
    }

    if (el.workspace) el.workspace.scrollTop = 0;
    updateProgress();

    try {
      await ensureLibraries();

      const markdown = await fetchMarkdown(normalized);

      // Ignore older requests if the user selected another note.
      if (requestId !== state.requestId) return;

      el.article.innerHTML = renderMarkdown(markdown);

      // Remove duplicate file-name heading if present.
      const firstHeading = $("h1", el.article);
      if (
        firstHeading &&
        firstHeading.textContent.trim().toLowerCase() ===
        getTitle(normalized).trim().toLowerCase()
      ) {
        firstHeading.remove();
      }

      if (isCheatSheet(normalized)) {
        loadChecklist();
        buildChecklist();
      }

      configureLinks(el.article);
      createTOC();
      renderMath(el.article);
      updateTitleAndButtons();
      updateProgress();

      if (location.hash) {
        requestAnimationFrame(() => {
          const id = decodeURIComponent(location.hash.slice(1));
          document.getElementById(id)?.scrollIntoView({
            behavior: "auto",
            block: "start"
          });
        });
      }
    } catch (error) {
      if (requestId !== state.requestId) return;

      console.error("Xi Notes: note loading failed.", error);
      showError(
        `${error.message || "Unable to load this note."} ` +
        "Check your connection and the Markdown file in GitHub, then try again."
      );
    }
  }

  /* ---------------------------------------------------------
     EVENT HANDLERS
     --------------------------------------------------------- */

  function bindEvents() {
    // Both existing three-line buttons operate the same sidebar.
    [el.sidebarToggle, el.topbarMenu].forEach(button => {
      button?.addEventListener("click", event => {
        event.preventDefault();
        toggleSidebar();
      });
    });

    el.backdrop?.addEventListener("click", closeMobileSidebar);

    el.navigation?.addEventListener("click", event => {
      const link = event.target.closest("[data-note-path]");
      if (!link) return;

      event.preventDefault();
      openNote(link.dataset.notePath);
    });

    el.previous?.addEventListener("click", () => navigate(-1));
    el.next?.addEventListener("click", () => navigate(1));
    el.footerNext?.addEventListener("click", () => navigate(1));

    el.start?.addEventListener("click", () => {
      const path = getRequestedPath() ||
        state.notes.find(note => isCheatSheet(note.path))?.path ||
        state.notes[0]?.path;

      if (path) openNote(path);
    });

    el.search?.addEventListener("input", event => {
      state.searchTerm = event.target.value || "";
      renderNotesList();
    });

    el.search?.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        el.search.value = "";
        state.searchTerm = "";
        renderNotesList();
        el.search.blur();
      }

      if (event.key === "Enter") {
        const first = $("[data-note-path]", el.navigation);
        if (first) openNote(first.dataset.notePath);
      }
    });

    // Checklist state persists for the current IST date.
    document.addEventListener("change", event => {
      const checkbox = event.target.closest("input[data-revision-key]");
      if (!checkbox) return;

      checkDailyReset();

      const key = checkbox.dataset.revisionKey;
      state.checkedSections[key] = checkbox.checked;
      saveChecklist();

      checkbox.closest(".cheat-sheet-section")
        ?.classList.toggle("is-checked", checkbox.checked);
    });

    el.workspace?.addEventListener("scroll", updateProgress, {
      passive: true
    });

    window.addEventListener("resize", () => {
      syncSidebar();
      updateProgress();
    });

    window.addEventListener("popstate", () => {
      const path = getRequestedPath();

      if (path && state.notes.some(note => note.path === path)) {
        openNote(path, { updateHistory: false });
      } else if (!path && state.notes.length) {
        const fallback = state.notes.find(note => isCheatSheet(note.path))
          || state.notes[0];

        openNote(fallback.path, {
          updateHistory: false
        });
      }
    });

    window.addEventListener("focus", checkDailyReset);
    document.addEventListener("visibilitychange", checkDailyReset);

    document.addEventListener("keydown", event => {
      const target = event.target;
      const typing = target instanceof HTMLElement && (
        target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      );

      if (typing) return;

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        el.search?.focus();
        return;
      }

      if (event.key === "/" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        el.search?.focus();
      }

      if (event.key === "ArrowLeft" && !event.altKey) {
        navigate(-1);
      }

      if (event.key === "ArrowRight" && !event.altKey) {
        navigate(1);
      }

      if (event.key === "Escape" && isMobile()) {
        closeMobileSidebar();
      }
    });

    el.retry?.addEventListener("click", () => {
      if (state.currentPath) {
        openNote(state.currentPath, { updateHistory: false });
      } else {
        initialize();
      }
    });
  }

  /* ---------------------------------------------------------
     INITIALIZATION
     --------------------------------------------------------- */

  async function initialize() {
    try {
      await discoverNotes();

      loadChecklist();

      const requested = getRequestedPath();
      const validRequested = state.notes.find(
        note => note.path.toLowerCase() === requested.toLowerCase()
      );

      const defaultNote = state.notes.find(note =>
        isCheatSheet(note.path)
      ) || state.notes[0];

      const initialNote = validRequested || defaultNote;

      if (!initialNote) {
        showError("No Markdown notes were found in the notes folder.");
        return;
      }

      await openNote(initialNote.path, { replaceHistory: true });
    } catch (error) {
      console.error("Xi Notes initialization failed.", error);
      showError(
        `${error.message || "Could not retrieve notes from GitHub."} ` +
        "Check your internet connection and try again."
      );
    }
  }

  function start() {
    // Ensure the existing HTML's loading state is replaced.
    if (el.navigation) {
      const loading = $("#loadingNotes", el.navigation);
      loading?.remove();
    }

    bindEvents();
    syncSidebar();

    // Keep the sidebar toggle as a three-line menu.
    $$(".close-sidebar, .sidebar-close, #closeSidebar").forEach(button => {
      button.remove();
    });

    initialize();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
