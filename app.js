const STORAGE_KEYS = { todos: 'app_todos', memos: 'app_memos' };

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
let currentMemoId = null;
let autoSaveTimer = null;
let savedTimer = null;

const memoInput = document.getElementById('memo-input');
const memoSaved = document.getElementById('memo-saved');

function loadMemos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.memos)) || []; }
  catch { return []; }
}

function saveMemos(memos) {
  localStorage.setItem(STORAGE_KEYS.memos, JSON.stringify(memos));
}

function memoTitle(body) {
  const first = body.split('\n')[0].trim();
  return first || '無題のメモ';
}

function memoPreview(body) {
  const lines = body.split('\n');
  const rest = lines.slice(1).join(' ').trim();
  return rest || '　';
}

function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
}

function renderMemoList() {
  const memos = loadMemos();
  const list = document.getElementById('memo-list');
  const empty = document.getElementById('memo-empty');
  const count = document.getElementById('memo-count');

  list.innerHTML = '';
  count.textContent = memos.length > 0 ? `${memos.length}件` : '';
  empty.style.display = memos.length === 0 ? 'block' : 'none';

  memos.slice().sort((a, b) => b.updatedAt - a.updatedAt).forEach(memo => {
    const li = document.createElement('li');
    li.className = 'memo-card';

    const body = document.createElement('div');
    body.className = 'memo-card-body';

    const title = document.createElement('div');
    title.className = 'memo-card-title';
    title.textContent = memoTitle(memo.body);

    const preview = document.createElement('div');
    preview.className = 'memo-card-preview';
    preview.textContent = memoPreview(memo.body);

    body.append(title, preview);

    const date = document.createElement('span');
    date.className = 'memo-card-date';
    date.textContent = formatDate(memo.updatedAt);

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = '×';
    delBtn.title = '削除';
    delBtn.addEventListener('click', e => { e.stopPropagation(); deleteMemo(memo.id); });

    li.append(body, date, delBtn);
    li.addEventListener('click', () => openMemo(memo.id));
    list.appendChild(li);
  });
}

function openMemo(id) {
  const memos = loadMemos();
  const memo = memos.find(m => m.id === id);
  if (!memo) return;

  currentMemoId = id;
  memoInput.value = memo.body;

  document.getElementById('memo-list-view').style.display = 'none';
  document.getElementById('memo-edit-view').style.display = 'block';
  memoInput.focus();
}

function saveCurrentMemo(silent = false) {
  if (!currentMemoId) return;
  const memos = loadMemos();
  const idx = memos.findIndex(m => m.id === currentMemoId);
  if (idx === -1) return;

  memos[idx].body = memoInput.value;
  memos[idx].updatedAt = Date.now();
  saveMemos(memos);

  if (!silent) {
    memoSaved.textContent = '保存しました';
    memoSaved.classList.add('show');
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => memoSaved.classList.remove('show'), 2000);
  }
}

function newMemo() {
  const memo = { id: Date.now(), body: '', updatedAt: Date.now() };
  const memos = loadMemos();
  memos.unshift(memo);
  saveMemos(memos);
  openMemo(memo.id);
}

function deleteMemo(id) {
  const memos = loadMemos();
  const filtered = memos.filter(m => m.id !== id);
  saveMemos(filtered);

  if (currentMemoId === id) {
    currentMemoId = null;
    document.getElementById('memo-list-view').style.display = 'block';
    document.getElementById('memo-edit-view').style.display = 'none';
  }
  renderMemoList();
}

// Auto-save while typing (debounce 600ms)
memoInput.addEventListener('input', () => {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => saveCurrentMemo(true), 600);
});

// Cmd+S / Ctrl+S
memoInput.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveCurrentMemo(false);
  }
});

document.getElementById('memo-new').addEventListener('click', newMemo);

document.getElementById('memo-back').addEventListener('click', () => {
  saveCurrentMemo(true);
  currentMemoId = null;
  document.getElementById('memo-list-view').style.display = 'block';
  document.getElementById('memo-edit-view').style.display = 'none';
  renderMemoList();
});

document.getElementById('memo-delete-current').addEventListener('click', () => {
  if (currentMemoId) deleteMemo(currentMemoId);
});

// Init
renderTodos();
