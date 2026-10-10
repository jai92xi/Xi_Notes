/* =========================================================
   XI NOTES — DAILY REVISION WORKSPACE
   GitHub Pages + Markdown + KaTeX
   ========================================================= */

(() => {
  "use strict";

  /* -------------------------------------------------------
     1. CONFIGURATION
     ------------------------------------------------------- */

  const CONFIG = {
    owner: "jai92xi",
    repo: "Xi_Notes",
    branch: "main",
    notesFolder: "notes",
    cheatSheet: "1CheatSheet.md",

    githubApi:
      "https://api.github.com/repos/jai92xi/Xi_Notes",

    rawBase:
      "https://raw.githubusercontent.com/jai92xi/Xi_Notes/main",

    contentBase:
      "https://cdn.jsdelivr.net/gh/jai92xi/Xi_Notes@main",

    refreshMs: 5 * 60 * 1000
  };

  /* -------------------------------------------------------
     2. STATE
     ------------------------------------------------------- */

  const state = {
    notes: [],
    currentPath: "",
    currentIndex: -1,
    searchTerm: "",
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    loading: false,
    requestId: 0,
    checkedSections: {},
    istDate: getIstDate(),
    midnightTimer: null
  };

  /* -------------------------------------------------------
     3. DOM HELPERS
     ------------------------------------------------------- */

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  function findElement(...selectors) {
    for (const selector of selectors) {
      const element = $(selector);
      if (element) return element;
    }
    return null;
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function encodePath(path) {
    return path
      .split("/")
      .map(part => encodeURIComponent(part))
      .join("/");
  }

  function decodePath(path) {
    try {
      return decodeURIComponent(path);
    } catch {
      return path;
    }
  }

  function getFileName(path) {
    const filename = path.split("/").pop() || path;

    return filename
      .replace(/\.md$/i, "")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getDisplayTitle(path) {
    return getFileName(path);
  }

  function normalizePath(path) {
    return String(path || "")
      .replace(/^\/+/, "")
      .replace(/\\/g, "/")
      .replace(/\/+/g, "/");
  }

  function isCheatSheet(path) {
    return normalizePath(path).toLowerCase() ===
      `${CONFIG.notesFolder}/${CONFIG.cheatSheet}`.toLowerCase();
  }

  function getNoteUrl(path) {
    return `?note=${encodeURIComponent(normalizePath(path))}`;
  }

  function updateUrl(path, replace = false) {
    const url = new URL(window.location.href);

    url.searchParams.set("note", normalizePath(path));

    if (replace) {
      history.replaceState({ note: path }, "", url);
    } else {
      history.pushState({ note: path }, "", url);
    }
  }

  /* -------------------------------------------------------
     4. ICONS
     ------------------------------------------------------- */

  const ICONS = {
    menu: `
      <svg viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round">
        <path d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    `,

    search: `
      <svg viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round">
        <circle cx="10.8" cy="10.8" r="6.8"/>
        <path d="m16 16 4 4"/>
      </svg>
    `,

    previous: `
      <svg viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="m14.5 18-6-6 6-6"/>
        <path d="M9 12h11"/>
      </svg>
    `,

    next: `
      <svg viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="m9.5 18 6-6-6-6"/>
        <path d="M4 12h11"/>
      </svg>
    `,

    check: `
      <svg viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="m5 12 4 4L19 6"/>
      </svg>
    `,

    book: `
      <svg viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z"/>
        <path d="M4 5.5v14A2.5 2.5 0 0 1 6.5 17H20"/>
      </svg>
    `,

    arrowRight: `
      <svg viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14M13 6l6 6-6 6"/>
      </svg>
    `
  };

  /* -------------------------------------------------------
     5. LOAD REQUIRED LIBRARIES
     ------------------------------------------------------- */

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = $$("script").find(script => script.src === src);

      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve();
          return;
        }

        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error(`Could not load ${src}`)),
          { once: true }
        );

        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;

      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Could not load ${src}`));
      };

      document.head.appendChild(script);
    });
  }

  function loadStylesheet(href) {
    return new Promise((resolve, reject) => {
      const existing = $$('link[rel="stylesheet"]').find(
        link => link.href === href
      );

      if (existing) {
        resolve();
        return;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;

      link.onload = resolve;
      link.onerror = () =>
        reject(new Error(`Could not load stylesheet ${href}`));

      document.head.appendChild(link);
    });
  }

  async function ensureLibraries() {
    if (!window.marked) {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/marked@15.0.7/marked.min.js"
      );
    }

    if (!window.DOMPurify) {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/dompurify@3.2.6/dist/purify.min.js"
      );
    }

    if (!window.renderMathInElement) {
      await loadStylesheet(
        "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css"
      );

      await loadScript(
        "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js"
      );

      await loadScript(
        "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/contrib/auto-render.min.js"
      );
    }

    if (window.marked?.setOptions) {
      window.marked.setOptions({
        gfm: true,
        breaks: false
      });
    }
  }

  /* -------------------------------------------------------
     6. FIND PAGE ELEMENTS
     ------------------------------------------------------- */

  const elements = {
    shell: findElement("#appShell", ".app-shell"),
    sidebar: findElement("#sidebar", ".sidebar"),
    sidebarContent: findElement(
      "#sidebarContent",
      ".sidebar-content"
    ),
    notesNavigation: findElement(
      "#notesNavigation",
      "#notesList",
      ".notes-navigation"
    ),
    searchInput: findElement(
      "#searchInput",
      "#noteSearch",
      ".search-input"
    ),
    noteCount: findElement(
      "#notesCount",
      "#noteCount",
      ".notes-count"
    ),
    currentTitle: findElement(
      "#currentNoteName",
      "#currentNoteTitle",
      ".current-note-name"
    ),
    article: findElement(
      "#articleContent",
      "#markdownContent",
      ".article-content"
    ),
    contentCard: findElement(
      "#contentCard",
      ".content-card"
    ),
    workspace: findElement(
      "#readingWorkspace",
      ".reading-workspace"
    ),
    previousButton: findElement(
      "#previousButton",
      "#prevButton",
      ".nav-previous"
    ),
    nextButton: findElement(
      "#nextButton",
      ".nav-next"
    ),
    progressFill: findElement(
      "#progressFill",
      ".progress-fill"
    ),
    progressText: findElement(
      "#readingProgressText",
      "#progressText"
    ),
    revisionBanner: findElement(
      "#revisionBanner",
      ".revision-banner"
    ),
    articleFooter: findElement(
      "#articleFooter",
      ".article-footer"
    ),
    backdrop: findElement(
      "#sidebarBackdrop",
      ".sidebar-backdrop"
    )
  };

  /* -------------------------------------------------------
     7. PREPARE PAGE STRUCTURE
     ------------------------------------------------------- */

  function ensurePageStructure() {
    if (!elements.shell) {
      elements.shell = makeElement("div", "app-shell");
      elements.shell.id = "appShell";
      document.body.prepend(elements.shell);
    }

    if (!elements.sidebar) {
      elements.sidebar = makeElement("aside", "sidebar");
      elements.sidebar.id = "sidebar";
      elements.shell.prepend(elements.sidebar);
    }

    if (!elements.sidebarContent) {
      elements.sidebarContent = makeElement(
        "div",
        "sidebar-content"
      );
      elements.sidebarContent.id = "sidebarContent";
      elements.sidebar.appendChild(elements.sidebarContent);
    }

    if (!elements.notesNavigation) {
      elements.notesNavigation = makeElement(
        "nav",
        "notes-navigation"
      );
      elements.notesNavigation.id = "notesNavigation";
      elements.notesNavigation.setAttribute(
        "aria-label",
        "Notes"
      );
      elements.sidebarContent.appendChild(elements.notesNavigation);
    }

    if (!elements.searchInput) {
      const wrapper = makeElement("div", "search-wrapper");

      const searchIcon = makeElement("span", "search-icon");
      searchIcon.innerHTML = ICONS.search;

      elements.searchInput = document.createElement("input");
      elements.searchInput.id = "searchInput";
      elements.searchInput.className = "search-input";
      elements.searchInput.type = "search";
      elements.searchInput.placeholder = "Search notes...";
      elements.searchInput.setAttribute(
        "aria-label",
        "Search notes"
      );

      wrapper.append(searchIcon, elements.searchInput);
      elements.sidebarContent.prepend(wrapper);
    }

    let main = findElement("#mainPanel", ".main-panel");

    if (!main) {
      main = makeElement("main", "main-panel");
      main.id = "mainPanel";
      elements.shell.appendChild(main);
    }

    if (!elements.workspace) {
      elements.workspace = makeElement(
        "section",
        "reading-workspace"
      );
      elements.workspace.id = "readingWorkspace";
      main.appendChild(elements.workspace);
    }

    if (!elements.contentCard) {
      elements.contentCard = makeElement(
        "article",
        "content-card"
      );
      elements.contentCard.id = "contentCard";
      elements.workspace.appendChild(elements.contentCard);
    }

    if (!elements.article) {
      elements.article = makeElement(
        "div",
        "article-content"
      );
      elements.article.id = "articleContent";
      elements.contentCard.appendChild(elements.article);
    }

    ensureTopbar(main);
    ensureRevisionBanner();
    ensureBackdrop();
    ensureProgressElements();
    ensureFooter();
    ensureSidebarHeader();

    // Refresh references to elements created during setup.
    elements.currentTitle = findElement(
      "#currentNoteName",
      "#currentNoteTitle",
      ".current-note-name"
    );

    elements.previousButton = findElement(
      "#previousButton",
      "#prevButton"
    );

    elements.nextButton = findElement("#nextButton");

    elements.progressFill = findElement("#progressFill");
    elements.progressText = findElement("#readingProgressText");

    elements.revisionBanner = findElement("#revisionBanner");
    elements.backdrop = findElement("#sidebarBackdrop");
    elements.articleFooter = findElement("#articleFooter");
  }

  function ensureSidebarHeader() {
    let header = findElement("#sidebarHeader", ".sidebar-header");

    if (!header) {
      header = makeElement("div", "sidebar-header");
      header.id = "sidebarHeader";
      elements.sidebar.prepend(header);
    }

    if (!findElement("#brandName", ".brand-name", header)) {
      const brand = makeElement("a", "brand");
      brand.href = window.location.pathname;
      brand.setAttribute("aria-label", "Xi Notes home");

      const mark = makeElement("span", "brand-mark", "Xi");
      const name = makeElement("span", "brand-name", "Xi Notes");
      name.id = "brandName";

      brand.append(mark, name);
      header.appendChild(brand);
    }

    // Remove the old X/close button if present.
    const closeButtons = $$(
      "#closeSidebar, .close-sidebar, .sidebar-close, [data-action='close-sidebar']",
      header
    );

    closeButtons.forEach(button => button.remove());
  }

  function ensureTopbar(main) {
    let topbar = findElement("#topbar", ".topbar");

    if (!topbar) {
      topbar = makeElement("header", "topbar");
      topbar.id = "topbar";

      const leading = makeElement("div", "topbar-leading");

      const menuButton = makeElement("button", "icon-button topbar-menu");
      menuButton.id = "sidebarToggle";
      menuButton.type = "button";
      menuButton.innerHTML = ICONS.menu;
      menuButton.setAttribute("aria-label", "Collapse or open notes sidebar");
      menuButton.setAttribute("aria-expanded", "true");

      const heading = makeElement("div", "current-note-heading");

      const title = makeElement("h1", "current-note-name", "Xi Notes");
      title.id = "currentNoteName";

      heading.appendChild(title);
      leading.append(menuButton, heading);

      const actions = makeElement("div", "topbar-actions");

      const progress = makeElement("div", "reading-progress");
      const track = makeElement("div", "progress-track");
      const fill = makeElement("div", "progress-fill");
      fill.id = "progressFill";
      track.appendChild(fill);

      const progressText = makeElement("span", "", "0% read");
      progressText.id = "readingProgressText";

      progress.append(track, progressText);

      const buttons = makeElement("div", "navigation-buttons");

      const prev = makeElement("button", "nav-button nav-previous");
      prev.id = "previousButton";
      prev.type = "button";
      prev.innerHTML = `${ICONS.previous}<span>Previous</span>`;

      const next = makeElement("button", "nav-button nav-next");
      next.id = "nextButton";
      next.type = "button";
      next.innerHTML = `<span>Next</span>${ICONS.next}`;

      buttons.append(prev, next);
      actions.append(progress, buttons);
      topbar.append(leading, actions);

      main.prepend(topbar);
    }

    if (!findElement(".topbar-accent", main)) {
      const accent = makeElement("div", "topbar-accent");
      accent.setAttribute("aria-hidden", "true");
      topbar.after(accent);
    }

    let toggle = findElement("#sidebarToggle");

    if (!toggle) {
      const leading = findElement(".topbar-leading", topbar);
      toggle = makeElement("button", "icon-button topbar-menu");
      toggle.id = "sidebarToggle";
      toggle.type = "button";
      toggle.innerHTML = ICONS.menu;
      toggle.setAttribute("aria-label", "Collapse or open notes sidebar");
      toggle.setAttribute("aria-expanded", "true");
      leading?.prepend(toggle);
    }

    // Ensure the menu uses the three-line icon and not an X.
    toggle.innerHTML = ICONS.menu;
    toggle.setAttribute("aria-label", "Collapse or open notes sidebar");
  }

  function ensureRevisionBanner() {
    if (!elements.contentCard) return;

    let banner = findElement("#revisionBanner", ".revision-banner");

    if (!banner) {
      banner = makeElement("div", "revision-banner");
      banner.id = "revisionBanner";

      const icon = makeElement(
        "span",
        "revision-banner-check"
      );
      icon.innerHTML = ICONS.check;

      const text = makeElement(
        "span",
        "revision-banner-text",
        "Daily revision checklist · Resets at midnight IST"
      );

      banner.append(icon, text);

      elements.contentCard.prepend(banner);
    } else {
      // Keep the message short and consistent.
      const text = findElement(
        ".revision-banner-text",
        "span:last-child",
        banner
      );

      if (text) {
        text.textContent =
          "Daily revision checklist · Resets at midnight IST";
      }
    }
  }

  function ensureBackdrop() {
    if (!elements.backdrop) {
      elements.backdrop = makeElement("button", "sidebar-backdrop");
      elements.backdrop.id = "sidebarBackdrop";
      elements.backdrop.type = "button";
      elements.backdrop.setAttribute("aria-label", "Close notes menu");
      elements.backdrop.tabIndex = -1;
      elements.shell.appendChild(elements.backdrop);
    }
  }

  function ensureProgressElements() {
    if (!findElement("#progressFill")) {
      const track = findElement(".progress-track");
      if (track) {
        const fill = makeElement("div", "progress-fill");
        fill.id = "progressFill";
        track.appendChild(fill);
      }
    }

    if (!findElement("#readingProgressText")) {
      const progress = findElement(".reading-progress");
      if (progress) {
        const text = makeElement("span", "", "0% read");
        text.id = "readingProgressText";
        progress.appendChild(text);
      }
    }
  }

  function ensureFooter() {
    const main = findElement("#mainPanel", ".main-panel");
    if (!main || findElement("#appFooter", ".app-footer")) return;

    const footer = makeElement("footer", "app-footer");
    footer.id = "appFooter";

    const left = makeElement("div", "app-footer-left");
    const dot = makeElement("span", "footer-dot");
    const label = makeElement("span", "", "Your daily learning space");
    left.append(dot, label);

    const right = makeElement("span", "app-footer-right", "KEEP LEARNING");
    footer.append(left, right);

    main.appendChild(footer);
  }

  /* -------------------------------------------------------
     8. SIDEBAR COLLAPSE / MOBILE MENU
     ------------------------------------------------------- */

  function isMobile() {
    return window.matchMedia("(max-width: 760px)").matches;
  }

  function syncSidebarState() {
    if (!elements.shell) return;

    elements.shell.classList.toggle(
      "sidebar-collapsed",
      state.sidebarCollapsed && !isMobile()
    );

    elements.shell.classList.toggle(
      "mobile-sidebar-open",
      state.mobileSidebarOpen && isMobile()
    );

    const toggle = findElement("#sidebarToggle");

    if (toggle) {
      toggle.innerHTML = ICONS.menu;
      toggle.setAttribute(
        "aria-expanded",
        String(isMobile()
          ? state.mobileSidebarOpen
          : !state.sidebarCollapsed)
      );
    }

    if (elements.backdrop) {
      elements.backdrop.hidden = !(
        isMobile() && state.mobileSidebarOpen
      );
    }
  }

  function toggleSidebar() {
    if (isMobile()) {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    } else {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    }

    syncSidebarState();
  }

  function closeMobileSidebar() {
    state.mobileSidebarOpen = false;
    syncSidebarState();
  }

  /* -------------------------------------------------------
     9. GITHUB NOTE DISCOVERY
     ------------------------------------------------------- */

  async function fetchJson(url) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        `GitHub request failed (${response.status})`
      );
    }

    return response.json();
  }

  async function discoverNotes() {
    const url =
      `${CONFIG.githubApi}/git/trees/${CONFIG.branch}?recursive=1`;

    const data = await fetchJson(url);

    if (!Array.isArray(data.tree)) {
      throw new Error("GitHub returned an invalid file listing.");
    }

    const folderPrefix = `${CONFIG.notesFolder}/`;

    const notes = data.tree
      .filter(item =>
        item.type === "blob" &&
        item.path.startsWith(folderPrefix) &&
        /\.md$/i.test(item.path) &&
        !item.path.split("/").some(part => part.startsWith("."))
      )
      .map(item => ({
        path: normalizePath(item.path),
        title: getDisplayTitle(item.path),
        sha: item.sha,
        size: item.size || 0
      }))
      .sort((a, b) =>
        a.title.localeCompare(b.title, undefined, {
          numeric: true,
          sensitivity: "base"
        })
      );

    if (!notes.length) {
      throw new Error(
        `No Markdown files were found under ${CONFIG.notesFolder}/.`
      );
    }

    state.notes = notes;

    if (elements.noteCount) {
      elements.noteCount.textContent = String(notes.length);
    }

    renderNotesList();

    return notes;
  }

  /* -------------------------------------------------------
     10. SIDEBAR NOTE LIST
     ------------------------------------------------------- */

  function renderNotesList() {
    const container = elements.notesNavigation;
    if (!container) return;

    const term = state.searchTerm.trim().toLowerCase();

    const filtered = state.notes.filter(note => {
      if (!term) return true;

      return note.title.toLowerCase().includes(term) ||
        note.path.toLowerCase().includes(term);
    });

    container.replaceChildren();

    if (!filtered.length) {
      const empty = makeElement("div", "empty-search");

      const icon = makeElement("span", "empty-search-icon", "⌕");
      const title = makeElement("p", "", "No notes found");
      const subtitle = makeElement(
        "span",
        "",
        "Try a different search."
      );

      empty.append(icon, title, subtitle);
      container.appendChild(empty);
      return;
    }

    for (const note of filtered) {
      const link = document.createElement("a");

      link.className = "note-link";
      link.href = getNoteUrl(note.path);
      link.dataset.notePath = note.path;

      if (note.path === state.currentPath) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }

      const icon = makeElement("span", "note-icon", "◇");
      icon.setAttribute("aria-hidden", "true");

      const title = makeElement("span", "note-title", note.title);

      link.append(icon, title);

      if (note.path === state.currentPath) {
        const indicator = makeElement(
          "span",
          "note-active-indicator"
        );
        indicator.setAttribute("aria-hidden", "true");
        link.appendChild(indicator);
      }

      container.appendChild(link);
    }
  }

  /* -------------------------------------------------------
     11. FETCH MARKDOWN CONTENT
     ------------------------------------------------------- */

  async function fetchMarkdown(path) {
    const encoded = encodePath(path);

    const urls = [
      `${CONFIG.rawBase}/${encoded}`,
      `${CONFIG.contentBase}/${encoded}`
    ];

    let lastError;

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error(`Could not load note (${response.status}).`);
        }

        return await response.text();
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Unable to load this note.");
  }

  /* -------------------------------------------------------
     12. MATH PROTECTION DURING MARKDOWN PARSING
     ------------------------------------------------------- */

  function protectMath(markdown) {
    const expressions = [];

    const protectedMarkdown = String(markdown).replace(
      /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|(?<!\\)\$(?!\$)[^\n$]+?(?<!\\)\$)/g,
      match => {
        const token = `XI_MATH_PLACEHOLDER_${expressions.length}_END`;
        expressions.push(match);
        return token;
      }
    );

    return {
      text: protectedMarkdown,
      restore(html) {
        return html.replace(
          /XI_MATH_PLACEHOLDER_(\d+)_END/g,
          (match, index) => {
            const expression = expressions[Number(index)];
            return expression === undefined
              ? match
              : escapeHTML(expression);
          }
        );
      }
    };
  }

  /* -------------------------------------------------------
     13. SAFE MARKDOWN RENDERING
     ------------------------------------------------------- */

  function applyHighlightSyntax(markdown) {
    // Supports ==highlighted text== without changing code blocks.
    const parts = String(markdown).split(
      /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/g
    );

    return parts.map((part, index) => {
      const isCode = index % 2 === 1;

      if (isCode) return part;

      return part.replace(
        /==(.+?)==/g,
        (_, text) => `<mark class="xi-highlight">${text}</mark>`
      );
    }).join("");
  }

  function sanitizeHtml(html) {
    if (window.DOMPurify) {
      return window.DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        ADD_ATTR: [
          "target",
          "rel",
          "class",
          "id",
          "aria-label",
          "data-revision-section"
        ]
      });
    }

    return html;
  }

  function renderMarkdown(markdown) {
    const protectedMath = protectMath(markdown);
    const preparedMarkdown = applyHighlightSyntax(protectedMath.text);

    const parsed = window.marked.parse(preparedMarkdown);
    const restored = protectedMath.restore(parsed);

    return sanitizeHtml(restored);
  }

  function renderMath(container) {
    if (!window.renderMathInElement || !container) return;

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
          "script",
          "noscript",
          "style",
          "textarea",
          "pre",
          "code",
          "option"
        ]
      });
    } catch (error) {
      console.warn("Math rendering warning:", error);
    }
  }

  /* -------------------------------------------------------
     14. CHEAT SHEET DAILY REVISION
     ------------------------------------------------------- */

  function getIstDate(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);

    const partMap = Object.fromEntries(
      parts.map(part => [part.type, part.value])
    );

    return `${partMap.year}-${partMap.month}-${partMap.day}`;
  }

  function getChecklistStorageKey() {
    return `xi-cheatsheet-checks-${state.istDate}`;
  }

  function loadChecklistState() {
    try {
      state.checkedSections = JSON.parse(
        localStorage.getItem(getChecklistStorageKey()) || "{}"
      );
    } catch {
      state.checkedSections = {};
    }
  }

  function saveChecklistState() {
    try {
      localStorage.setItem(
        getChecklistStorageKey(),
        JSON.stringify(state.checkedSections)
      );
    } catch (error) {
      console.warn("Could not save revision checklist:", error);
    }
  }

  function getSectionKey(heading, index) {
    const normalized = heading
      .toLowerCase()
      .replace(/<[^>]*>/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);

    return `${normalized || "topic"}-${index}`;
  }

  function makeCheatSheetSections(container) {
    const headings = $$("h1, h2, h3, h4, h5, h6", container);

    if (!headings.length) return;

    const contentNodes = Array.from(container.childNodes);
    const sections = [];
    let currentSection = null;
    let headingIndex = 0;

    for (const node of contentNodes) {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        /^H[1-6]$/.test(node.tagName)
      ) {
        currentSection = {
          heading: node,
          nodes: [],
          index: headingIndex++
        };

        sections.push(currentSection);
      } else if (currentSection) {
        currentSection.nodes.push(node);
      }
    }

    if (!sections.length) return;

    const fragment = document.createDocumentFragment();

    for (const section of sections) {
      const headingText = section.heading.textContent.trim();
      const key = getSectionKey(headingText, section.index);
      const checked = Boolean(state.checkedSections[key]);

      const wrapper = makeElement(
        "section",
        "cheat-sheet-section"
      );

      wrapper.dataset.revisionSection = key;

      const headingRow = makeElement(
        "div",
        "cheat-sheet-heading"
      );

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "cheat-sheet-checkbox";
      checkbox.checked = checked;
      checkbox.setAttribute(
        "aria-label",
        `Mark ${headingText} as revised`
      );
      checkbox.dataset.revisionKey = key;

      section.heading.parentNode?.removeChild(section.heading);

      headingRow.append(checkbox, section.heading);
      wrapper.appendChild(headingRow);

      for (const node of section.nodes) {
        wrapper.appendChild(node);
      }

      if (checked) {
        wrapper.classList.add("is-checked");
      }

      fragment.appendChild(wrapper);
    }

    container.replaceChildren(fragment);
  }

  function clearDailyChecklistIfNeeded() {
    const currentDate = getIstDate();

    if (currentDate === state.istDate) return;

    state.istDate = currentDate;
    state.checkedSections = {};

    try {
      localStorage.setItem(getChecklistStorageKey(), "{}");
    } catch {
      // The checklist remains usable for this page session.
    }

    if (isCheatSheet(state.currentPath)) {
      renderCurrentNote({ updateHistory: false });
    }

    scheduleMidnightReset();
  }

  function millisecondsUntilNextIstMidnight() {
    const now = new Date();

    const dateParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(now);

    const values = Object.fromEntries(
      dateParts.map(part => [part.type, part.value])
    );

    // IST is UTC+05:30. Calculate the next midnight in IST.
    const todayUtcMidnight = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day)
    );

    const nextIstMidnight =
      todayUtcMidnight + 24 * 60 * 60 * 1000 -
      (5 * 60 + 30) * 60 * 1000;

    return Math.max(1000, nextIstMidnight - now.getTime() + 1000);
  }

  function scheduleMidnightReset() {
    if (state.midnightTimer) {
      clearTimeout(state.midnightTimer);
    }

    state.midnightTimer = setTimeout(() => {
      clearDailyChecklistIfNeeded();
      scheduleMidnightReset();
    }, millisecondsUntilNextIstMidnight());
  }

  /* -------------------------------------------------------
     15. UPDATE TITLE AND NAVIGATION
     ------------------------------------------------------- */

  function updateCurrentTitle(path) {
    const title = getDisplayTitle(path);

    if (elements.currentTitle) {
      elements.currentTitle.textContent = title;
      elements.currentTitle.title = title;
    }

    document.title = `${title} | Xi Notes`;
  }

  function updateNavigationButtons() {
    const index = state.notes.findIndex(
      note => note.path === state.currentPath
    );

    state.currentIndex = index;

    if (elements.previousButton) {
      elements.previousButton.disabled = index <= 0;
      elements.previousButton.setAttribute(
        "aria-label",
        index > 0
          ? `Previous note: ${state.notes[index - 1].title}`
          : "No previous note"
      );
    }

    if (elements.nextButton) {
      elements.nextButton.disabled =
        index < 0 || index >= state.notes.length - 1;

      elements.nextButton.setAttribute(
        "aria-label",
        index >= 0 && index < state.notes.length - 1
          ? `Next note: ${state.notes[index + 1].title}`
          : "No next note"
      );
    }
  }

  async function navigateByOffset(offset) {
    const nextIndex = state.currentIndex + offset;

    if (nextIndex < 0 || nextIndex >= state.notes.length) return;

    await openNote(state.notes[nextIndex].path);
  }

  /* -------------------------------------------------------
     16. READING PROGRESS
     ------------------------------------------------------- */

  function updateReadingProgress() {
    const workspace = elements.workspace;
    if (!workspace) return;

    const scrollableDistance =
      workspace.scrollHeight - workspace.clientHeight;

    const percentage = scrollableDistance <= 0
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (workspace.scrollTop / scrollableDistance) * 100
            )
          )
        );

    if (elements.progressFill) {
      elements.progressFill.style.width = `${percentage}%`;
    }

    if (elements.progressText) {
      elements.progressText.textContent = `${percentage}% read`;
    }
  }

  /* -------------------------------------------------------
     17. OPEN AND RENDER A NOTE
     ------------------------------------------------------- */

  async function openNote(path, options = {}) {
    const normalizedPath = normalizePath(path);
    const noteExists = state.notes.some(
      note => note.path === normalizedPath
    );

    if (!noteExists) {
      showError(
        "Note not found",
        "This Markdown file is not in the current GitHub notes list."
      );
      return;
    }

    state.currentPath = normalizedPath;
    state.currentIndex = state.notes.findIndex(
      note => note.path === normalizedPath
    );

    const requestId = ++state.requestId;

    updateCurrentTitle(normalizedPath);
    updateNavigationButtons();
    renderNotesList();

    if (options.updateHistory !== false) {
      updateUrl(normalizedPath, options.replaceHistory === true);
    }

    closeMobileSidebar();

    if (elements.article) {
      elements.article.innerHTML = `
        <div class="loading-notes">
          <span class="loading-spinner" aria-hidden="true"></span>
          <span>Loading your notes...</span>
        </div>
      `;
    }

    if (elements.workspace) {
      elements.workspace.scrollTop = 0;
    }

    updateReadingProgress();

    try {
      await ensureLibraries();

      const markdown = await fetchMarkdown(normalizedPath);

      // Ignore older requests if the user has already opened another note.
      if (requestId !== state.requestId) return;

      const renderedHtml = renderMarkdown(markdown);

      elements.article.innerHTML = renderedHtml;

      // This note title is already displayed in the top bar.
      // Remove a duplicate top-level heading only when it exactly matches
      // the filename, avoiding unwanted duplicate title display.
      removeDuplicateFileTitle(elements.article, normalizedPath);

      if (isCheatSheet(normalizedPath)) {
        loadChecklistState();
        makeCheatSheetSections(elements.article);
      }

      addSafeLinkBehavior(elements.article);
      renderMath(elements.article);
      highlightCodeBlocks(elements.article);

      // No content index / table of contents is created.
      updateReadingProgress();
      updateNavigationButtons();
    } catch (error) {
      if (requestId !== state.requestId) return;

      console.error("Could not open note:", error);

      showError(
        "Unable to load this note",
        "Check your internet connection and confirm the Markdown file exists in the notes folder on GitHub."
      );
    }
  }

  function removeDuplicateFileTitle(container, path) {
    const firstHeading = container.querySelector("h1");

    if (!firstHeading) return;

    const headingText = firstHeading.textContent
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

    const filename = getFileName(path)
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

    if (headingText === filename) {
      firstHeading.remove();
    }
  }

  function addSafeLinkBehavior(container) {
    $$("a", container).forEach(link => {
      const href = link.getAttribute("href");

      if (!href) return;

      if (/^https?:\/\//i.test(href)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }

      if (
        href.startsWith("#") &&
        href.length > 1
      ) {
        link.addEventListener("click", event => {
          const target = document.getElementById(
            decodeURIComponent(href.slice(1))
          );

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

  function highlightCodeBlocks(container) {
    // Optional syntax highlighting if highlight.js is included in index.html.
    if (!window.hljs) return;

    $$("pre code", container).forEach(block => {
      try {
        window.hljs.highlightElement(block);
      } catch (error) {
        console.warn("Code highlighting warning:", error);
      }
    });
  }

  /* -------------------------------------------------------
     18. ERROR STATE
     ------------------------------------------------------- */

  function showError(title, message) {
    if (!elements.article) return;

    elements.article.innerHTML = `
      <div class="status-panel">
        <div class="status-icon status-icon-error" aria-hidden="true">!</div>
        <h2>${escapeHTML(title)}</h2>
        <p>${escapeHTML(message)}</p>
        <button type="button" class="status-button" id="retryNoteButton">
          Try again
        </button>
      </div>
    `;

    const retry = findElement("#retryNoteButton", elements.article);

    retry?.addEventListener("click", () => {
      if (state.currentPath) {
        openNote(state.currentPath, { updateHistory: false });
      } else {
        initializeNotes();
      }
    });
  }

  /* -------------------------------------------------------
     19. EVENT HANDLERS
     ------------------------------------------------------- */

  function bindEvents() {
    // Menu button: one three-line button handles both open and collapse.
    document.addEventListener("click", event => {
      const toggle = event.target.closest("#sidebarToggle");

      if (toggle) {
        event.preventDefault();
        toggleSidebar();
        return;
      }

      const noteLink = event.target.closest("[data-note-path]");

      if (noteLink) {
        event.preventDefault();
        openNote(noteLink.dataset.notePath);
        return;
      }

      const previous = event.target.closest(
        "#previousButton, #prevButton"
      );

      if (previous) {
        event.preventDefault();
        navigateByOffset(-1);
        return;
      }

      const next = event.target.closest("#nextButton");

      if (next) {
        event.preventDefault();
        navigateByOffset(1);
        return;
      }

      const backdrop = event.target.closest("#sidebarBackdrop");

      if (backdrop) {
        closeMobileSidebar();
      }
    });

    if (elements.searchInput) {
      elements.searchInput.addEventListener("input", event => {
        state.searchTerm = event.target.value || "";
        renderNotesList();
      });

      elements.searchInput.addEventListener("keydown", event => {
        if (event.key === "Escape") {
          elements.searchInput.value = "";
          state.searchTerm = "";
          renderNotesList();
          elements.searchInput.blur();
        }

        if (event.key === "Enter") {
          const firstNote = elements.notesNavigation?.querySelector(
            "[data-note-path]"
          );

          if (firstNote) {
            openNote(firstNote.dataset.notePath);
          }
        }
      });
    }

    // Save daily revision checklist changes.
    document.addEventListener("change", event => {
      const checkbox = event.target.closest(
        "input[data-revision-key]"
      );

      if (!checkbox) return;

      clearDailyChecklistIfNeeded();

      const key = checkbox.dataset.revisionKey;

      state.checkedSections[key] = checkbox.checked;
      saveChecklistState();

      const section = checkbox.closest(".cheat-sheet-section");

      section?.classList.toggle("is-checked", checkbox.checked);
    });

    if (elements.workspace) {
      elements.workspace.addEventListener(
        "scroll",
        updateReadingProgress,
        { passive: true }
      );
    }

    window.addEventListener("resize", () => {
      syncSidebarState();
      updateReadingProgress();
    });

    window.addEventListener("popstate", () => {
      const path = getNoteFromUrl();

      if (path && state.notes.some(note => note.path === path)) {
        openNote(path, { updateHistory: false });
      }
    });

    window.addEventListener("focus", clearDailyChecklistIfNeeded);
    document.addEventListener(
      "visibilitychange",
      clearDailyChecklistIfNeeded
    );

    // Keyboard shortcuts.
    document.addEventListener("keydown", event => {
      const target = event.target;
      const typing = target instanceof HTMLElement &&
        (
          target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
        );

      if (typing) return;

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        elements.searchInput?.focus();
        return;
      }

      if (event.key === "ArrowLeft" && !event.altKey) {
        navigateByOffset(-1);
      }

      if (event.key === "ArrowRight" && !event.altKey) {
        navigateByOffset(1);
      }

      if (event.key === "/" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        elements.searchInput?.focus();
      }

      if (event.key === "Escape" && isMobile()) {
        closeMobileSidebar();
      }
    });
  }

  /* -------------------------------------------------------
     20. READ NOTE FROM URL
     ------------------------------------------------------- */

  function getNoteFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("note");

    if (!requested) return "";

    return normalizePath(requested);
  }

  function chooseInitialNote() {
    const requested = getNoteFromUrl();

    if (requested && state.notes.some(note => note.path === requested)) {
      return requested;
    }

    const cheatSheetPath =
      `${CONFIG.notesFolder}/${CONFIG.cheatSheet}`;

    const cheatSheetExists = state.notes.some(
      note => note.path === cheatSheetPath
    );

    return cheatSheetExists
      ? cheatSheetPath
      : state.notes[0]?.path || "";
  }

  /* -------------------------------------------------------
     21. INITIALIZE
     ------------------------------------------------------- */

  async function initializeNotes() {
    try {
      await ensureLibraries();

      await discoverNotes();

      loadChecklistState();
      scheduleMidnightReset();

      const initialPath = chooseInitialNote();

      if (!initialPath) {
        showError(
          "No notes found",
          "Add Markdown files to the notes folder in your Xi_Notes GitHub repository."
        );
        return;
      }

      await openNote(initialPath, {
        replaceHistory: true
      });
    } catch (error) {
      console.error("Xi Notes initialization failed:", error);

      showError(
        "Unable to load Xi Notes",
        "The app could not retrieve your notes from GitHub. Please check your connection and try again."
      );
    }
  }

  /* -------------------------------------------------------
     22. START APP
     ------------------------------------------------------- */

  function start() {
    ensurePageStructure();
    bindEvents();
    syncSidebarState();

    // Avoid showing an X or separate close button.
    const closeButtons = $$(
      "#closeSidebar, .close-sidebar, .sidebar-close, [data-action='close-sidebar']"
    );
    closeButtons.forEach(button => button.remove());

    initializeNotes();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, {
      once: true
    });
  } else {
    start();
  }
})();
