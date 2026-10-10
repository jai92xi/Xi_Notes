
/* =========================================================
   XI NOTES — COMPLETE APP.JS
   Theme: Lavender + Mint + Pink
   Features:
   - Searchable GitHub Markdown notes
   - Direct links using ?note=notes/example.md
   - Previous / Next navigation in the top bar
   - Collapsible sidebar with hamburger menu
   - Markdown, LaTeX formulas and code highlighting
   - Cheat sheet heading checkboxes
   - Green strike-through for completed sections
   - Checkbox state saved in localStorage
   ========================================================= */

(() => {
  "use strict";

  const CFG = {
    owner: "jai92xi",
    repo: "Xi_Notes",
    branch: "main",
    folder: "notes",
    defaultNote: "notes/1CheatSheet.md",
    api: "https://api.github.com/repos/jai92xi/Xi_Notes",
    raw: "https://raw.githubusercontent.com/jai92xi/Xi_Notes/main"
  };

  const $ = (selector, root = document) => root.querySelector(selector);

  const state = {
    notes: [],
    path: "",
    index: -1,
    query: "",
    request: 0,
    libraries: {},
    checked: {},
    mobileOpen: false
  };

  const STORAGE_KEY = "xi-notes-cheatsheet-checks-v2";

  /* =========================================================
     HELPERS
     ========================================================= */

  function normalize(path) {
    return String(path || "")
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/^(?:\.\/)+/, "");
  }

  function encodePath(path) {
    return normalize(path)
      .split("/")
      .map(encodeURIComponent)
      .join("/");
  }

  function titleOf(path) {
    const filename = normalize(path).split("/").pop() || path;

    return filename
      .replace(/\.md$/i, "")
      .replace(/^\d+[-_. ]*/, "")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Untitled note";
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

  function icon(name) {
    const paths = {
      menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
      left: '<path d="m15 18-6-6 6-6"/>',
      right: '<path d="m9 18 6-6-6-6"/>'
    };

    return `
      <svg viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true">
        ${paths[name] || paths.file}
      </svg>
    `;
  }

  function isCheatSheet(path) {
    return /(?:^|\/)1CheatSheet\.md$/i.test(normalize(path));
  }

  function readRevisionState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      state.checked = saved ? JSON.parse(saved) : {};

      if (
        !state.checked ||
        typeof state.checked !== "object" ||
        Array.isArray(state.checked)
      ) {
        state.checked = {};
      }
    } catch (error) {
      console.warn("Could not restore revision checklist.", error);
      state.checked = {};
    }
  }

  function saveRevisionState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.checked));
    } catch (error) {
      console.warn("Could not save revision checklist.", error);
    }
  }

  function revisionKey(path, heading, occurrence) {
    return [
      normalize(path).toLowerCase(),
      String(occurrence),
      heading.trim().toLowerCase()
    ].join("::");
  }

  /* =========================================================
     BUILD INTERFACE
     ========================================================= */

  function buildApp() {
    const root = $("#app");

    if (!root) {
      console.error('Xi Notes requires <div id="app"></div> in index.html.');
      return;
    }

    root.innerHTML = `
      <div id="xiApp">
        <header class="xi-topbar">
          <button
            class="xi-icon-btn"
            id="xiMenu"
            type="button"
            aria-label="Toggle notes sidebar"
            aria-expanded="true"
            title="Show or hide notes">
            ${icon("menu")}
          </button>

          <div class="xi-top-current" id="xiTopCurrent">
            Revision notes
          </div>

          <div class="xi-top-spacer"></div>

          <span class="xi-read-meta" id="xiReadMeta"></span>

          <button
            class="xi-nav-btn"
            id="xiPrevious"
            type="button"
            disabled>
            ${icon("left")} Previous
          </button>

          <button
            class="xi-nav-btn primary"
            id="xiNext"
            type="button"
            disabled>
            Next topic ${icon("right")}
          </button>
        </header>

        <div class="xi-layout">
          <aside class="xi-sidebar" id="xiSidebar">
            <div class="xi-library-head">
              <label class="xi-search">
                ${icon("search")}
                <input
                  id="xiSearch"
                  type="search"
                  placeholder="Search topics..."
                  autocomplete="off"
                  aria-label="Search notes">
              </label>
            </div>

            <nav
              class="xi-library-scroll"
              id="xiLibrary"
              aria-label="Notes">
              <div class="xi-empty">Loading notes…</div>
            </nav>
          </aside>

          <div class="xi-mobile-backdrop" id="xiBackdrop"></div>

          <main class="xi-reader">
            <div class="xi-reader-scroll" id="xiReaderScroll">
              <div class="xi-article-wrap">
                <header class="xi-article-header">
                  <h1 class="xi-article-title" id="xiArticleTitle">
                    Loading notes…
                  </h1>
                  <div
                    class="xi-article-subtitle"
                    id="xiArticleSubtitle"></div>
                </header>

                <article class="xi-markdown" id="xiMarkdown">
                  <p>Connecting to GitHub…</p>
                </article>
              </div>
            </div>
          </main>
        </div>
      </div>
    `;
  }

  /* =========================================================
     GEN-Z THEME
     Main content styling is also defined in style.css.
     ========================================================= */

  function injectStyles() {
    if ($("#xiAppRuntimeStyles")) return;

    const style = document.createElement("style");
    style.id = "xiAppRuntimeStyles";

    style.textContent = `
      #xiApp {
        --xi-bg: #f5efff;
        --xi-paper: #ffffff;
        --xi-soft: #fbf7ff;
        --xi-ink: #29213d;
        --xi-body: #514765;
        --xi-muted: #9588aa;
        --xi-line: #e6dcf5;
        --xi-accent: #8057d9;
        --xi-accent-hover: #6840bd;
        --xi-accent-soft: #f0e8ff;

        background: var(--xi-bg);
      }

      #xiApp .xi-topbar {
        background: #fffaff;
        border-bottom-color: #e6dcf5;
      }

      #xiApp .xi-icon-btn {
        background: #f3eaff;
        border-color: #e2d3ff;
        color: #744bc6;
      }

      #xiApp .xi-nav-btn.primary {
        background: #8057d9;
        border-color: #8057d9;
        color: #fff;
      }

      #xiApp .xi-sidebar {
        background: #fffaff;
        border-right-color: #e6dcf5;
      }

      #xiApp .xi-reader {
        background: #f5efff;
      }

      #xiApp .xi-article-wrap {
        background: #fff;
        border-color: #e6dcf5;
      }

      #xiApp .xi-note-link.active {
        background: #eee4ff;
        border-color: #dfceff;
        color: #6037b3;
      }

      #xiApp .xi-markdown .xi-check-section {
        margin: 13px 0;
        padding: 13px 15px;
        border: 1px solid #e7dcf7;
        border-radius: 10px;
        background: #fff;
        transition: background 160ms ease, border-color 160ms ease;
      }

      #xiApp .xi-check-heading {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }

      #xiApp .xi-check-heading > h1,
      #xiApp .xi-check-heading > h2,
      #xiApp .xi-check-heading > h3,
      #xiApp .xi-check-heading > h4,
      #xiApp .xi-check-heading > h5,
      #xiApp .xi-check-heading > h6 {
        flex: 1;
        min-width: 0;
        margin: 0 0 9px !important;
        padding: 0 !important;
        border: 0 !important;
      }

      #xiApp .xi-checkbox {
        flex: 0 0 17px;
        width: 17px;
        height: 17px;
        margin: 4px 0 0;
        accent-color: #19a765;
        cursor: pointer;
      }

      #xiApp .xi-check-section.is-checked {
        border-color: #8ce0b4;
        background: #effdf5;
      }

      #xiApp .xi-check-section.is-checked
      > .xi-check-heading > h1,
      #xiApp .xi-check-section.is-checked
      > .xi-check-heading > h2,
      #xiApp .xi-check-section.is-checked
      > .xi-check-heading > h3,
      #xiApp .xi-check-section.is-checked
      > .xi-check-heading > h4,
      #xiApp .xi-check-section.is-checked
      > .xi-check-heading > h5,
      #xiApp .xi-check-section.is-checked
      > .xi-check-heading > h6,
      #xiApp .xi-check-section.is-checked > p,
      #xiApp .xi-check-section.is-checked > ul,
      #xiApp .xi-check-section.is-checked > ol,
      #xiApp .xi-check-section.is-checked > blockquote,
      #xiApp .xi-check-section.is-checked > table,
      #xiApp .xi-check-section.is-checked > pre,
      #xiApp .xi-check-section.is-checked > .katex-display {
        color: #16864a;
        text-decoration-line: line-through;
        text-decoration-color: #25ad63;
        text-decoration-thickness: 2px;
      }

      #xiApp .xi-check-section.is-checked
      > .xi-check-section {
        border-color: #8ce0b4;
        background: #effdf5;
      }

      #xiApp .xi-check-section.is-checked
      > .xi-check-section.is-checked {
        background: #e4f9ec;
      }

      #xiApp .xi-mobile-backdrop {
        display: none;
      }

      @media (max-width: 620px) {
        #xiApp .xi-check-section {
          padding: 11px;
        }

        #xiApp .xi-topbar {
          gap: 6px;
          padding: 0 8px;
        }

        #xiApp .xi-top-current,
        #xiApp .xi-read-meta {
          display: none;
        }

        #xiApp .xi-layout {
          position: relative;
          display: block;
        }

        #xiApp .xi-sidebar {
          position: absolute;
          z-index: 12;
          inset: 0 auto 0 0;
          width: min(310px, 87vw);
          box-shadow: 12px 0 35px #25332d20;
          transform: translateX(-105%);
          transition: transform 180ms ease;
        }

        #xiApp.xi-mobile-open .xi-sidebar {
          transform: translateX(0);
        }

        #xiApp .xi-mobile-backdrop {
          position: absolute;
          z-index: 11;
          inset: 0;
          background: #25332d66;
        }

        #xiApp.xi-mobile-open .xi-mobile-backdrop {
          display: block;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* =========================================================
     GITHUB NOTE DISCOVERY
     ========================================================= */

  async function fetchJSON(url) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`GitHub returned HTTP ${response.status}.`);
    }

    return response.json();
  }

  async function listFolder(path) {
    const data = await fetchJSON(
      `${CFG.api}/contents/${encodePath(path)}?ref=${CFG.branch}`
    );

    if (!Array.isArray(data)) return [];

    const notes = [];

    for (const item of data) {
      if (item.type === "dir" && !item.name.startsWith(".")) {
        notes.push(...await listFolder(item.path));
      } else if (item.type === "file" && /\.md$/i.test(item.name)) {
        notes.push({
          path: normalize(item.path),
          title: titleOf(item.path)
        });
      }
    }

    return notes;
  }

  async function discoverNotes() {
    let notes = [];

    try {
      const tree = await fetchJSON(
        `${CFG.api}/git/trees/${CFG.branch}?recursive=1`
      );

      if (Array.isArray(tree.tree) && !tree.truncated) {
        notes = tree.tree
          .filter(file =>
            file.type === "blob" &&
            file.path.startsWith(`${CFG.folder}/`) &&
            /\.md$/i.test(file.path) &&
            !file.path.split("/").some(part => part.startsWith("."))
          )
          .map(file => ({
            path: normalize(file.path),
            title: titleOf(file.path)
          }));
      } else {
        notes = await listFolder(CFG.folder);
      }
    } catch (error) {
      console.warn("Trying folder-based note discovery.", error);
      notes = await listFolder(CFG.folder);
    }

    const unique = new Map();
    notes.forEach(note => unique.set(note.path, note));

    state.notes = [...unique.values()].sort((a, b) =>
      a.path.localeCompare(b.path, undefined, {
        numeric: true,
        sensitivity: "base"
      })
    );

    if (!state.notes.length) {
      throw new Error("No Markdown files were found in the notes folder.");
    }

    renderLibrary();
  }

  /* =========================================================
     SEARCH AND NOTE LIST
     ========================================================= */

  function renderLibrary() {
    const library = $("#xiLibrary");
    if (!library) return;

    const query = state.query.toLowerCase().trim();

    const filtered = state.notes.filter(note =>
      note.title.toLowerCase().includes(query) ||
      note.path.toLowerCase().includes(query)
    );

    library.replaceChildren();

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "xi-empty";
      empty.textContent = query
        ? "No matching topics. Try another search."
        : "No notes found.";

      library.appendChild(empty);
      return;
    }

    filtered.forEach(note => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "xi-note-link";
      button.dataset.path = note.path;

      if (note.path === state.path) {
        button.classList.add("active");
      }

      button.innerHTML = `
        <span class="xi-note-file">${icon("file")}</span>
        <span class="xi-note-name">${escapeHTML(note.title)}</span>
        ${note.path === state.path
          ? '<span class="xi-active-mark"></span>'
          : ""}
      `;

      button.title = note.path;
      button.addEventListener("click", () => openNote(note.path));
      library.appendChild(button);
    });
  }

  /* =========================================================
     SCRIPT LOADER
     Load each library once and wait for it to initialize.
     ========================================================= */

  function loadScript(url, key) {
    if (state.libraries[key]) {
      return state.libraries[key];
    }

    state.libraries[key] = new Promise((resolve, reject) => {
      const existing = document.querySelector(
        `script[data-xi-library="${key}"]`
      );

      if (existing && existing.dataset.loaded === "true") {
        resolve();
        return;
      }

      const script = existing || document.createElement("script");

      script.src = url;
      script.async = false;
      script.dataset.xiLibrary = key;

      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };

      script.onerror = () => {
        delete state.libraries[key];
        script.remove();
        reject(new Error(`Failed to load ${key}.`));
      };

      if (!existing) {
        document.head.appendChild(script);
      }
    });

    return state.libraries[key];
  }

  /* =========================================================
     MARKDOWN LIBRARIES
     ========================================================= */

  async function ensureMarkdownLibraries() {
    if (!window.marked || typeof window.marked.parse !== "function") {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/marked@15.0.7/marked.min.js",
        "marked"
      );
    }

    if (!window.DOMPurify ||
        typeof window.DOMPurify.sanitize !== "function") {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/dompurify@3.2.6/dist/purify.min.js",
        "dompurify"
      );
    }

    if (!window.marked || typeof window.marked.parse !== "function") {
      throw new Error("The Markdown library did not initialize.");
    }

    if (!window.DOMPurify ||
        typeof window.DOMPurify.sanitize !== "function") {
      throw new Error("The HTML sanitizer did not initialize.");
    }
  }

  /* =========================================================
     MATH AND CODE LIBRARIES
     These are optional. Their failure must not block a note.
     ========================================================= */

  async function ensureMathLibraries() {
    try {
      if (!document.querySelector("#xiKatexStyles")) {
        const css = document.createElement("link");
        css.id = "xiKatexStyles";
        css.rel = "stylesheet";
        css.href =
          "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css";

        document.head.appendChild(css);
      }

      // KaTeX core must load before its auto-render extension.
      if (!window.katex ||
          typeof window.katex.render !== "function") {
        await loadScript(
          "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js",
          "katex"
        );
      }

      if (!window.katex ||
          typeof window.katex.render !== "function") {
        throw new Error("KaTeX core failed to initialize.");
      }

      if (typeof window.renderMathInElement !== "function") {
        await loadScript(
          "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/contrib/auto-render.min.js",
          "katex-auto-render"
        );
      }

      if (typeof window.renderMathInElement !== "function") {
        throw new Error("KaTeX auto-render did not initialize.");
      }
    } catch (error) {
      console.warn(
        "Formula rendering is unavailable; the note can still be read.",
        error
      );
    }
  }

  async function ensureCodeHighlighting() {
    try {
      if (!document.querySelector("#xiHighlightStyles")) {
        const css = document.createElement("link");
        css.id = "xiHighlightStyles";
        css.rel = "stylesheet";
        css.href =
          "https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github.min.css";

        document.head.appendChild(css);
      }

      if (!window.hljs ||
          typeof window.hljs.highlightElement !== "function") {
        await loadScript(
          "https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/lib/common.min.js",
          "highlight-js"
        );
      }
    } catch (error) {
      console.warn("Syntax highlighting is unavailable.", error);
    }
  }

  async function enhanceMarkdown(article) {
    // External links should open in a new tab.
    article.querySelectorAll("a[href]").forEach(link => {
      const href = link.getAttribute("href") || "";

      if (/^https?:\/\//i.test(href)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    });

    // Code highlighting is optional.
    if (window.hljs &&
        typeof window.hljs.highlightElement === "function") {
      article.querySelectorAll("pre code").forEach(code => {
        try {
          window.hljs.highlightElement(code);
        } catch (error) {
          console.warn("Could not highlight this code block.", error);
        }
      });
    }

    // Render LaTeX only if both KaTeX components are available.
    if (
      window.katex &&
      typeof window.katex.render === "function" &&
      typeof window.renderMathInElement === "function"
    ) {
      try {
        window.renderMathInElement(article, {
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
        // This avoids the ParseError failure breaking navigation.
        console.warn(
          "Formula rendering failed; keeping the Markdown note available.",
          error
        );
      }
    }
  }

  /* =========================================================
     CHEAT SHEET CHECKLIST
     Only enabled for notes/1CheatSheet.md.
     Each heading owns the content until the next heading at
     the same or higher level. Nested sections remain nested.
     ========================================================= */

  function buildDailyChecklist(article) {
    if (!isCheatSheet(state.path)) return;

    const originalNodes = Array.from(article.childNodes);
    const rootBlocks = [];
    const stack = [];
    let occurrence = 0;

    function headingLevel(node) {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return 0;

      const match = node.tagName.match(/^H([1-6])$/);
      return match ? Number(match[1]) : 0;
    }

    originalNodes.forEach(node => {
      const level = headingLevel(node);

      if (!level) {
        const parent = stack[stack.length - 1];
        (parent ? parent.blocks : rootBlocks).push(node);
        return;
      }

      while (
        stack.length &&
        stack[stack.length - 1].level >= level
      ) {
        stack.pop();
      }

      const item = {
        heading: node,
        level,
        blocks: [],
        occurrence: occurrence++
      };

      const parent = stack[stack.length - 1];
      (parent ? parent.blocks : rootBlocks).push(item);
      stack.push(item);
    });

    function makeSection(item) {
      const headingText = item.heading.textContent.trim();

      const key = revisionKey(
        state.path,
        headingText,
        item.occurrence
      );

      const wrapper = document.createElement("section");
      wrapper.className = "xi-check-section";
      wrapper.dataset.revisionKey = key;

      const headingRow = document.createElement("div");
      headingRow.className = "xi-check-heading";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "xi-checkbox";
      checkbox.checked = Boolean(state.checked[key]);
      checkbox.setAttribute(
        "aria-label",
        `Mark ${headingText} as revised`
      );

      if (checkbox.checked) {
        wrapper.classList.add("is-checked");
      }

      checkbox.addEventListener("change", () => {
        state.checked[key] = checkbox.checked;
        wrapper.classList.toggle("is-checked", checkbox.checked);
        saveRevisionState();
      });

      headingRow.appendChild(checkbox);
      headingRow.appendChild(item.heading);
      wrapper.appendChild(headingRow);

      item.blocks.forEach(block => {
        if (
          block &&
          typeof block === "object" &&
          Array.isArray(block.blocks) &&
          block.heading
        ) {
          wrapper.appendChild(makeSection(block));
        } else {
          wrapper.appendChild(block);
        }
      });

      return wrapper;
    }

    const fragment = document.createDocumentFragment();

    rootBlocks.forEach(block => {
      if (
        block &&
        typeof block === "object" &&
        Array.isArray(block.blocks) &&
        block.heading
      ) {
        fragment.appendChild(makeSection(block));
      } else {
        fragment.appendChild(block);
      }
    });

    article.replaceChildren(fragment);
  }

  /* =========================================================
     URL MANAGEMENT
     ========================================================= */

  function requestedNote() {
    return normalize(
      new URLSearchParams(window.location.search).get("note") || ""
    );
  }

  function setNoteURL(path, replace = false) {
    const url = new URL(window.location.href);
    url.searchParams.set("note", normalize(path));

    if (replace) {
      history.replaceState({ note: path }, "", url);
    } else {
      history.pushState({ note: path }, "", url);
    }
  }

  /* =========================================================
     TOP NAVIGATION
     ========================================================= */

  function updateNavigation() {
    const previous = $("#xiPrevious");
    const next = $("#xiNext");
    const note = state.notes[state.index];

    if (previous) {
      previous.disabled = state.index <= 0;
    }

    if (next) {
      next.disabled =
        state.index < 0 ||
        state.index >= state.notes.length - 1;
    }

    const current = $("#xiTopCurrent");
    if (current) {
      current.textContent = note ? note.title : "Revision notes";
    }

    const meta = $("#xiReadMeta");
    if (meta) {
      meta.textContent = note
        ? `${state.index + 1} of ${state.notes.length}`
        : "";
    }

    renderLibrary();
  }

  /* =========================================================
     NOTE LOADING
     ========================================================= */

  async function fetchMarkdown(path) {
    const url = `${CFG.raw}/${encodePath(path)}`;
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Could not load the note (HTTP ${response.status}).`);
    }

    return response.text();
  }

  function showMessage(title, message, retry = false) {
    const heading = $("#xiArticleTitle");
    const article = $("#xiMarkdown");

    if (heading) heading.textContent = title;

    if (article) {
      article.replaceChildren();

      const stateBox = document.createElement("div");
      stateBox.className = "xi-state";

      const stateHeading = document.createElement("h2");
      stateHeading.textContent = title;

      const paragraph = document.createElement("p");
      paragraph.textContent = message;

      stateBox.append(stateHeading, paragraph);

      if (retry) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "xi-retry";
        button.textContent = "Try again";

        button.addEventListener("click", () => {
          if (state.path) {
            openNote(state.path, { updateHistory: false });
          } else {
            initialize();
          }
        });

        stateBox.appendChild(button);
      }

      article.appendChild(stateBox);
    }
  }

  async function openNote(path, options = {}) {
    const normalized = normalize(path);

    const note = state.notes.find(item =>
      item.path === normalized
    );

    if (!note) {
      showMessage(
        "Note not found",
        "This note is not present in the current GitHub notes list.",
        true
      );
      return;
    }

    const requestId = ++state.request;

    state.path = normalized;
    state.index = state.notes.findIndex(item =>
      item.path === normalized
    );

    if (options.updateHistory !== false) {
      setNoteURL(normalized, options.replaceHistory === true);
    }

    updateNavigation();

    if (window.matchMedia("(max-width: 620px)").matches) {
      $("#xiApp").classList.remove("xi-mobile-open");
      $("#xiMenu").setAttribute("aria-expanded", "false");
    }

    const heading = $("#xiArticleTitle");
    const article = $("#xiMarkdown");
    const scroller = $("#xiReaderScroll");

    if (heading) heading.textContent = note.title;
    if (article) article.innerHTML = "<p>Loading note…</p>";
    if (scroller) scroller.scrollTop = 0;

    try {
      // Required libraries: Markdown parser and HTML sanitizer.
      await ensureMarkdownLibraries();

      const markdown = await fetchMarkdown(normalized);

      if (requestId !== state.request) return;

      const parsed = window.marked.parse(markdown, {
        gfm: true,
        breaks: false
      });

      // Sanitize rendered Markdown before inserting it into the page.
      const safeHTML = window.DOMPurify.sanitize(parsed, {
        USE_PROFILES: { html: true }
      });

      article.innerHTML = safeHTML;

      // Avoid duplicate display of the note's title.
      const firstHeading = $("#xiMarkdown h1");

      if (
        firstHeading &&
        firstHeading.textContent.trim().toLowerCase() ===
          note.title.trim().toLowerCase()
      ) {
        firstHeading.remove();
      }

      // Optional libraries must never prevent a note from opening.
      await Promise.allSettled([
        ensureMathLibraries(),
        ensureCodeHighlighting()
      ]);

      if (requestId !== state.request) return;

      // Add checkboxes only for the cheat sheet.
      if (isCheatSheet(normalized)) {
        buildDailyChecklist(article);
      }

      await enhanceMarkdown(article);

      if (requestId !== state.request) return;

      if (heading) heading.textContent = note.title;

      const subtitle = $("#xiArticleSubtitle");
      if (subtitle) subtitle.textContent = "";

      updateNavigation();
    } catch (error) {
      if (requestId !== state.request) return;

      console.error("Xi Notes loading error:", error);

      showMessage(
        "Unable to open this note",
        `${error.message || "An unexpected error occurred."} Check your connection and try again.`,
        true
      );
    }
  }

  /* =========================================================
     EVENT HANDLERS
     ========================================================= */

  function bindEvents() {
    const menu = $("#xiMenu");
    const search = $("#xiSearch");
    const backdrop = $("#xiBackdrop");
    const previous = $("#xiPrevious");
    const next = $("#xiNext");

    menu.addEventListener("click", () => {
      const app = $("#xiApp");
      const mobile = window.matchMedia("(max-width: 620px)").matches;

      if (mobile) {
        const open = app.classList.toggle("xi-mobile-open");
        state.mobileOpen = open;
        menu.setAttribute("aria-expanded", String(open));
      } else {
        const collapsed = app.classList.toggle("xi-collapsed");
        menu.setAttribute("aria-expanded", String(!collapsed));
      }
    });

    backdrop.addEventListener("click", () => {
      $("#xiApp").classList.remove("xi-mobile-open");
      state.mobileOpen = false;
      menu.setAttribute("aria-expanded", "false");
    });

    search.addEventListener("input", event => {
      state.query = event.target.value || "";
      renderLibrary();
    });

    search.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        const first = $("#xiLibrary .xi-note-link");
        if (first) openNote(first.dataset.path);
      }

      if (event.key === "Escape") {
        search.value = "";
        state.query = "";
        renderLibrary();
        search.blur();
      }
    });

    previous.addEventListener("click", () => {
      if (state.index > 0) {
        openNote(state.notes[state.index - 1].path);
      }
    });

    next.addEventListener("click", () => {
      if (state.index >= 0 && state.index < state.notes.length - 1) {
        openNote(state.notes[state.index + 1].path);
      }
    });

    window.addEventListener("popstate", () => {
      const requested = requestedNote();

      const note = state.notes.find(item =>
        item.path.toLowerCase() === requested.toLowerCase()
      );

      if (note) {
        openNote(note.path, { updateHistory: false });
      }
    });

    window.addEventListener("resize", () => {
      if (!window.matchMedia("(max-width: 620px)").matches) {
        $("#xiApp").classList.remove("xi-mobile-open");
        state.mobileOpen = false;
      }
    });

    document.addEventListener("keydown", event => {
      const target = event.target;

      const typing = target instanceof HTMLElement && (
        target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      );

      if (typing) {
        if (event.key === "Escape" && target === search) {
          $("#xiApp").classList.remove("xi-mobile-open");
        }
        return;
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        search.focus();
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        search.focus();
        return;
      }

      if (event.key === "ArrowLeft" && state.index > 0) {
        openNote(state.notes[state.index - 1].path);
      }

      if (
        event.key === "ArrowRight" &&
        state.index >= 0 &&
        state.index < state.notes.length - 1
      ) {
        openNote(state.notes[state.index + 1].path);
      }

      if (event.key === "Escape") {
        $("#xiApp").classList.remove("xi-mobile-open");
        state.mobileOpen = false;
      }
    });
  }

  /* =========================================================
     INITIALIZATION
     ========================================================= */

  async function initialize() {
    try {
      await discoverNotes();

      const requested = requestedNote();

      const selected =
        state.notes.find(note => note.path === requested) ||
        state.notes.find(note =>
          note.path.toLowerCase() === requested.toLowerCase()
        ) ||
        state.notes.find(note =>
          note.path.toLowerCase() === CFG.defaultNote.toLowerCase()
        ) ||
        state.notes[0];

      if (!selected) {
        throw new Error("No Markdown notes were found.");
      }

      await openNote(selected.path, { replaceHistory: true });
    } catch (error) {
      console.error("Xi Notes initialization failed:", error);

      const library = $("#xiLibrary");

      if (library) {
        library.replaceChildren();

        const box = document.createElement("div");
        box.className = "xi-empty";
        box.textContent =
          `Could not load notes. ${error.message || "Check your connection."} `;

        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "xi-retry";
        retry.textContent = "Retry loading";
        retry.addEventListener("click", initialize);

        box.appendChild(retry);
        library.appendChild(box);
      }

      showMessage(
        "Could not load notes",
        error.message || "Check your internet connection and retry."
      );
    }
  }

  function start() {
    readRevisionState();
    injectStyles();
    buildApp();

    if (!$("#xiApp")) return;

    bindEvents();
    initialize();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
