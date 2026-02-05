let allTodos = [];
let currentUserId = ""; 

const capitalizeTitle = (title = "") =>
  title
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ");
const formatTodo = (todo = {}) => {
  const { id = 0, title = "(no title)", completed = false, userId = 0 } = todo;
  const statusText = completed ? "Completed" : "Pending";

  return `
    <article class="todo ${completed ? "completed" : ""}" data-id="${id}" data-user-id="${userId}">
      <h2>${capitalizeTitle(title)}</h2>
      <div class="meta">
        <span class="badge">#${id}</span>
        <span class="badge">User: ${userId}</span>
        <span class="badge">Status: ${statusText}</span>
        <button class="toggle-btn" data-action="toggle" data-id="${id}">
          Toggle (local)
        </button>
      </div>
    </article>
  `;
};

const formatTodos = (todos = []) => todos.map(formatTodo).join("");

const filterByUser = (todos, userId) =>
  userId === "" ? todos : todos.filter((t) => t.userId === Number(userId));

const filterByStatus = (todos, status) => {
  if (status === "completed") return todos.filter((t) => t.completed === true);
  if (status === "pending") return todos.filter((t) => t.completed === false);
  return todos;
};

const filterBySearch = (todos, searchTerm = "") => {
  const term = searchTerm.toLowerCase().trim();
  return term === ""
    ? todos
    : todos.filter((t) => t.title.toLowerCase().includes(term));
};

const sortTodos = (todos, sortMode = "id") => {
  const copy = [...todos];

  if (sortMode === "title") return copy.sort((a, b) => a.title.localeCompare(b.title));
  if (sortMode === "status") return copy.sort((a, b) => Number(a.completed) - Number(b.completed));

  return copy.sort((a, b) => a.id - b.id);
};
const processTodosResponse = (todos = []) => {
  const [firstTodo, ...remainingTodos] = todos;
  return { firstTodo, remainingTodos, totalCount: todos.length };
};

const fetchTodos = async (userId = "") => {
  const url =
    userId === ""
      ? "https://jsonplaceholder.typicode.com/todos"
      : `https://jsonplaceholder.typicode.com/todos?userId=${userId}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  return response.json();
};

const setLoading = (message = "Loading todos...") => {
  const container = document.getElementById("content");
  container.innerHTML = `<div class="loading">${message}</div>`;
};

const setError = (error) => {
  const container = document.getElementById("content");
  container.innerHTML = `
    <div class="error">
      <p><strong>Failed to load todos</strong></p>
      <p>${error?.message ?? String(error)}</p>
      <p>Please check your internet connection and try again.</p>
    </div>
  `;
};

const renderStats = (todos = []) => {
  const stats = document.getElementById("stats");
  const total = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const pendingCount = total - completedCount;

  stats.textContent = `Showing ${total} todos — Completed: ${completedCount}, Pending: ${pendingCount}`;
};

const displayFilteredTodos = () => {
  const container = document.getElementById("content");

  const searchTerm = document.getElementById("searchInput").value;
  const userId = document.getElementById("userFilter").value;
  const status = document.getElementById("statusFilter").value;
  const sortMode = document.getElementById("sortSelect").value;

  let filtered = filterByUser(allTodos, userId);
  filtered = filterByStatus(filtered, status);
  filtered = filterBySearch(filtered, searchTerm);
  filtered = sortTodos(filtered, sortMode);

  renderStats(filtered);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <p>No todos found matching your criteria.</p>
        <p>Try adjusting your search or filter settings.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = formatTodos(filtered);
};

const buildUserOptions = () =>
  [
    '<option value="">All Users</option>',
    ...Array.from({ length: 10 }, (_, i) => {
      const id = i + 1;
      return `<option value="${id}">${id}</option>`;
    }),
  ].join("");

const loadData = async (userId = "") => {
    const userFilter = document.getElementById("userFilter");

  setLoading(userId === "" ? "Loading todos..." : `Loading todos for user ${userId}...`);

  try {
    if (userFilter.options.length === 0) {
      userFilter.innerHTML = buildUserOptions();
    }
    userFilter.value = userId;

    const todos = await fetchTodos(userId);
    allTodos = todos;
    currentUserId = userId;

    const { totalCount, firstTodo } = processTodosResponse(todos);
    console.log(`Loaded ${totalCount} todos. First todo:`, firstTodo);

    displayFilteredTodos();
  } catch (error) {
    setError(error);
    console.error("Error loading data:", error);
  }
};
const initializeEventListeners = () => {
  const searchInput = document.getElementById("searchInput");
  const userFilter = document.getElementById("userFilter");
  const statusFilter = document.getElementById("statusFilter");
  const sortSelect = document.getElementById("sortSelect");
  const refreshBtn = document.getElementById("refreshBtn");
  const nextUserBtn = document.getElementById("nextUserBtn");
  const content = document.getElementById("content");

  searchInput.addEventListener("input", () => displayFilteredTodos());
  statusFilter.addEventListener("change", () => displayFilteredTodos());
  sortSelect.addEventListener("change", () => displayFilteredTodos());

  userFilter.addEventListener("change", async () => {
    await loadData(userFilter.value);
  });

  refreshBtn.addEventListener("click", async () => {
    searchInput.value = "";
    statusFilter.value = "all";
    sortSelect.value = "id";
    await loadData(currentUserId);
  });

  nextUserBtn.addEventListener("click", async () => {
    const next = currentUserId === "" ? 1 : (Number(currentUserId) % 10) + 1;
    await loadData(String(next));
  });

  content.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-action='toggle']");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    if (!Number.isFinite(id)) return;

    allTodos = allTodos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    displayFilteredTodos();
  });
};
const init = () => {
  console.log("Todos Explorer - Initializing...");
  document.getElementById("userFilter").innerHTML = buildUserOptions();
  initializeEventListeners();
  loadData(""); 
};

document.addEventListener("DOMContentLoaded", init);
