/* =========================================================
   Xi Notes — AI / ML Revision Hub
   app.js  
   ========================================================= */

(() => {
  "use strict";

  const CONFIG = {
    githubOwner: "jai92xi",
    githubRepo: "Xi_Notes",
    notesPath: "notes",
    branch: "main",

    apiBase: "https://api.github.com",

    storage: {
      theme: "xi-notes-theme",
      progress: "xi-notes-progress",
      favorites: "xi-notes-favorites",
      lastNote: "xi-notes-last-note"
    }
  };

  const state = {
    files: [],
    notes: [],
    filteredNotes: [],
    currentNote: null,

    searchQuery: "",
    selectedTopic: "all",
    selectedTag: "all",
    sortBy: "name",

    favorites: loadJSON(CONFIG.storage.favorites, []),
    progress: loadJSON(CONFIG.storage.progress, {}),
    theme: localStorage.getItem(CONFIG.storage.theme) || "dark",

    loading: false
  };

  /* =========================================================
     DOM HELPERS
     ========================================================= */

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  /* =========================================================
     INITIALIZATION
     ========================================================= */

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    applyTheme();
    bindEvents();
    await loadNotes();
  }

  /* =========================================================
     GITHUB
     ========================================================= */

  function githubApiUrl(path = "") {
    return `${CONFIG.apiBase}/repos/${CONFIG.githubOwner}/${CONFIG.githubRepo}/contents/${CONFIG.notesPath}${path}?ref=${CONFIG.branch}`;
  }

  function githubRawUrl(path) {
    return `https://raw.githubusercontent.com/${CONFIG.githubOwner}/${CONFIG.githubRepo}/${CONFIG.branch}/${CONFIG.notesPath}/${path}`;
  }

  async function loadNotes() {
    setLoading(true);

    try {
      const response = await fetch(githubApiUrl());

      if (!response.ok) {
        throw new Error(
          `GitHub returned ${response.status}: ${response.statusText}`
        );
      }

      const contents = await response.json();

      state.files = contents;

      const markdownFiles = contents.filter(
        file =>
          file.type === "file" &&
          /\.(md|markdown)$/i.test(file.name)
      );

      state.notes = markdownFiles.map(createNoteObject);
      state.filteredNotes = [...state.notes];

      renderAll();
    } catch (error) {
      console.error("Unable to load notes:", error);

      showError(
        "Could not load your notebooks from GitHub.",
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  function createNoteObject(file) {
    const nameWithoutExtension = file.name
      .replace(/\.(md|markdown)$/i, "")
      .replace(/[-_]+/g, " ")
      .trim();

    const title = prettifyTitle(nameWithoutExtension);

    const pathParts = file.path.split("/");

    const topic =
      pathParts.length > 2
        ? prettifyTitle(pathParts[pathParts.length - 2])
        : "General";

    return {
      id: file.path,
      name: file.name,
      path: file.path,
      title,
      topic,
      sha: file.sha,
      downloadUrl: file.download_url,

      htmlUrl: `https://github.com/${CONFIG.githubOwner}/${CONFIG.githubRepo}/blob/${CONFIG.branch}/${file.path}`,

      tags: inferTags(`${title} ${topic}`),

      favorite: state.favorites.includes(file.path),

      progress: state.progress[file.path] || {
        percent: 0,
        completed: false
      }
    };
  }

  /* =========================================================
     RENDER
     ========================================================= */

  function renderAll() {
    renderStats();
    renderTopics();
    renderNotes();
    renderContinueReading();
    renderFavorites();
  }

  function renderStats() {
    const total = state.notes.length;

    const completed = state.notes.filter(
      note => note.progress?.completed
    ).length;

    const inProgress = state.notes.filter(note => {
      const percent = note.progress?.percent || 0;
      return percent > 0 && percent < 100;
    }).length;

    setText("#totalNotes", total);
    setText("#completedNotes", completed);
    setText("#progressNotes", inProgress);

    const progressPercent =
      total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    setText("#overallProgress", `${progressPercent}%`);

    const progressBar = $("#overallProgressBar");

    if (progressBar) {
      progressBar.style.width = `${progressPercent}%`;
    }
  }

  function renderTopics() {
    const container =
      $("#topicList") ||
      $("#topics") ||
      $("#sidebarTopics");

    if (!container) return;

    const topicCounts = {};

    state.notes.forEach(note => {
      topicCounts[note.topic] =
        (topicCounts[note.topic] || 0) + 1;
    });

    const topics = Object.entries(topicCounts)
      .sort((a, b) => a[0].localeCompare(b[0]));

    container.innerHTML = `
      <button class="topic-item active" data-topic="all">
        <span>All Notes</span>
        <span class="topic-count">${state.notes.length}</span>
      </button>

      ${topics
        .map(
          ([topic, count]) => `
            <button
              class="topic-item"
              data-topic="${escapeHTML(topic)}"
            >
              <span>${escapeHTML(topic)}</span>
              <span class="topic-count">${count}</span>
            </button>
          `
        )
        .join("")}
    `;

    updateActiveTopic();
  }

  function renderNotes() {
    const container =
      $("#notesGrid") ||
      $("#notesList") ||
      $("#notebookGrid");

    if (!container) return;

    const notes = getFilteredNotes();

    state.filteredNotes = notes;

    if (!notes.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⌕</div>

          <h3>No notes found</h3>

          <p>
            Try a different search term or clear the active filters.
          </p>

          <button class="btn btn-secondary" id="clearFilters">
            Clear filters
          </button>
        </div>
      `;

      return;
    }

    container.innerHTML = notes
      .map(note => createNoteCard(note))
      .join("");

    updateResultCount(notes.length);
  }

  function createNoteCard(note) {
    const progress = note.progress?.percent || 0;

    const isFavorite =
      state.favorites.includes(note.path);

    const description =
      note.description ||
      generateDescription(note);

    return `
      <article
        class="note-card ${isFavorite ? "is-favorite" : ""}"
        data-note="${escapeHTML(note.path)}"
        tabindex="0"
      >

        <div class="note-card-top">

          <span class="note-topic">
            ${escapeHTML(note.topic)}
          </span>

          <button
            class="favorite-btn ${isFavorite ? "active" : ""}"
            data-favorite="${escapeHTML(note.path)}"
            aria-label="Toggle favorite"
            title="Favorite"
          >
            ${isFavorite ? "★" : "☆"}
          </button>

        </div>

        <h3 class="note-title">
          ${escapeHTML(note.title)}
        </h3>

        <p class="note-description">
          ${escapeHTML(description)}
        </p>

        <div class="note-tags">
          ${note.tags
            .slice(0, 3)
            .map(
              tag => `
                <span class="tag">
                  #${escapeHTML(tag)}
                </span>
              `
            )
            .join("")}
        </div>

        <div class="note-card-bottom">

          <div class="progress-info">
            <div class="progress-track">
              <div
                class="progress-fill"
                style="width:${progress}%"
              ></div>
            </div>

            <span>${progress}%</span>
          </div>

          <span class="open-note">
            Open →
          </span>

        </div>

      </article>
    `;
  }

  function renderContinueReading() {
    const container = $("#continueReading");

    if (!container) return;

    const notes = state.notes
      .filter(note => {
        const percent = note.progress?.percent || 0;
        return percent > 0 && percent < 100;
      })
      .sort(
        (a, b) =>
          (b.progress?.lastOpened || 0) -
          (a.progress?.lastOpened || 0)
      )
      .slice(0, 5);

    if (!notes.length) {
      container.innerHTML = `
        <div class="continue-empty">
          <span>📖</span>
          <p>Start reading a note to see it here.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = notes
      .map(
        note => `
          <button
            class="continue-item"
            data-note="${escapeHTML(note.path)}"
          >
            <div>
              <strong>${escapeHTML(note.title)}</strong>
              <small>${escapeHTML(note.topic)}</small>
            </div>

            <span>
              ${note.progress.percent}%
            </span>
          </button>
        `
      )
      .join("");
  }

  function renderFavorites() {
    const container = $("#favoritesList");

    if (!container) return;

    const favorites = state.notes.filter(note =>
      state.favorites.includes(note.path)
    );

    if (!favorites.length) {
      container.innerHTML = `
        <div class="favorites-empty">
          <span>☆</span>
          <p>Star notes you want to revisit quickly.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = favorites
      .map(
        note => `
          <button
            class="favorite-item"
            data-note="${escapeHTML(note.path)}"
          >
            <span>★</span>
            <strong>${escapeHTML(note.title)}</strong>
          </button>
        `
      )
      .join("");
  }

  /* =========================================================
     FILTERING / SEARCH
     ========================================================= */

  function getFilteredNotes() {
    let notes = [...state.notes];

    if (state.selectedTopic !== "all") {
      notes = notes.filter(
        note => note.topic === state.selectedTopic
      );
    }

    if (state.selectedTag !== "all") {
      notes = notes.filter(
        note => note.tags.includes(state.selectedTag)
      );
    }

    const query =
      state.searchQuery.trim().toLowerCase();

    if (query) {
      notes = notes.filter(note => {
        const searchable = [
          note.title,
          note.topic,
          note.name,
          ...note.tags
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      });
    }

    notes.sort((a, b) => {
      switch (state.sortBy) {
        case "recent":
          return (
            (b.progress?.lastOpened || 0) -
            (a.progress?.lastOpened || 0)
          );

        case "progress":
          return (
            (b.progress?.percent || 0) -
            (a.progress?.percent || 0)
          );

        case "favorites":
          return (
            Number(state.favorites.includes(b.path)) -
            Number(state.favorites.includes(a.path))
          );

        case "name":
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return notes;
  }

  function handleSearch(value) {
    state.searchQuery = value;

    renderNotes();

    const clearButton = $("#clearSearch");

    if (clearButton) {
      clearButton.classList.toggle(
        "visible",
        Boolean(value)
      );
    }
  }

  /* =========================================================
     NOTE READER
     ========================================================= */

  async function openNote(path) {
    const note = state.notes.find(
      item => item.path === path
    );

    if (!note) return;

    state.currentNote = note;

    saveLastNote(path);
    updateProgressTimestamp(note);

    const modal =
      $("#noteModal") ||
      $("#readerModal") ||
      $("#noteReader");

    if (!modal) {
      window.open(note.htmlUrl, "_blank");
      return;
    }

    const content =
      $("#noteContent") ||
      $("#readerContent");

    const title =
      $("#readerTitle") ||
      $("#noteTitle");

    if (title) {
      title.textContent = note.title;
    }

    if (content) {
      content.innerHTML = `
        <div class="reader-loading">
          <div class="loading-spinner"></div>
          <p>Loading notebook…</p>
        </div>
      `;
    }

    modal.classList.add("open");
    document.body.classList.add("modal-open");

    try {
      const response = await fetch(
        githubRawUrl(note.path)
      );

      if (!response.ok) {
        throw new Error(
          `Unable to fetch note (${response.status})`
        );
      }

      const markdown = await response.text();

      if (content) {
        content.innerHTML =
          renderMarkdown(markdown);
      }

      setupReaderInteractions(note);
      updateReaderProgress(note);
    } catch (error) {
      console.error(error);

      if (content) {
        content.innerHTML = `
          <div class="reader-error">

            <h3>
              Unable to load this notebook
            </h3>

            <p>
              ${escapeHTML(error.message)}
            </p>

            <a
              href="${escapeHTML(note.htmlUrl)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open on GitHub →
            </a>

          </div>
        `;
      }
    }
  }

  function closeNote() {
    const modal =
      $("#noteModal") ||
      $("#readerModal") ||
      $("#noteReader");

    if (!modal) return;

    modal.classList.remove("open");
    document.body.classList.remove("modal-open");

    state.currentNote = null;
  }

  /* =========================================================
     MARKDOWN RENDERER
     ========================================================= */

  function renderMarkdown(markdown) {
    let html = escapeHTML(markdown);

    html = html.replace(
      /```([\s\S]*?)```/g,
      (_, code) => `
        <pre class="code-block"><code>${code.trim()}</code></pre>
      `
    );

    html = html.replace(
      /`([^`\n]+)`/g,
      "<code>$1</code>"
    );

    html = html.replace(
      /^###### (.*)$/gm,
      "<h6>$1</h6>"
    );

    html = html.replace(
      /^##### (.*)$/gm,
      "<h5>$1</h5>"
    );

    html = html.replace(
      /^#### (.*)$/gm,
      "<h4>$1</h4>"
    );

    html = html.replace(
      /^### (.*)$/gm,
      "<h3>$1</h3>"
    );

    html = html.replace(
      /^## (.*)$/gm,
      "<h2>$1</h2>"
    );

    html = html.replace(
      /^# (.*)$/gm,
      "<h1>$1</h1>"
    );

    html = html.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" loading="lazy">'
    );

    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    html = html.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );

    html = html.replace(
      /\*(.*?)\*/g,
      "<em>$1</em>"
    );

    html = html.replace(
      /^> (.*)$/gm,
      "<blockquote>$1</blockquote>"
    );

    html = html.replace(
      /^---$/gm,
      "<hr>"
    );

    html = html.replace(
      /^(?:- |\* )(.*)$/gm,
      "<li>$1</li>"
    );

    html = html.replace(
      /(<li>.*<\/li>)/gs,
      "<ul>$1</ul>"
    );

    html = renderTables(html);

    const blocks = html
      .split(/\n{2,}/)
      .map(block => {
        const trimmed = block.trim();

        if (!trimmed) return "";

        if (
          /^<(h[1-6]|ul|ol|li|pre|blockquote|hr|img|table)/i.test(
            trimmed
          )
        ) {
          return trimmed;
        }

        return `
          <p>
            ${trimmed.replace(/\n/g, "<br>")}
          </p>
        `;
      });

    return blocks.join("\n");
  }

  function renderTables(html) {
    const lines = html.split("\n");
    const output = [];

    let tableRows = [];

    function flushTable() {
      if (!tableRows.length) return;

      const rows = tableRows.map(row =>
        row
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map(cell => cell.trim())
      );

      if (rows.length < 2) {
        output.push(...tableRows);
        tableRows = [];
        return;
      }

      const header = rows[0];

      const isSeparator = rows[1].every(cell =>
        /^:?-{3,}:?$/.test(cell)
      );

      if (!isSeparator) {
        output.push(...tableRows);
        tableRows = [];
        return;
      }

      let table = `
        <div class="table-wrapper">
          <table>

            <thead>
              <tr>
                ${header
                  .map(cell => `<th>${cell}</th>`)
                  .join("")}
              </tr>
            </thead>

            <tbody>
      `;

      rows.slice(2).forEach(row => {
        table += `
          <tr>
            ${row
              .map(cell => `<td>${cell}</td>`)
              .join("")}
          </tr>
        `;
      });

      table += `
            </tbody>

          </table>
        </div>
      `;

      output.push(table);
      tableRows = [];
    }

    lines.forEach(line => {
      if (line.includes("|")) {
        tableRows.push(line);
      } else {
        flushTable();
        output.push(line);
      }
    });

    flushTable();

    return output.join("\n");
  }

  /* =========================================================
     READING PROGRESS
     ========================================================= */

  function setupReaderInteractions(note) {
    const content =
      $("#noteContent") ||
      $("#readerContent");

    if (!content) return;

    const headings = $$(
      "h1, h2, h3, h4",
      content
    );

    headings.forEach((heading, index) => {
      if (!heading.id) {
        heading.id =
          `section-${index}-${slugify(
            heading.textContent
          )}`;
      }
    });

    content.addEventListener(
      "scroll",
      () => {
        calculateReadingProgress(
          note,
          content
        );
      },
      { passive: true }
    );
  }

  function calculateReadingProgress(
    note,
    content
  ) {
    const scrollable =
      content.scrollHeight -
      content.clientHeight;

    if (scrollable <= 0) return;

    const percent = Math.round(
      (content.scrollTop / scrollable) * 100
    );

    updateNoteProgress(note, percent);
  }

  function updateNoteProgress(
    note,
    percent
  ) {
    const clamped = Math.min(
      100,
      Math.max(0, Math.round(percent))
    );

    state.progress[note.path] = {
      ...(state.progress[note.path] || {}),

      percent: clamped,

      completed:
        clamped >= 95,

      lastOpened:
        Date.now()
    };

    saveJSON(
      CONFIG.storage.progress,
      state.progress
    );

    note.progress =
      state.progress[note.path];

    renderStats();
  }

  function updateProgressTimestamp(note) {
    const current =
      state.progress[note.path] || {};

    state.progress[note.path] = {
      ...current,
      lastOpened: Date.now()
    };

    saveJSON(
      CONFIG.storage.progress,
      state.progress
    );
  }

  function updateReaderProgress(note) {
    const progress =
      state.progress[note.path]?.percent || 0;

    const progressBar =
      $("#readerProgressBar");

    const progressText =
      $("#readerProgressText");

    if (progressBar) {
      progressBar.style.width =
        `${progress}%`;
    }

    if (progressText) {
      progressText.textContent =
        `${progress}% read`;
    }
  }

  /* =========================================================
     FAVORITES
     ========================================================= */

  function toggleFavorite(path) {
    const index =
      state.favorites.indexOf(path);

    if (index === -1) {
      state.favorites.push(path);
    } else {
      state.favorites.splice(index, 1);
    }

    saveJSON(
      CONFIG.storage.favorites,
      state.favorites
    );

    const note = state.notes.find(
      item => item.path === path
    );

    if (note) {
      note.favorite =
        state.favorites.includes(path);
    }

    renderNotes();
    renderFavorites();
  }

  /* =========================================================
     TOPICS
     ========================================================= */

  function selectTopic(topic) {
    state.selectedTopic = topic;

    updateActiveTopic();
    renderNotes();
  }

  function updateActiveTopic() {
    $$(".topic-item").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.topic ===
          state.selectedTopic
      );
    });
  }

  /* =========================================================
     SORTING
     ========================================================= */

  function setSort(value) {
    state.sortBy = value;
    renderNotes();
  }

  /* =========================================================
     EVENTS
     ========================================================= */

  function bindEvents() {
    document.addEventListener(
      "input",
      event => {
        if (
          event.target.matches(
            "#searchInput, #search, .search-input"
          )
        ) {
          handleSearch(
            event.target.value
          );
        }
      }
    );

    document.addEventListener(
      "click",
      event => {
        const target = event.target;

        const favorite =
          target.closest(
            "[data-favorite]"
          );

        if (favorite) {
          event.stopPropagation();

          toggleFavorite(
            favorite.dataset.favorite
          );

          return;
        }

        const topic =
          target.closest("[data-topic]");

        if (topic) {
          selectTopic(
            topic.dataset.topic
          );

          return;
        }

        const continueItem =
          target.closest(
            ".continue-item"
          );

        if (continueItem) {
          openNote(
            continueItem.dataset.note
          );

          return;
        }

        const favoriteItem =
          target.closest(
            ".favorite-item"
          );

        if (favoriteItem) {
          openNote(
            favoriteItem.dataset.note
          );

          return;
        }

        const noteCard =
          target.closest(
            ".note-card"
          );

        if (noteCard) {
          openNote(
            noteCard.dataset.note
          );

          return;
        }

        if (
          target.closest(
            "#clearFilters"
          )
        ) {
          clearFilters();
          return;
        }

        if (
          target.closest(
            "#clearSearch"
          )
        ) {
          clearSearch();
          return;
        }

        if (
          target.closest(
            "#themeToggle, .theme-toggle"
          )
        ) {
          toggleTheme();
          return;
        }

        if (
          target.closest(
            "#menuToggle, .menu-toggle"
          )
        ) {
          toggleSidebar();
          return;
        }

        if (
          target.closest(
            "#sidebarOverlay, .sidebar-overlay"
          )
        ) {
          closeSidebar();
          return;
        }

        if (
          target.closest(
            "#closeReader, #closeModal, .modal-close"
          )
        ) {
          closeNote();
          return;
        }

        if (
          target.closest(
            "#markComplete, .mark-complete"
          )
        ) {
          if (state.currentNote) {
            updateNoteProgress(
              state.currentNote,
              100
            );

            renderNotes();
            renderContinueReading();
          }

          return;
        }

        if (
          target.closest(
            "#openGithub, .open-github"
          )
        ) {
          if (state.currentNote) {
            window.open(
              state.currentNote.htmlUrl,
              "_blank",
              "noopener,noreferrer"
            );
          }

          return;
        }
      }
    );

    document.addEventListener(
      "change",
      event => {
        if (
          event.target.matches(
            "#sortSelect, .sort-select"
          )
        ) {
          setSort(
            event.target.value
          );
        }
      }
    );

    document.addEventListener(
      "keydown",
      handleKeyboard
    );

    document.addEventListener(
      "click",
      event => {
        const modal =
          event.target.closest(
            "#noteModal, #readerModal, #noteReader"
          );

        if (
          modal &&
          event.target === modal
        ) {
          closeNote();
        }
      }
    );
  }

  /* =========================================================
     KEYBOARD SHORTCUTS
     ========================================================= */

  function handleKeyboard(event) {
    if (
      event.key === "/" &&
      !isTyping(event.target)
    ) {
      event.preventDefault();

      const search =
        $("#searchInput") ||
        $("#search") ||
        $(".search-input");

      search?.focus();
    }

    if (event.key === "Escape") {
      closeNote();
      closeSidebar();
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "k"
    ) {
      event.preventDefault();

      const search =
        $("#searchInput") ||
        $("#search") ||
        $(".search-input");

      search?.focus();
    }
  }

  /* =========================================================
     SIDEBAR
     ========================================================= */

  function toggleSidebar() {
    document.body.classList.toggle(
      "sidebar-open"
    );
  }

  function closeSidebar() {
    document.body.classList.remove(
      "sidebar-open"
    );
  }

  /* =========================================================
     THEME
     ========================================================= */

  function applyTheme() {
    document.documentElement.dataset.theme =
      state.theme;

    document.body.dataset.theme =
      state.theme;

    const button =
      $("#themeToggle") ||
      $(".theme-toggle");

    if (button) {
      button.setAttribute(
        "aria-label",
        state.theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      );

      button.innerHTML =
        state.theme === "dark"
          ? "☀"
          : "☾";
    }
  }

  function toggleTheme() {
    state.theme =
      state.theme === "dark"
        ? "light"
        : "dark";

    localStorage.setItem(
      CONFIG.storage.theme,
      state.theme
    );

    applyTheme();
  }

  /* =========================================================
     FILTER HELPERS
     ========================================================= */

  function clearFilters() {
    state.searchQuery = "";
    state.selectedTopic = "all";
    state.selectedTag = "all";

    const search =
      $("#searchInput") ||
      $("#search") ||
      $(".search-input");

    if (search) {
      search.value = "";
    }

    renderAll();
  }

  function clearSearch() {
    state.searchQuery = "";

    const search =
      $("#searchInput") ||
      $("#search") ||
      $(".search-input");

    if (search) {
      search.value = "";
      search.focus();
    }

    renderNotes();
  }

  function updateResultCount(count) {
    const elements = [
      "#resultCount",
      "#notesCount",
      ".result-count"
    ];

    elements.forEach(selector => {
      const element = $(selector);

      if (element) {
        element.textContent =
          `${count} ${
            count === 1
              ? "note"
              : "notes"
          }`;
      }
    });
  }

  /* =========================================================
     TAG GENERATION
     ========================================================= */

  function inferTags(text) {
    const normalized =
      text.toLowerCase();

    const tags = [];

    const keywords = {
      "machine learning":
        "machine-learning",

      "deep learning":
        "deep-learning",

      "neural network":
        "neural-networks",

      "transformer":
        "transformers",

      "attention":
        "attention",

      "llm":
        "llms",

      "large language model":
        "llms",

      "nlp":
        "nlp",

      "natural language":
        "nlp",

      "computer vision":
        "computer-vision",

      "reinforcement":
        "reinforcement-learning",

      "statistics":
        "statistics",

      "probability":
        "probability",

      "python":
        "python",

      "pytorch":
        "pytorch",

      "tensorflow":
        "tensorflow",

      "optimization":
        "optimization",

      "regression":
        "regression",

      "classification":
        "classification",

      "clustering":
        "clustering",

      "embedding":
        "embeddings",

      "rag":
        "rag",

      "retrieval":
        "retrieval",

      "generative":
        "generative-ai",

      "diffusion":
        "diffusion",

      "cnn":
        "cnn",

      "rnn":
        "rnn",

      "lstm":
        "lstm",

      "gan":
        "gans",

      "fine tuning":
        "fine-tuning",

      "fine-tuning":
        "fine-tuning",

      "evaluation":
        "evaluation",

      "agents":
        "agents",

      "agent":
        "agents"
    };

    Object.entries(keywords).forEach(
      ([keyword, tag]) => {
        if (
          normalized.includes(
            keyword
          )
        ) {
          tags.push(tag);
        }
      }
    );

    if (!tags.length) {
      tags.push("ai-ml");
    }

    return [
      ...new Set(tags)
    ];
  }

  /* =========================================================
     DESCRIPTIONS
     ========================================================= */

  function generateDescription(note) {
    const topic = note.topic;

    const descriptions = {
      "Machine Learning":
        "Concepts, algorithms and practical ideas for understanding machine learning.",

      "Deep Learning":
        "Neural networks, architectures and techniques for modern deep learning.",

      "Natural Language Processing":
        "Notes covering language models, representations and NLP concepts.",

      "Computer Vision":
        "Concepts and techniques for understanding visual data with machine learning.",

      "Reinforcement Learning":
        "Notes on agents, environments, rewards and learning through interaction."
    };

    return (
      descriptions[topic] ||
      `Revision notes covering ${topic} and related AI/ML concepts.`
    );
  }

  /* =========================================================
     UTILITIES
     ========================================================= */

  function prettifyTitle(value) {
    return value
      .replace(/\b\w/g, char =>
        char.toUpperCase()
      )
      .replace(/\s+/g, " ")
      .trim();
  }

  function slugify(value) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setText(selector, value) {
    const element = $(selector);

    if (element) {
      element.textContent = value;
    }
  }

  function loadJSON(key, fallback) {
    try {
      const value =
        localStorage.getItem(key);

      return value
        ? JSON.parse(value)
        : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch (error) {
      console.warn(
        "Unable to save local data:",
        error
      );
    }
  }

  function isTyping(element) {
    if (!element) return false;

    const tag =
      element.tagName?.toLowerCase();

    return (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      element.isContentEditable
    );
  }

  /* =========================================================
     LOADING / ERROR UI
     ========================================================= */

  function setLoading(isLoading) {
    state.loading = isLoading;

    document.body.classList.toggle(
      "is-loading",
      isLoading
    );

    const loader =
      $("#pageLoader");

    if (loader) {
      loader.classList.toggle(
        "visible",
        isLoading
      );
    }
  }

  function showError(title, message) {
    const container =
      $("#notesGrid") ||
      $("#notesList") ||
      $("#notebookGrid");

    if (!container) return;

    container.innerHTML = `
      <div class="error-state">

        <div class="error-icon">!</div>

        <h2>
          ${escapeHTML(title)}
        </h2>

        <p>
          ${escapeHTML(message)}
        </p>

        <button
          class="btn btn-primary"
          id="retryNotes"
        >
          Try again
        </button>

      </div>
    `;

    $("#retryNotes")?.addEventListener(
      "click",
      loadNotes
    );
  }

  /* =========================================================
     GLOBAL API
     ========================================================= */

  window.XiNotes = {
    openNote,
    closeNote,
    toggleFavorite,
    selectTopic,
    clearFilters,
    clearSearch,
    toggleTheme,
    loadNotes,

    get state() {
      return state;
    },

    get config() {
      return CONFIG;
    }
  };

})();
