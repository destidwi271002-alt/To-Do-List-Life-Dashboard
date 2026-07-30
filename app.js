/* ============================================================
   js/app.js — To-Do List Life Dashboard
   Vanilla JavaScript, no external dependencies.
   ============================================================ */

'use strict';

/* ------------------------------------------------------------
   MODULE 1: StorageService
   ------------------------------------------------------------ */
const StorageService = {
  KEYS: {
    USER_NAME:         'tld_userName',
    POMODORO_DURATION: 'tld_pomodoroDuration',
    THEME:             'tld_theme',
    TASKS:             'tld_tasks',
    LINKS:             'tld_links',
  },

  _fallback: {},

  isAvailable() {
    try {
      const test = '__tld_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  get(key) {
    if (this.isAvailable()) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    } else {
      const value = this._fallback[key];
      return value !== undefined ? value : null;
    }
  },

  set(key, value) {
    if (this.isAvailable()) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {}
    } else {
      this._fallback[key] = value;
    }
  },
};

/* ------------------------------------------------------------
   MODULE 2: ClockModule
   ------------------------------------------------------------ */
const ClockModule = {
  intervalId: null,

  start() {
    this.tick();
    this.intervalId = setInterval(() => this.tick(), 1000);
  },

  stop() {
    clearInterval(this.intervalId);
    this.intervalId = null;
  },

  tick() {
    const now = new Date();
    const clockEl = document.getElementById('clock-display');
    if (clockEl) clockEl.textContent = this.formatTime(now);
    const dateEl = document.getElementById('date-display');
    if (dateEl) dateEl.textContent = this.formatDate(now);
    GreetingModule.updateGreeting();
  },

  formatTime(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  },

  formatDate(date) {
    const DAYS   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni',
                    'Juli','Agustus','September','Oktober','November','Desember'];
    return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  },
};

/* ------------------------------------------------------------
   MODULE 3: GreetingModule
   ------------------------------------------------------------ */
const GreetingModule = {
  init() {
    const savedName = StorageService.get(StorageService.KEYS.USER_NAME) || '';
    const nameInput = document.getElementById('name-input');
    if (nameInput && savedName) nameInput.value = savedName;

    const saveBtn = document.getElementById('name-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const input = document.getElementById('name-input');
        if (input) this.saveName(input.value.trim());
      });
    }
    if (nameInput) {
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.saveName(nameInput.value.trim());
      });
    }
    this.updateGreeting();
  },

  updateGreeting() {
    const name   = StorageService.get(StorageService.KEYS.USER_NAME) || '';
    const prefix = this.getGreetingPrefix(new Date().getHours());
    this.renderGreeting(name, prefix);
  },

  saveName(name) {
    StorageService.set(StorageService.KEYS.USER_NAME, name);
    this.updateGreeting();
  },

  getGreetingPrefix(hour) {
    if (hour >= 5  && hour <= 11) return 'Selamat Pagi';
    if (hour >= 12 && hour <= 14) return 'Selamat Siang';
    if (hour >= 15 && hour <= 17) return 'Selamat Sore';
    return 'Selamat Malam';
  },

  renderGreeting(name, prefix) {
    const el = document.getElementById('greeting-display');
    if (!el) return;
    el.textContent = name ? `${prefix}, ${name}!` : `${prefix}!`;
  },
};

/* ------------------------------------------------------------
   MODULE 4: TimerModule
   ------------------------------------------------------------ */
const TimerModule = {
  state:      'idle',
  remaining:  0,
  intervalId: null,
  duration:   25,

  init() {
    const saved = StorageService.get(StorageService.KEYS.POMODORO_DURATION);
    this.duration  = (saved && Number.isInteger(saved) && saved >= 1) ? saved : 25;
    this.remaining = this.duration * 60;
    this.renderDisplay();

    document.getElementById('timer-start').addEventListener('click',  () => this.start());
    document.getElementById('timer-stop').addEventListener('click',   () => this.stop());
    document.getElementById('timer-reset').addEventListener('click',  () => this.reset());
    document.getElementById('duration-save').addEventListener('click', () => {
      this.saveDuration(parseInt(document.getElementById('duration-input').value, 10));
    });
  },

  start() {
    if (this.state === 'running') return;
    if (this.remaining <= 0) this.remaining = this.duration * 60;
    this.state      = 'running';
    this.intervalId = setInterval(() => this.tick(), 1000);
    this.renderDisplay();
  },

  stop() {
    if (this.state !== 'running') return;
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.state      = 'idle';
    this.renderDisplay();
  },

  reset() {
    this.stop();
    this.remaining = this.duration * 60;
    this.renderDisplay();
  },

  tick() {
    this.remaining -= 1;
    this.renderDisplay();
    if (this.remaining <= 0) this.onComplete();
  },

  onComplete() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.state      = 'idle';
    this.remaining  = 0;
    this.renderDisplay();

    const notif = document.getElementById('notification');
    if (notif) {
      notif.textContent = 'Sesi fokus selesai! Waktunya istirahat. ☕';
      notif.classList.remove('hidden', 'fade-out');
      setTimeout(() => {
        notif.classList.add('fade-out');
        setTimeout(() => notif.classList.add('hidden'), 300);
      }, 5000);
    }
  },

  saveDuration(minutes) {
    const errEl = document.getElementById('duration-error');
    if (!Number.isFinite(minutes) || minutes < 1) {
      if (errEl) {
        errEl.textContent = 'Durasi harus berupa angka minimal 1 menit.';
        errEl.classList.remove('hidden');
      }
      return;
    }
    if (errEl) errEl.classList.add('hidden');
    this.duration = minutes;
    StorageService.set(StorageService.KEYS.POMODORO_DURATION, minutes);
    this.reset();
  },

  renderDisplay() {
    const display  = document.getElementById('timer-display');
    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    if (display)  display.textContent = this.formatMMSS(this.remaining);
    if (startBtn) startBtn.disabled   = (this.state === 'running');
    if (stopBtn)  stopBtn.disabled    = (this.state !== 'running');
  },

  formatMMSS(seconds) {
    const s = Math.max(0, seconds);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  },
};

/* ------------------------------------------------------------
   MODULE 5: TodoModule
   ------------------------------------------------------------ */
const TodoModule = {
  tasks:     [],
  sortOrder: 'default',

  init() {
    this.tasks     = StorageService.get(StorageService.KEYS.TASKS) || [];
    this.sortOrder = 'default';
    this.render();

    const addBtn  = document.getElementById('todo-add');
    const input   = document.getElementById('todo-input');
    const sortSel = document.getElementById('sort-select');

    if (addBtn) addBtn.addEventListener('click', () => this.addTask(input.value));
    if (input)  input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addTask(input.value);
    });
    if (sortSel) sortSel.addEventListener('change', (e) => this.setSortOrder(e.target.value));
  },

  addTask(text) {
    const errEl = document.getElementById('todo-error');
    const input = document.getElementById('todo-input');

    if (!text || text.trim() === '') {
      if (errEl) { errEl.textContent = 'Teks tugas tidak boleh kosong.'; errEl.classList.remove('hidden'); }
      return;
    }
    if (this.isDuplicate(text)) {
      if (errEl) { errEl.textContent = `Tugas '${text.trim()}' sudah ada dalam daftar.`; errEl.classList.remove('hidden'); }
      return;
    }
    if (errEl) errEl.classList.add('hidden');

    this.tasks.push({
      id:        'task_' + Date.now(),
      text:      text.trim(),
      completed: false,
      createdAt: Date.now(),
    });
    this.persist();
    this.render();
    if (input) input.value = '';
  },

  editTask(id, newText) {
    if (!newText || newText.trim() === '') return;
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.text = newText.trim();
      this.persist();
      this.render();
    }
  },

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.persist();
    this.render();
  },

  toggleComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.persist();
      this.render();
    }
  },

  setSortOrder(order) {
    this.sortOrder = order;
    this.render();
  },

  getSortedTasks() {
    const copy = [...this.tasks];
    switch (this.sortOrder) {
      case 'az':              return copy.sort((a, b) => a.text.localeCompare(b.text));
      case 'za':              return copy.sort((a, b) => b.text.localeCompare(a.text));
      case 'incomplete-first':return copy.sort((a, b) => Number(a.completed) - Number(b.completed));
      case 'complete-first':  return copy.sort((a, b) => Number(b.completed) - Number(a.completed));
      default:                return copy.sort((a, b) => a.createdAt - b.createdAt);
    }
  },

  isDuplicate(text) {
    const n = text.trim().toLowerCase();
    return this.tasks.some(t => t.text.trim().toLowerCase() === n);
  },

  persist() {
    StorageService.set(StorageService.KEYS.TASKS, this.tasks);
  },

  render() {
    const list = document.getElementById('task-list');
    if (!list) return;
    list.innerHTML = '';
    this.getSortedTasks().forEach(task => list.appendChild(this.renderTask(task)));
  },

  renderTask(task) {
    const li = document.createElement('li');
    li.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 4px;border-bottom:1px solid var(--color-border);';

    const checkbox   = document.createElement('input');
    checkbox.type    = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.style.cursor = 'pointer';
    checkbox.addEventListener('change', () => this.toggleComplete(task.id));

    const span = document.createElement('span');
    span.textContent = task.text;
    span.style.cssText = `flex:1;${task.completed ? 'text-decoration:line-through;color:var(--color-task-done-text);' : ''}`;

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.style.cssText = 'background:var(--color-accent);padding:4px 10px;font-size:0.8rem;';
    editBtn.addEventListener('click', () => {
      const editInput  = document.createElement('input');
      editInput.type   = 'text';
      editInput.value  = task.text;
      editInput.style.cssText = 'flex:1;padding:4px 8px;';

      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Simpan';
      saveBtn.style.cssText = 'background:var(--color-success);padding:4px 10px;font-size:0.8rem;';
      saveBtn.addEventListener('click', () => this.editTask(task.id, editInput.value));
      editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.editTask(task.id, editInput.value);
      });

      li.replaceChild(editInput, span);
      li.replaceChild(saveBtn, editBtn);
    });

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Hapus';
    delBtn.style.cssText = 'background:var(--color-error);padding:4px 10px;font-size:0.8rem;';
    delBtn.addEventListener('click', () => this.deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(delBtn);
    return li;
  },
};

/* ------------------------------------------------------------
   MODULE 6: LinksModule
   ------------------------------------------------------------ */
const LinksModule = {
  links: [],

  init() {
    this.links = StorageService.get(StorageService.KEYS.LINKS) || [];
    this.render();

    const addBtn = document.getElementById('link-add');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const name = document.getElementById('link-name-input').value;
        const url  = document.getElementById('link-url-input').value;
        this.addLink(name, url);
      });
    }
  },

  addLink(name, url) {
    const errEl = document.getElementById('link-error');

    if (!name || name.trim() === '') {
      if (errEl) { errEl.textContent = 'Nama link tidak boleh kosong.'; errEl.classList.remove('hidden'); }
      return;
    }
    if (!this.validateUrl(url)) {
      if (errEl) { errEl.textContent = 'URL harus diawali dengan http:// atau https://.'; errEl.classList.remove('hidden'); }
      return;
    }
    if (errEl) errEl.classList.add('hidden');

    this.links.push({
      id:        'link_' + Date.now(),
      name:      name.trim(),
      url:       url.trim(),
      createdAt: Date.now(),
    });
    this.persist();
    this.render();
    document.getElementById('link-name-input').value = '';
    document.getElementById('link-url-input').value  = '';
  },

  deleteLink(id) {
    this.links = this.links.filter(l => l.id !== id);
    this.persist();
    this.render();
  },

  validateUrl(url) {
    return /^https?:\/\//i.test(url ? url.trim() : '');
  },

  persist() {
    StorageService.set(StorageService.KEYS.LINKS, this.links);
  },

  render() {
    const container = document.getElementById('links-list');
    if (!container) return;
    container.innerHTML = '';
    this.links.forEach(link => container.appendChild(this.renderLink(link)));
  },

  renderLink(link) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:inline-flex;align-items:center;gap:4px;';

    const openBtn = document.createElement('button');
    openBtn.textContent = link.name;
    openBtn.title       = link.url;
    openBtn.style.cssText = 'background:var(--color-accent);';
    openBtn.addEventListener('click', () => window.open(link.url, '_blank'));

    const delBtn = document.createElement('button');
    delBtn.textContent = '×';
    delBtn.title       = 'Hapus link';
    delBtn.style.cssText = 'background:var(--color-error);padding:4px 8px;font-weight:bold;';
    delBtn.addEventListener('click', () => this.deleteLink(link.id));

    wrapper.appendChild(openBtn);
    wrapper.appendChild(delBtn);
    return wrapper;
  },
};

/* ------------------------------------------------------------
   MODULE 7: ThemeModule
   ------------------------------------------------------------ */
const ThemeModule = {
  current: 'light',

  init() {
    const saved = StorageService.get(StorageService.KEYS.THEME);
    this.apply(saved === 'dark' ? 'dark' : 'light');

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggle());
  },

  toggle() {
    this.apply(this.current === 'light' ? 'dark' : 'light');
    this.persist();
  },

  apply(theme) {
    this.current = theme;
    document.documentElement.setAttribute('data-theme', theme);
  },

  persist() {
    StorageService.set(StorageService.KEYS.THEME, this.current);
  },
};

/* ------------------------------------------------------------
   APPLICATION BOOTSTRAP
   ------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', function () {
  if (!StorageService.isAvailable()) {
    const banner = document.createElement('div');
    banner.style.cssText = 'background:#d69e2e;color:#000;padding:8px 16px;text-align:center;font-size:14px;position:sticky;top:0;z-index:200;';
    banner.textContent   = 'Data tidak akan tersimpan karena browser tidak mendukung penyimpanan lokal.';
    document.body.prepend(banner);
  }

  ThemeModule.init();
  GreetingModule.init();
  TimerModule.init();
  TodoModule.init();
  LinksModule.init();
  ClockModule.start();
});
