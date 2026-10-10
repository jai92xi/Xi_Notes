
(() => {
  "use strict";

  const CONFIG = {
    owner: "jai92xi",
    repo: "Xi_Notes",
    branch: "main",
    notesFolder: "notes",
    storageKey: "xi-notes-v2",
    cheatSheet: "1CheatSheet.md",
    supportedExtensions: [".md", ".mdx", ".markdown", ".txt"]
  };

  const state = {
    notes: [],
    currentIndex: -1,
    searchQuery: "",
    expandedFolders: new Set(),
    loadedContent: new Map(),
    currentRequest: 0,
    tocOpen: true,
    checkedTopics: {},
    currentIstDate: getIstDate()
  };

  const app = document.getElementById("app") ||
    (() => {
      const element = document.createElement("div");
      element.id = "app";
      document.body.appendChild(element);
      return element;
    })();

  // ---------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);
  }

  function getIstDate() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());

    const values = {};
    parts.forEach(part => {
      values[part.type] = part.value;
    });

    return `${values.year}-${values.month}-${values.day}`;
  }

  function millisecondsUntilIstMidnight() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "numeric",
      day: "numeric"
    }).formatToParts(new Date());

    const values = {};
    parts.forEach(part => {
      values[part.type] = Number(part.value);
    });

    // IST is UTC+05:30.
    const nextMidnightUtc = Date.UTC(
      values.year,
      values.month - 1,
      values.day + 1,
      0, 0, 0
    ) - (5 * 60 + 30) * 60 * 1000;

    return Math.max(1000, nextMidnightUtc - Date.now());
  }

  function filenameToTitle(path) {
    return path.split("/").pop()
      .replace(/\.(md|mdx|markdown|txt)$/i, "")
      .replace(/^\d+[-_. ]*/, "")
      .replace(/[-_]+/g, " ")
      .trim();
  }

  function extension(path) {
    return path.match(/\.[^.]+$/)?.[0].toLowerCase() || "";
  }

  function rawURL(path) {
    return `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
  }

  function currentNote() {
    return state.notes[state.currentIndex] || null;
  }

  function isCheatSheet(note) {
    return note?.path === `notes/${CONFIG.cheatSheet}` ||
      note?.path.endsWith(`/${CONFIG.cheatSheet}`);
  }

  function loadDailyChecks() {
    try {
      const key = `xi-cheatsheet-checks-${getIstDate()}`;
      state.checkedTopics = JSON.parse(localStorage.getItem(key)) || {};
    } catch {
      state.checkedTopics = {};
    }
  }

  function saveDailyChecks() {
    try {
      const key = `xi-cheatsheet-checks-${getIstDate()}`;
      localStorage.setItem(key, JSON.stringify(state.checkedTopics));
    } catch {
      // The notes remain readable if browser storage is unavailable.
    }
  }

  function resetDailyChecks() {
    const today = getIstDate();

    if (today === state.currentIstDate) return;

    state.currentIstDate = today;
    state.checkedTopics = {};
    loadDailyChecks();

    if (isCheatSheet(currentNote())) {
      openNote(state.currentIndex, { keepScroll: true });
    }
  }

  function scheduleDailyReset() {
    setTimeout(() => {
      resetDailyChecks();
      scheduleDailyReset();
    }, millisecondsUntilIstMidnight() + 100);
  }

  // Also detect midnight after the browser tab becomes active again.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) resetDailyChecks();
  });

  window.addEventListener("focus", resetDailyChecks);

  // ---------------------------------------------------------
  // External libraries
  // ---------------------------------------------------------

  function loadScript(src, id) {
    return new Promise((resolve, reject) => {
      if (document.getElementById(id)?.dataset.loaded === "true") {
        resolve();
        return;
      }

      const script = document.getElementById(id) ||
        document.createElement("script");

      script.id = id;
      script.src = src;
      script.async = true;

      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };

      script.onerror = () => reject(
        new Error(`Unable to load ${id}. Check your internet connection.`)
      );

      if (!script.isConnected) document.head.appendChild(script);
    });
  }

  async function loadLibraries() {
    await loadScript(
      "https://cdn.jsdelivr.net/npm/marked@15.0.7/marked.min.js",
      "xi-marked"
    );

    await loadScript(
      "https://cdn.jsdelivr.net/npm/dompurify@3.2.6/dist/purify.min.js",
      "xi-dompurify"
    );

    await loadScript(
      "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js",
      "xi-katex"
    );

    await loadScript(
      "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/contrib/auto-render.min.js",
      "xi-katex-render"
    );

    marked.setOptions({
      gfm: true,
      breaks: true
    });
  }

  // ---------------------------------------------------------
  // Discover Markdown notes
  // ---------------------------------------------------------

  async function discoverNotes() {
    const response = await fetch(
      `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/git/trees/${CONFIG.branch}?recursive=1`,
      { headers: { Accept: "application/vnd.github+json" } }
    );

    if (!response.ok) {
      throw new Error(
        response.status === 404
          ? "Repository or branch not found. Check your GitHub settings."
          : `Unable to list notes from GitHub (${response.status}).`
      );
    }

    const data = await response.json();

    if (data.truncated) {
      throw new Error("GitHub returned an incomplete file listing.");
    }

    const prefix = `${CONFIG.notesFolder}/`;

    state.notes = (data.tree || [])
      .filter(item =>
        item.type === "blob" &&
        item.path.startsWith(prefix) &&
        CONFIG.supportedExtensions.includes(extension(item.path))
      )
      .map(item => ({
        path: item.path,
        title: filenameToTitle(item.path),
        folder: item.path.slice(prefix.length).includes("/")
          ? item.path.slice(prefix.length).split("/").slice(0, -1).join("/")
          : ""
      }))
      .sort((a, b) =>
        a.path.localeCompare(b.path, undefined, {
          numeric: true,
          sensitivity: "base"
        })
      );

    if (!state.notes.length) {
      throw new Error("No Markdown or text notes were found in /notes.");
    }

    state.notes.forEach(note => {
      if (!note.folder) return;

      const parts = note.folder.split("/");
      let folder = "";

      parts.forEach(part => {
        folder = folder ? `${folder}/${part}` : part;
        state.expandedFolders.add(folder);
      });
    });

    const savedPath = new URLSearchParams(location.search).get("note");
    const index = state.notes.findIndex(note => note.path === savedPath);

    state.currentIndex = index >= 0 ? index : 0;
  }

  // ---------------------------------------------------------
  // Layout
  // ---------------------------------------------------------

  function renderShell() {
    app.innerHTML = `
      <div class="xi-app">

        <aside class="xi-sidebar" id="xi-sidebar">
          <div class="xi-sidebar-tools">
            <button class="xi-icon-button"
              id="xi-sidebar-close"
              aria-label="Close contents sidebar"
              title="Close sidebar">×</button>
          </div>

          <div class="xi-search-wrap">
            <span class="xi-search-icon" aria-hidden="true">⌕</span>
            <input
              id="xi-search"
              class="xi-search"
              type="search"
              placeholder="Search notes..."
              aria-label="Search notes"
              autocomplete="off"
            />
            <kbd class="xi-search-shortcut">/</kbd>
          </div>

          <div class="xi-sidebar-heading">
            <span>NOTES</span>
            <span class="xi-count" id="xi-note-count">0</span>
          </div>

          <nav class="xi-note-tree" id="xi-note-tree"
            aria-label="Notes index">
            <div class="xi-loading-small">Loading notes...</div>
          </nav>
        </aside>

        <div class="xi-sidebar-backdrop" id="xi-sidebar-backdrop"></div>

        <main class="xi-main">

          <header class="xi-topbar" id="xi-topbar">
            <div class="xi-topbar-left">
              <button
                class="xi-icon-button"
                id="xi-sidebar-toggle"
                aria-label="Toggle contents sidebar"
                title="Open or collapse contents"
              >☰</button>

              <div class="xi-breadcrumb" id="xi-breadcrumb">
                <span>Loading note...</span>
              </div>
            </div>

            <div class="xi-topbar-right">
              <span class="xi-progress-label" id="xi-progress-label">
                0% read
              </span>

              <button class="xi-nav-button" id="xi-previous"
                title="Previous note (Alt + Left)" disabled>
                <span>←</span><span>Previous</span>
              </button>

              <button class="xi-nav-button xi-nav-next" id="xi-next"
                title="Next note (Alt + Right)" disabled>
                <span>Next</span><span>→</span>
              </button>
            </div>

            <div class="xi-top-progress">
              <div class="xi-top-progress-fill"
                id="xi-top-progress-fill"></div>
            </div>
          </header>

          <section class="xi-workspace" id="xi-workspace">
            <div id="xi-content" class="xi-welcome">
              <div class="xi-loading-spinner"></div>
              <p>Preparing your notes...</p>
            </div>
          </section>

          <footer class="xi-bottom-bar">
            <span id="xi-current-position">Loading...</span>
            <span class="xi-key-hint">
              <kbd>Alt</kbd> + <kbd>←</kbd>
              <span>Previous</span>
              <kbd>Alt</kbd> + <kbd>→</kbd>
              <span>Next</span>
            </span>
          </footer>

        </main>
      </div>
    `;

    bindEvents();
  }

  // ---------------------------------------------------------
  // Sidebar note list
  // ---------------------------------------------------------

  function renderSidebar() {
    const tree = document.getElementById("xi-note-tree");
    const count = document.getElementById("xi-note-count");

    if (!tree) return;

    const query = state.searchQuery.trim().toLowerCase();

    const notes = state.notes.filter(note =>
      !query ||
      note.title.toLowerCase().includes(query) ||
      note.path.toLowerCase().includes(query)
    );

    count.textContent = notes.length;

    if (!notes.length) {
      tree.innerHTML = `
        <div class="xi-empty-search">
          <p>No notes found</p>
          <span>Try another keyword.</span>
        </div>`;
      return;
    }

    const root = { folders: new Map(), notes: [] };

    notes.forEach(note => {
      let node = root;
      let path = "";

      (note.folder ? note.folder.split("/") : []).forEach(name => {
        path = path ? `${path}/${name}` : name;

        if (!node.folders.has(name)) {
          node.folders.set(name, {
            name,
            path,
            folders: new Map(),
            notes: []
          });
        }

        node = node.folders.get(name);
      });

      node.notes.push(note);
    });

    function renderNode(node, depth = 0) {
      let html = "";

      [...node.folders.values()]
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(folder => {
          const expanded =
            query.length > 0 || state.expandedFolders.has(folder.path);

          html += `
            <div class="xi-tree-folder" data-folder="${escapeHTML(folder.path)}">
              <button class="xi-folder-button"
                data-action="toggle-folder"
                data-folder="${escapeHTML(folder.path)}"
                aria-expanded="${expanded}"
                style="--xi-depth:${depth}">
                <span class="xi-folder-chevron">${expanded ? "⌄" : "›"}</span>
                <span class="xi-folder-icon">▸</span>
                <span class="xi-folder-name">${escapeHTML(
                  folder.name.replace(/[-_]+/g, " ")
                )}</span>
              </button>
              <div class="xi-folder-children" ${expanded ? "" : "hidden"}>
                ${renderNode(folder, depth + 1)}
              </div>
            </div>`;
        });

      node.notes.forEach(note => {
        const index = state.notes.findIndex(item => item.path === note.path);
        const active = index === state.currentIndex;

        html += `
          <button class="xi-note-link ${active ? "is-active" : ""}"
            data-action="open-note"
            data-index="${index}"
            style="--xi-depth:${depth}"
            title="${escapeHTML(note.title)}"
            ${active ? 'aria-current="page"' : ""}>
            <span class="xi-note-icon">◇</span>
            <span class="xi-note-name">${escapeHTML(note.title)}</span>
            ${active ? '<span class="xi-active-dot"></span>' : ""}
          </button>`;
      });

      return html;
    }

    tree.innerHTML = renderNode(root);
  }

  // ---------------------------------------------------------
  // Markdown preparation and safe rendering
  // ---------------------------------------------------------

  function extractFrontmatter(content) {
    if (!content.startsWith("---\n")) {
      return { metadata: {}, body: content };
    }

    const end = content.indexOf("\n---", 4);

    if (end < 0) return { metadata: {}, body: content };

    const metadata = {};

    content.slice(4, end).split(/\r?\n/).forEach(line => {
      const match = line.match(/^([\w-]+)\s*:\s*(.*?)\s*$/);

      if (match) {
        metadata[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    });

    return {
      metadata,
      body: content.slice(end + 4).replace(/^\r?\n/, "")
    };
  }

  function protectMath(markdown) {
    const expressions = [];

    const protectedText = markdown.replace(
      /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g,
      match => {
        const token = `XIMATHPLACEHOLDER${expressions.length}END`;
        expressions.push(match);
        return token;
      }
    );

    return { protectedText, expressions };
  }

  function renderMarkdown(markdown) {
    let { protectedText, expressions } = protectMath(markdown);

    protectedText = protectedText.replace(
      /(^|[^\w=])==([^=\n]+)==(?![=])/g,
      '$1<mark class="xi-highlight">$2</mark>'
    );

    let html = marked.parse(protectedText);

    expressions.forEach((expression, index) => {
      html = html.replaceAll(
        `XIMATHPLACEHOLDER${index}END`,
        escapeHTML(expression)
      );
    });

    html = DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_TAGS: ["mark"],
      ADD_ATTR: ["class"]
    });

    const container = document.createElement("div");
    container.innerHTML = html;

    container.querySelectorAll("a").forEach(link => {
      const href = link.getAttribute("href") || "";

      if (/^\s*javascript:/i.test(href)) {
        link.removeAttribute("href");
      } else if (/^https?:\/\//i.test(href)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    });

    container.querySelectorAll("table").forEach(table => {
      table.classList.add("xi-markdown-table");

      const wrapper = document.createElement("div");
      wrapper.className = "xi-table-wrap";
      table.before(wrapper);
      wrapper.appendChild(table);
    });

    container.querySelectorAll("pre").forEach(pre => {
      pre.classList.add("xi-code-block");
    });

    return container.innerHTML;
  }

  // ---------------------------------------------------------
  // Daily checklist for 1CheatSheet.md
  // ---------------------------------------------------------

  function makeTopicId(notePath, heading, occurrence) {
    const source = `${notePath}|${heading}|${occurrence}`;
    let hash = 2166136261;

    for (let i = 0; i < source.length; i++) {
      hash ^= source.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(36);
  }

  function renderCheatSheet(markdown, notePath) {
    const lines = markdown.split("\n");
    const sections = [];
    let current = null;
    let occurrence = 0;

    lines.forEach(line => {
      const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);

      if (heading) {
        occurrence++;

        current = {
          level: heading[1].length,
          title: heading[2].replace(/\*\*/g, "").trim(),
          markdown: line,
          id: makeTopicId(notePath, heading[2].trim(), occurrence)
        };

        sections.push(current);
      } else if (current) {
        current.markdown += "\n" + line;
      } else if (line.trim()) {
        // Introductory content before the first heading.
        sections.push({
          level: 0,
          title: "",
          markdown: line,
          id: ""
        });
      } else if (sections.length && sections[sections.length - 1].level === 0) {
        sections[sections.length - 1].markdown += "\n" + line;
      }
    });

    return sections.map(section => {
      const content = renderMarkdown(section.markdown);

      if (!section.level) {
        return `<div class="xi-cheat-intro">${content}</div>`;
      }

      const checked = Boolean(state.checkedTopics[section.id]);

      const checkbox = `
        <label class="xi-topic-check"
          title="${checked ? "Mark as not revised" : "Mark as revised"}">
          <input type="checkbox"
            data-topic-check="${section.id}"
            ${checked ? "checked" : ""}
            aria-label="Mark ${escapeHTML(section.title)} as revised">
          <span class="xi-custom-check" aria-hidden="true"></span>
        </label>`;

      const sectionHTML = content.replace(
        /<h([1-6])([^>]*)>/,
        `<h$1$2>${checkbox}`
      );

      return `
        <section class="xi-check-section ${checked ? "is-checked" : ""}"
          data-topic-section="${section.id}">
          ${sectionHTML}
        </section>`;
    }).join("");
  }

  function renderMath(container) {
    if (!window.renderMathInElement) return;

    renderMathInElement(container, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false,
      strict: "ignore",
      ignoredTags: ["script", "style", "textarea", "pre", "code"]
    });
  }

  function addCodeCopyButtons(container) {
    container.querySelectorAll("pre").forEach(pre => {
      if (pre.querySelector(".xi-copy-code")) return;

      const button = document.createElement("button");
      button.className = "xi-copy-code";
      button.type = "button";
      button.textContent = "Copy";
      pre.appendChild(button);
    });
  }

  // ---------------------------------------------------------
  // In-note contents index
  // ---------------------------------------------------------

  function buildContentsIndex(container) {
    const headings = [
      ...container.querySelectorAll(".xi-markdown h1, .xi-markdown h2, .xi-markdown h3, .xi-markdown h4, .xi-markdown h5, .xi-markdown h6")
    ];

    if (!headings.length) return "";

    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `xi-heading-${index}`;
    });

    return `
      <div class="xi-toc ${state.tocOpen ? "is-open" : "is-closed"}">
        <button class="xi-toc-toggle" id="xi-toc-toggle"
          aria-expanded="${state.tocOpen}">
          <span class="xi-toc-toggle-left">
            <span class="xi-toc-icon">☷</span>
            <span>On this page</span>
            <span class="xi-toc-count">${headings.length}</span>
          </span>
          <span class="xi-toc-chevron">${state.tocOpen ? "⌃" : "⌄"}</span>
        </button>

        <nav class="xi-toc-list" id="xi-toc-list"
          aria-label="On this page" ${state.tocOpen ? "" : "hidden"}>
          ${headings.map(heading => `
            <a class="xi-toc-link"
              href="#${heading.id}"
              style="--xi-toc-level:${Number(heading.tagName.slice(1)) - 1}">
              ${escapeHTML(heading.textContent.trim())}
            </a>
          `).join("")}
        </nav>
      </div>`;
  }

  // ---------------------------------------------------------
  // Open a note
  // ---------------------------------------------------------

  async function getContent(note) {
    if (state.loadedContent.has(note.path)) {
      return state.loadedContent.get(note.path);
    }

    const response = await fetch(rawURL(note.path), {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error(`Unable to load ${note.title} (${response.status}).`);
    }

    const content = await response.text();
    state.loadedContent.set(note.path, content);

    return content;
  }

  async function openNote(index, options = {}) {
    if (index < 0 || index >= state.notes.length) return;

    const note = state.notes[index];
    const requestId = ++state.currentRequest;

    state.currentIndex = index;

    renderSidebar();
    renderNavigation();
    updateBreadcrumb(note);

    const contentElement = document.getElementById("xi-content");

    contentElement.innerHTML = `
      <div class="xi-note-loading">
        <div class="xi-loading-spinner"></div>
        <p>Opening note...</p>
      </div>`;

    try {
      const raw = await getContent(note);

      if (requestId !== state.currentRequest) return;

      const { metadata, body } = extractFrontmatter(raw);
      const cheatSheet = isCheatSheet(note);

      const title = metadata.title || note.title;

      // The breadcrumb already displays the filename. Do not
      // repeat the filename as a large article heading.
      const renderedBody = cheatSheet
        ? renderCheatSheet(body, note.path)
        : renderMarkdown(body);

      contentElement.innerHTML = `
        <article class="xi-content-card" id="xi-content-card">
          <div class="xi-article-body">

            ${metadata.description
              ? `<p class="xi-article-description">${escapeHTML(metadata.description)}</p>`
              : ""}

            ${cheatSheet
              ? `<div class="xi-cheat-sheet-banner">
                   <span class="xi-cheat-sheet-icon">✓</span>
                   <div>
                     <strong>Daily revision checklist</strong>
                     <span>Check off each topic as you revise it. Resets at midnight IST.</span>
                   </div>
                 </div>`
              : ""}

            ${buildContentsIndexFromMarkdown(renderedBody)}

            <div class="xi-markdown ${cheatSheet ? "xi-cheat-sheet" : ""}">
              ${renderedBody}
            </div>

            <div class="xi-article-footer">
              <div class="xi-article-footer-text">
                <span class="xi-footer-sparkle">✳</span>
                One topic at a time.
              </div>
              <div class="xi-article-actions">
                <button class="xi-secondary-button" data-action="back-to-top">
                  ↑ Back to top
                </button>
              </div>
            </div>

          </div>
        </article>`;

      renderMath(contentElement);
      addCodeCopyButtons(contentElement);

      updateBreadcrumb(note);
      updatePosition();

      const workspace = document.getElementById("xi-workspace");

      if (!options.keepScroll && workspace) {
        workspace.scrollTop = 0;
      }

      updateProgress();

      document.title = `${title} · Revision`;

      const url = new URL(location.href);
      url.searchParams.set("note", note.path);
      history.replaceState({ notePath: note.path }, "", url);

    } catch (error) {
      if (requestId !== state.currentRequest) return;

      contentElement.innerHTML = `
        <div class="xi-error-card">
          <h2>Couldn't open this note</h2>
          <p>${escapeHTML(error.message)}</p>
          <button class="xi-nav-button xi-nav-next"
            data-action="retry-note">Try again</button>
        </div>`;
    }
  }

  function buildContentsIndexFromMarkdown(renderedBody) {
    const temp = document.createElement("div");
    temp.innerHTML = renderedBody;

    const headings = [
      ...temp.querySelectorAll("h1, h2, h3, h4, h5, h6")
    ];

    if (!headings.length) return "";

    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `xi-heading-${index}`;
    });

    return `
      <div class="xi-toc ${state.tocOpen ? "is-open" : "is-closed"}">
        <button class="xi-toc-toggle" id="xi-toc-toggle"
          aria-expanded="${state.tocOpen}">
          <span class="xi-toc-toggle-left">
            <span class="xi-toc-icon">☷</span>
            <span>Content index</span>
            <span class="xi-toc-count">${headings.length}</span>
          </span>
          <span class="xi-toc-chevron">${state.tocOpen ? "⌃" : "⌄"}</span>
        </button>

        <nav class="xi-toc-list" id="xi-toc-list"
          aria-label="Content index" ${state.tocOpen ? "" : "hidden"}>
          ${headings.map((heading, index) => `
            <a class="xi-toc-link"
              href="#xi-heading-${index}"
              style="--xi-toc-level:${Number(heading.tagName.slice(1)) - 1}">
              ${escapeHTML(heading.textContent.trim())}
            </a>
          `).join("")}
        </nav>
      </div>`;
  }

  // ---------------------------------------------------------
  // Navigation and breadcrumb
  // ---------------------------------------------------------

  function renderNavigation() {
    const previous = document.getElementById("xi-previous");
    const next = document.getElementById("xi-next");

    previous.disabled = state.currentIndex <= 0;
    next.disabled = state.currentIndex >= state.notes.length - 1;

    updatePosition();
  }

  function navigate(direction) {
    const nextIndex = state.currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < state.notes.length) {
      openNote(nextIndex);
    }
  }

  function updateBreadcrumb(note) {
    const breadcrumb = document.getElementById("xi-breadcrumb");
    if (!breadcrumb) return;

    breadcrumb.innerHTML = `
      <span class="xi-breadcrumb-current">${escapeHTML(note.title)}</span>`;
  }

  function updatePosition() {
    const element = document.getElementById("xi-current-position");

    if (element) {
      element.textContent = state.notes.length
        ? `Note ${state.currentIndex + 1} of ${state.notes.length}`
        : "No notes";
    }
  }

  // ---------------------------------------------------------
  // Reading progress
  // ---------------------------------------------------------

  function updateProgress() {
    const workspace = document.getElementById("xi-workspace");
    const card = document.getElementById("xi-content-card");

    let progress = 0;

    if (workspace && card) {
      const scrollableHeight = card.offsetHeight - workspace.clientHeight;

      progress = scrollableHeight <= 0
        ? 100
        : Math.min(100, Math.max(
            0,
            workspace.scrollTop / scrollableHeight * 100
          ));
    }

    const label = document.getElementById("xi-progress-label");
    const fill = document.getElementById("xi-top-progress-fill");

    if (label) label.textContent = `${Math.round(progress)}% read`;
    if (fill) fill.style.width = `${progress}%`;
  }

  // ---------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------

  function setMobileSidebar(open) {
    app.classList.toggle("xi-mobile-sidebar-open", open);
  }

  function toggleFolder(folder) {
    if (state.expandedFolders.has(folder)) {
      state.expandedFolders.delete(folder);
    } else {
      state.expandedFolders.add(folder);
    }

    renderSidebar();
  }

  function bindEvents() {
    app.addEventListener("click", async event => {
      const actionElement = event.target.closest("[data-action]");

      if (actionElement) {
        switch (actionElement.dataset.action) {
          case "open-note":
            await openNote(Number(actionElement.dataset.index));
            setMobileSidebar(false);
            return;

          case "toggle-folder":
            toggleFolder(actionElement.dataset.folder);
            return;

          case "retry-note":
            if (currentNote()) {
              state.loadedContent.delete(currentNote().path);
              openNote(state.currentIndex);
            }
            return;

          case "back-to-top":
            document.getElementById("xi-workspace")
              ?.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
      }

      const checkbox = event.target.closest("[data-topic-check]");

      if (checkbox) {
        const topicId = checkbox.dataset.topicCheck;

        state.checkedTopics[topicId] = checkbox.checked;
        saveDailyChecks();

        const section = checkbox.closest("[data-topic-section]");

        if (section) {
          section.classList.toggle("is-checked", checkbox.checked);
        }

        checkbox.closest(".xi-topic-check")?.setAttribute(
          "title",
          checkbox.checked ? "Mark as not revised" : "Mark as revised"
        );

        return;
      }

      if (event.target.closest("#xi-previous")) {
        navigate(-1);
        return;
      }

      if (event.target.closest("#xi-next")) {
        navigate(1);
        return;
      }

      if (event.target.closest("#xi-sidebar-toggle")) {
        if (matchMedia("(max-width: 900px)").matches) {
          setMobileSidebar(!app.classList.contains("xi-mobile-sidebar-open"));
        } else {
          app.classList.toggle("xi-sidebar-collapsed");
        }
        return;
      }

      if (
        event.target.closest("#xi-sidebar-close") ||
        event.target.closest("#xi-sidebar-backdrop")
      ) {
        setMobileSidebar(false);
        return;
      }

      if (event.target.closest("#xi-toc-toggle")) {
        state.tocOpen = !state.tocOpen;

        const toc = document.querySelector(".xi-toc");
        const list = document.getElementById("xi-toc-list");
        const button = document.getElementById("xi-toc-toggle");
        const chevron = document.querySelector(".xi-toc-chevron");

        toc?.classList.toggle("is-open", state.tocOpen);
        toc?.classList.toggle("is-closed", !state.tocOpen);

        if (list) list.hidden = !state.tocOpen;
        if (button) button.setAttribute("aria-expanded", String(state.tocOpen));
        if (chevron) chevron.textContent = state.tocOpen ? "⌃" : "⌄";

        return;
      }

      const copyButton = event.target.closest(".xi-copy-code");

      if (copyButton) {
        const code = copyButton.closest("pre")?.querySelector("code");

        if (code) {
          try {
            await navigator.clipboard.writeText(code.innerText);
            showToast("Code copied");
          } catch {
            showToast("Unable to copy code");
          }
        }
      }
    });

    document.getElementById("xi-search").addEventListener("input", event => {
      state.searchQuery = event.target.value;
      renderSidebar();
    });

    document.getElementById("xi-workspace").addEventListener(
      "scroll",
      updateProgress,
      { passive: true }
    );

    window.addEventListener("resize", () => {
      if (!matchMedia("(max-width: 900px)").matches) {
        setMobileSidebar(false);
      }
    });

    document.addEventListener("keydown", event => {
      const target = event.target;

      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable;

      if (event.key === "Escape") {
        setMobileSidebar(false);
        return;
      }

      if (event.key === "/" && !typing) {
        event.preventDefault();
        document.getElementById("xi-search").focus();
        return;
      }

      if (typing) return;

      if (event.altKey && event.key === "ArrowLeft") {
        event.preventDefault();
        navigate(-1);
      }

      if (event.altKey && event.key === "ArrowRight") {
        event.preventDefault();
        navigate(1);
      }
    });
  }

  function showToast(message) {
    let toast = document.getElementById("xi-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "xi-toast";
      toast.className = "xi-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2000);
  }

  // ---------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------

  async function init() {
    renderShell();
    loadDailyChecks();
    scheduleDailyReset();

    try {
      await loadLibraries();
      await discoverNotes();

      renderSidebar();
      renderNavigation();

      await openNote(state.currentIndex);

    } catch (error) {
      document.getElementById("xi-content").innerHTML = `
        <div class="xi-error-card">
          <h2>Unable to load notes</h2>
          <p>${escapeHTML(error.message)}</p>
          <button class="xi-nav-button xi-nav-next"
            onclick="location.reload()">Reload</button>
        </div>`;

      console.error("Xi Notes:", error);
    }
  }

  init();
})();
