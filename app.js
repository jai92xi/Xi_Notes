/* ============================================================
   XI NOTES — INTERVIEW REVISION WORKSPACE
   Complete app.js replacement
   Features:
   - Modern responsive workspace
   - Fixed compact header and fixed library
   - Independent library and reading-area scrolling
   - GitHub Markdown discovery and direct note URLs
   - Search, folder grouping, Previous / Next
   - KaTeX formulas and syntax highlighting when available
   - Daily revision checklist for 1CheatSheet.md
   - No Contents / Context panel
   ============================================================ */

(() => {
  "use strict";

  const CFG = {
    owner: "jai92xi",
    repo: "Xi_Notes",
    branch: "main",
    folder: "notes",
    defaultNote: "notes/1CheatSheet.md",
    api: "https://api.github.com/repos/jai92xi/Xi_Notes",
    raw: "https://raw.githubusercontent.com/jai92xi/Xi_Notes/main",
    cdn: "https://cdn.jsdelivr.net/gh/jai92xi/Xi_Notes@main"
  };

  const $ = (selector, root = document) => root.querySelector(selector);

  const state = {
    notes: [],
    path: "",
    index: -1,
    query: "",
    category: "all",
    request: 0,
    checked: {},
    sidebarOpen: false,
    libraries: {},
    loadError: "",
    progress: 0
  };

  /* ============================================================
     UTILITIES
     ============================================================ */

  const normalize = path => String(path || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^(?:\.\/)+/, "");

  const titleOf = path => {
    const name = normalize(path).split("/").pop() || path;

    return name
      .replace(/\.md$/i, "")
      .replace(/^\d+[-_. ]*/, "")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Untitled note";
  };

  const folderOf = path => {
    const parts = normalize(path).split("/");
    return parts.length > 1 ? parts.slice(1, -1).join("/") : "";
  };

  const isCheatSheet = path =>
    normalize(path).toLowerCase() === CFG.defaultNote.toLowerCase();

  const encodePath = path => normalize(path)
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

  const getISTDate = () => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());

    const obj = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${obj.year}-${obj.month}-${obj.day}`;
  };

  const revisionStorageKey = () => `xi-revision-${getISTDate()}`;

  function readRevisionState() {
    try {
      state.checked = JSON.parse(
        localStorage.getItem(revisionStorageKey()) || "{}"
      );
    } catch {
      state.checked = {};
    }
  }

  function saveRevisionState() {
    try {
      localStorage.setItem(
        revisionStorageKey(),
        JSON.stringify(state.checked)
      );
    } catch (error) {
      console.warn("Revision progress could not be saved.", error);
    }
  }

  function currentNote() {
    return state.notes.find(note => note.path === state.path);
  }

  function getRequestedNote() {
    return normalize(
      new URLSearchParams(location.search).get("note") || ""
    );
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

  function icon(name) {
    const icons = {
      menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
      file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
      arrowLeft: '<path d="m15 18-6-6 6-6"/>',
      arrowRight: '<path d="m9 18 6-6-6-6"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      external: '<path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
      close: '<path d="m18 6-12 12M6 6l12 12"/>',
      refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 17.5 6L20 12M4 12l2.5 6A7 7 0 0 0 18.4 15"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
      keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M10 13h.01M14 13h.01M18 13h.01M8 16h8"/>'
    };

    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true">${icons[name] || icons.file}</svg>`;
  }

  /* ============================================================
     STYLES
     ============================================================ */

  function injectStyles() {
    if ($("#xi-workspace-styles")) return;

    const style = document.createElement("style");
    style.id = "xi-workspace-styles";

    style.textContent = `
      :root {
        --xi-bg: #f4f6fa;
        --xi-paper: #fff;
        --xi-soft: #f8f9fc;
        --xi-ink: #172033;
        --xi-body: #475569;
        --xi-muted: #8b96a8;
        --xi-line: #e5e9f1;
        --xi-blue: #3659d9;
        --xi-blue-soft: #edf2ff;
        --xi-green: #168568;
        --xi-header: 54px;
        --xi-library: 272px;
        --xi-radius: 10px;
      }

      *, *::before, *::after { box-sizing: border-box; }

      html, body {
        width: 100%;
        height: 100%;
        min-height: 100%;
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

      body, button, input { font-family: inherit; }
      button { color: inherit; }
      button:focus-visible, input:focus-visible, a:focus-visible {
        outline: 3px solid #b8c7ff;
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
        height: var(--xi-header);
        position: relative;
        z-index: 20;
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 0 19px;
        border-bottom: 1px solid var(--xi-line);
        background: rgba(255,255,255,.97);
      }

      .xi-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 220px;
      }

      .xi-brand-mark {
        width: 31px;
        height: 31px;
        display: grid;
        place-items: center;
        border-radius: 9px;
        background: #233d9f;
        color: #fff;
        font-size: 15px;
        font-weight: 850;
        letter-spacing: -1px;
      }

      .xi-brand-name {
        font-size: 14px;
        font-weight: 800;
        letter-spacing: -.45px;
      }

      .xi-brand-sub {
        display: block;
        margin-top: -3px;
        color: var(--xi-muted);
        font-size: 10px;
        font-weight: 550;
        letter-spacing: .1px;
      }

      .xi-icon-btn {
        width: 34px;
        height: 34px;
        flex: 0 0 34px;
        display: grid;
        place-items: center;
        padding: 0;
        border: 1px solid var(--xi-line);
        border-radius: 8px;
        background: #fff;
        color: #526078;
        cursor: pointer;
        transition: .15s ease;
      }

      .xi-icon-btn svg {
        width: 17px;
        height: 17px;
      }

      .xi-icon-btn:hover {
        border-color: #c7d2fe;
        background: var(--xi-blue-soft);
        color: var(--xi-blue);
      }

      .xi-top-divider {
        width: 1px;
        height: 23px;
        background: var(--xi-line);
      }

      .xi-top-current {
        min-width: 0;
        overflow: hidden;
        color: #5d687b;
        font-size: 12px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .xi-top-current strong {
        color: var(--xi-ink);
        font-weight: 700;
      }

      .xi-top-spacer { flex: 1; }

      .xi-top-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #6a778a;
        font-size: 11px;
        white-space: nowrap;
      }

      .xi-status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #28a17d;
      }

      .xi-top-shortcut {
        padding: 4px 7px;
        border: 1px solid var(--xi-line);
        border-radius: 5px;
        background: #fafbfc;
        color: #68758a;
        font-size: 10px;
      }

      .xi-layout {
        display: grid;
        grid-template-columns: var(--xi-library) minmax(0,1fr);
        min-height: 0;
        height: 100%;
        overflow: hidden;
        transition: grid-template-columns .18s ease;
      }

      #xiApp.xi-collapsed {
        --xi-library: 0px;
      }

      .xi-sidebar {
        display: flex;
        min-width: 0;
        min-height: 0;
        flex-direction: column;
        overflow: hidden;
        border-right: 1px solid var(--xi-line);
        background: var(--xi-paper);
      }

      .xi-library-head {
        flex: 0 0 auto;
        padding: 21px 16px 13px;
      }

      .xi-eyebrow {
        color: #8994a6;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.25px;
        text-transform: uppercase;
      }

      .xi-library-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin: 4px 0 14px;
      }

      .xi-library-title {
        font-size: 19px;
        font-weight: 790;
        letter-spacing: -.7px;
      }

      .xi-count {
        display: inline-flex;
        min-width: 25px;
        height: 22px;
        align-items: center;
        justify-content: center;
        padding: 0 7px;
        border: 1px solid #e7eaf1;
        border-radius: 6px;
        background: #f7f8fb;
        color: #657187;
        font-size: 10px;
        font-weight: 750;
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
        color: #98a2b3;
        pointer-events: none;
      }

      .xi-search input {
        width: 100%;
        height: 36px;
        padding: 0 40px 0 34px;
        border: 1px solid #e3e7ef;
        border-radius: 8px;
        background: #f8f9fc;
        color: var(--xi-ink);
        font-size: 12px;
        outline: none;
      }

      .xi-search input:focus {
        border-color: #aabaff;
        background: #fff;
        box-shadow: 0 0 0 3px #3659d910;
      }

      .xi-search input::placeholder { color: #9aa4b4; }

      .xi-search-shortcut {
        position: absolute;
        right: 7px;
        padding: 2px 5px;
        border: 1px solid #e1e5ed;
        border-radius: 4px;
        color: #97a0af;
        font-size: 9px;
      }

      .xi-library-tools {
        display: flex;
        gap: 6px;
        padding: 0 16px 10px;
      }

      .xi-filter {
        min-height: 27px;
        padding: 4px 9px;
        border: 1px solid transparent;
        border-radius: 6px;
        background: transparent;
        color: #768197;
        font-size: 10px;
        font-weight: 650;
        cursor: pointer;
      }

      .xi-filter:hover { background: #f5f6fa; }

      .xi-filter.active {
        border-color: #e0e7ff;
        background: var(--xi-blue-soft);
        color: #3152c2;
      }

      .xi-library-scroll {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        overscroll-behavior: contain;
        padding: 0 10px 15px;
        scrollbar-width: thin;
        scrollbar-color: #d9deea transparent;
      }

      .xi-group-label {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 14px 7px 6px;
        color: #919bad;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        overflow-wrap: anywhere;
      }

      .xi-group-label:first-child { margin-top: 5px; }

      .xi-group-label::before {
        content: "";
        width: 6px;
        height: 6px;
        flex: 0 0 6px;
        border-radius: 2px;
        background: #c7d2fe;
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
        color: #526078;
        text-align: left;
        cursor: pointer;
        transition: background .12s ease, color .12s ease;
      }

      .xi-note-link:hover {
        background: #f6f7fb;
        color: #253d8f;
      }

      .xi-note-link.active {
        border-color: #e0e7ff;
        background: #eef2ff;
        color: #2948b8;
      }

      .xi-note-file {
        width: 15px;
        height: 15px;
        flex: 0 0 15px;
        color: #a0aabc;
      }

      .xi-note-link.active .xi-note-file { color: #4864d2; }

      .xi-note-name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        font-size: 11.5px;
        font-weight: 570;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .xi-note-link.active .xi-note-name { font-weight: 750; }

      .xi-active-mark {
        width: 5px;
        height: 5px;
        flex: 0 0 5px;
        border-radius: 50%;
        background: var(--xi-blue);
      }

      .xi-library-footer {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 12px 16px;
        border-top: 1px solid var(--xi-line);
        color: #8b96a8;
        font-size: 10px;
      }

      .xi-library-footer svg { width: 15px; height: 15px; }

      .xi-reader {
        position: relative;
        display: flex;
        min-width: 0;
        min-height: 0;
        flex-direction: column;
        overflow: hidden;
        background: var(--xi-bg);
      }

      .xi-reader-toolbar {
        z-index: 5;
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 47px;
        padding: 0 28px;
        border-bottom: 1px solid #e7eaf1;
        background: rgba(248,249,252,.96);
      }

      .xi-breadcrumb {
        display: flex;
        align-items: center;
        gap: 7px;
        min-width: 0;
        overflow: hidden;
        color: #8b95a7;
        font-size: 11px;
      }

      .xi-breadcrumb span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .xi-breadcrumb strong {
        color: #455168;
        font-weight: 700;
      }

      .xi-toolbar-spacer { flex: 1; }

      .xi-read-meta {
        color: #939daf;
        font-size: 10px;
        white-space: nowrap;
      }

      .xi-read-progress {
        width: 64px;
        height: 4px;
        overflow: hidden;
        border-radius: 4px;
        background: #e2e6ef;
      }

      .xi-read-progress span {
        display: block;
        width: 0;
        height: 100%;
        border-radius: inherit;
        background: #4e68d6;
        transition: width .15s ease;
      }

      .xi-reader-scroll {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        scroll-behavior: smooth;
        padding: 27px 30px 42px;
        scrollbar-width: thin;
        scrollbar-color: #d5dbe7 transparent;
      }

      .xi-article-wrap {
        width: 100%;
        max-width: 970px;
        min-height: 300px;
        margin: 0 auto;
        padding: clamp(23px, 3.3vw, 42px) clamp(20px, 4vw, 48px) 40px;
        border: 1px solid #e6e9f0;
        border-radius: 11px;
        background: #fff;
        box-shadow: 0 2px 7px #17203305;
      }

      .xi-article-header {
        padding-bottom: 22px;
        border-bottom: 1px solid #edf0f5;
        margin-bottom: 23px;
      }

      .xi-article-kicker {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-bottom: 11px;
        color: #6d7fc6;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.05px;
        text-transform: uppercase;
      }

      .xi-article-kicker span {
        width: 6px;
        height: 6px;
        border-radius: 2px;
        background: #5a72df;
      }

      .xi-article-title {
        margin: 0;
        color: #172033;
        font-size: clamp(25px, 3vw, 34px);
        font-weight: 820;
        line-height: 1.2;
        letter-spacing: -1.15px;
        overflow-wrap: anywhere;
      }

      .xi-article-subtitle {
        margin-top: 11px;
        color: #7d889b;
        font-size: 12px;
      }

      .xi-markdown {
        color: #3e4a5e;
        font-size: 13.5px;
        line-height: 1.78;
        overflow-wrap: anywhere;
      }

      .xi-markdown > :first-child { margin-top: 0; }

      .xi-markdown h1,
      .xi-markdown h2,
      .xi-markdown h3,
      .xi-markdown h4,
      .xi-markdown h5,
      .xi-markdown h6 {
        color: #1b2639;
        font-weight: 780;
        line-height: 1.42;
        letter-spacing: -.35px;
        scroll-margin-top: 18px;
      }

      .xi-markdown h1 {
        margin: 28px 0 12px;
        font-size: 26px;
      }

      .xi-markdown h2 {
        margin: 31px 0 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e9edf4;
        font-size: 21px;
      }

      .xi-markdown h3 {
        margin: 24px 0 9px;
        font-size: 17px;
      }

      .xi-markdown h4 {
        margin: 20px 0 8px;
        font-size: 14px;
      }

      .xi-markdown p { margin: 11px 0 15px; }

      .xi-markdown strong {
        color: #202b3f;
        font-weight: 760;
      }

      .xi-markdown a {
        color: #3659d9;
        text-decoration-thickness: 1px;
        text-underline-offset: 3px;
      }

      .xi-markdown ul,
      .xi-markdown ol {
        padding-left: 24px;
        margin: 9px 0 17px;
      }

      .xi-markdown li { padding-left: 3px; margin: 4px 0; }
      .xi-markdown li::marker { color: #7f91c4; }

      .xi-markdown blockquote {
        margin: 16px 0;
        padding: 12px 16px;
        border-left: 3px solid #667fe0;
        border-radius: 0 7px 7px 0;
        background: #f5f7ff;
        color: #4b5870;
      }

      .xi-markdown hr {
        margin: 25px 0;
        border: 0;
        border-top: 1px solid #e7ebf2;
      }

      .xi-markdown :not(pre) > code {
        padding: 2px 5px;
        border: 1px solid #e7eaf1;
        border-radius: 4px;
        background: #f4f6fa;
        color: #b02e53;
        font:  .9em ui-monospace, SFMono-Regular, Consolas, monospace;
      }

      .xi-markdown pre {
        max-width: 100%;
        overflow: auto;
        margin: 16px 0 21px;
        padding: 17px 19px;
        border: 1px solid #263349;
        border-radius: 8px;
        background: #111827;
        color: #e5edf9;
        font: 12px/1.75 ui-monospace, SFMono-Regular, Consolas, monospace;
        tab-size: 4;
      }

      .xi-markdown pre code {
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        white-space: pre;
      }

      .xi-markdown table {
        display: block;
        width: 100%;
        max-width: 100%;
        overflow-x: auto;
        margin: 16px 0 23px;
        border: 1px solid #e3e8f0;
        border-radius: 8px;
        border-spacing: 0;
        border-collapse: separate;
        font-size: 12px;
        line-height: 1.6;
      }

      .xi-markdown th,
      .xi-markdown td {
        min-width: 85px;
        padding: 9px 12px;
        border-right: 1px solid #e8ecf3;
        border-bottom: 1px solid #e8ecf3;
        text-align: left;
        vertical-align: top;
      }

      .xi-markdown th:last-child,
      .xi-markdown td:last-child { border-right: 0; }

      .xi-markdown tr:last-child td { border-bottom: 0; }

      .xi-markdown th {
        background: #f3f6fb;
        color: #26334a;
        font-weight: 750;
      }

      .xi-markdown tbody tr:nth-child(even) { background: #fafbfe; }

      .xi-markdown .katex-display {
        max-width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        margin: 17px 0;
        padding: 13px 8px;
        border: 1px solid #e8edf5;
        border-radius: 8px;
        background: #fafbfe;
      }

      .xi-markdown img {
        max-width: 100%;
        height: auto;
        border-radius: 7px;
      }

      .xi-markdown input[type="checkbox"] {
        margin-right: 7px;
        accent-color: #3659d9;
      }

      .xi-check-section {
        margin: 13px 0;
        padding: 12px 14px;
        border: 1px solid #e5eaf2;
        border-radius: 8px;
        background: #fff;
      }

      .xi-check-heading {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }

      .xi-check-heading > h1,
      .xi-check-heading > h2,
      .xi-check-heading > h3,
      .xi-check-heading > h4 {
        flex: 1;
        min-width: 0;
        margin: 0 0 8px !important;
        padding: 0 !important;
        border: 0 !important;
      }

      .xi-checkbox {
        width: 16px;
        height: 16px;
        flex: 0 0 16px;
        margin-top: 5px;
        accent-color: var(--xi-green);
        cursor: pointer;
      }

      .xi-check-section.is-checked {
        border-color: #b9e4d7;
        background: #f7fcfa;
      }

      .xi-check-section.is-checked .xi-check-heading {
        opacity: .68;
      }

      .xi-reader-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        margin: 15px auto 0;
        max-width: 970px;
      }

      .xi-footer-position {
        color: #909bad;
        font-size: 10px;
      }

      .xi-footer-buttons {
        display: flex;
        gap: 8px;
      }

      .xi-nav-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 35px;
        padding: 7px 12px;
        border: 1px solid #dfe4ed;
        border-radius: 7px;
        background: #fff;
        color: #4a566b;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: .15s ease;
      }

      .xi-nav-btn svg { width: 14px; height: 14px; }

      .xi-nav-btn:hover:not(:disabled) {
        border-color: #bcc9ff;
        background: #edf2ff;
        color: #2949ba;
      }

      .xi-nav-btn.primary {
        border-color: #3659d9;
        background: #3659d9;
        color: #fff;
      }

      .xi-nav-btn.primary:hover:not(:disabled) {
        background: #2949c4;
      }

      .xi-nav-btn:disabled {
        opacity: .38;
        cursor: not-allowed;
      }

      .xi-state {
        width: 100%;
        max-width: 570px;
        margin: 50px auto;
        padding: 32px 25px;
        border: 1px solid var(--xi-line);
        border-radius: 11px;
        background: #fff;
        text-align: center;
      }

      .xi-state-symbol {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        margin: 0 auto 14px;
        border-radius: 12px;
        background: #edf2ff;
        color: #3659d9;
      }

      .xi-state-symbol svg { width: 22px; height: 22px; }

      .xi-state h2 {
        margin: 0 0 8px;
        font-size: 19px;
        letter-spacing: -.4px;
      }

      .xi-state p {
        max-width: 390px;
        margin: 0 auto 18px;
        color: #7d889b;
        font-size: 12px;
        line-height: 1.75;
      }

      .xi-retry {
        min-height: 34px;
        padding: 7px 12px;
        border: 1px solid #dce3f1;
        border-radius: 7px;
        background: #fff;
        color: #3552ba;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
      }

      .xi-spinner {
        width: 18px;
        height: 18px;
        display: inline-block;
        border: 2px solid #dbe4ff;
        border-top-color: #3659d9;
        border-radius: 50%;
        animation: xiSpin .7s linear infinite;
      }

      @keyframes xiSpin { to { transform: rotate(360deg); } }

      .xi-mobile-backdrop { display: none; }

      .xi-toast {
        position: fixed;
        z-index: 100;
        right: 18px;
        bottom: 18px;
        max-width: min(360px, calc(100vw - 36px));
        padding: 11px 15px;
        border: 1px solid #dfe5f0;
        border-radius: 8px;
        background: #fff;
        color: #364257;
        box-shadow: 0 7px 25px #17203315;
        font-size: 12px;
      }

      .xi-empty {
        padding: 20px 10px;
        color: #8994a6;
        font-size: 11px;
        line-height: 1.7;
      }

      .xi-help {
        position: fixed;
        z-index: 50;
        right: 17px;
        bottom: 16px;
        padding: 7px 10px;
        border: 1px solid #e1e6ef;
        border-radius: 7px;
        background: #ffffffed;
        color: #8a95a7;
        font-size: 10px;
        pointer-events: none;
      }

      @media (max-width: 850px) {
        :root { --xi-library: 245px; }

        .xi-brand { min-width: auto; }
        .xi-brand-sub, .xi-top-status, .xi-top-shortcut { display: none; }
        .xi-reader-toolbar { padding: 0 17px; }
        .xi-reader-scroll { padding: 18px 16px 30px; }
        .xi-article-wrap { padding: 26px 23px 32px; }
      }

      @media (max-width: 620px) {
        :root { --xi-header: 51px; }

        .xi-topbar { gap: 8px; padding: 0 10px; }
        .xi-brand-mark { width: 29px; height: 29px; }
        .xi-brand-name { font-size: 13px; }
        .xi-top-divider { display: none; }
        .xi-top-current { display: none; }

        .xi-layout {
          display: block;
          position: relative;
        }

        .xi-sidebar {
          position: absolute;
          z-index: 12;
          top: 0;
          bottom: 0;
          left: 0;
          width: min(310px, 87vw);
          box-shadow: 12px 0 35px #1720331a;
          transform: translateX(-105%);
          transition: transform .18s ease;
        }

        #xiApp.xi-mobile-open .xi-sidebar { transform: translateX(0); }

        .xi-mobile-backdrop {
          position: absolute;
          z-index: 11;
          inset: 0;
          background: #0f172a66;
        }

        #xiApp.xi-mobile-open .xi-mobile-backdrop { display: block; }

        .xi-reader { height: 100%; }
        .xi-reader-toolbar { min-height: 42px; padding: 0 12px; gap: 8px; }
        .xi-read-progress { width: 40px; }
        .xi-read-meta { font-size: 9px; }

        .xi-reader-scroll { padding: 12px 9px 25px; }
        .xi-article-wrap {
          padding: 23px 16px 27px;
          border-radius: 9px;
        }

        .xi-article-title { font-size: 26px; }
        .xi-markdown { font-size: 13px; }
        .xi-markdown h2 { font-size: 19px; }
        .xi-markdown h3 { font-size: 16px; }
        .xi-markdown pre { padding: 13px; font-size: 11px; }
        .xi-reader-footer { align-items: flex-start; }
        .xi-footer-position { padding-top: 8px; }
        .xi-nav-btn { padding: 7px 9px; }
        .xi-help { display: none; }
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          scroll-behavior: auto !important;
          animation-duration: .01ms !important;
          transition-duration: .01ms !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* ============================================================
     BUILD THE COMPLETE APP
     ============================================================ */

  function buildApp() {
    // Remove old layout and its conflicting IDs.
    document.body.innerHTML = `
      <div id="xiApp">
        <header class="xi-topbar">
          <button class="xi-icon-btn" id="xiMenu"
            aria-label="Toggle library" aria-expanded="true"
            title="Toggle library">
            ${icon("menu")}
          </button>

          <div class="xi-brand">
            <div class="xi-brand-mark">Xi</div>
            <div>
              <div class="xi-brand-name">Xi Notes</div>
              <span class="xi-brand-sub">Technical interview revision</span>
            </div>
          </div>

          <div class="xi-top-divider"></div>

          <div class="xi-top-current" id="xiTopCurrent">
            <strong>Revision workspace</strong>
          </div>

          <div class="xi-top-spacer"></div>

          <div class="xi-top-status">
            <span class="xi-status-dot"></span>
            <span>Personal library</span>
          </div>

          <button class="xi-icon-btn" id="xiGitHub"
            aria-label="Open GitHub repository" title="Open GitHub repository">
            ${icon("external")}
          </button>
        </header>

        <div class="xi-layout">
          <aside class="xi-sidebar" id="xiSidebar">
            <div class="xi-library-head">
              <div class="xi-eyebrow">Your knowledge base</div>
              <div class="xi-library-title-row">
                <div class="xi-library-title">Library</div>
                <span class="xi-count" id="xiNoteCount">—</span>
              </div>

              <label class="xi-search">
                ${icon("search")}
                <input id="xiSearch" type="search"
                  placeholder="Find a topic..." autocomplete="off"
                  aria-label="Search notes">
                <span class="xi-search-shortcut">/</span>
              </label>
            </div>

            <div class="xi-library-tools" role="group" aria-label="Library filters">
              <button class="xi-filter active" data-filter="all">All notes</button>
              <button class="xi-filter" data-filter="folder">By folder</button>
              <button class="xi-filter" data-filter="revision">Cheat sheet</button>
            </div>

            <nav class="xi-library-scroll" id="xiLibrary"
              aria-label="Notes library">
              <div class="xi-empty">Connecting to your GitHub library…</div>
            </nav>

            <div class="xi-library-footer">
              ${icon("book")}
              <span>Synced from GitHub · Read-only</span>
            </div>
          </aside>

          <div class="xi-mobile-backdrop" id="xiBackdrop"></div>

          <main class="xi-reader">
            <div class="xi-reader-toolbar">
              <div class="xi-breadcrumb" id="xiBreadcrumb">
                <span>Library</span>
                <span>/</span>
                <strong>Getting ready…</strong>
              </div>
              <div class="xi-toolbar-spacer"></div>
              <span class="xi-read-meta" id="xiReadMeta">Ready to revise</span>
              <div class="xi-read-progress" title="Reading progress">
                <span id="xiProgress"></span>
              </div>
            </div>

            <div class="xi-reader-scroll" id="xiReaderScroll">
              <div class="xi-article-wrap">
                <div class="xi-article-header">
                  <div class="xi-article-kicker">
                    <span></span> INTERVIEW REVISION
                  </div>
                  <h1 class="xi-article-title" id="xiArticleTitle">
                    Welcome to Xi Notes
                  </h1>
                  <div class="xi-article-subtitle" id="xiArticleSubtitle">
                    Your technical knowledge, organised for quick revision.
                  </div>
                </div>

                <article class="xi-markdown" id="xiMarkdown">
                  <p>Loading your notes from GitHub…</p>
                </article>
              </div>

              <footer class="xi-reader-footer">
                <span class="xi-footer-position" id="xiPosition"></span>
                <div class="xi-footer-buttons">
                  <button class="xi-nav-btn" id="xiPrevious" disabled>
                    ${icon("arrowLeft")} Previous
                  </button>
                  <button class="xi-nav-btn primary" id="xiNext" disabled>
                    Next topic ${icon("arrowRight")}
                  </button>
                </div>
              </footer>
            </div>
          </main>
        </div>

        <div class="xi-help">/ Search · ← → Navigate</div>
        <div id="xiToast" class="xi-toast" hidden></div>
      </div>
    `;

    $("#xiGitHub").addEventListener("click", () => {
      window.open(
        "https://github.com/jai92xi/Xi_Notes",
        "_blank",
        "noopener,noreferrer"
      );
    });
  }

  /* ============================================================
     LIBRARY DISCOVERY
     ============================================================ */

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

    const result = [];

    for (const item of data) {
      if (item.type === "dir" && !item.name.startsWith(".")) {
        result.push(...await listFolder(item.path));
      } else if (item.type === "file" && /\.md$/i.test(item.name)) {
        result.push({
          path: normalize(item.path),
          title: titleOf(item.path)
        });
      }
    }

    return result;
  }

  async function discoverNotes() {
    let notes = [];

    try {
      const tree = await fetchJSON(
        `${CFG.api}/git/trees/${CFG.branch}?recursive=1`
      );

      if (Array.isArray(tree.tree)) {
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
      }

      if (tree.truncated) {
        console.warn("GitHub returned a truncated tree; checking the notes folder.");
        notes = await listFolder(CFG.folder);
      }
    } catch (error) {
      console.warn("Tree discovery failed; trying folder discovery.", error);
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

    $("#xiNoteCount").textContent = state.notes.length;
    renderLibrary();
  }

  /* ============================================================
     LIBRARY RENDERING
     ============================================================ */

  function filteredNotes() {
    const query = state.query.toLowerCase().trim();

    return state.notes.filter(note => {
      const matchesQuery =
        note.title.toLowerCase().includes(query) ||
        note.path.toLowerCase().includes(query);

      if (!matchesQuery) return false;

      if (state.category === "revision") return isCheatSheet(note.path);
      return true;
    });
  }

  function renderLibrary() {
    const library = $("#xiLibrary");
    if (!library) return;

    const notes = filteredNotes();
    library.replaceChildren();

    if (!notes.length) {
      const empty = document.createElement("div");
      empty.className = "xi-empty";
      empty.textContent = state.query
        ? "No matching topics. Try another search."
        : "No notes found for this filter.";
      library.appendChild(empty);
      return;
    }

    const groups = new Map();

    notes.forEach(note => {
      const group = state.category === "folder" && folderOf(note.path)
        ? folderOf(note.path)
        : state.category === "revision"
          ? "Revision"
          : "All topics";

      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(note);
    });

    for (const [groupName, groupNotes] of groups) {
      if (state.category === "folder" || state.category === "revision") {
        const label = document.createElement("div");
        label.className = "xi-group-label";
        label.textContent = groupName || "General";
        library.appendChild(label);
      } else if (groups.size > 1) {
        const label = document.createElement("div");
        label.className = "xi-group-label";
        label.textContent = groupName;
        library.appendChild(label);
      }

      for (const note of groupNotes) {
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
  }

  /* ============================================================
     LOAD OPTIONAL MARKDOWN LIBRARIES
     ============================================================ */

  function loadScript(src, key) {
    if (state.libraries[key]) return state.libraries[key];

    state.libraries[key] = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-xi-lib="${key}"]`);

      if (existing?.dataset.loaded === "true") {
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

  async function ensureMathLibraries() {
    try {
      if (!window.katex) {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css";
        document.head.appendChild(css);

        await loadScript(
          "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js",
          "katex"
        );
      }

      if (!window.renderMathInElement) {
        await loadScript(
          "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/contrib/auto-render.min.js",
          "katex-render"
        );
      }
    } catch (error) {
      console.warn("Math rendering is unavailable.", error);
    }
  }

  async function ensureHighlightLibrary() {
    try {
      if (!window.hljs) {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github-dark.min.css";
        document.head.appendChild(css);

        await loadScript(
          "https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/lib/common.min.js",
          "highlight"
        );
      }
    } catch (error) {
      console.warn("Syntax highlighting is unavailable.", error);
    }
  }

  /* ============================================================
     MARKDOWN RENDERING
     ============================================================ */

  async function fetchMarkdown(path) {
    const urls = [
      `${CFG.raw}/${encodePath(path)}`,
      `${CFG.cdn}/${encodePath(path)}`
    ];

    let lastError;

    for (const url of urls) {
      try {
        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`Could not load note (HTTP ${response.status}).`);
        }

        return await response.text();
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Could not load the Markdown file.");
  }

  function markdownToHTML(markdown) {
    const html = window.marked.parse(markdown, {
      gfm: true,
      breaks: false
    });

    return window.DOMPurify.sanitize(html, {
      ADD_ATTR: ["target", "rel"]
    });
  }

  async function enhanceMarkdown(container) {
    container.querySelectorAll("a[href]").forEach(link => {
      const href = link.getAttribute("href") || "";

      if (/^https?:\/\//i.test(href)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    });

    if (window.hljs) {
      container.querySelectorAll("pre code").forEach(code => {
        try {
          window.hljs.highlightElement(code);
        } catch (error) {
          console.warn("Code highlighting skipped.", error);
        }
      });
    }

    if (window.renderMathInElement) {
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
          ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
        });
      } catch (error) {
        console.warn("Formula rendering warning.", error);
      }
    }
  }

  /* ============================================================
     DAILY REVISION CHECKLIST
     Only applied to the main cheat sheet.
     No Contents / Context panel is created.
     ============================================================ */

  function buildDailyChecklist(article) {
    if (!isCheatSheet(state.path)) return;

    const nodes = Array.from(article.childNodes);
    const sections = [];
    let section = null;
    let index = 0;

    nodes.forEach(node => {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        /^H[1-4]$/.test(node.tagName)
      ) {
        section = {
          heading: node,
          nodes: [],
          index: index++
        };
        sections.push(section);
      } else if (section) {
        section.nodes.push(node);
      }
    });

    if (!sections.length) return;

    const fragment = document.createDocumentFragment();

    sections.forEach(item => {
      const headingText = item.heading.textContent.trim();
      const key = `${headingText.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}-${item.index}`;

      const wrapper = document.createElement("section");
      wrapper.className = "xi-check-section";

      const headingRow = document.createElement("div");
      headingRow.className = "xi-check-heading";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "xi-checkbox";
      checkbox.dataset.revisionKey = key;
      checkbox.checked = Boolean(state.checked[key]);
      checkbox.setAttribute("aria-label", `Mark ${headingText} as revised`);

      if (checkbox.checked) wrapper.classList.add("is-checked");

      checkbox.addEventListener("change", () => {
        state.checked[key] = checkbox.checked;
        saveRevisionState();
        wrapper.classList.toggle("is-checked", checkbox.checked);
        showToast(checkbox.checked ? "Topic marked as revised" : "Revision mark removed");
      });

      headingRow.append(checkbox, item.heading);
      wrapper.appendChild(headingRow);
      item.nodes.forEach(node => wrapper.appendChild(node));
      fragment.appendChild(wrapper);
    });

    article.replaceChildren(fragment);
  }

  /* ============================================================
     READER STATES
     ============================================================ */

  function showReaderMessage(title, message, retry = false) {
    $("#xiArticleTitle").textContent = title;
    $("#xiArticleSubtitle").textContent = "Xi Notes · Technical revision";
    $("#xiMarkdown").innerHTML = `
      <div class="xi-state">
        <div class="xi-state-symbol">${icon(retry ? "refresh" : "book")}</div>
        <h2>${escapeHTML(title)}</h2>
        <p>${escapeHTML(message)}</p>
        ${retry ? '<button class="xi-retry" id="xiRetry">Try again</button>' : ""}
      </div>`;

    if (retry) {
      $("#xiRetry").addEventListener("click", () => {
        if (state.path) openNote(state.path, { updateHistory: false });
        else initialize();
      });
    }
  }

  function showToast(message) {
    const toast = $("#xiToast");
    if (!toast) return;

    toast.textContent = message;
    toast.hidden = false;

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.hidden = true;
    }, 1800);
  }

  /* ============================================================
     READER METADATA AND NAVIGATION
     ============================================================ */

  function updateNavigation() {
    const index = state.index;
    const previous = $("#xiPrevious");
    const next = $("#xiNext");

    previous.disabled = index <= 0;
    next.disabled = index < 0 || index >= state.notes.length - 1;

    previous.onclick = () => {
      if (index > 0) openNote(state.notes[index - 1].path);
    };

    next.onclick = () => {
      if (index >= 0 && index < state.notes.length - 1) {
        openNote(state.notes[index + 1].path);
      }
    };

    $("#xiPosition").textContent = index >= 0
      ? `NOTE ${index + 1} OF ${state.notes.length}`
      : "";

    const note = currentNote();

    $("#xiBreadcrumb").innerHTML = note
      ? `<span>Library</span><span>/</span>
         <span>${escapeHTML(folderOf(note.path) || "Notes")}</span>
         <span>/</span><strong>${escapeHTML(note.title)}</strong>`
      : "<span>Library</span>";

    $("#xiTopCurrent").innerHTML = note
      ? `<strong>${escapeHTML(note.title)}</strong>`
      : "<strong>Revision workspace</strong>";

    $("#xiReadMeta").textContent = note
      ? `${index + 1} / ${state.notes.length}`
      : "Ready to revise";

    $("#xiReadProgress").textContent = "";
    renderLibrary();
  }

  function updateReadingProgress() {
    const scroller = $("#xiReaderScroll");
    if (!scroller) return;

    const max = scroller.scrollHeight - scroller.clientHeight;
    const value = max <= 0 ? 100 : Math.round(
      Math.min(100, Math.max(0, scroller.scrollTop / max * 100))
    );

    $("#xiProgress").style.width = `${value}%`;
  }

  /* ============================================================
     OPEN NOTE
     ============================================================ */

  async function openNote(path, options = {}) {
    const normalized = normalize(path);
    const note = state.notes.find(item => item.path === normalized);

    if (!note) {
      showReaderMessage(
        "Note not found",
        `The requested note "${normalized}" is not in the current GitHub library.`,
        true
      );
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

    $("#xiArticleTitle").textContent = note.title;
    $("#xiArticleSubtitle").textContent = "Loading your revision notes…";
    $("#xiMarkdown").innerHTML = `
      <div class="xi-state">
        <div class="xi-state-symbol"><span class="xi-spinner"></span></div>
        <h2>Opening note</h2>
        <p>Retrieving Markdown from your GitHub library.</p>
      </div>`;

    $("#xiReaderScroll").scrollTop = 0;
    updateReadingProgress();

    try {
      await ensureMarkdownLibraries();

      const markdown = await fetchMarkdown(normalized);

      if (requestId !== state.request) return;

      $("#xiMarkdown").innerHTML = markdownToHTML(markdown);

      // Avoid displaying the same title twice when Markdown starts with # title.
      const firstHeading = $("#xiMarkdown h1");

      if (
        firstHeading &&
        firstHeading.textContent.trim().toLowerCase() ===
        note.title.trim().toLowerCase()
      ) {
        firstHeading.remove();
      }

      if (isCheatSheet(normalized)) {
        readRevisionState();
        buildDailyChecklist($("#xiMarkdown"));
      }

      // Optional libraries must never prevent a note from opening.
      await Promise.allSettled([
        ensureMathLibraries(),
        ensureHighlightLibrary()
      ]);

      if (requestId !== state.request) return;

      await enhanceMarkdown($("#xiMarkdown"));

      $("#xiArticleTitle").textContent = note.title;
      $("#xiArticleSubtitle").textContent =
        `${folderOf(note.path) || "Technical notes"} · Markdown revision`;

      updateNavigation();
      updateReadingProgress();

      // No Contents / Context panel is added.
    } catch (error) {
      if (requestId !== state.request) return;

      console.error("Xi Notes note loading error:", error);

      showReaderMessage(
        "Unable to open this note",
        `${error.message || "A loading error occurred."} Check your connection and the file in GitHub, then retry.`,
        true
      );
    }
  }

  /* ============================================================
     EVENTS
     ============================================================ */

  function bindEvents() {
    $("#xiMenu").addEventListener("click", () => {
      const app = $("#xiApp");
      const mobile = window.matchMedia("(max-width: 620px)").matches;

      if (mobile) {
        const open = app.classList.toggle("xi-mobile-open");
        $("#xiMenu").setAttribute("aria-expanded", String(open));
      } else {
        app.classList.toggle("xi-collapsed");
        $("#xiMenu").setAttribute(
          "aria-expanded",
          String(!app.classList.contains("xi-collapsed"))
        );
      }
    });

    $("#xiBackdrop").addEventListener("click", () => {
      $("#xiApp").classList.remove("xi-mobile-open");
      $("#xiMenu").setAttribute("aria-expanded", "false");
    });

    $("#xiSearch").addEventListener("input", event => {
      state.query = event.target.value || "";
      renderLibrary();
    });

    $("#xiSearch").addEventListener("keydown", event => {
      if (event.key === "Enter") {
        const first = $("#xiLibrary .xi-note-link");
        if (first) openNote(first.dataset.path);
      }

      if (event.key === "Escape") {
        event.target.value = "";
        state.query = "";
        renderLibrary();
        event.target.blur();
      }
    });

    document.querySelectorAll(".xi-filter").forEach(button => {
      button.addEventListener("click", () => {
        state.category = button.dataset.filter;

        document.querySelectorAll(".xi-filter").forEach(item => {
          item.classList.toggle("active", item === button);
        });

        renderLibrary();
      });
    });

    $("#xiReaderScroll").addEventListener("scroll", updateReadingProgress, {
      passive: true
    });

    window.addEventListener("resize", () => {
      if (!window.matchMedia("(max-width: 620px)").matches) {
        $("#xiApp").classList.remove("xi-mobile-open");
      }
    });

    window.addEventListener("popstate", () => {
      const requested = getRequestedNote();

      if (requested && state.notes.some(note => note.path === requested)) {
        openNote(requested, { updateHistory: false });
      } else if (state.notes.length) {
        openNote(state.notes[0].path, { updateHistory: false });
      }
    });

    document.addEventListener("keydown", event => {
      const target = event.target;
      const typing = target instanceof HTMLElement && (
        target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      );

      if (typing) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        $("#xiSearch").focus();
        return;
      }

      if (event.key === "/" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        $("#xiSearch").focus();
      }

      if (event.key === "ArrowLeft" && !event.altKey) {
        if (state.index > 0) openNote(state.notes[state.index - 1].path);
      }

      if (event.key === "ArrowRight" && !event.altKey) {
        if (state.index < state.notes.length - 1) {
          openNote(state.notes[state.index + 1].path);
        }
      }

      if (event.key === "Escape") {
        $("#xiApp").classList.remove("xi-mobile-open");
      }
    });
  }

  /* ============================================================
     INITIALIZATION
     ============================================================ */

  async function initialize() {
    try {
      await discoverNotes();

      const requested = getRequestedNote();
      const exact = state.notes.find(note => note.path === requested);
      const caseInsensitive = state.notes.find(note =>
        note.path.toLowerCase() === requested.toLowerCase()
      );

      const defaultNote = state.notes.find(note => isCheatSheet(note.path))
        || state.notes[0];

      const selected = exact || caseInsensitive || defaultNote;

      if (!selected) {
        throw new Error("Your library does not contain any Markdown notes.");
      }

      await openNote(selected.path, { replaceHistory: true });
    } catch (error) {
      console.error("Xi Notes initialization failed:", error);

      $("#xiLibrary").innerHTML = `
        <div class="xi-empty">
          Could not load the library.<br><br>
          ${escapeHTML(error.message || "Check your internet connection.")}
          <br><br>
          <button class="xi-retry" id="xiRetryLibrary">Retry loading</button>
        </div>`;

      $("#xiRetryLibrary").addEventListener("click", initialize);

      showReaderMessage(
        "Your library could not be loaded",
        `${error.message || "Could not connect to GitHub."} Check your internet connection and retry.`,
        true
      );
    }
  }

  function start() {
    injectStyles();
    buildApp();
    bindEvents();
    initialize();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
