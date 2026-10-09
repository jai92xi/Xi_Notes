
(() => {
  "use strict";

  // =========================================================
  // XI NOTES — REVISION WEBSITE
  // =========================================================

  const CONFIG = {
    owner: "jai92xi",
    repo: "Xi_Notes",
    branch: "main",
    notesFolder: "notes",
    pageTitle: "Xi Notes",
    subtitle: "Learn. Revise. Repeat.",
    githubApi: "https://api.github.com",
    rawBase: "https://raw.githubusercontent.com",
    storageKey: "xi-notes-preferences-v1",
    supportedExtensions: [".md", ".mdx", ".markdown", ".txt"],
    pageSize: 50
  };

  const state = {
    notes: [],
    currentIndex: -1,
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    searchQuery: "",
    loading: true,
    error: null,
    scrollProgress: 0,
    expandedFolders: new Set(),
    loadedContent: new Map(),
    currentRequest: 0,
    preferences: loadPreferences()
  };

  const app = document.getElementById("app") || createAppRoot();

  // =========================================================
  // UTILITIES
  // =========================================================

  function createAppRoot() {
    const root = document.createElement("div");
    root.id = "app";
    document.body.appendChild(root);
    return root;
  }

  function loadPreferences() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.storageKey)) || {};
    } catch {
      return {};
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(
        CONFIG.storageKey,
        JSON.stringify(state.preferences)
      );
    } catch {
      // The application remains usable when storage is unavailable.
    }
  }

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function filenameToTitle(path) {
    const filename = path.split("/").pop() || path;

    return filename
      .replace(/\.(md|mdx|markdown|txt)$/i, "")
      .replace(/^\d+[-_. ]*/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getExtension(path) {
    const match = path.match(/\.[^.]+$/);
    return match ? match[0].toLowerCase() : "";
  }

  function getFolder(path) {
    const parts = path.split("/");
    parts.pop();
    return parts.join("/");
  }

  function getFolderLabel(folder) {
    return folder
      .split("/")
      .filter(Boolean)
      .map(part => part.replace(/[-_]+/g, " "))
      .join(" / ");
  }

  function compareNotePaths(a, b) {
    // Natural sorting: Chapter 2 comes before Chapter 10.
    return a.path.localeCompare(b.path, undefined, {
      numeric: true,
      sensitivity: "base"
    });
  }

  function getCurrentNote() {
    return state.notes[state.currentIndex] || null;
  }

  function getRawURL(path) {
    return `${CONFIG.rawBase}/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
  }

  function getApiURL(path) {
    return `${CONFIG.githubApi}/repos/${CONFIG.owner}/${CONFIG.repo}/${path}`;
  }

  async function fetchJSON(url) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json"
      }
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        throw new Error(
          "GitHub API rate limit reached. Please wait a minute and reload."
        );
      }

      if (response.status === 404) {
        throw new Error(
          "The notes folder was not found. Check the repository and folder settings."
        );
      }

      throw new Error(`Request failed (${response.status}).`);
    }

    return response.json();
  }

  // =========================================================
  // LOAD EXTERNAL LIBRARIES
  // =========================================================

  function loadScript(src, id) {
    return new Promise((resolve, reject) => {
      const existing = document.getElementById(id);

      if (existing?.dataset.loaded === "true") {
        resolve();
        return;
      }

      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error(`Could not load ${id}`)),
          { once: true }
        );
        return;
      }

      const script = document.createElement("script");
      script.id = id;
      script.src = src;
      script.async = true;

      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Could not load ${id}`));
      };

      document.head.appendChild(script);
    });
  }

  async function loadMarkdownLibraries() {
    await loadScript(
      "https://cdn.jsdelivr.net/npm/marked@15.0.7/marked.min.js",
      "xi-marked"
    );

    await loadScript(
      "https://cdn.jsdelivr.net/npm/dompurify@3.2.6/dist/purify.min.js",
      "xi-dompurify"
    );

    // KaTeX renders LaTeX equations without a full-page reflow.
    await loadScript(
      "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js",
      "xi-katex"
    );

    await loadScript(
      "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/contrib/auto-render.min.js",
      "xi-katex-auto-render"
    );

    configureMarkdown();
  }

  function configureMarkdown() {
    if (!window.marked) {
      throw new Error("Markdown rendering library is unavailable.");
    }

    marked.setOptions({
      gfm: true,
      breaks: true,
      headerIds: false,
      mangle: false
    });
  }

  // =========================================================
  // DISCOVER NOTES IN /notes
  // =========================================================

  async function discoverNotes() {
    const tree = await fetchJSON(
      getApiURL(`git/trees/${CONFIG.branch}?recursive=1`)
    );

    if (tree.truncated) {
      throw new Error(
        "The repository is too large to list in one request. " +
        "Consider creating a notes manifest file."
      );
    }

    const prefix = CONFIG.notesFolder.replace(/^\/|\/$/g, "") + "/";

    const files = (tree.tree || [])
      .filter(item => {
        if (item.type !== "blob") return false;
        if (!item.path.startsWith(prefix)) return false;

        const extension = getExtension(item.path);

        return CONFIG.supportedExtensions.includes(extension);
      })
      .map(item => ({
        path: item.path,
        title: filenameToTitle(item.path),
        folder: getFolder(item.path).slice(prefix.length).replace(/\/$/, ""),
        url: getRawURL(item.path),
        sha: item.sha,
        size: item.size || 0
      }))
      .sort(compareNotePaths);

    if (!files.length) {
      throw new Error(
        `No supported notes were found inside /${CONFIG.notesFolder}. ` +
        "Add Markdown (.md) files and reload."
      );
    }

    state.notes = files;

    // Restore the last note when possible.
    const savedPath = state.preferences.lastNotePath;
    const savedIndex = files.findIndex(note => note.path === savedPath);

    state.currentIndex = savedIndex >= 0 ? savedIndex : 0;

    files.forEach(note => {
      const folder = note.folder || "";

      if (folder) {
        const segments = folder.split("/");
        let current = "";

        segments.forEach(segment => {
          current = current ? `${current}/${segment}` : segment;
          state.expandedFolders.add(current);
        });
      }
    });

    renderSidebar();
    renderNavigation();
  }

  // =========================================================
  // APP LAYOUT
  // =========================================================

  function renderShell() {
    app.innerHTML = `
      <div class="xi-app">

        <aside class="xi-sidebar" id="xi-sidebar">
          <div class="xi-brand">
            <div class="xi-brand-icon">Xi</div>
            <div class="xi-brand-copy">
              <div class="xi-brand-title">${escapeHTML(CONFIG.pageTitle)}</div>
              <div class="xi-brand-subtitle">${escapeHTML(CONFIG.subtitle)}</div>
            </div>
            <button
              class="xi-icon-button xi-sidebar-close"
              id="xi-sidebar-close"
              aria-label="Close sidebar"
              title="Close sidebar"
            >×</button>
          </div>

          <div class="xi-sidebar-actions">
            <button class="xi-secondary-button" id="xi-collapse-all">
              Collapse all
            </button>
            <button class="xi-secondary-button" id="xi-expand-all">
              Expand all
            </button>
          </div>

          <div class="xi-search-wrap">
            <span class="xi-search-icon" aria-hidden="true">⌕</span>
            <input
              id="xi-search"
              class="xi-search"
              type="search"
              placeholder="Search your notes..."
              autocomplete="off"
              aria-label="Search notes"
            />
            <kbd class="xi-search-shortcut">/</kbd>
          </div>

          <div class="xi-sidebar-heading">
            <span>YOUR LIBRARY</span>
            <span id="xi-note-count" class="xi-count">0</span>
          </div>

          <nav class="xi-note-tree" id="xi-note-tree" aria-label="Notes">
            <div class="xi-loading-small">Loading your notes...</div>
          </nav>

          <div class="xi-sidebar-footer">
            <div class="xi-status-dot"></div>
            <span>Personal revision space</span>
          </div>
        </aside>

        <div class="xi-sidebar-backdrop" id="xi-sidebar-backdrop"></div>

        <main class="xi-main">

          <header class="xi-topbar" id="xi-topbar">
            <div class="xi-topbar-left">
              <button
                class="xi-icon-button"
                id="xi-sidebar-toggle"
                aria-label="Toggle sidebar"
                title="Toggle sidebar"
              >☰</button>

              <div class="xi-breadcrumb" id="xi-breadcrumb">
                <span>Xi Notes</span>
                <span class="xi-breadcrumb-separator">/</span>
                <span>Revision</span>
              </div>
            </div>

            <div class="xi-topbar-right">
              <span class="xi-progress-label" id="xi-progress-label">
                0% read
              </span>

              <button
                class="xi-nav-button"
                id="xi-previous"
                aria-label="Previous note"
                title="Previous note (Alt + Left)"
                disabled
              >
                <span aria-hidden="true">←</span>
                <span>Previous</span>
              </button>

              <button
                class="xi-nav-button xi-nav-next"
                id="xi-next"
                aria-label="Next note"
                title="Next note (Alt + Right)"
                disabled
              >
                <span>Next</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <div class="xi-top-progress">
              <div class="xi-top-progress-fill" id="xi-top-progress-fill"></div>
            </div>
          </header>

          <section class="xi-workspace" id="xi-workspace">
            <div class="xi-welcome" id="xi-content">
              <div class="xi-welcome-icon">✳</div>
              <p class="xi-eyebrow">YOUR KNOWLEDGE SPACE</p>
              <h1>Your next revision starts here.</h1>
              <p class="xi-welcome-text">
                Choose a note from the left to get started.
              </p>
              <div class="xi-loading-spinner" aria-label="Loading"></div>
            </div>
          </section>

          <footer class="xi-bottom-bar">
            <span id="xi-current-position">Preparing your notes...</span>
            <span class="xi-key-hint">
              <kbd>Alt</kbd> + <kbd>←</kbd>
              <span>or</span>
              <kbd>Alt</kbd> + <kbd>→</kbd>
              <span>to navigate</span>
            </span>
          </footer>

        </main>
      </div>
    `;

    bindEvents();
  }

  // =========================================================
  // SIDEBAR TREE
  // =========================================================

  function buildFolderTree(notes) {
    const root = {
      name: "",
      path: "",
      folders: new Map(),
      notes: []
    };

    notes.forEach(note => {
      const segments = note.folder
        ? note.folder.split("/").filter(Boolean)
        : [];

      let node = root;
      let path = "";

      segments.forEach(segment => {
        path = path ? `${path}/${segment}` : segment;

        if (!node.folders.has(segment)) {
          node.folders.set(segment, {
            name: segment,
            path,
            folders: new Map(),
            notes: []
          });
        }

        node = node.folders.get(segment);
      });

      node.notes.push(note);
    });

    return root;
  }

  function renderSidebar() {
    const treeElement = document.getElementById("xi-note-tree");
    const countElement = document.getElementById("xi-note-count");

    if (!treeElement) return;

    const query = state.searchQuery.trim().toLowerCase();

    const filteredNotes = state.notes.filter(note => {
      if (!query) return true;

      return (
        note.title.toLowerCase().includes(query) ||
        note.path.toLowerCase().includes(query)
      );
    });

    if (countElement) {
      countElement.textContent = String(filteredNotes.length);
    }

    if (!filteredNotes.length) {
      treeElement.innerHTML = `
        <div class="xi-empty-search">
          <div class="xi-empty-search-icon">⌕</div>
          <p>No notes found</p>
          <span>Try a different keyword.</span>
        </div>
      `;
      return;
    }

    const tree = buildFolderTree(filteredNotes);

    function renderNode(node, depth = 0) {
      let html = "";

      const folders = [...node.folders.values()].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: "base"
        })
      );

      folders.forEach(folder => {
        const isExpanded =
          query.length > 0 || state.expandedFolders.has(folder.path);

        html += `
          <div class="xi-tree-folder" data-folder="${escapeHTML(folder.path)}">
            <button
              class="xi-folder-button"
              data-action="toggle-folder"
              data-folder="${escapeHTML(folder.path)}"
              aria-expanded="${isExpanded}"
              style="--xi-depth:${depth}"
              title="${escapeHTML(folder.name)}"
            >
              <span class="xi-folder-chevron">${isExpanded ? "⌄" : "›"}</span>
              <span class="xi-folder-icon">${isExpanded ? "▾" : "▸"}</span>
              <span class="xi-folder-name">${escapeHTML(
                folder.name.replace(/[-_]+/g, " ")
              )}</span>
            </button>

            <div class="xi-folder-children"
                 ${isExpanded ? "" : "hidden"}>
              ${renderNode(folder, depth + 1)}
            </div>
          </div>
        `;
      });

      const orderedNotes = [...node.notes].sort((a, b) =>
        compareNotePaths(a, b)
      );

      orderedNotes.forEach(note => {
        const index = state.notes.findIndex(
          item => item.path === note.path
        );

        const isActive = index === state.currentIndex;

        html += `
          <button
            class="xi-note-link ${isActive ? "is-active" : ""}"
            data-action="open-note"
            data-index="${index}"
            style="--xi-depth:${depth}"
            title="${escapeHTML(note.title)}"
            ${isActive ? 'aria-current="page"' : ""}
          >
            <span class="xi-note-icon">◇</span>
            <span class="xi-note-name">${escapeHTML(note.title)}</span>
            ${isActive ? '<span class="xi-active-dot"></span>' : ""}
          </button>
        `;
      });

      return html;
    }

    treeElement.innerHTML = renderNode(tree);

    // Reopen the active note's parent folders when not searching.
    if (!query) {
      const current = getCurrentNote();

      if (current?.folder) {
        const segments = current.folder.split("/");
        let folder = "";

        segments.forEach(segment => {
          folder = folder ? `${folder}/${segment}` : segment;

          const element = treeElement.querySelector(
            `.xi-tree-folder[data-folder="${CSS.escape(folder)}"]`
          );

          if (element) {
            const button = element.querySelector(".xi-folder-button");
            const children = element.querySelector(".xi-folder-children");

            if (button) button.setAttribute("aria-expanded", "true");
            if (children) children.hidden = false;
            state.expandedFolders.add(folder);
          }
        });
      }
    }
  }

  // =========================================================
  // LOAD AND RENDER A NOTE
  // =========================================================

  async function getNoteContent(note) {
    if (state.loadedContent.has(note.path)) {
      return state.loadedContent.get(note.path);
    }

    const response = await fetch(note.url, {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error(
        `Unable to load "${note.title}" (${response.status}).`
      );
    }

    const content = await response.text();

    state.loadedContent.set(note.path, content);

    return content;
  }

  function extractFrontmatter(content) {
    if (!content.startsWith("---\n")) {
      return { metadata: {}, body: content };
    }

    const end = content.indexOf("\n---", 4);

    if (end === -1) {
      return { metadata: {}, body: content };
    }

    const header = content.slice(4, end);
    const body = content.slice(end + 4).replace(/^\r?\n/, "");
    const metadata = {};

    header.split(/\r?\n/).forEach(line => {
      const match = line.match(/^([\w-]+)\s*:\s*(.*?)\s*$/);

      if (match) {
        metadata[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    });

    return { metadata, body };
  }

  function normalizeMarkdown(content) {
    let result = content.replace(/\r\n/g, "\n");

    // Remove YAML frontmatter.
    result = extractFrontmatter(result).body;

    // Support common ==yellow highlight== notation.
    result = result.replace(
      /(^|[^\w=])==([^=\n]+)==(?![=])/g,
      '$1<mark class="xi-highlight">$2</mark>'
    );

    // Convert common highlight notation into marked HTML.
    // Sanitization is performed after Markdown rendering.
    return result;
  }

  function renderMarkdown(content) {
    const markdown = normalizeMarkdown(content);

    // Support both common LaTeX delimiters and Markdown fences.
    const mathBlocks = [];

    let protectedMarkdown = markdown.replace(
      /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g,
      match => {
        const token = `XI_MATH_BLOCK_${mathBlocks.length}_TOKEN`;
        mathBlocks.push(match);
        return token;
      }
    );

    // Render Markdown first.
    let html = marked.parse(protectedMarkdown);

    // Restore equations after Markdown parsing.
    mathBlocks.forEach((math, index) => {
      const token = `XI_MATH_BLOCK_${index}_TOKEN`;
      html = html.replaceAll(token, escapeHTML(math));
    });

    // Sanitize all rendered HTML. Raw note HTML is not trusted.
    html = DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_TAGS: ["mark"],
      ADD_ATTR: ["class", "aria-label"]
    });

    // Ensure links open safely.
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;

    wrapper.querySelectorAll("a").forEach(link => {
      const href = link.getAttribute("href") || "";

      if (/^\s*javascript:/i.test(href)) {
        link.removeAttribute("href");
        return;
      }

      if (/^https?:\/\//i.test(href)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    });

    // Style code blocks for readable revision.
    wrapper.querySelectorAll("pre").forEach(pre => {
      pre.classList.add("xi-code-block");
    });

    wrapper.querySelectorAll("table").forEach(table => {
      table.classList.add("xi-markdown-table");

      const container = document.createElement("div");
      container.className = "xi-table-wrap";

      table.parentNode.insertBefore(container, table);
      container.appendChild(table);
    });

    return wrapper.innerHTML;
  }

  async function openNote(index, options = {}) {
    if (index < 0 || index >= state.notes.length) return;

    const note = state.notes[index];
    const requestId = ++state.currentRequest;

    state.currentIndex = index;
    state.scrollProgress = 0;
    state.preferences.lastNotePath = note.path;
    savePreferences();

    renderSidebar();
    renderNavigation();

    const contentElement = document.getElementById("xi-content");

    if (contentElement) {
      contentElement.innerHTML = `
        <div class="xi-note-loading">
          <div class="xi-loading-spinner"></div>
          <p>Opening your note...</p>
        </div>
      `;
    }

    try {
      const rawContent = await getNoteContent(note);

      if (requestId !== state.currentRequest) return;

      const parsed = extractFrontmatter(rawContent);
      const title = parsed.metadata.title || note.title;
      const body = renderMarkdown(parsed.body);

      const noteNumber = String(index + 1).padStart(2, "0");
      const noteTotal = String(state.notes.length).padStart(2, "0");
      const folderLabel = note.folder
        ? getFolderLabel(note.folder)
        : "General";

      contentElement.innerHTML = `
        <article class="xi-content-card" id="xi-content-card">

          <div class="xi-note-meta">
            <div class="xi-note-category">
              <span class="xi-category-dot"></span>
              ${escapeHTML(folderLabel)}
            </div>
            <div class="xi-note-number">
              ${noteNumber} <span>/ ${noteTotal}</span>
            </div>
          </div>

          <div class="xi-article-body">
            <h1 class="xi-article-title">${escapeHTML(title)}</h1>

            ${parsed.metadata.description
              ? `<p class="xi-article-description">${escapeHTML(
                  parsed.metadata.description
                )}</p>`
              : ""}

            <div class="xi-markdown">
              ${body}
            </div>
          </div>

          <div class="xi-article-footer">
            <div class="xi-article-footer-text">
              <span class="xi-footer-sparkle">✳</span>
              Keep showing up. Keep learning.
            </div>
            <div class="xi-article-actions">
              <button class="xi-secondary-button" data-action="copy-link">
                Copy note link
              </button>
              <button class="xi-secondary-button" data-action="back-to-top">
                ↑ Back to top
              </button>
            </div>
          </div>

        </article>
      `;

      renderMath(contentElement);
      decorateCodeBlocks(contentElement);
      buildTableOfContents(contentElement);
      updateBreadcrumb(note);
      updatePosition();

      const workspace = document.getElementById("xi-workspace");

      if (workspace) workspace.scrollTop = 0;

      window.scrollTo({ top: 0, behavior: "auto" });

      updateReadingProgress();

      if (!options.keepFocus) {
        document.title = `${title} · ${CONFIG.pageTitle}`;
      }

      if (options.pushHistory !== false) {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set("note", note.path);

          window.history.replaceState(
            { notePath: note.path },
            "",
            url.toString()
          );
        } catch {
          // Continue without URL state if history updates are unavailable.
        }
      }

      document.dispatchEvent(
        new CustomEvent("xi-note-opened", {
          detail: { note, index }
        })
      );
    } catch (error) {
      if (requestId !== state.currentRequest) return;

      contentElement.innerHTML = `
        <div class="xi-error-card">
          <div class="xi-error-icon">!</div>
          <h2>Couldn't open this note</h2>
          <p>${escapeHTML(error.message || "An unexpected error occurred.")}</p>
          <button class="xi-nav-button xi-nav-next"
                  data-action="retry-note">
            Try again
          </button>
        </div>
      `;
    }
  }

  // =========================================================
  // FORMULAS AND CODE
  // =========================================================

  function renderMath(container) {
    if (!container || !window.renderMathInElement) return;

    try {
      renderMathInElement(container, {
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
        ],
        errorColor: "#b42318"
      });
    } catch (error) {
      console.warn("Math rendering issue:", error);
    }
  }

  function decorateCodeBlocks(container) {
    container.querySelectorAll("pre code").forEach(code => {
      const pre = code.closest("pre");

      if (!pre || pre.querySelector(".xi-copy-code")) return;

      const copyButton = document.createElement("button");
      copyButton.className = "xi-copy-code";
      copyButton.type = "button";
      copyButton.textContent = "Copy";
      copyButton.setAttribute("aria-label", "Copy code");

      pre.appendChild(copyButton);
    });
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand("copy");
        showToast("Copied to clipboard");
      } catch {
        showToast("Copy failed. Please select the text manually.");
      }

      textarea.remove();
    }
  }

  // =========================================================
  // TABLE OF CONTENTS
  // =========================================================

  function buildTableOfContents(container) {
    const markdown = container.querySelector(".xi-markdown");
    if (!markdown) return;

    const headings = [...markdown.querySelectorAll("h2, h3")];

    if (!headings.length) return;

    headings.forEach((heading, index) => {
      if (!heading.id) {
        heading.id = `xi-section-${index + 1}`;
      }

      heading.classList.add("xi-heading-anchor");
    });

    // Keep the main article uncluttered. Heading navigation is
    // available through the native browser Find feature and anchors.
    // A future index.html/style.css update can add a TOC panel here.
    const tocEvent = new CustomEvent("xi-toc-ready", {
      detail: {
        headings: headings.map(heading => ({
          id: heading.id,
          text: heading.textContent,
          level: Number(heading.tagName.slice(1))
        }))
      }
    });

    document.dispatchEvent(tocEvent);
  }

  // =========================================================
  // TOP NAVIGATION
  // =========================================================

  function renderNavigation() {
    const previous = document.getElementById("xi-previous");
    const next = document.getElementById("xi-next");

    if (!previous || !next) return;

    previous.disabled = state.currentIndex <= 0;
    next.disabled =
      state.currentIndex < 0 ||
      state.currentIndex >= state.notes.length - 1;

    updatePosition();
  }

  function navigate(direction) {
    const nextIndex = state.currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= state.notes.length) return;

    openNote(nextIndex);
  }

  function updatePosition() {
    const element = document.getElementById("xi-current-position");

    if (!element) return;

    if (!state.notes.length || state.currentIndex < 0) {
      element.textContent = "Preparing your notes...";
      return;
    }

    element.textContent =
      `Note ${state.currentIndex + 1} of ${state.notes.length}`;
  }

  function updateBreadcrumb(note) {
    const breadcrumb = document.getElementById("xi-breadcrumb");

    if (!breadcrumb) return;

    const parts = note.folder
      ? note.folder.split("/").filter(Boolean)
      : [];

    breadcrumb.innerHTML = `
      <span class="xi-breadcrumb-root">Xi Notes</span>
      <span class="xi-breadcrumb-separator">/</span>
      ${
        parts.length
          ? `<span>${escapeHTML(parts[parts.length - 1].replace(/[-_]+/g, " "))}</span>
             <span class="xi-breadcrumb-separator">/</span>`
          : ""
      }
      <span class="xi-breadcrumb-current">${escapeHTML(note.title)}</span>
    `;
  }

  // =========================================================
  // READING PROGRESS
  // =========================================================

  function updateReadingProgress() {
    const workspace = document.getElementById("xi-workspace");
    const card = document.getElementById("xi-content-card");

    let progress = 0;

    if (card) {
      const rect = card.getBoundingClientRect();
      const scrollableHeight =
        card.scrollHeight - window.innerHeight;

      if (scrollableHeight <= 0) {
        progress = 100;
      } else {
        progress = Math.max(
          0,
          Math.min(100, (Math.max(0, -rect.top) / scrollableHeight) * 100)
        );
      }
    }

    state.scrollProgress = Math.round(progress);

    const label = document.getElementById("xi-progress-label");
    const fill = document.getElementById("xi-top-progress-fill");

    if (label) label.textContent = `${state.scrollProgress}% read`;
    if (fill) fill.style.width = `${state.scrollProgress}%`;

    if (workspace) {
      workspace.classList.toggle(
        "xi-reading-started",
        state.scrollProgress > 0
      );
    }
  }

  // =========================================================
  // SIDEBAR CONTROLS
  // =========================================================

  function setSidebarCollapsed(collapsed) {
    state.sidebarCollapsed = collapsed;
    app.classList.toggle("xi-sidebar-collapsed", collapsed);

    state.preferences.sidebarCollapsed = collapsed;
    savePreferences();

    const button = document.getElementById("xi-sidebar-toggle");

    if (button) {
      button.setAttribute(
        "aria-label",
        collapsed ? "Open sidebar" : "Collapse sidebar"
      );
      button.title = collapsed ? "Open sidebar" : "Collapse sidebar";
    }
  }

  function setMobileSidebar(open) {
    state.mobileSidebarOpen = open;

    app.classList.toggle("xi-mobile-sidebar-open", open);

    const toggle = document.getElementById("xi-sidebar-toggle");

    if (toggle) {
      toggle.setAttribute("aria-expanded", String(open));
    }
  }

  function toggleFolder(folder) {
    if (state.expandedFolders.has(folder)) {
      state.expandedFolders.delete(folder);
    } else {
      state.expandedFolders.add(folder);
    }

    renderSidebar();
  }

  function expandAllFolders(expanded) {
    state.expandedFolders.clear();

    if (expanded) {
      state.notes.forEach(note => {
        if (!note.folder) return;

        const segments = note.folder.split("/");
        let current = "";

        segments.forEach(segment => {
          current = current ? `${current}/${segment}` : segment;
          state.expandedFolders.add(current);
        });
      });
    }

    renderSidebar();
  }

  // =========================================================
  // SEARCH
  // =========================================================

  function searchNotes(query) {
    state.searchQuery = query;
    renderSidebar();
  }

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  let toastTimer;

  function showToast(message) {
    let toast = document.getElementById("xi-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "xi-toast";
      toast.className = "xi-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  // =========================================================
  // EVENTS
  // =========================================================

  function bindEvents() {
    app.addEventListener("click", async event => {
      const actionElement = event.target.closest("[data-action]");

      if (actionElement) {
        const action = actionElement.dataset.action;

        switch (action) {
          case "open-note": {
            const index = Number(actionElement.dataset.index);

            if (Number.isInteger(index)) {
              await openNote(index);
              setMobileSidebar(false);
            }

            return;
          }

          case "toggle-folder": {
            toggleFolder(actionElement.dataset.folder);
            return;
          }

          case "copy-link": {
            const note = getCurrentNote();

            if (note) {
              const url = new URL(window.location.href);
              url.searchParams.set("note", note.path);
              await copyText(url.toString());
            }

            return;
          }

          case "back-to-top": {
            window.scrollTo({ top: 0, behavior: "smooth" });

            const workspace = document.getElementById("xi-workspace");

            if (workspace) {
              workspace.scrollTo({ top: 0, behavior: "smooth" });
            }

            return;
          }

          case "retry-note": {
            if (state.currentIndex >= 0) {
              state.loadedContent.delete(
                state.notes[state.currentIndex].path
              );

              await openNote(state.currentIndex);
            }

            return;
          }
        }
      }

      const copyCode = event.target.closest(".xi-copy-code");

      if (copyCode) {
        const pre = copyCode.closest("pre");
        const code = pre?.querySelector("code");

        if (code) await copyText(code.innerText);

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
        if (window.matchMedia("(max-width: 900px)").matches) {
          setMobileSidebar(!state.mobileSidebarOpen);
        } else {
          setSidebarCollapsed(!state.sidebarCollapsed);
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

      if (event.target.closest("#xi-collapse-all")) {
        expandAllFolders(false);
        return;
      }

      if (event.target.closest("#xi-expand-all")) {
        expandAllFolders(true);
        return;
      }
    });

    const searchInput = document.getElementById("xi-search");

    if (searchInput) {
      searchInput.addEventListener("input", event => {
        searchNotes(event.target.value);
      });
    }

    window.addEventListener("scroll", updateReadingProgress, {
      passive: true
    });

    const workspace = document.getElementById("xi-workspace");

    if (workspace) {
      workspace.addEventListener("scroll", updateReadingProgress, {
        passive: true
      });
    }

    window.addEventListener("resize", () => {
      if (!window.matchMedia("(max-width: 900px)").matches) {
        setMobileSidebar(false);
      }
    });

    document.addEventListener("keydown", event => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (event.key === "Escape") {
        setMobileSidebar(false);
        return;
      }

      // "/" focuses search unless the user is typing.
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchInput?.focus();
        return;
      }

      if (isTyping) return;

      if (event.altKey && event.key === "ArrowLeft") {
        event.preventDefault();
        navigate(-1);
      } else if (event.altKey && event.key === "ArrowRight") {
        event.preventDefault();
        navigate(1);
      }
    });
  }

  // =========================================================
  // INITIALIZATION
  // =========================================================

  async function init() {
    renderShell();

    if (state.preferences.sidebarCollapsed) {
      setSidebarCollapsed(true);
    }

    try {
      await loadMarkdownLibraries();
      await discoverNotes();

      state.loading = false;

      // Open a note from the URL if a valid note path is supplied.
      const params = new URLSearchParams(window.location.search);
      const requestedPath = params.get("note");

      if (requestedPath) {
        const index = state.notes.findIndex(
          note => note.path === requestedPath
        );

        if (index >= 0) {
          state.currentIndex = index;
        }
      }

      await openNote(state.currentIndex, {
        pushHistory: false
      });

      document.dispatchEvent(new CustomEvent("xi-notes-ready"));
    } catch (error) {
      state.loading = false;
      state.error = error;

      const content = document.getElementById("xi-content");
      const tree = document.getElementById("xi-note-tree");

      if (tree) {
        tree.innerHTML = `
          <div class="xi-error-message">
            ${escapeHTML(error.message)}
          </div>
        `;
      }

      if (content) {
        content.innerHTML = `
          <div class="xi-error-card">
            <div class="xi-error-icon">!</div>
            <p class="xi-eyebrow">NOTES UNAVAILABLE</p>
            <h1>Let's get your notes back.</h1>
            <p>${escapeHTML(error.message || "Unable to load your notes.")}</p>
            <button
              class="xi-nav-button xi-nav-next"
              id="xi-reload"
              type="button"
            >Reload notes</button>
            <p class="xi-error-help">
              Check that the repository is public and the notes folder
              exists on the configured branch.
            </p>
          </div>
        `;
      }

      document.getElementById("xi-reload")?.addEventListener("click", () => {
        window.location.reload();
      });

      console.error("Xi Notes initialization failed:", error);
    }
  }

  init();
})();
