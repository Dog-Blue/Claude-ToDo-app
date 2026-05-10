const STORAGE_KEYS = { todos: 'app_todos', memo: 'app_memo' };

// --- Tab switching ---
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// --- ToDo ---
function loadTodos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.todos)) || []; }
  catch { return []; }
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEYS.todos, JSON.stringify(todos));
}

function renderTodos() {
  const todos = loadTodos();
  const list = document.getElementById('todo-list');
  const empty = document.getElementById('todo-empty');

  list.innerHTML = '';
  empty.style.display = todos.length === 0 ? 'block' : 'none';

  todos.forEach((todo, index) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => toggleTodo(index));

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = '×';
    delBtn.title = '削除';
    delBtn.addEventListener('click', () => deleteTodo(index));

    li.append(checkbox, span, delBtn);
    list.appendChild(li);
  });
}

function addTodo() {
  const input = document.getElementById('todo-input');
  const text = input.value.trim();
  if (!text) return;

  const todos = loadTodos();
  todos.push({ text, done: false });
  saveTodos(todos);
  renderTodos();
  input.value = '';
  input.focus();
}

function toggleTodo(index) {
  const todos = loadTodos();
  todos[index].done = !todos[index].done;
  saveTodos(todos);
  renderTodos();
}

function deleteTodo(index) {
  const todos = loadTodos();
  todos.splice(index, 1);
  saveTodos(todos);
  renderTodos();
}

document.getElementById('todo-add').addEventListener('click', addTodo);
document.getElementById('todo-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTodo();
});

// --- Memo ---
const memoInput = document.getElementById('memo-input');
const memoSaved = document.getElementById('memo-saved');
let savedTimer = null;

memoInput.value = localStorage.getItem(STORAGE_KEYS.memo) || '';

document.getElementById('memo-save').addEventListener('click', () => {
  localStorage.setItem(STORAGE_KEYS.memo, memoInput.value);

  memoSaved.textContent = '保存しました';
  memoSaved.classList.add('show');
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => memoSaved.classList.remove('show'), 2000);
});

// Auto-save memo on Ctrl+S / Cmd+S
memoInput.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    document.getElementById('memo-save').click();
  }
});

// Init
renderTodos();
