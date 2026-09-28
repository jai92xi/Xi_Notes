const topics = [
  {
    name: "Early Stopping",
    file: "Early_Stopping.md",
    category: "Machine Learning"
  },
  {
    name: "Imbalanced Data Handling",
    file: "imbalanced data handling.md",
    category: "Machine Learning"
  }
];

const sidebar = document.getElementById("sidebar");
const content = document.getElementById("content");
const searchInput = document.getElementById("search");
const currentTopic = document.getElementById("current-topic");

function getNavigationContainer() {
  let navigation = document.querySelector(".topic-navigation");

  if (!navigation) {
    navigation = document.createElement("nav");
    navigation.className = "topic-navigation";
    sidebar.appendChild(navigation);
  }

  return navigation;
}

function createSidebar(items = topics) {
  const navigation = getNavigationContainer();

  navigation.innerHTML = "";

  if (items.length === 0) {
    navigation.innerHTML = `
      <div class="no-results">
        No notes found 😶
      </div>
    `;

    return;
  }

  const categories = {};

  items.forEach(topic => {
    if (!categories[topic.category]) {
      categories[topic.category] = [];
    }

    categories[topic.category].push(topic);
  });

  Object.entries(categories).forEach(
    ([category, categoryTopics]) => {

      const categoryTitle =
        document.createElement("div");

      categoryTitle.className = "category-title";
      categoryTitle.textContent = category;

      navigation.appendChild(categoryTitle);

      categoryTopics.forEach(topic => {

        const button =
          document.createElement("button");

        button.className = "topic-button";
        button.type = "button";
        button.textContent = topic.name;

        button.addEventListener("click", () => {
          loadMarkdown(topic);
        });

        navigation.appendChild(button);
      });
    }
  );
}


async function loadMarkdown(topic) {
  try {

    content.innerHTML = `
      <div class="loading">
        <div class="loading-spinner"></div>
        <p>Loading note...</p>
      </div>
    `;

    const response =
      await fetch(
        `notes/${encodeURIComponent(topic.file)}`
      );

    if (!response.ok) {
      throw new Error(
        `Could not load ${topic.file}`
      );
    }

    const markdown =
      await response.text();

    content.innerHTML =
      marked.parse(markdown);

    if (currentTopic) {
      currentTopic.textContent =
        topic.name;
    }

    updateActiveTopic(topic);

    addCopyButtons();

    addHeadingIds();

    setupCodeHighlighting();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  } catch (error) {

    console.error(error);

    content.innerHTML = `
      <div class="error">
        <div class="error-icon">😵</div>

        <h2>Couldn't load this note</h2>

        <p>
          The file
          <strong>${escapeHTML(topic.file)}</strong>
          could not be loaded.
        </p>

        <p>
          Make sure the file exists inside the
          <code>notes</code> folder.
        </p>
      </div>
    `;
  }
}


function updateActiveTopic(selectedTopic) {

  const buttons =
    document.querySelectorAll(
      ".topic-button"
    );

  buttons.forEach(button => {

    if (
      button.textContent.trim() ===
      selectedTopic.name
    ) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }

  });
}


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

    button.className = "copy-button";
    button.type = "button";
    button.textContent = "Copy";

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
            "Copied ✓";

          button.classList.add(
            "copied"
          );

          setTimeout(() => {

            button.textContent =
              "Copy";

            button.classList.remove(
              "copied"
            );

          }, 1500);

        } catch (error) {

          console.error(error);

          button.textContent =
            "Failed";

          setTimeout(() => {
            button.textContent =
              "Copy";
          }, 1500);
        }
      }
    );

    pre.appendChild(button);
  });
}


function addHeadingIds() {

  const headings =
    content.querySelectorAll(
      "h1, h2, h3"
    );

  headings.forEach(heading => {

    if (heading.id) {
      return;
    }

    const text =
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

    if (text) {
      heading.id = text;
    }
  });
}


function setupCodeHighlighting() {

  const codeBlocks =
    content.querySelectorAll(
      "pre code"
    );

  codeBlocks.forEach(code => {

    code.classList.add(
      "code-block"
    );

  });
}


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
        createSidebar();
        return;
      }

      const filteredTopics =
        topics.filter(topic => {

          return (
            topic.name
              .toLowerCase()
              .includes(query) ||

            topic.category
              .toLowerCase()
              .includes(query) ||

            topic.file
              .toLowerCase()
              .includes(query)
          );

        });

      createSidebar(filteredTopics);
    }
  );
}


function setupKeyboardShortcuts() {

  document.addEventListener(
    "keydown",
    event => {

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {

        event.preventDefault();

        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }


      if (event.key === "Escape") {

        if (searchInput) {
          searchInput.value = "";
          searchInput.blur();
        }

        createSidebar();
      }

    }
  );
}


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


  if (
    !menuButton ||
    !sidebar
  ) {
    return;
  }


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


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeMobileMenu
    );
  }


  if (overlay) {

    overlay.addEventListener(
      "click",
      closeMobileMenu
    );
  }
}


function closeMobileMenu() {

  sidebar.classList.remove(
    "mobile-open"
  );

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


function escapeHTML(value) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent = value;

  return div.innerHTML;
}


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


function initialize() {

  configureMarkdown();

  createSidebar();

  setupSearch();

  setupKeyboardShortcuts();

  setupMobileMenu();

  if (topics.length > 0) {
    loadMarkdown(topics[0]);
  }
}


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
