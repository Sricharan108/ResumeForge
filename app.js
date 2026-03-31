/* ═══════════════════════════════════════════════════════════════
   ResumeForge – app.js
   Full client-side resume builder with presets, live preview,
   customization, and export. No frameworks, no backend.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════════════════
   PRESET DEFINITIONS
══════════════════════════════════════════════════ */
const PRESETS = {
  software: {
    name: 'Software Developer',
    color: '#4F8EF7',
    accentBg: 'rgba(79,142,247,0.08)',
    layout: 'software',
    sectionOrder: ['summary', 'skills', 'experience', 'projects', 'education'],
    font: "'Jost', sans-serif",
  },
  management: {
    name: 'Management',
    color: '#7C3AED',
    accentBg: 'rgba(124,58,237,0.08)',
    layout: 'management',
    sectionOrder: ['summary', 'experience', 'skills', 'education'],
    font: "'IBM Plex Serif', serif",
  },
  design: {
    name: 'Design',
    color: '#EC4899',
    accentBg: 'rgba(236,72,153,0.08)',
    layout: 'design',
    sectionOrder: ['summary', 'experience', 'projects', 'skills', 'education'],
    font: "'Raleway', sans-serif",
  },
  entry: {
    name: 'Entry Level',
    color: '#059669',
    accentBg: 'rgba(5,150,105,0.08)',
    layout: 'entry',
    sectionOrder: ['summary', 'education', 'skills', 'experience', 'projects'],
    font: "'DM Sans', sans-serif",
  },
};

const SECTION_LABELS = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
};

const SKILL_LEVELS = { beginner: 20, intermediate: 50, proficient: 70, advanced: 85, expert: 100 };

/* ══════════════════════════════════════════════════
   DEFAULT STATE
══════════════════════════════════════════════════ */
function defaultState() {
  return {
    preset: 'software',
    theme: { color: '#4F8EF7', secondaryColor: '#111827', font: "'Jost', sans-serif", spacing: 1, fontSize: 14 },
    sectionOrder: [...PRESETS.software.sectionOrder],
    personal: {
      name: '', title: '', email: '', phone: '',
      location: '', website: '', linkedin: '', github: '', summary: '',
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
  };
}

function newExperience() {
  return { id: uid(), company: '', role: '', start: '', end: '', current: false, description: '', metrics: '' };
}
function newEducation() {
  return { id: uid(), school: '', degree: '', field: '', start: '', end: '', gpa: '' };
}
function newSkill() {
  return { id: uid(), name: '', level: 'proficient', category: '' };
}
function newProject() {
  return { id: uid(), name: '', url: '', tech: '', description: '' };
}

/* ══════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════ */
let _uidCounter = Date.now();
function uid() { return 'id_' + (++_uidCounter).toString(36); }

function escHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function debounce(fn, ms = 180) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

/* Storage abstraction (chrome.storage.local with localStorage fallback) */
const Store = {
  get(cb) {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get('resumeforge_state', (result) => {
        cb(result.resumeforge_state || null);
      });
    } else {
      try { cb(JSON.parse(localStorage.getItem('resumeforge_state'))); }
      catch { cb(null); }
    }
  },
  set(data, cb) {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ resumeforge_state: data }, cb || (() => {}));
    } else {
      localStorage.setItem('resumeforge_state', JSON.stringify(data));
      cb && cb();
    }
  },
};

/* ══════════════════════════════════════════════════
   APPLICATION STATE
══════════════════════════════════════════════════ */
let state = defaultState();
let saveTimeout = null;
let dragSrcIndex = null;

/* ══════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  Store.get((saved) => {
    if (saved) state = Object.assign(defaultState(), saved);
    applyTheme();
    bindTopbar();
    bindFormTabs();
    renderAllForms();
    renderPreview();
    syncPresetButtons();
    updatePresetLabel();
    updateColorPreview();
    updateSpacingLabel();
    // Font Size
  const fontSizeSlider = document.getElementById('fontSizeSlider');
  if (fontSizeSlider) {
    fontSizeSlider.value = state.theme.fontSize || 14;
    fontSizeSlider.addEventListener('input', debounce(() => {
      state.theme.fontSize = fontSizeSlider.value;
      renderPreview();
      triggerSave();
    }, 60));
  }

  bindExport();
  });
});

/* ══════════════════════════════════════════════════
   SAVE STATE
══════════════════════════════════════════════════ */
function triggerSave() {
  const ind = $('#autosaveIndicator');
  if (ind) { ind.classList.add('saving'); ind.querySelector('.save-text').textContent = 'Saving'; }
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    Store.set(state, () => {
      if (ind) {
        ind.classList.remove('saving');
        ind.querySelector('.save-text').textContent = 'Saved';
      }
    });
  }, 600);
}

/* ══════════════════════════════════════════════════
   THEME
══════════════════════════════════════════════════ */
function applyTheme() {
  const r = document.documentElement.style;
  r.setProperty('--accent', state.theme.color);
  r.setProperty('--accent-soft', hexToRgba(state.theme.color, 0.12));
  r.setProperty('--accent-hover', shadeHex(state.theme.color, -15));
  r.setProperty('--accent-secondary', state.theme.secondaryColor || '#111827');
  r.setProperty('--resume-font', state.theme.font);
  // Apply font directly to resume preview
  const preview = document.getElementById('resumePreview');
  if (preview) preview.style.fontFamily = state.theme.font;
}

function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function shadeHex(hex, pct) {
  let num = parseInt(hex.slice(1), 16);
  let r = Math.min(255, Math.max(0, (num >> 16) + pct));
  let g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + pct));
  let b = Math.min(255, Math.max(0, (num & 0xff) + pct));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

/* ══════════════════════════════════════════════════
   TOP BAR BINDINGS
══════════════════════════════════════════════════ */
function bindTopbar() {
  // Preset buttons
  $$('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      switchPreset(preset);
    });
  });

  // Color picker
  const colorInput = $('#primaryColor');
  if (colorInput) {
    colorInput.value = state.theme.color;
    colorInput.addEventListener('input', debounce(() => {
      state.theme.color = colorInput.value;
      applyTheme();
      updateColorPreview();
      renderPreview();
      triggerSave();
    }, 60));
  }

  // Font select
  const fontSelect = $('#fontFamily');
  if (fontSelect) {
    fontSelect.value = state.theme.font;
    fontSelect.addEventListener('change', () => {
      state.theme.font = fontSelect.value;
      renderPreview();
      triggerSave();
    });
  }

  // Spacing
  const spacingSlider = $('#spacingSlider');
  if (spacingSlider) {
    spacingSlider.value = state.theme.spacing;
    spacingSlider.addEventListener('input', debounce(() => {
      state.theme.spacing = parseFloat(spacingSlider.value);
      updateSpacingLabel();
      renderPreview();
      triggerSave();
    }, 60));
  }

  // Secondary color
  const secondaryInput = $('#secondaryColor');
  if (secondaryInput) {
    secondaryInput.value = state.theme.secondaryColor || '#111827';
    secondaryInput.addEventListener('input', debounce(() => {
      state.theme.secondaryColor = secondaryInput.value;
      const dot = $('#secondaryColorPreview');
      if (dot) dot.style.background = secondaryInput.value;
      applyTheme();
      renderPreview();
      triggerSave();
    }, 60));
  }
}

function updateColorPreview() {
  const preview = $('#colorPreview');
  if (preview) preview.style.background = state.theme.color;
  const input = $('#primaryColor');
  if (input) input.value = state.theme.color;
}

function updateSpacingLabel() {
  const label = $('#spacingValue');
  if (label) label.textContent = parseFloat(state.theme.spacing).toFixed(1) + '×';
}

function syncPresetButtons() {
  $$('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === state.preset);
    btn.setAttribute('aria-selected', btn.dataset.preset === state.preset);
  });
}

function updatePresetLabel() {
  const label = $('#currentPresetLabel');
  if (label) label.textContent = PRESETS[state.preset]?.name || '';
}

/* ══════════════════════════════════════════════════
   PRESET SWITCHING
══════════════════════════════════════════════════ */
function switchPreset(presetKey) {
  if (!PRESETS[presetKey]) return;
  const p = PRESETS[presetKey];
  state.preset = presetKey;
  state.theme.color = p.color;
  state.theme.font = p.font;
  state.sectionOrder = [...p.sectionOrder];

  const colorInput = $('#primaryColor');
  if (colorInput) colorInput.value = p.color;
  const fontSelect = $('#fontFamily');
  if (fontSelect) fontSelect.value = p.font;

  applyTheme();
  updateColorPreview();
  syncPresetButtons();
  updatePresetLabel();
  renderSectionOrder();
  renderPreview();
  triggerSave();
  showToast(`Switched to ${p.name} preset`, 'success');
}

/* ══════════════════════════════════════════════════
   FORM TAB SWITCHING
══════════════════════════════════════════════════ */
function bindFormTabs() {
  $$('.form-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      $$('.form-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === target));
      $$('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${target}`));
    });
  });
}

/* ══════════════════════════════════════════════════
   RENDER ALL FORMS
══════════════════════════════════════════════════ */
function renderAllForms() {
  renderPersonalForm();
  renderExperienceList();
  renderEducationList();
  renderSkillsList();
  renderProjectsList();
  renderSectionOrder();
}

/* ── PERSONAL FORM ── */
function renderPersonalForm() {
  const fields = ['name', 'title', 'email', 'phone', 'location', 'website', 'linkedin', 'github', 'summary'];
  fields.forEach(field => {
    const el = $(`[data-field="${field}"]`);
    if (!el) return;
    el.value = state.personal[field] || '';
    el.addEventListener('input', debounce(() => {
      state.personal[field] = el.value;
      renderPreview();
      triggerSave();
    }, 120));
  });
}

/* ── EXPERIENCE LIST ── */
function renderExperienceList() {
  const container = $('#experience-list');
  if (!container) return;
  container.innerHTML = '';
  state.experience.forEach((item, idx) => {
    container.appendChild(buildExperienceCard(item, idx));
  });
  bindAddButton('addExperience', () => {
    state.experience.push(newExperience());
    renderExperienceList();
    renderPreview();
    triggerSave();
    // Auto-open the new card
    const cards = $$('.list-item-card', $('#experience-list'));
    if (cards.length) openCard(cards[cards.length - 1]);
  });
}

function buildExperienceCard(item, idx) {
  const card = document.createElement('div');
  card.className = 'list-item-card';
  card.dataset.id = item.id;

  const displayTitle = item.role || item.company || `Experience ${idx + 1}`;
  card.innerHTML = `
    <div class="item-header">
      <span class="item-title-text">${escHtml(displayTitle)}</span>
      <div class="item-actions">
        <button class="icon-btn danger remove-btn" title="Remove">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <svg class="chevron-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
    <div class="item-body">
      <div class="fields-grid">
        <div class="field-group">
          <label>Job Title</label>
          <input type="text" data-key="role" value="${escHtml(item.role)}" placeholder="e.g. Senior Engineer" />
        </div>
        <div class="field-group">
          <label>Company</label>
          <input type="text" data-key="company" value="${escHtml(item.company)}" placeholder="e.g. Google" />
        </div>
        <div class="field-group">
          <label>Start Date</label>
          <input type="text" data-key="start" value="${escHtml(item.start)}" placeholder="Jan 2021" />
        </div>
        <div class="field-group">
          <label>End Date</label>
          <input type="text" data-key="end" value="${escHtml(item.end)}" placeholder="Dec 2023" ${item.current ? 'disabled' : ''} />
        </div>
        <div class="checkbox-group">
          <input type="checkbox" id="cur-${item.id}" data-key="current" ${item.current ? 'checked' : ''} />
          <label for="cur-${item.id}">Currently working here</label>
        </div>
        <div class="field-group full">
          <label>Description / Achievements</label>
          <textarea data-key="description" rows="4" placeholder="• Led team of 5 engineers to deliver...&#10;• Improved performance by 40%...">${escHtml(item.description)}</textarea>
        </div>
        <div class="field-group full">
          <label>Key Metrics (comma separated)</label>
          <input type="text" data-key="metrics" value="${escHtml(item.metrics)}" placeholder="e.g. 40% faster, $2M revenue, 99.9% uptime" />
        </div>
      </div>
    </div>
  `;

  // Header toggle
  const header = card.querySelector('.item-header');
  header.addEventListener('click', (e) => {
    if (!e.target.closest('.remove-btn')) toggleCard(card);
  });

  // Remove button
  card.querySelector('.remove-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    state.experience = state.experience.filter(x => x.id !== item.id);
    renderExperienceList();
    renderPreview();
    triggerSave();
  });

  // Field inputs
  card.querySelectorAll('[data-key]').forEach(input => {
    const key = input.dataset.key;
    const handler = debounce(() => {
      const val = input.type === 'checkbox' ? input.checked : input.value;
      const expItem = state.experience.find(x => x.id === item.id);
      if (expItem) {
        expItem[key] = val;
        if (key === 'current') {
          const endInput = card.querySelector('[data-key="end"]');
          if (endInput) endInput.disabled = val;
          if (val) { expItem.end = ''; if (endInput) endInput.value = ''; }
        }
        // Update card title
        const titleEl = card.querySelector('.item-title-text');
        if (titleEl) titleEl.textContent = expItem.role || expItem.company || `Experience`;
      }
      renderPreview();
      triggerSave();
    }, 120);
    input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', handler);
  });

  return card;
}

/* ── EDUCATION LIST ── */
function renderEducationList() {
  const container = $('#education-list');
  if (!container) return;
  container.innerHTML = '';
  state.education.forEach((item, idx) => {
    container.appendChild(buildEducationCard(item, idx));
  });
  bindAddButton('addEducation', () => {
    state.education.push(newEducation());
    renderEducationList();
    renderPreview();
    triggerSave();
    const cards = $$('.list-item-card', $('#education-list'));
    if (cards.length) openCard(cards[cards.length - 1]);
  });
}

function buildEducationCard(item, idx) {
  const card = document.createElement('div');
  card.className = 'list-item-card';
  card.dataset.id = item.id;

  const displayTitle = item.degree || item.school || `Education ${idx + 1}`;
  card.innerHTML = `
    <div class="item-header">
      <span class="item-title-text">${escHtml(displayTitle)}</span>
      <div class="item-actions">
        <button class="icon-btn danger remove-btn" title="Remove">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <svg class="chevron-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
    <div class="item-body">
      <div class="fields-grid">
        <div class="field-group full">
          <label>School / Institution</label>
          <input type="text" data-key="school" value="${escHtml(item.school)}" placeholder="e.g. MIT" />
        </div>
        <div class="field-group">
          <label>Degree</label>
          <input type="text" data-key="degree" value="${escHtml(item.degree)}" placeholder="B.S. / M.S. / Ph.D" />
        </div>
        <div class="field-group">
          <label>Field of Study</label>
          <input type="text" data-key="field" value="${escHtml(item.field)}" placeholder="Computer Science" />
        </div>
        <div class="field-group">
          <label>Start Year</label>
          <input type="text" data-key="start" value="${escHtml(item.start)}" placeholder="2019" />
        </div>
        <div class="field-group">
          <label>End Year</label>
          <input type="text" data-key="end" value="${escHtml(item.end)}" placeholder="2023" />
        </div>
        <div class="field-group">
          <label>GPA (optional)</label>
          <input type="text" data-key="gpa" value="${escHtml(item.gpa)}" placeholder="3.9/4.0" />
        </div>
      </div>
    </div>
  `;

  card.querySelector('.item-header').addEventListener('click', (e) => {
    if (!e.target.closest('.remove-btn')) toggleCard(card);
  });

  card.querySelector('.remove-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    state.education = state.education.filter(x => x.id !== item.id);
    renderEducationList();
    renderPreview();
    triggerSave();
  });

  card.querySelectorAll('[data-key]').forEach(input => {
    input.addEventListener('input', debounce(() => {
      const eduItem = state.education.find(x => x.id === item.id);
      if (eduItem) {
        eduItem[input.dataset.key] = input.value;
        const titleEl = card.querySelector('.item-title-text');
        if (titleEl) titleEl.textContent = eduItem.degree || eduItem.school || 'Education';
      }
      renderPreview();
      triggerSave();
    }, 120));
  });

  return card;
}

/* ── SKILLS LIST ── */
function renderSkillsList() {
  const container = $('#skills-list');
  if (!container) return;
  container.innerHTML = '';
  state.skills.forEach(item => {
    container.appendChild(buildSkillCard(item));
  });
  bindAddButton('addSkill', () => {
    state.skills.push(newSkill());
    renderSkillsList();
    renderPreview();
    triggerSave();
  });
}

function buildSkillCard(item) {
  const card = document.createElement('div');
  card.className = 'skill-item-card';
  card.dataset.id = item.id;
  card.innerHTML = `
    <input type="text" data-key="name" value="${escHtml(item.name)}" placeholder="Skill name (e.g. React)" />
    <select class="skill-level-select" data-key="level">
      <option value="beginner"     ${item.level === 'beginner'     ? 'selected' : ''}>Beginner</option>
      <option value="intermediate" ${item.level === 'intermediate' ? 'selected' : ''}>Intermediate</option>
      <option value="proficient"   ${item.level === 'proficient'   ? 'selected' : ''}>Proficient</option>
      <option value="advanced"     ${item.level === 'advanced'     ? 'selected' : ''}>Advanced</option>
      <option value="expert"       ${item.level === 'expert'       ? 'selected' : ''}>Expert</option>
    </select>
    <button class="icon-btn danger remove-btn" title="Remove">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;

  card.querySelector('.remove-btn').addEventListener('click', () => {
    state.skills = state.skills.filter(x => x.id !== item.id);
    renderSkillsList();
    renderPreview();
    triggerSave();
  });

  card.querySelectorAll('[data-key]').forEach(input => {
    input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', debounce(() => {
      const skillItem = state.skills.find(x => x.id === item.id);
      if (skillItem) skillItem[input.dataset.key] = input.value;
      renderPreview();
      triggerSave();
    }, 120));
  });

  return card;
}

/* ── PROJECTS LIST ── */
function renderProjectsList() {
  const container = $('#projects-list');
  if (!container) return;
  container.innerHTML = '';
  state.projects.forEach((item, idx) => {
    container.appendChild(buildProjectCard(item, idx));
  });
  bindAddButton('addProject', () => {
    state.projects.push(newProject());
    renderProjectsList();
    renderPreview();
    triggerSave();
    const cards = $$('.list-item-card', $('#projects-list'));
    if (cards.length) openCard(cards[cards.length - 1]);
  });
}

function buildProjectCard(item, idx) {
  const card = document.createElement('div');
  card.className = 'list-item-card';
  card.dataset.id = item.id;

  const displayTitle = item.name || `Project ${idx + 1}`;
  card.innerHTML = `
    <div class="item-header">
      <span class="item-title-text">${escHtml(displayTitle)}</span>
      <div class="item-actions">
        <button class="icon-btn danger remove-btn" title="Remove">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <svg class="chevron-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
    <div class="item-body">
      <div class="fields-grid">
        <div class="field-group full">
          <label>Project Name</label>
          <input type="text" data-key="name" value="${escHtml(item.name)}" placeholder="e.g. OpenMetrics Dashboard" />
        </div>
        <div class="field-group full">
          <label>URL / GitHub</label>
          <input type="url" data-key="url" value="${escHtml(item.url)}" placeholder="https://github.com/user/project" />
        </div>
        <div class="field-group full">
          <label>Tech Stack (comma separated)</label>
          <input type="text" data-key="tech" value="${escHtml(item.tech)}" placeholder="React, Node.js, PostgreSQL" />
        </div>
        <div class="field-group full">
          <label>Description</label>
          <textarea data-key="description" rows="3" placeholder="What it does, your impact, key features...">${escHtml(item.description)}</textarea>
        </div>
      </div>
    </div>
  `;

  card.querySelector('.item-header').addEventListener('click', (e) => {
    if (!e.target.closest('.remove-btn')) toggleCard(card);
  });

  card.querySelector('.remove-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    state.projects = state.projects.filter(x => x.id !== item.id);
    renderProjectsList();
    renderPreview();
    triggerSave();
  });

  card.querySelectorAll('[data-key]').forEach(input => {
    input.addEventListener('input', debounce(() => {
      const projItem = state.projects.find(x => x.id === item.id);
      if (projItem) {
        projItem[input.dataset.key] = input.value;
        const titleEl = card.querySelector('.item-title-text');
        if (titleEl) titleEl.textContent = projItem.name || 'Project';
      }
      renderPreview();
      triggerSave();
    }, 120));
  });

  return card;
}

/* ── CARD HELPERS ── */
function toggleCard(card) {
  const body = card.querySelector('.item-body');
  const chevron = card.querySelector('.chevron-icon');
  const isOpen = body.classList.toggle('open');
  if (chevron) chevron.classList.toggle('open', isOpen);
}
function openCard(card) {
  const body = card.querySelector('.item-body');
  const chevron = card.querySelector('.chevron-icon');
  body.classList.add('open');
  if (chevron) chevron.classList.add('open');
}

/* ── BIND ADD BUTTONS ── */
const boundAddButtons = new Set();
function bindAddButton(id, handler) {
  const btn = document.getElementById(id);
  if (!btn || boundAddButtons.has(id)) return;
  boundAddButtons.add(id);
  btn.addEventListener('click', handler);
}

/* ══════════════════════════════════════════════════
   SECTION ORDER (DRAG & DROP + ARROWS)
══════════════════════════════════════════════════ */
function renderSectionOrder() {
  const list = $('#section-order-list');
  if (!list) return;
  list.innerHTML = '';

  state.sectionOrder.forEach((section, idx) => {
    const item = document.createElement('div');
    item.className = 'order-item';
    item.draggable = true;
    item.dataset.index = idx;
    item.innerHTML = `
      <span class="order-handle">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/>
        </svg>
      </span>
      <span class="order-item-label">${SECTION_LABELS[section] || section}</span>
      <div class="order-move-btns">
        <button class="icon-btn move-up" title="Move Up" ${idx === 0 ? 'disabled' : ''}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <button class="icon-btn move-down" title="Move Down" ${idx === state.sectionOrder.length - 1 ? 'disabled' : ''}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>
    `;

    // Arrow buttons
    item.querySelector('.move-up').addEventListener('click', () => {
      if (idx > 0) {
        [state.sectionOrder[idx - 1], state.sectionOrder[idx]] = [state.sectionOrder[idx], state.sectionOrder[idx - 1]];
        renderSectionOrder();
        renderPreview();
        triggerSave();
      }
    });
    item.querySelector('.move-down').addEventListener('click', () => {
      if (idx < state.sectionOrder.length - 1) {
        [state.sectionOrder[idx], state.sectionOrder[idx + 1]] = [state.sectionOrder[idx + 1], state.sectionOrder[idx]];
        renderSectionOrder();
        renderPreview();
        triggerSave();
      }
    });

    // Drag events
    item.addEventListener('dragstart', (e) => {
      dragSrcIndex = idx;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      $$('.order-item').forEach(i => i.classList.remove('drag-over'));
    });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      $$('.order-item').forEach(i => i.classList.remove('drag-over'));
      item.classList.add('drag-over');
    });
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const targetIdx = parseInt(item.dataset.index);
      if (dragSrcIndex !== null && dragSrcIndex !== targetIdx) {
        const moved = state.sectionOrder.splice(dragSrcIndex, 1)[0];
        state.sectionOrder.splice(targetIdx, 0, moved);
        renderSectionOrder();
        renderPreview();
        triggerSave();
      }
      dragSrcIndex = null;
    });

    list.appendChild(item);
  });
}

/* ══════════════════════════════════════════════════
   LIVE PREVIEW RENDER ENGINE
══════════════════════════════════════════════════ */
function renderPreview() {
  const el = document.getElementById('resumePreview');
  if (!el) return;

  const preset = PRESETS[state.preset] || PRESETS.software;
  const color = state.theme.color;
  const font = state.theme.font;
  const spacing = state.theme.spacing;
  const p = state.personal;

  // CSS variables on the preview element
  el.style.setProperty('--resume-accent', color);
  el.style.setProperty('--resume-font', font);
  el.style.setProperty('--resume-spacing', spacing);
  el.style.fontFamily = font;
  el.style.lineHeight = spacing;
  el.style.fontSize = (state.theme.fontSize || 14) + 'px';

  // Remove all layout classes, add current
  el.className = `resume-a4 layout-${preset.layout}`;

  // Choose renderer
  const renderers = {
    software:   renderSoftwareLayout,
    management: renderManagementLayout,
    design:     renderDesignLayout,
    entry:      renderEntryLayout,
  };
  const renderer = renderers[preset.layout] || renderSoftwareLayout;
  el.innerHTML = renderer(p, state, color, font, spacing);
}

/* ── Contact item helper ── */
function contactItem(svg, text, href) {
  if (!text) return '';
  const content = href
    ? `<a href="${escHtml(href)}" style="color:inherit;text-decoration:none;">${escHtml(text)}</a>`
    : escHtml(text);
  return `<span class="rh-contact-item">${svg} ${content}</span>`;
}

const ICONS = {
  email:    `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  phone:    `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  location: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  web:      `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  linkedin: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
  github:   `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,
  link:     `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
};

/* ── Section HTML generators ── */
function renderSummarySection(p, color) {
  if (!p.summary) return '';
  return `
    <div class="resume-section">
      <div class="rs-title" style="color:${color};border-color:${color}">Professional Summary</div>
      <p class="rs-summary">${escHtml(p.summary)}</p>
    </div>`;
}

function renderExperienceSection(experience, color) {
  if (!experience.length) return '';
  const entries = experience.map(e => {
    const dates = e.current ? `${escHtml(e.start)} – Present` : [e.start, e.end].filter(Boolean).map(escHtml).join(' – ');
    const metrics = e.metrics ? e.metrics.split(',').filter(m => m.trim()).map(m =>
      `<span class="rs-metric-tag" style="background:${color}18;color:${color}">${escHtml(m.trim())}</span>`
    ).join('') : '';
    return `
      <div class="rs-entry">
        <div class="rs-entry-header">
          <div>
            <div class="rs-entry-role">${escHtml(e.role)}</div>
            <div class="rs-entry-company" style="color:${color}">${escHtml(e.company)}</div>
          </div>
          <span class="rs-entry-date">${dates}</span>
        </div>
        ${e.description ? `<div class="rs-entry-desc">${escHtml(e.description)}</div>` : ''}
        ${metrics ? `<div class="rs-entry-metrics">${metrics}</div>` : ''}
      </div>`;
  }).join('');
  return `
    <div class="resume-section">
      <div class="rs-title" style="color:${color};border-color:${color}">Experience</div>
      ${entries}
    </div>`;
}

function renderEducationSection(education, color) {
  if (!education.length) return '';
  const entries = education.map(e => {
    const dates = [e.start, e.end].filter(Boolean).map(escHtml).join(' – ');
    const degreeField = [e.degree, e.field].filter(Boolean).map(escHtml).join(' in ');
    return `
      <div class="rs-entry">
        <div class="rs-entry-header">
          <div>
            <div class="rs-entry-role">${degreeField || escHtml(e.school)}</div>
            <div class="rs-entry-company" style="color:${color}">${escHtml(e.school)}</div>
            ${e.gpa ? `<div class="rs-edu-gpa">GPA: ${escHtml(e.gpa)}</div>` : ''}
          </div>
          <span class="rs-entry-date">${dates}</span>
        </div>
      </div>`;
  }).join('');
  return `
    <div class="resume-section">
      <div class="rs-title" style="color:${color};border-color:${color}">Education</div>
      ${entries}
    </div>`;
}

function renderSkillsSection(skills, color, style = 'tags') {
  if (!skills.length) return '';
  if (style === 'bars') {
    // Used in design sidebar
    return skills.map(s => {
      const pct = SKILL_LEVELS[s.level] || 70;
      return `
        <div class="ds-skill-bar-wrap">
          <div class="ds-skill-name">${escHtml(s.name)}</div>
          <div class="ds-skill-bar"><div class="ds-skill-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join('');
  }
  const tags = skills.map(s => {
    const isExpert = s.level === 'expert' || s.level === 'advanced';
    return `<span class="resume-skill-tag ${isExpert ? 'level-expert' : ''}"
      style="${isExpert ? `color:${color};border-color:${color}30;background:${color}12` : ''}"
      >${escHtml(s.name)}</span>`;
  }).join('');
  return `
    <div class="resume-section">
      <div class="rs-title" style="color:${color};border-color:${color}">Skills</div>
      <div class="resume-skills-grid">${tags}</div>
    </div>`;
}

function renderProjectsSection(projects, color, showTech = true) {
  if (!projects.length) return '';
  const entries = projects.map(proj => {
    const techTags = showTech && proj.tech
      ? proj.tech.split(',').filter(t => t.trim()).map(t =>
          `<span class="resume-tech-tag">${escHtml(t.trim())}</span>`).join('')
      : '';
    return `
      <div class="rs-entry">
        <div class="rs-entry-header">
          <div>
            <div class="rs-project-name">${escHtml(proj.name)}</div>
            ${proj.url ? `<div class="rs-project-url" style="color:${color}">${escHtml(proj.url)}</div>` : ''}
          </div>
        </div>
        ${techTags ? `<div class="resume-tech-tags">${techTags}</div>` : ''}
        ${proj.description ? `<div class="rs-entry-desc">${escHtml(proj.description)}</div>` : ''}
      </div>`;
  }).join('');
  return `
    <div class="resume-section">
      <div class="rs-title" style="color:${color};border-color:${color}">Projects</div>
      ${entries}
    </div>`;
}

function renderSectionsInOrder(sectionOrder, state, color, exclude = []) {
  return sectionOrder
    .filter(s => !exclude.includes(s))
    .map(section => {
      switch (section) {
        case 'summary':    return renderSummarySection(state.personal, color);
        case 'experience': return renderExperienceSection(state.experience, color);
        case 'education':  return renderEducationSection(state.education, color);
        case 'skills':     return renderSkillsSection(state.skills, color, 'tags');
        case 'projects':   return renderProjectsSection(state.projects, color, true);
        default:           return '';
      }
    }).join('');
}

/* ══════════════════════════════════════════════════
   PRESET LAYOUT RENDERERS
══════════════════════════════════════════════════ */

/* ── SOFTWARE DEVELOPER ── */
function renderSoftwareLayout(p, st, color) {
  const hasName = p.name || p.title;
  if (!hasName && !st.experience.length && !st.skills.length) {
    return emptyState();
  }

  // Split sections: main col = summary, experience, projects; side = skills, education
  const mainSections = ['summary', 'experience', 'projects'];
  const sideSections = ['education', 'skills'];

  const mainHTML = st.sectionOrder
    .filter(s => mainSections.includes(s))
    .map(s => {
      if (s === 'summary')    return renderSummarySection(p, color);
      if (s === 'experience') return renderExperienceSection(st.experience, color);
      if (s === 'projects')   return renderProjectsSection(st.projects, color, true);
      return '';
    }).join('');

  const sideHTML = st.sectionOrder
    .filter(s => sideSections.includes(s))
    .map(s => {
      if (s === 'skills')     return renderSkillsSection(st.skills, color, 'tags');
      if (s === 'education')  return renderEducationSection(st.education, color);
      return '';
    }).join('');

  // GitHub/website links for header
  const links = [
    p.email    ? contactItem(ICONS.email,    p.email,    `mailto:${p.email}`) : '',
    p.phone    ? contactItem(ICONS.phone,    p.phone,    `tel:${p.phone}`) : '',
    p.location ? contactItem(ICONS.location, p.location, null) : '',
    p.github   ? contactItem(ICONS.github,   p.github,   `https://${p.github.replace(/^https?:\/\//,'')}`) : '',
    p.linkedin ? contactItem(ICONS.linkedin, p.linkedin, `https://${p.linkedin.replace(/^https?:\/\//,'')}`) : '',
    p.website  ? contactItem(ICONS.web,      p.website,  p.website) : '',
  ].filter(Boolean).join('');

  return `
    <div class="resume-header-software" style="background:${color}">
      <div class="rh-name">${escHtml(p.name) || '&nbsp;'}</div>
      <div class="rh-title">${escHtml(p.title)}</div>
      <div class="rh-contact-row">${links}</div>
    </div>
    <div class="resume-body-software">
      <div class="resume-main-col">${mainHTML}</div>
      <div class="resume-side-col">${sideHTML}</div>
    </div>`;
}

/* ── MANAGEMENT ── */
function renderManagementLayout(p, st, color) {
  const hasName = p.name || p.title;
  if (!hasName && !st.experience.length) return emptyState();

  const contactHTML = [
    p.email    ? `<div>${ICONS.email} ${escHtml(p.email)}</div>` : '',
    p.phone    ? `<div>${ICONS.phone} ${escHtml(p.phone)}</div>` : '',
    p.location ? `<div>${ICONS.location} ${escHtml(p.location)}</div>` : '',
    p.linkedin ? `<div>${ICONS.linkedin} ${escHtml(p.linkedin)}</div>` : '',
    p.website  ? `<div>${ICONS.web} ${escHtml(p.website)}</div>` : '',
  ].filter(Boolean).join('');

  const bodyHTML = renderSectionsInOrder(st.sectionOrder, st, color, []);

  return `
    <div class="resume-header-management">
      <div class="rhm-left">
        <div class="rhm-name">${escHtml(p.name) || '&nbsp;'}</div>
        <div class="rhm-title" style="color:${color}">${escHtml(p.title)}</div>
      </div>
      <div class="rhm-right" style="font-size:11px;color:#5C6278;line-height:1.9">${contactHTML}</div>
    </div>
    <div class="resume-body-management">${bodyHTML}</div>`;
}

/* ── DESIGN ── */
function renderDesignLayout(p, st, color) {
  const initials = (p.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const sideContactHTML = [
    p.email    ? `<div class="ds-contact-item">${ICONS.email} ${escHtml(p.email)}</div>` : '',
    p.phone    ? `<div class="ds-contact-item">${ICONS.phone} ${escHtml(p.phone)}</div>` : '',
    p.location ? `<div class="ds-contact-item">${ICONS.location} ${escHtml(p.location)}</div>` : '',
    p.website  ? `<div class="ds-contact-item">${ICONS.web} ${escHtml(p.website)}</div>` : '',
    p.linkedin ? `<div class="ds-contact-item">${ICONS.linkedin} ${escHtml(p.linkedin)}</div>` : '',
  ].filter(Boolean).join('');

  const skillBars = renderSkillsSection(st.skills, color, 'bars');

  const mainSections = ['summary', 'experience', 'projects', 'education'].filter(s =>
    st.sectionOrder.includes(s)
  );
  const mainHTML = mainSections.map(s => {
    if (s === 'summary')    return renderSummarySection(p, color);
    if (s === 'experience') return renderExperienceSection(st.experience, color);
    if (s === 'projects')   return renderProjectsSection(st.projects, color, false);
    if (s === 'education')  return renderEducationSection(st.education, color);
    return '';
  }).join('');

  return `
    <div class="design-sidebar" style="background:${color}">
      <div class="ds-avatar">${initials}</div>
      <div class="ds-name">${escHtml(p.name) || '&nbsp;'}</div>
      <div class="ds-title">${escHtml(p.title)}</div>
      ${sideContactHTML ? `<div class="ds-section-title">Contact</div>${sideContactHTML}` : ''}
      ${skillBars ? `<div class="ds-section-title">Skills</div>${skillBars}` : ''}
    </div>
    <div class="design-main">${mainHTML}</div>`;
}

/* ── ENTRY LEVEL ── */
function renderEntryLayout(p, st, color) {
  const hasName = p.name || p.title;
  if (!hasName && !st.education.length && !st.skills.length) return emptyState();

  const contactRow = [
    p.email    ? `<span class="rhe-contact-item">${ICONS.email} ${escHtml(p.email)}</span>` : '',
    p.phone    ? `<span class="rhe-contact-item">${ICONS.phone} ${escHtml(p.phone)}</span>` : '',
    p.location ? `<span class="rhe-contact-item">${ICONS.location} ${escHtml(p.location)}</span>` : '',
    p.linkedin ? `<span class="rhe-contact-item">${ICONS.linkedin} ${escHtml(p.linkedin)}</span>` : '',
    p.github   ? `<span class="rhe-contact-item">${ICONS.github} ${escHtml(p.github)}</span>` : '',
  ].filter(Boolean).join('');

  const bodyHTML = renderSectionsInOrder(st.sectionOrder, st, color, []);

  return `
    <div class="resume-header-entry">
      <div class="rhe-name">${escHtml(p.name) || '&nbsp;'}</div>
      <div class="rhe-title" style="color:${color}">${escHtml(p.title)}</div>
      <div class="rhe-contacts">${contactRow}</div>
    </div>
    <div class="resume-body-entry">${bodyHTML}</div>`;
}

/* ── Empty State ── */
function emptyState() {
  return `
    <div class="resume-empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      <h3>Start filling in your details</h3>
      <p>Your resume will appear here in real-time as you type.</p>
    </div>`;
}

/* ══════════════════════════════════════════════════
   EXPORT FUNCTIONS
══════════════════════════════════════════════════ */
function bindExport() {
  const pdfBtn = document.getElementById('exportPDF');
  const docxBtn = document.getElementById('exportDOCX');

  if (pdfBtn) {
    pdfBtn.addEventListener('click', exportPDF);
  }
  if (docxBtn) {
    docxBtn.addEventListener('click', exportDOCX);
  }
}

function exportPDF() {
  const el = document.getElementById('resumePreview');
  if (!el) return;

  const pdfBtn = document.getElementById('exportPDF');
  if (pdfBtn) {
    pdfBtn.classList.add('btn-loading');
    pdfBtn.disabled = true;
  }

  const fileName = `${(state.personal.name || 'resume').replace(/\s+/g, '_')}_resume.pdf`;

  // Clone into a hidden container at natural A4 size (no transform)
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: fixed; top: -9999px; left: -9999px;
    width: 794px; height: auto; overflow: visible;
    background: #fff; z-index: -1;
  `;
  const clone = el.cloneNode(true);
  clone.style.cssText = `
    width: 794px; min-height: 1123px;
    transform: none; font-family: ${state.theme.font};
    background: #fff; color: #1A1D27;
  `;
  // Copy computed CSS variables into clone
  clone.style.setProperty('--resume-accent', state.theme.color);
  clone.style.setProperty('--accent-bg', hexToRgba(state.theme.color, 0.08));
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  const opt = {
    margin:      [0, 0, 0, 0],
    filename:    fileName,
    image:       { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      width: 794,
      windowWidth: 794,
    },
    jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:   { mode: ['css', 'avoid-all'] },
  };

  html2pdf().set(opt).from(clone).save().then(() => {
    document.body.removeChild(wrapper);
    if (pdfBtn) { pdfBtn.classList.remove('btn-loading'); pdfBtn.disabled = false; }
    showToast('PDF downloaded successfully!', 'success');
  }).catch((err) => {
    console.error('PDF error:', err);
    document.body.removeChild(wrapper);
    if (pdfBtn) { pdfBtn.classList.remove('btn-loading'); pdfBtn.disabled = false; }
    showToast('PDF export failed. Please try again.', 'error');
  });
}

function exportDOCX() {
  const el = document.getElementById('resumePreview');
  if (!el) return;

  // html-docx-js exposes itself as window.htmlDocx
  const htmlDocxLib = window.htmlDocx || (typeof htmlDocx !== 'undefined' ? htmlDocx : null);
  if (!htmlDocxLib) {
    showToast('DOCX library not loaded. Check your connection.', 'error');
    return;
  }

  const docxBtn = document.getElementById('exportDOCX');
  if (docxBtn) { docxBtn.classList.add('btn-loading'); docxBtn.disabled = true; }

  const color = state.theme.color;
  const font = state.theme.font.replace(/'/g, '').split(',')[0].trim();
  const fileName = `${(state.personal.name || 'resume').replace(/\s+/g, '_')}_resume.docx`;

  // Build clean HTML for DOCX
  const docHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: ${font}; margin: 0; padding: 0; color: #1A1D27; }
        .resume-header { background: ${color}; color: white; padding: 30px 36px 24px; }
        .resume-header h1 { font-size: 28px; margin: 0 0 4px; font-weight: 700; }
        .resume-header .title { font-size: 12px; opacity: 0.85; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 2px; }
        .resume-header .contacts { font-size: 10px; opacity: 0.9; }
        .resume-body { padding: 24px 36px; }
        .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;
          color: ${color}; border-bottom: 1.5px solid ${color}; padding-bottom: 4px; margin: 18px 0 10px; }
        .entry { margin-bottom: 12px; }
        .entry-role { font-size: 12px; font-weight: 700; }
        .entry-company { font-size: 11px; color: ${color}; font-weight: 500; }
        .entry-date { font-size: 10px; color: #9399AD; }
        .entry-desc { font-size: 10.5px; color: #4A4F65; line-height: 1.6; margin-top: 4px; }
        .summary { font-size: 11px; line-height: 1.7; color: #4A4F65; }
        .skills-list { font-size: 11px; line-height: 1.8; color: #1A1D27; }
        .project-name { font-size: 12px; font-weight: 700; }
        .project-url { font-size: 10px; color: ${color}; }
        .edu-degree { font-size: 12px; font-weight: 700; }
        .edu-school { font-size: 11px; color: ${color}; font-weight: 500; }
      </style>
    </head>
    <body>
      ${buildDocxBody()}
    </body>
    </html>`;

  try {
    const blob = htmlDocxLib.asBlob(docHtml);
    saveAs(blob, fileName);
    showToast('DOCX downloaded successfully!', 'success');
  } catch (e) {
    showToast('DOCX export failed. Please try again.', 'error');
    console.error('DOCX export error:', e);
  } finally {
    if (docxBtn) { docxBtn.classList.remove('btn-loading'); docxBtn.disabled = false; }
  }
}

function buildDocxBody() {
  const p = state.personal;
  const color = state.theme.color;

  const contacts = [p.email, p.phone, p.location, p.linkedin, p.github, p.website]
    .filter(Boolean).join('  ·  ');

  let html = `
    <div class="resume-header">
      <h1>${escHtml(p.name)}</h1>
      <div class="title">${escHtml(p.title)}</div>
      <div class="contacts">${escHtml(contacts)}</div>
    </div>
    <div class="resume-body">`;

  // Summary
  if (p.summary) {
    html += `<div class="section-title">Professional Summary</div>
      <p class="summary">${escHtml(p.summary)}</p>`;
  }

  // Sections in order
  state.sectionOrder.forEach(section => {
    if (section === 'experience' && state.experience.length) {
      html += `<div class="section-title">Experience</div>`;
      state.experience.forEach(e => {
        const dates = e.current ? `${e.start} – Present` : [e.start, e.end].filter(Boolean).join(' – ');
        html += `<div class="entry">
          <div class="entry-role">${escHtml(e.role)}</div>
          <div class="entry-company">${escHtml(e.company)}</div>
          <div class="entry-date">${escHtml(dates)}</div>
          ${e.description ? `<div class="entry-desc">${escHtml(e.description)}</div>` : ''}
          ${e.metrics ? `<div class="entry-date" style="color:${color};font-weight:600">Key metrics: ${escHtml(e.metrics)}</div>` : ''}
        </div>`;
      });
    }
    if (section === 'education' && state.education.length) {
      html += `<div class="section-title">Education</div>`;
      state.education.forEach(e => {
        const dates = [e.start, e.end].filter(Boolean).join(' – ');
        const deg = [e.degree, e.field].filter(Boolean).join(' in ');
        html += `<div class="entry">
          <div class="edu-degree">${escHtml(deg)}</div>
          <div class="edu-school">${escHtml(e.school)}</div>
          <div class="entry-date">${escHtml(dates)}${e.gpa ? `  ·  GPA: ${escHtml(e.gpa)}` : ''}</div>
        </div>`;
      });
    }
    if (section === 'skills' && state.skills.length) {
      html += `<div class="section-title">Skills</div>
        <div class="skills-list">${state.skills.map(s => `${escHtml(s.name)} (${s.level})`).join('  ·  ')}</div>`;
    }
    if (section === 'projects' && state.projects.length) {
      html += `<div class="section-title">Projects</div>`;
      state.projects.forEach(proj => {
        html += `<div class="entry">
          <div class="project-name">${escHtml(proj.name)}</div>
          ${proj.url ? `<div class="project-url">${escHtml(proj.url)}</div>` : ''}
          ${proj.tech ? `<div class="entry-date">Tech: ${escHtml(proj.tech)}</div>` : ''}
          ${proj.description ? `<div class="entry-desc">${escHtml(proj.description)}</div>` : ''}
        </div>`;
      });
    }
  });

  html += '</div>';
  return html;
}

/* ══════════════════════════════════════════════════
   TOAST NOTIFICATIONS
══════════════════════════════════════════════════ */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon"></span><span>${escHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}
