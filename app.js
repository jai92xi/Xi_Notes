
/* =========================================================
   XI NOTES — CLEAN REVISION WORKSPACE
   Theme: Sage green + ivory
   Features:
   - Minimal top bar with hamburger and Previous / Next
   - Flat searchable notes list
   - GitHub Markdown discovery
   - Direct note URLs using ?note=notes/example.md
   - Markdown, formulas and code highlighting
   - Responsive sidebar
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
    sidebarOpen: false,
    libraries: {}
  };

  const normalize = path => String(path || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^(?:\.\/)+/, "");

  const encodePath = path => normalize(path)
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  const titleOf = path => {
    const name = normalize(path).split("/").pop() || path;
    return name
      .replace(/\.md$/i, "")
      .replace(/^\d+[-_. ]*/, "")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Untitled note";
  };

  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

  function icon(name) {
    const paths = {
      menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
      left: '<path d="m15 18-6-6 6-6"/>',
      right: '<path d="m9 18 6-6-6-6"/>'
    };

    return `<svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true">${paths[name] || paths.file}</svg>`;
  }

  /* =========================
     STYLES
     ========================= */

  function injectStyles() {
    if ($("#xi-workspace-styles")) return;

    const style = document.createElement("style");
    style.id = "xi-workspace-styles";

    style.textContent = `
      :root {
        --xi-bg: #f1f4ef;
        --xi-paper: #fffefa;
        --xi-soft: #f7f8f4;
        --xi-ink: #25332d;
        --xi-body: #4c5b52;
        --xi-muted: #879489;
        --xi-line: #dfe6dc;
        --xi-accent: #52745d;
        --xi-accent-soft: #eaf1e9;
        --xi-header: 58px;
        --xi-library: 265px;
      }

      *, *::before, *::after { box-sizing: border-box; }

      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
      }

      body {
        overflow: hidden;
        background: var(--xi-bg);
        color: var(--xi-ink);
        font: 14px/1.55 Inter, -apple-system, BlinkMacSystemFont,
          "Segoe UI", Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      button, input { font: inherit; }
      button { color: inherit; }

      button:focus-visible, input:focus-visible {
        outline: 3px solid #b4cbb8;
        outline-offset: 2px;
      }

      #xiApp {
        height: 100dvh;
        width: 100%;
        display: grid;
        grid-template-rows: var(--xi-header) minmax(0, 1fr);
        overflow: hidden;
        background: var(--xi-bg);
      }

      .xi-topbar {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        padding: 0 16px;
        border-bottom: 1px solid var(--xi-line);
        background: #fbfcf8;
        z-index: 20;
      }

      .xi-icon-btn {
        display: grid;
        place-items: center;
        flex: 0 0 36px;
        width: 36px;
        height: 36px;
        padding: 0;
        border: 1px solid var(--xi-line);
        border-radius: 8px;
        background: #fffefa;
        color: #526858;
        cursor: pointer;
      }

      .xi-icon-btn:hover {
        background: var(--xi-accent-soft);
      }

      .xi-icon-btn svg,
      .xi-nav-btn svg {
        width: 17px;
        height: 17px;
      }

      .xi-top-current {
        min-width: 0;
        overflow: hidden;
        color: var(--xi-ink);
        font-size: 13px;
        font-weight: 700;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .xi-top-spacer { flex: 1; }

      .xi-read-meta {
        color: var(--xi-muted);
        font-size: 11px;
        white-space: nowrap;
      }

      .xi-nav-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        min-height: 35px;
        padding: 7px 11px;
        border: 1px solid var(--xi-line);
        border-radius: 8px;
        background: #fffefa;
        color: #425448;
        font-size: 12px;
        white-space: nowrap;
        cursor: pointer;
      }

      .xi-nav-btn:hover:not(:disabled) {
        background: var(--xi-accent-soft);
      }

      .xi-nav-btn.primary {
        border-color: var(--xi-accent);
        background: var(--xi-accent);
        color: #fff;
      }

      .xi-nav-btn.primary:hover:not(:disabled) {
        background: #42624c;
      }

      .xi-nav-btn:disabled {
        opacity: .4;
        cursor: not-allowed;
      }

      .xi-layout {
        display: grid;
        grid-template-columns: var(--xi-library) minmax(0, 1fr);
        min-height: 0;
        overflow: hidden;
        transition: grid-template-columns .18s ease;
      }

      #xiApp.xi-collapsed {
        --xi-library: 0px;
      }

      .xi-sidebar {
        display: flex;
        flex-direction: column;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        border-right: 1px solid var(--xi-line);
        background: #fbfcf8;
      }

      .xi-library-head {
        padding: 14px;
        border-bottom: 1px solid #e9eee6;
      }

      .xi-search {
        position: relative;
        display: flex;
        align-items: center;
      }

      .xi-search svg {
        position: absolute;
        left: 11px;
        width: 15px;
        height: 15px;
        color: #8c9b8e;
        pointer-events: none;
      }

      .xi-search input {
        width: 100%;
        height: 38px;
        padding: 0 12px 0 34px;
        border: 1px solid var(--xi-line);
        border-radius: 8px;
        background: #f3f6f0;
        color: var(--xi-ink);
        font-size: 12px;
        outline: none;
      }

      .xi-search input:focus {
        border-color: #9cb7a1;
        background: #fffefa;
        box-shadow: 0 0 0 3px #52745d12;
      }

      .xi-search input::placeholder { color: #95a093; }

      .xi-library-scroll {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 8px;
        overscroll-behavior: contain;
        scrollbar-width: thin;
        scrollbar-color: #d5ded3 transparent;
      }

      .xi-note-link {
        display: flex;
        align-items: center;
        gap: 9px;
        width: 100%;
        min-height: 35px;
        margin: 2px 0;
        padding: 7px 9px;
        border: 1px solid transparent;
        border-radius: 7px;
        background: transparent;
        color: #536257;
        text-align: left;
        cursor: pointer;
      }

      .xi-note-link:hover {
        background: #f0f4ed;
        color: #314b38;
      }

      .xi-note-link.active {
        border-color: #dce8da;
        background: #eaf1e9;
        color: #34543b;
      }

      .xi-note-file {
        display: flex;
        flex: 0 0 15px;
        color: #91a092;
      }

      .xi-note-file svg { width: 15px; height: 15px; }

      .xi-note-link.active .xi-note-file { color: var(--xi-accent); }

      .xi-note-name {
        min-width: 0;
        flex: 1;
        overflow: hidden;
        font-size: 12px;
        font-weight: 550;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .xi-note-link.active .xi-note-name { font-weight: 750; }

      .xi-active-mark {
        width: 6px;
        height: 6px;
        flex: 0 0 6px;
        border-radius: 50%;
        background: var(--xi-accent);
      }

      .xi-empty {
        padding: 22px 12px;
        color: var(--xi-muted);
        font-size: 12px;
        line-height: 1.7;
        overflow-wrap: anywhere;
      }

      .xi-reader {
        display: flex;
        flex-direction: column;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        background: var(--xi-bg);
      }

      .xi-reader-scroll {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 22px 26px 36px;
        overscroll-behavior: contain;
        scroll-behavior: smooth;
        scrollbar-width: thin;
        scrollbar-color: #d5ded3 transparent;
      }

      .xi-article-wrap {
        width: 100%;
        max-width: 1100px;
        min-height: 300px;
        margin: 0 auto;
        padding: clamp(22px, 3vw, 38px) clamp(20px, 3.5vw, 44px);
        border: 1px solid #e1e7dd;
        border-radius: 11px;
        background: var(--xi-paper);
        box-shadow: 0 3px 12px #2a3e2e08;
      }

      .xi-article-header {
        margin-bottom: 20px;
        padding-bottom: 17px;
        border-bottom: 1px solid #e8ede4;
      }

      .xi-article-title {
        margin: 0;
        color: #25332d;
        font-size: clamp(25px, 3vw, 34px);
        font-weight: 800;
        line-height: 1.25;
        letter-spacing: -.8px;
        overflow-wrap: anywhere;
      }

      .xi-article-subtitle { display: none; }
      .xi-article-kicker { display: none; }

      .xi-markdown {
        color: #435248;
        font-size: 13.5px;
        line-height: 1.65;
        overflow-wrap: anywhere;
      }

      .xi-markdown > :first-child { margin-top: 0; }

      .xi-markdown h1,
      .xi-markdown h2,
      .xi-markdown h3,
      .xi-markdown h4,
      .xi-markdown h5,
      .xi-markdown h6 {
        color: #2c3d31;
        font-weight: 760;
        line-height: 1.4;
        scroll-margin-top: 18px;
      }

      .xi-markdown h1 { margin: 24px 0 10px; font-size: 25px; }

      .xi-markdown h2 {
        margin: 27px 0 10px;
        padding-bottom: 7px;
        border-bottom: 1px solid #e5ebe2;
        font-size: 20px;
      }

      .xi-markdown h3 { margin: 21px 0 8px; font-size: 16px; }
      .xi-markdown h4 { margin: 18px 0 7px; font-size: 14px; }
      .xi-markdown p { margin: 9px 0 13px; }
      .xi-markdown strong { color: #2b3b30; font-weight: 760; }

      .xi-markdown a {
        color: #426c4b;
        text-decoration-thickness: 1px;
        text-underline-offset: 3px;
      }

      .xi-markdown ul,
      .xi-markdown ol {
        margin: 8px 0 14px;
        padding-left: 24px;
      }

      .xi-markdown li { margin: 3px 0; padding-left: 2px; }
      .xi-markdown li::marker { color: #78957b; }

      .xi-markdown blockquote {
        margin: 15px 0;
        padding: 10px 15px;
        border-left: 3px solid #7e9e81;
        border-radius: 0 7px 7px 0;
        background: #f1f5ef;
        color: #56675a;
      }

      .xi-markdown code {
        padding: 2px 5px;
        border: 1px solid #e5eae2;
        border-radius: 4px;
        background: #f3f6f0;
        color: #426047;
        font-family: "SFMono-Regular", Consolas, monospace;
        font-size: .9em;
      }

      .xi-markdown pre {
        overflow: auto;
        margin: 13px 0 17px;
        padding: 15px;
        border: 1px solid #dfe6dc;
        border-radius: 8px;
        background: #f5f7f3;
        line-height: 1.55;
      }

      .xi-markdown pre code {
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        color: #35473a;
        font-size: 12px;
      }

      .xi-markdown table {
        width: 100%;
        margin: 14px 0 18px;
        border-collapse: collapse;
        font-size: 12px;
      }

      .xi-markdown th,
      .xi-markdown td {
        padding: 8px 10px;
        border: 1px solid #dfe6dc;
        text-align: left;
        vertical-align: top;
      }

      .xi-markdown th {
        background: #edf3ea;
        color: #304b36;
      }

      .xi-markdown tr:nth-child(even) td { background: #fafbf8; }
      .xi-markdown hr { border: 0; border-top: 1px solid #e1e8de; margin: 23px 0; }
      .xi-markdown img { max-width: 100%; height: auto; }

      .xi-markdown .katex-display {
        max-width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 5px 0;
      }

      .xi-markdown input[type="checkbox"] { accent-color: var(--xi-accent); }

      .xi-state {
        padding: 36px 10px;
        color: var(--xi-body);
        text-align: center;
      }

      .xi-state h2 { color: var(--xi-ink); font-size: 18px; }
      .xi-state p { color: var(--xi-muted); font-size: 12px; }

      .xi-retry {
        margin-top: 8px;
        padding: 8px 12px;
        border: 1px solid var(--xi-line);
        border-radius: 7px;
        background: #fffefa;
        cursor: pointer;
      }

      .xi-mobile-backdrop { display: none; }

      @media (max-width: 850px) {
        :root { --xi-library: 245px; }
        .xi-reader-scroll { padding: 16px; }
        .xi-article-wrap { padding: 25px 22px; }
      }

      @media (max-width: 620px) {
        :root { --xi-header: 54px; }

        .xi-topbar { gap: 6px; padding: 0 8px; }
        .xi-top-current { display: none; }
        .xi-read-meta { display: none; }

        .xi-nav-btn { gap: 3px; padding: 7px 8px; font-size: 11px; }
        .xi-nav-btn svg { width: 14px; height: 14px; }

        .xi-layout {
          display: block;
          position: relative;
        }

        .xi-sidebar {
          position: absolute;
          z-index: 12;
          inset: 0 auto 0 0;
          width: min(310px, 87vw);
          box-shadow: 12px 0 35px #25332d20;
          transform: translateX(-105%);
          transition: transform .18s ease;
        }

        #xiApp.xi-mobile-open .xi-sidebar { transform: translateX(0); }

        .xi-mobile-backdrop {
          position: absolute;
          z-index: 11;
          inset: 0;
          background: #25332d66;
        }

        #xiApp.xi-mobile-open .xi-mobile-backdrop { display: block; }

        .xi-reader { height: 100%; }
        .xi-reader-scroll { padding: 10px 8px 20px; }

        .xi-article-wrap {
          padding: 21px 15px 25px;
          border-radius: 8px;
        }

        .xi-article-title { font-size: 25px; }
        .xi-markdown { font-size: 13px; }
        .xi-markdown h2 { font-size: 19px; }
        .xi-markdown h3 { font-size: 16px; }
        .xi-markdown pre { padding: 12px; font-size: 11px; }
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          scroll-behavior: auto !important;
          transition-duration: .01ms !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* =========================
     BUILD INTERFACE
     ========================= */

  function buildApp() {
    const root = $("#app");

    if (!root) {
      console.error('Xi Notes requires <div id="app"></div> in index.html.');
      return;
    }

    root.innerHTML = `
      <div id="xiApp">
        <header class="xi-topbar">
          <button class="xi-icon-btn" id="xiMenu"
            type="button" aria-label="Toggle notes sidebar"
            aria-expanded="true" title="Show or hide notes">
            ${icon("menu")}
          </button>

          <div class="xi-top-current" id="xiTopCurrent">
            Revision notes
          </div>

          <div class="xi-top-spacer"></div>

          <span class="xi-read-meta" id="xiReadMeta"></span>

          <button class="xi-nav-btn" id="xiPrevious" type="button" disabled>
            ${icon("left")} Previous
          </button>

          <button class="xi-nav-btn primary" id="xiNext" type="button" disabled>
            Next topic ${icon("right")}
          </button>
        </header>

        <div class="xi-layout">
          <aside class="xi-sidebar" id="xiSidebar">
            <div class="xi-library-head">
              <label class="xi-search">
                ${icon("search")}
                <input id="xiSearch" type="search"
                  placeholder="Search topics..."
                  autocomplete="off"
                  aria-label="Search notes">
              </label>
            </div>

            <nav class="xi-library-scroll" id="xiLibrary"
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
                  <div class="xi-article-subtitle" id="xiArticleSubtitle"></div>
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

  /* =========================
     GITHUB NOTE DISCOVERY
     ========================= */

  async function fetchJSON(url) {
    const response = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" },
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
      console.warn("Using folder discovery fallback:", error);
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

  /* =========================
     SEARCHABLE NOTES LIST
     ========================= */

  function renderLibrary() {
    const library = $("#xiLibrary");
    if (!library) return;

    const query = state.query.toLowerCase().trim();

    const notes = state.notes.filter(note =>
      note.title.toLowerCase().includes(query) ||
      note.path.toLowerCase().includes(query)
    );

    library.replaceChildren();

    if (!notes.length) {
      const empty = document.createElement("div");
      empty.className = "xi-empty";
      empty.textContent = query
        ? "No matching topics. Try another search."
        : "No notes found.";
      library.appendChild(empty);
      return;
    }

    for (const note of notes) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "xi-note-link";
      button.dataset.path = note.path;

      if (note.path === state.path) button.classList.add("active");

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
    }
  }

  /* =========================
     MARKDOWN LIBRARIES
     ========================= */

  function loadScript(src, key) {
    if (state.libraries[key]) return state.libraries[key];

    state.libraries[key] = new Promise((resolve, reject) => {
      const existing = document.querySelector(
        `script[data-xi-lib="${key}"]`
      );

      if (existing && existing.dataset.loaded === "true") {
        resolve();
        return;
      }

      const script = existing || document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.xiLib = key;

      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };

      script.onerror = () => {
        delete state.libraries[key];
        reject(new Error(`Could not load ${key}.`));
      };

      if (!existing) document.head.appendChild(script);
    });

    return state.libraries[key];
  }

  async function ensureMarkdownLibraries() {
    if (!window.marked) {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/marked@15.0.7/marked.min.js",
        "marked"
      );
    }

    if (!window.DOMPurify) {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/dompurify@3.2.6/dist/purify.min.js",
        "purify"
      );
    }
  }

  async function enhanceMarkdown(article) {
    if (window.renderMathInElement) {
      window.renderMathInElement(article, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false
      });
    }

    if (window.hljs) {
      article.querySelectorAll("pre code").forEach(block => {
        window.hljs.highlightElement(block);
      });
    }
  }

  async function loadOptionalLibraries() {
    const tasks = [];

    if (!window.katex) {
      if (!document.querySelector("#xiKatexCss")) {
        const css = document.createElement("link");
        css.id = "xiKatexCss";
        css.rel = "stylesheet";
        css.href =
          "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css";
        document.head.appendChild(css);
      }

      tasks.push(
        loadScript(
          "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js",
          "katex"
        )
      );
    }

    if (!window.renderMathInElement) {
      tasks.push(
        loadScript(
          "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/contrib/auto-render.min.js",
          "katex-render"
        )
      );
    }

    if (!window.hljs) {
      if (!document.querySelector("#xiHighlightCss")) {
        const css = document.createElement("link");
        css.id = "xiHighlightCss";
        css.rel = "stylesheet";
        css.href =
          "https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github.min.css";
        document.head.appendChild(css);
      }

      tasks.push(
        loadScript(
          "https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/lib/common.min.js",
          "highlight"
        )
      );
    }

    await Promise.allSettled(tasks);
  }

  /* =========================
     URL HANDLING
     ========================= */

  function requestedNote() {
    return normalize(new URLSearchParams(location.search).get("note") || "");
  }

  function setNoteURL(path, replace = false) {
    const url = new URL(location.href);
    url.searchParams.set("note", normalize(path));

    if (replace) {
      history.replaceState({ note: path }, "", url);
    } else {
      history.pushState({ note: path }, "", url);
    }
  }

  /* =========================
     NAVIGATION
     ========================= */

  function updateNavigation() {
    const previous = $("#xiPrevious");
    const next = $("#xiNext");
    const note = state.notes[state.index];

    if (previous) {
      previous.disabled = state.index <= 0;
      previous.onclick = () => {
        if (state.index > 0) {
          openNote(state.notes[state.index - 1].path);
        }
      };
    }

    if (next) {
      next.disabled =
        state.index < 0 || state.index >= state.notes.length - 1;

      next.onclick = () => {
        if (state.index >= 0 && state.index < state.notes.length - 1) {
          openNote(state.notes[state.index + 1].path);
        }
      };
    }

    const current = $("#xiTopCurrent");
    if (current) current.textContent = note ? note.title : "Revision notes";

    const meta = $("#xiReadMeta");
    if (meta) {
      meta.textContent = note
        ? `${state.index + 1} of ${state.notes.length}`
        : "";
    }

    renderLibrary();
  }

  /* =========================
     LOAD AND DISPLAY A NOTE
     ========================= */

  async function fetchMarkdown(path) {
    const url = `${CFG.raw}/${encodePath(path)}`;
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Could not load note (HTTP ${response.status}).`);
    }

    return response.text();
  }

  function showMessage(title, message, retry = false) {
    const heading = $("#xiArticleTitle");
    const article = $("#xiMarkdown");

    if (heading) heading.textContent = title;

    if (article) {
      article.innerHTML = `
        <div class="xi-state">
          <h2>${escapeHTML(title)}</h2>
          <p>${escapeHTML(message)}</p>
          ${retry ? '<button class="xi-retry" id="xiRetry">Try again</button>' : ""}
        </div>`;
    }

    const retryButton = $("#xiRetry");
    if (retryButton) {
      retryButton.addEventListener("click", () => {
        if (state.path) openNote(state.path, { updateHistory: false });
        else initialize();
      });
    }
  }

  async function openNote(path, options = {}) {
    const normalized = normalize(path);
    const note = state.notes.find(item => item.path === normalized);

    if (!note) {
      showMessage("Note not found", "This note is not in the current GitHub notes list.", true);
      return;
    }

    const requestId = ++state.request;

    state.path = normalized;
    state.index = state.notes.findIndex(item => item.path === normalized);

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
    if (article) article.innerHTML = '<p>Loading note…</p>';
    if (scroller) scroller.scrollTop = 0;

    try {
      await ensureMarkdownLibraries();
      const markdown = await fetchMarkdown(normalized);

      if (requestId !== state.request) return;

      const html = window.marked.parse(markdown, {
        gfm: true,
        breaks: false
      });

      article.innerHTML = window.DOMPurify
        ? window.DOMPurify.sanitize(html)
        : html;

      // Avoid showing the same title twice when the note starts with # title.
      const firstHeading = $("#xiMarkdown h1");
      if (
        firstHeading &&
        firstHeading.textContent.trim().toLowerCase() ===
          note.title.trim().toLowerCase()
      ) {
        firstHeading.remove();
      }

      await loadOptionalLibraries();

      if (requestId !== state.request) return;

      await enhanceMarkdown(article);

      if (heading) heading.textContent = note.title;

      const subtitle = $("#xiArticleSubtitle");
      if (subtitle) subtitle.textContent = "";

      updateNavigation();
    } catch (error) {
      if (requestId !== state.request) return;

      console.error("Xi Notes loading error:", error);
      showMessage(
        "Unable to open this note",
        `${error.message || "A loading error occurred."} Check your connection and try again.`,
        true
      );
    }
  }

  /* =========================
     EVENTS
     ========================= */

  function bindEvents() {
    const menu = $("#xiMenu");
    const search = $("#xiSearch");
    const backdrop = $("#xiBackdrop");

    menu.addEventListener("click", () => {
      const app = $("#xiApp");
      const mobile = window.matchMedia("(max-width: 620px)").matches;

      if (mobile) {
        const open = app.classList.toggle("xi-mobile-open");
        menu.setAttribute("aria-expanded", String(open));
      } else {
        app.classList.toggle("xi-collapsed");
        menu.setAttribute(
          "aria-expanded",
          String(!app.classList.contains("xi-collapsed"))
        );
      }
    });

    backdrop.addEventListener("click", () => {
      $("#xiApp").classList.remove("xi-mobile-open");
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

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        search.focus();
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        search.focus();
      }

      if (event.key === "ArrowLeft" && state.index > 0) {
        openNote(state.notes[state.index - 1].path);
      }

      if (event.key === "ArrowRight" && state.index >= 0 &&
          state.index < state.notes.length - 1) {
        openNote(state.notes[state.index + 1].path);
      }

      if (event.key === "Escape") {
        $("#xiApp").classList.remove("xi-mobile-open");
      }
    });
  }

  /* =========================
     INITIALIZATION
     ========================= */

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
        library.innerHTML = `
          <div class="xi-empty">
            Could not load notes.<br><br>
            ${escapeHTML(error.message || "Check your internet connection.")}
            <br><br>
            <button class="xi-retry" id="xiRetryLibrary">Retry loading</button>
          </div>`;

        $("#xiRetryLibrary").addEventListener("click", initialize);
      }

      showMessage(
        "Could not load notes",
        error.message || "Check your internet connection and retry."
      );
    }
  }

  function start() {
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
