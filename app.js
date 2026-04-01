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
    name: 'Software Developer', color: '#4F8EF7', accentBg: 'rgba(79,142,247,0.08)',
    layout: 'software', sectionOrder: ['summary', 'skills', 'experience', 'projects', 'education'],
    font: "'Jost', sans-serif",
  },
  management: {
    name: 'Management', color: '#7C3AED', accentBg: 'rgba(124,58,237,0.08)',
    layout: 'management', sectionOrder: ['summary', 'experience', 'skills', 'education'],
    font: "'IBM Plex Serif', serif",
  },
  design: {
    name: 'Design', color: '#EC4899', accentBg: 'rgba(236,72,153,0.08)',
    layout: 'design', sectionOrder: ['summary', 'experience', 'projects', 'skills', 'education'],
    font: "'Raleway', sans-serif",
  },
  entry: {
    name: 'Entry Level', color: '#059669', accentBg: 'rgba(5,150,105,0.08)',
    layout: 'entry', sectionOrder: ['summary', 'education', 'skills', 'experience', 'projects'],
    font: "'DM Sans', sans-serif",
  },
};

const SECTION_LABELS = { summary: 'Summary', experience: 'Experience', education: 'Education', skills: 'Skills', projects: 'Projects' };
const SKILL_LEVELS = { beginner: 20, intermediate: 50, proficient: 70, advanced: 85, expert: 100 };

/* ══════════════════════════════════════════════════
   MULTI-TONE PALETTE PRESETS
══════════════════════════════════════════════════ */
const PALETTES = [
  { name: 'Sky', primary: '#4F8EF7', secondary: '#1E3A8A' },
  { name: 'Forest', primary: '#059669', secondary: '#1A4731' },
  { name: 'Sunset', primary: '#F97316', secondary: '#7C2D12' },
  { name: 'Royal', primary: '#7C3AED', secondary: '#1E1B4B' },
  { name: 'Rose', primary: '#EC4899', secondary: '#500724' },
  { name: 'Slate', primary: '#475569', secondary: '#0F172A' },
  { name: 'Crimson', primary: '#DC2626', secondary: '#450A0A' },
  { name: 'Gold', primary: '#D97706', secondary: '#1C1003' },
];

/* ══════════════════════════════════════════════════
   DEFAULT STATE
══════════════════════════════════════════════════ */
function defaultState() {
  return {
    preset: 'software',
    theme: { color: '#4F8EF7', secondaryColor: '#111827', font: "'Jost', sans-serif", spacing: 1, headingScale: 1, bodyScale: 1 },
    sectionOrder: [...PRESETS.software.sectionOrder],
    personal: { name: '', title: '', email: '', phone: '', location: '', website: '', linkedin: '', github: '', summary: '' },
    experience: [], education: [], skills: [], projects: [],
  };
}

function newExperience() { return { id: uid(), company: '', role: '', start: '', end: '', current: false, description: '', metrics: '' }; }
function newEducation() { return { id: uid(), school: '', degree: '', field: '', start: '', end: '', gpa: '' }; }
function newSkill() { return { id: uid(), name: '', level: 'proficient', category: '' }; }
function newProject() { return { id: uid(), name: '', url: '', tech: '', description: '' }; }

/* ══════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════ */
let _uidCounter = Date.now();
function uid() { return 'id_' + (++_uidCounter).toString(36); }
function escHtml(s) { return !s ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function debounce(fn, ms = 180) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; }
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

const Store = {
  get(cb) {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) { chrome.storage.local.get('resumeforge_state', (r) => cb(r.resumeforge_state || null)); }
    else { try { cb(JSON.parse(localStorage.getItem('resumeforge_state'))); } catch { cb(null); } }
  },
  set(data, cb) {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) { chrome.storage.local.set({ resumeforge_state: data }, cb || (() => { })); }
    else { localStorage.setItem('resumeforge_state', JSON.stringify(data)); cb && cb(); }
  },
};

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
    bindScaleSliders();
    bindPalettes();
    bindExport();
  });
});

function triggerSave() {
  const ind = $('#autosaveIndicator');
  if (ind) { ind.classList.add('saving'); ind.querySelector('.save-text').textContent = 'Saving'; }
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    Store.set(state, () => {
      if (ind) { ind.classList.remove('saving'); ind.querySelector('.save-text').textContent = 'Saved'; }
    });
  }, 600);
}

/* ══════════════════════════════════════════════════
   THEME & TOP BAR
══════════════════════════════════════════════════ */
function applyTheme() {
  const r = document.documentElement.style;
  r.setProperty('--accent', state.theme.color);
  r.setProperty('--accent-secondary', state.theme.secondaryColor || '#111827');

  const preview = document.getElementById('resumePreview');
  if (preview) {
    preview.style.fontFamily = state.theme.font;
    preview.style.setProperty('--rs-heading-scale', state.theme.headingScale || 1);
    preview.style.setProperty('--rs-body-scale', state.theme.bodyScale || 1);
    preview.style.lineHeight = state.theme.spacing || 1;
  }
}

function bindTopbar() {
  $$('.preset-btn').forEach(btn => btn.addEventListener('click', () => switchPreset(btn.dataset.preset)));

  $('#primaryColor')?.addEventListener('input', debounce((e) => {
    state.theme.color = e.target.value; applyTheme(); updateColorPreview(); renderPreview(); triggerSave();
  }, 60));

  $('#secondaryColor')?.addEventListener('input', debounce((e) => {
    state.theme.secondaryColor = e.target.value;
    if ($('#secondaryColorPreview')) $('#secondaryColorPreview').style.background = e.target.value;
    applyTheme(); renderPreview(); triggerSave();
  }, 60));

  $('#fontFamily')?.addEventListener('change', (e) => {
    state.theme.font = e.target.value; applyTheme(); renderPreview(); triggerSave();
  });

  $('#spacingSlider')?.addEventListener('input', debounce((e) => {
    state.theme.spacing = parseFloat(e.target.value); updateSpacingLabel(); applyTheme(); renderPreview(); triggerSave();
  }, 60));
}

function updateColorPreview() {
  if ($('#colorPreview')) $('#colorPreview').style.background = state.theme.color;
  if ($('#primaryColor')) $('#primaryColor').value = state.theme.color;
}

function updateSpacingLabel() {
  if ($('#spacingValue')) $('#spacingValue').textContent = parseFloat(state.theme.spacing).toFixed(1) + '×';
}

/* ══════════════════════════════════════════════════
   SCALE SLIDERS (Real-time specific bindings)
══════════════════════════════════════════════════ */
function bindScaleSliders() {
  const headingSlider = $('#headingScaleSlider');
  const bodySlider = $('#bodyScaleSlider');
  const headingLabel = $('#headingScaleValue');
  const bodyLabel = $('#bodyScaleValue');

  if (headingSlider) {
    headingSlider.value = state.theme.headingScale || 1;
    if (headingLabel) headingLabel.textContent = parseFloat(headingSlider.value).toFixed(1) + '×';

    headingSlider.addEventListener('input', () => {
      const val = parseFloat(headingSlider.value);
      state.theme.headingScale = val;
      if (headingLabel) headingLabel.textContent = val.toFixed(1) + '×';
      $('#resumePreview')?.style.setProperty('--rs-heading-scale', val);
    });
    headingSlider.addEventListener('change', triggerSave);
  }

  if (bodySlider) {
    bodySlider.value = state.theme.bodyScale || 1;
    if (bodyLabel) bodyLabel.textContent = parseFloat(bodySlider.value).toFixed(1) + '×';

    bodySlider.addEventListener('input', () => {
      const val = parseFloat(bodySlider.value);
      state.theme.bodyScale = val;
      if (bodyLabel) bodyLabel.textContent = val.toFixed(1) + '×';
      $('#resumePreview')?.style.setProperty('--rs-body-scale', val);
    });
    bodySlider.addEventListener('change', triggerSave);
  }
}

/* ══════════════════════════════════════════════════
   MULTI-TONE PALETTES
══════════════════════════════════════════════════ */
function bindPalettes() {
  const row = $('#paletteRow');
  if (!row) return;

  PALETTES.forEach((pal) => {
    const swatch = document.createElement('button');
    swatch.className = 'palette-swatch';
    swatch.title = pal.name;
    swatch.innerHTML = `<span class="swatch-half" style="background:${pal.primary}"></span><span class="swatch-half" style="background:${pal.secondary}"></span>`;

    swatch.addEventListener('click', () => {
      state.theme.color = pal.primary;
      state.theme.secondaryColor = pal.secondary;

      if ($('#primaryColor')) $('#primaryColor').value = pal.primary;
      if ($('#secondaryColor')) $('#secondaryColor').value = pal.secondary;
      if ($('#secondaryColorPreview')) $('#secondaryColorPreview').style.background = pal.secondary;

      applyTheme(); updateColorPreview(); renderPreview(); triggerSave();

      $$('.palette-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
    });
    row.appendChild(swatch);
  });
}

function switchPreset(presetKey) {
  if (!PRESETS[presetKey]) return;
  const p = PRESETS[presetKey];
  state.preset = presetKey;
  state.theme.color = p.color;
  state.theme.font = p.font;
  state.sectionOrder = [...p.sectionOrder];

  if ($('#primaryColor')) $('#primaryColor').value = p.color;
  if ($('#fontFamily')) $('#fontFamily').value = p.font;

  applyTheme(); updateColorPreview(); syncPresetButtons(); updatePresetLabel();
  renderSectionOrder(); renderPreview(); triggerSave();
}

function syncPresetButtons() { $$('.preset-btn').forEach(b => b.classList.toggle('active', b.dataset.preset === state.preset)); }
function updatePresetLabel() { if ($('#currentPresetLabel')) $('#currentPresetLabel').textContent = PRESETS[state.preset]?.name || ''; }

/* ══════════════════════════════════════════════════
   FORM TAB SWITCHING & RENDERING
══════════════════════════════════════════════════ */
function bindFormTabs() {
  $$('.form-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.form-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab.dataset.tab));
      $$('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${tab.dataset.tab}`));
    });
  });
}

function renderAllForms() {
  ['name', 'title', 'email', 'phone', 'location', 'website', 'linkedin', 'github', 'summary'].forEach(f => {
    const el = $(`[data-field="${f}"]`);
    if (!el) return;
    el.value = state.personal[f] || '';
    el.addEventListener('input', debounce(() => { state.personal[f] = el.value; renderPreview(); triggerSave(); }, 120));
  });

  renderDynamicList('experience', newExperience, buildExperienceCard);
  renderDynamicList('education', newEducation, buildEducationCard);
  renderDynamicList('skills', newSkill, buildSkillCard);
  renderDynamicList('projects', newProject, buildProjectCard);
  renderSectionOrder();
}

function renderDynamicList(key, freshItemFn, buildCardFn) {
  const container = $(`#${key}-list`);
  if (!container) return;
  container.innerHTML = '';
  state[key].forEach((item, idx) => container.appendChild(buildCardFn(item, idx)));

  const btn = $(`#add${key.charAt(0).toUpperCase() + key.slice(1)}`);
  if (btn && !btn.dataset.bound) {
    btn.dataset.bound = true;
    btn.addEventListener('click', () => {
      state[key].push(freshItemFn());
      renderDynamicList(key, freshItemFn, buildCardFn); renderPreview(); triggerSave();
      const cards = $$('.list-item-card', container);
      if (cards.length) openCard(cards[cards.length - 1]);
    });
  }
}

function buildExperienceCard(item, idx) {
  return createCard(item, idx, 'experience', item.role || item.company, `
    <div class="field-group"><label>Job Title</label><input type="text" data-key="role" value="${escHtml(item.role)}" /></div>
    <div class="field-group"><label>Company</label><input type="text" data-key="company" value="${escHtml(item.company)}" /></div>
    <div class="field-group"><label>Start Date</label><input type="text" data-key="start" value="${escHtml(item.start)}" /></div>
    <div class="field-group"><label>End Date</label><input type="text" data-key="end" value="${escHtml(item.end)}" /></div>
    <div class="field-group full"><label>Description / Achievements</label><textarea data-key="description" rows="4">${escHtml(item.description)}</textarea></div>
    <div class="field-group full"><label>Key Metrics</label><input type="text" data-key="metrics" value="${escHtml(item.metrics)}" /></div>
`);
}

function buildEducationCard(item, idx) {
  return createCard(item, idx, 'education', item.degree || item.school, `
    <div class="field-group full"><label>School / Institution</label><input type="text" data-key="school" value="${escHtml(item.school)}" /></div>
    <div class="field-group"><label>Degree</label><input type="text" data-key="degree" value="${escHtml(item.degree)}" /></div>
    <div class="field-group"><label>Field of Study</label><input type="text" data-key="field" value="${escHtml(item.field)}" /></div>
    <div class="field-group"><label>Start Year</label><input type="text" data-key="start" value="${escHtml(item.start)}" /></div>
    <div class="field-group"><label>End Year</label><input type="text" data-key="end" value="${escHtml(item.end)}" /></div>
    <div class="field-group"><label>GPA</label><input type="text" data-key="gpa" value="${escHtml(item.gpa)}" /></div>
`);
}

function buildProjectCard(item, idx) {
  return createCard(item, idx, 'projects', item.name, `
    <div class="field-group full"><label>Project Name</label><input type="text" data-key="name" value="${escHtml(item.name)}" /></div>
    <div class="field-group full"><label>URL / GitHub</label><input type="url" data-key="url" value="${escHtml(item.url)}" /></div>
    <div class="field-group full"><label>Tech Stack</label><input type="text" data-key="tech" value="${escHtml(item.tech)}" /></div>
    <div class="field-group full"><label>Description</label><textarea data-key="description" rows="3">${escHtml(item.description)}</textarea></div>
`);
}

function buildSkillCard(item) {
  const card = document.createElement('div'); card.className = 'skill-item-card';
  card.innerHTML = `
    <input type="text" data-key="name" value="${escHtml(item.name)}" placeholder="Skill name (e.g. React)" />
    <select class="skill-level-select" data-key="level">
      <option value="beginner" ${item.level === 'beginner' ? 'selected' : ''}>Beginner</option>
      <option value="intermediate" ${item.level === 'intermediate' ? 'selected' : ''}>Intermediate</option>
      <option value="proficient" ${item.level === 'proficient' ? 'selected' : ''}>Proficient</option>
      <option value="advanced" ${item.level === 'advanced' ? 'selected' : ''}>Advanced</option>
      <option value="expert" ${item.level === 'expert' ? 'selected' : ''}>Expert</option>
    </select>
    <button class="icon-btn danger remove-btn" title="Remove">✕</button>
  `;
  card.querySelector('.remove-btn').addEventListener('click', () => { state.skills = state.skills.filter(x => x.id !== item.id); renderAllForms(); renderPreview(); triggerSave(); });
  card.querySelectorAll('[data-key]').forEach(i => i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', debounce(() => {
    state.skills.find(x => x.id === item.id)[i.dataset.key] = i.value; renderPreview(); triggerSave();
  }, 120)));
  return card;
}

function createCard(item, idx, stateKey, displayTitle, fieldsHtml) {
  const card = document.createElement('div'); card.className = 'list-item-card';
  card.innerHTML = `
    <div class="item-header"><span class="item-title-text">${escHtml(displayTitle) || 'Item ' + (idx + 1)}</span>
    <div class="item-actions"><button class="icon-btn danger remove-btn">✕</button><span class="chevron-icon">▼</span></div></div>
    <div class="item-body"><div class="fields-grid">${fieldsHtml}</div></div>`;

  card.querySelector('.item-header').addEventListener('click', (e) => { if (!e.target.closest('.remove-btn')) toggleCard(card); });
  card.querySelector('.remove-btn').addEventListener('click', (e) => { e.stopPropagation(); state[stateKey] = state[stateKey].filter(x => x.id !== item.id); renderAllForms(); renderPreview(); triggerSave(); });
  card.querySelectorAll('[data-key]').forEach(input => input.addEventListener('input', debounce(() => {
    state[stateKey].find(x => x.id === item.id)[input.dataset.key] = input.value;
    card.querySelector('.item-title-text').textContent = input.value || 'Item'; renderPreview(); triggerSave();
  }, 120)));
  return card;
}

function toggleCard(c) { c.querySelector('.item-body').classList.toggle('open'); }
function openCard(c) { c.querySelector('.item-body').classList.add('open'); }

/* ══════════════════════════════════════════════════
   SECTION ORDER (DRAG & DROP)
══════════════════════════════════════════════════ */
function renderSectionOrder() {
  const list = $('#section-order-list'); if (!list) return; list.innerHTML = '';
  state.sectionOrder.forEach((section, idx) => {
    const item = document.createElement('div'); item.className = 'order-item'; item.draggable = true; item.dataset.index = idx;
    item.innerHTML = `<span class="order-handle">≡</span><span class="order-item-label">${SECTION_LABELS[section] || section}</span>
      <div class="order-move-btns"><button class="icon-btn move-up" ${idx === 0 ? 'disabled' : ''}>↑</button><button class="icon-btn move-down" ${idx === state.sectionOrder.length - 1 ? 'disabled' : ''}>↓</button></div>`;
    item.querySelector('.move-up').addEventListener('click', () => { [state.sectionOrder[idx - 1], state.sectionOrder[idx]] = [state.sectionOrder[idx], state.sectionOrder[idx - 1]]; renderSectionOrder(); renderPreview(); triggerSave(); });
    item.querySelector('.move-down').addEventListener('click', () => { [state.sectionOrder[idx], state.sectionOrder[idx + 1]] = [state.sectionOrder[idx + 1], state.sectionOrder[idx]]; renderSectionOrder(); renderPreview(); triggerSave(); });

    item.addEventListener('dragstart', (e) => { dragSrcIndex = idx; item.classList.add('dragging'); });
    item.addEventListener('dragend', () => { item.classList.remove('dragging'); $$('.order-item').forEach(i => i.classList.remove('drag-over')); });
    item.addEventListener('dragover', (e) => { e.preventDefault(); $$('.order-item').forEach(i => i.classList.remove('drag-over')); item.classList.add('drag-over'); });
    item.addEventListener('drop', (e) => {
      e.preventDefault(); item.classList.remove('drag-over');
      if (dragSrcIndex !== null && dragSrcIndex !== idx) {
        state.sectionOrder.splice(idx, 0, state.sectionOrder.splice(dragSrcIndex, 1)[0]);
        renderSectionOrder(); renderPreview(); triggerSave();
      }
    });
    list.appendChild(item);
  });
}

/* ══════════════════════════════════════════════════
   LIVE PREVIEW RENDER ENGINE
══════════════════════════════════════════════════ */
const ICONS = {
  email: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  phone: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  location: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  web: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  linkedin: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
  github: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,
};

function contactItem(svg, text, href) {
  if (!text) return '';
  const content = href ? `<a href="${escHtml(href)}" style="color:inherit;text-decoration:none;">${escHtml(text)}</a>` : escHtml(text);
  return `<span class="rh-contact-item">${svg} ${content}</span>`;
}

function renderPreview() {
  const el = $('#resumePreview'); if (!el) return;
  const p = state.personal;
  const color = state.theme.color;
  const layout = PRESETS[state.preset]?.layout || 'software';

  el.className = `resume-a4 layout-${layout}`;
  el.style.setProperty('--resume-accent', color);
  el.style.setProperty('--accent-secondary', state.theme.secondaryColor || '#111827');

  // Choose Renderer
  const renderers = { software: renderSoftwareLayout, management: renderManagementLayout, design: renderDesignLayout, entry: renderEntryLayout };
  const renderer = renderers[layout] || renderSoftwareLayout;

  if (!p.name && !p.title && !state.experience.length && !state.education.length && !state.skills.length && !state.projects.length && !p.summary) {
    el.innerHTML = `<div class="resume-empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg><h3>Start filling in your details</h3><p>Your resume will appear here in real-time as you type.</p></div>`;
    return;
  }

  el.innerHTML = renderer(p, state, color);
}

// ── Shared Section Renderers
function renderSectionsInOrder(order, st, color, exclude = []) {
  return order.filter(s => !exclude.includes(s)).map(section => {
    if (section === 'summary' && st.personal.summary) return `<div class="resume-section"><div class="rs-title">Professional Summary</div><p class="rs-summary">${escHtml(st.personal.summary)}</p></div>`;
    if (section === 'experience' && st.experience.length) return `<div class="resume-section"><div class="rs-title">Experience</div>${st.experience.map(e => `<div class="rs-entry"><div class="rs-entry-header"><div><div class="rs-entry-role">${escHtml(e.role)}</div><div class="rs-entry-company" style="color:var(--accent-secondary)">${escHtml(e.company)}</div></div><div class="rs-entry-date">${e.current ? `${escHtml(e.start)} – Present` : [e.start, e.end].filter(Boolean).map(escHtml).join(' – ')}</div></div>${e.description ? `<div class="rs-entry-desc">${escHtml(e.description)}</div>` : ''}${e.metrics ? `<div class="rs-entry-metrics">${e.metrics.split(',').filter(m => m.trim()).map(m => `<span class="rs-metric-tag" style="background:${color}18;color:${color}">${escHtml(m.trim())}</span>`).join('')}</div>` : ''}</div>`).join('')}</div>`;
    if (section === 'education' && st.education.length) return `<div class="resume-section"><div class="rs-title">Education</div>${st.education.map(e => `<div class="rs-entry"><div class="rs-entry-header"><div><div class="rs-entry-role">${[e.degree, e.field].filter(Boolean).map(escHtml).join(' in ') || escHtml(e.school)}</div><div class="rs-entry-company" style="color:var(--accent-secondary)">${escHtml(e.school)}</div>${e.gpa ? `<div class="rs-edu-gpa">GPA: ${escHtml(e.gpa)}</div>` : ''}</div><div class="rs-entry-date">${[e.start, e.end].filter(Boolean).map(escHtml).join(' – ')}</div></div></div>`).join('')}</div>`;
    if (section === 'skills' && st.skills.length) return `<div class="resume-section"><div class="rs-title">Skills</div><div class="resume-skills-grid">${st.skills.map(s => { const isExp = s.level === 'expert' || s.level === 'advanced'; return `<span class="resume-skill-tag ${isExp ? 'level-expert' : ''}" style="${isExp ? `color:${color};border-color:${color}30;background:${color}12` : ''}">${escHtml(s.name)}</span>`; }).join('')}</div></div>`;
    if (section === 'projects' && st.projects.length) return `<div class="resume-section"><div class="rs-title">Projects</div>${st.projects.map(pr => `<div class="rs-entry"><div class="rs-entry-header"><div><div class="rs-project-name">${escHtml(pr.name)}</div>${pr.url ? `<div class="rs-project-url" style="color:${color}">${escHtml(pr.url)}</div>` : ''}</div></div>${pr.tech ? `<div class="resume-tech-tags">${pr.tech.split(',').filter(t => t.trim()).map(t => `<span class="resume-tech-tag">${escHtml(t.trim())}</span>`).join('')}</div>` : ''}${pr.description ? `<div class="rs-entry-desc">${escHtml(pr.description)}</div>` : ''}</div>`).join('')}</div>`;
    return '';
  }).join('');
}

// ── Preset Layout Renderers
function renderSoftwareLayout(p, st, color) {
  const links = [
    p.email ? contactItem(ICONS.email, p.email, `mailto:${p.email}`) : '',
    p.phone ? contactItem(ICONS.phone, p.phone, `tel:${p.phone}`) : '',
    p.location ? contactItem(ICONS.location, p.location, null) : '',
    p.github ? contactItem(ICONS.github, p.github, `https://${p.github.replace(/^https?:\/\//, '')}`) : '',
    p.linkedin ? contactItem(ICONS.linkedin, p.linkedin, `https://${p.linkedin.replace(/^https?:\/\//, '')}`) : '',
    p.website ? contactItem(ICONS.web, p.website, p.website) : '',
  ].filter(Boolean).join('');

  return `
    <div class="resume-header-software">
      <div class="rh-name">${escHtml(p.name) || '&nbsp;'}</div>
      <div class="rh-title">${escHtml(p.title)}</div>
      <div class="rh-contact-row">${links}</div>
    </div>
    <div class="resume-body-software">
      <div class="resume-main-col">${renderSectionsInOrder(st.sectionOrder, st, color, ['education', 'skills'])}</div>
      <div class="resume-side-col">${renderSectionsInOrder(st.sectionOrder, st, color, ['summary', 'experience', 'projects'])}</div>
    </div>`;
}

function renderManagementLayout(p, st, color) {
  const contactHTML = [
    p.email ? `<div>${ICONS.email} ${escHtml(p.email)}</div>` : '',
    p.phone ? `<div>${ICONS.phone} ${escHtml(p.phone)}</div>` : '',
    p.location ? `<div>${ICONS.location} ${escHtml(p.location)}</div>` : '',
    p.linkedin ? `<div>${ICONS.linkedin} ${escHtml(p.linkedin)}</div>` : '',
    p.website ? `<div>${ICONS.web} ${escHtml(p.website)}</div>` : '',
  ].filter(Boolean).join('');
  return `
    <div class="resume-header-management">
      <div class="rhm-left"><div class="rhm-name">${escHtml(p.name) || '&nbsp;'}</div><div class="rhm-title">${escHtml(p.title)}</div></div>
      <div class="rhm-right">${contactHTML}</div>
    </div>
    <div class="resume-body-management">${renderSectionsInOrder(st.sectionOrder, st, color, [])}</div>`;
}

function renderDesignLayout(p, st, color) {
  const initials = (p.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const sideContact = [
    p.email ? `<div class="ds-contact-item">${ICONS.email} ${escHtml(p.email)}</div>` : '',
    p.phone ? `<div class="ds-contact-item">${ICONS.phone} ${escHtml(p.phone)}</div>` : '',
    p.location ? `<div class="ds-contact-item">${ICONS.location} ${escHtml(p.location)}</div>` : '',
    p.website ? `<div class="ds-contact-item">${ICONS.web} ${escHtml(p.website)}</div>` : '',
    p.linkedin ? `<div class="ds-contact-item">${ICONS.linkedin} ${escHtml(p.linkedin)}</div>` : '',
  ].filter(Boolean).join('');

  const skillBars = st.skills.map(s => `<div class="ds-skill-bar-wrap"><div class="ds-skill-name">${escHtml(s.name)}</div><div class="ds-skill-bar"><div class="ds-skill-fill" style="width:${SKILL_LEVELS[s.level] || 70}%"></div></div></div>`).join('');

  return `
    <div class="design-sidebar">
      <div class="ds-avatar">${initials}</div>
      <div class="ds-name">${escHtml(p.name) || '&nbsp;'}</div>
      <div class="ds-title">${escHtml(p.title)}</div>
      ${sideContact ? `<div class="ds-section-title">Contact</div>${sideContact}` : ''}
      ${skillBars ? `<div class="ds-section-title">Skills</div>${skillBars}` : ''}
    </div>
    <div class="design-main">${renderSectionsInOrder(st.sectionOrder, st, color, ['skills'])}</div>`;
}

function renderEntryLayout(p, st, color) {
  const contactRow = [
    p.email ? `<span class="rhe-contact-item">${ICONS.email} ${escHtml(p.email)}</span>` : '',
    p.phone ? `<span class="rhe-contact-item">${ICONS.phone} ${escHtml(p.phone)}</span>` : '',
    p.location ? `<span class="rhe-contact-item">${ICONS.location} ${escHtml(p.location)}</span>` : '',
    p.linkedin ? `<span class="rhe-contact-item">${ICONS.linkedin} ${escHtml(p.linkedin)}</span>` : '',
    p.github ? `<span class="rhe-contact-item">${ICONS.github} ${escHtml(p.github)}</span>` : '',
  ].filter(Boolean).join('');
  return `
    <div class="resume-header-entry">
      <div class="rhe-name">${escHtml(p.name) || '&nbsp;'}</div>
      <div class="rhe-title">${escHtml(p.title)}</div>
      <div class="rhe-contacts">${contactRow}</div>
    </div>
    <div class="resume-body-entry">${renderSectionsInOrder(st.sectionOrder, st, color, [])}</div>`;
}

/* ══════════════════════════════════════════════════
   EXPORT FUNCTIONS (CRITICAL FIX FOR HTML2CANVAS OFFSET BUG)
══════════════════════════════════════════════════ */
function bindExport() {
  $('#exportPDF')?.addEventListener('click', exportPDF);
  $('#exportDOCX')?.addEventListener('click', exportDOCX);
}

function exportPDF() {
  const el = $('#resumePreview'); if (!el) return;
  const btn = $('#exportPDF'); if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }

  const sizeKey = ($('#pdfSizeSelect')?.value || 'a4').toLowerCase();
  const FORMAT_MAP = { a4: { jsPDF: 'a4', widthPx: 794, minHeightPx: 1123 }, a3: { jsPDF: 'a3', widthPx: 1122, minHeightPx: 1588 }, a5: { jsPDF: 'a5', widthPx: 559, minHeightPx: 794 }, a2: { jsPDF: 'a2', widthPx: 1587, minHeightPx: 2245 } };
  const fmt = FORMAT_MAP[sizeKey];

  // 1. Reset window scroll to 0,0 - CRUCIAL for html2canvas to not offset the render
  const originalScrollX = window.scrollX;
  const originalScrollY = window.scrollY;
  window.scrollTo(0, 0);

  // 2. Clone the element
  const clone = el.cloneNode(true);

  // 3. Force the clone to render completely natively, at top-left of the document
  clone.style.cssText = `
    width: ${fmt.widthPx}px !important;
    min-height: ${fmt.minHeightPx}px !important;
    height: max-content !important; 
    max-height: none !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    transform: none !important;
    overflow: visible !important;
    background: #fff !important;
    color: #1A1D27 !important;
    font-family: ${state.theme.font} !important;
    z-index: -9999 !important; /* Hide it behind the actual page */
  `;

  // Propagate custom CSS variables manually
  clone.style.setProperty('--rs-heading-scale', state.theme.headingScale || 1);
  clone.style.setProperty('--rs-body-scale', state.theme.bodyScale || 1);
  clone.style.setProperty('--resume-accent', state.theme.color);
  clone.style.setProperty('--accent-secondary', state.theme.secondaryColor || '#111827');

  // Append directly to body (no wrapper divs to mess up grid layouts)
  document.body.appendChild(clone);

  // Measure actual height once layout forces recalculation
  void clone.offsetHeight;
  const fullHeight = Math.max(clone.scrollHeight, fmt.minHeightPx);

  const opt = {
    margin: 0,
    filename: `${(state.personal.name || 'resume').replace(/\s+/g, '_')}_${sizeKey.toUpperCase()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      width: fmt.widthPx,
      height: fullHeight,
      windowWidth: fmt.widthPx,
      windowHeight: fullHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0
    },
    jsPDF: { unit: 'px', format: [fmt.widthPx, fullHeight], orientation: 'portrait', hotfixes: ["px_scaling"] }
  };

  html2pdf().set(opt).from(clone).save().then(() => {
    // Cleanup
    document.body.removeChild(clone);
    window.scrollTo(originalScrollX, originalScrollY);
    if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
    showToast(`PDF (${sizeKey.toUpperCase()}) successfully exported!`, 'success');
  }).catch((err) => {
    console.error('PDF Error:', err);
    document.body.removeChild(clone);
    window.scrollTo(originalScrollX, originalScrollY);
    if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
    showToast('PDF Export failed. Try reloading the page.', 'error');
  });
}

// ── PURE XML DOCX GENERATION (No fragile html-docx-js needed)
function _xmlEsc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }
function _col(hex) { return hex.replace('#', '').toUpperCase().padEnd(6, '0').slice(0, 6); }
function _run(text, { bold = false, sz = 22, color = '1A1D27', italic = false } = {}) {
  if (!text) return '';
  const b = bold ? '<w:b/>' : ''; const i = italic ? '<w:i/>' : '';
  return `<w:r><w:rPr>${b}${i}<w:color w:val="${_col(color)}"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${_xmlEsc(text)}</w:t></w:r>`;
}
function _para(runs, { spaceBefore = 0, spaceAfter = 80, borderColor = null } = {}) {
  const border = borderColor ? `<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="4" w:color="${_col(borderColor)}"/></w:pBdr>` : '';
  return `<w:p><w:pPr><w:spacing w:before="${spaceBefore}" w:after="${spaceAfter}"/>${border}</w:pPr>${runs}</w:p>`;
}

// Dynamically load JSZip if blocked by CSP previously
async function ensureJSZip() {
  if (typeof JSZip !== 'undefined') return true;
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

async function exportDOCX() {
  const btn = $('#exportDOCX');
  if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }

  const isJSZipReady = await ensureJSZip();
  if (!isJSZipReady) {
    if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
    showToast('Failed to load DOCX library. Please check your internet connection.', 'error');
    return;
  }

  try {
    const color = state.theme.color; const p = state.personal;
    let paras = [];

    // Header
    if (p.name) paras.push(_para(_run(p.name, { bold: true, sz: 52, color }), { spaceAfter: 60 }));
    if (p.title) paras.push(_para(_run(p.title, { sz: 26, color }), { spaceAfter: 60 }));
    const contacts = [p.email, p.phone, p.location, p.linkedin, p.github, p.website].filter(Boolean).join('   ·   ');
    if (contacts) paras.push(_para(_run(contacts, { sz: 20, color: '5C6278' }), { spaceAfter: 100 }));
    paras.push('<w:p><w:pPr><w:spacing w:after="60"/></w:pPr></w:p>');

    // Sections
    state.sectionOrder.forEach(section => {
      if (section === 'summary' && p.summary) {
        paras.push(_para(_run('PROFESSIONAL SUMMARY', { bold: true, sz: 18, color }), { spaceBefore: 160, spaceAfter: 80, borderColor: color }));
        paras.push(_para(_run(p.summary, { sz: 22, color: '4A4F65' }), { spaceAfter: 60 }));
      }
      if (section === 'experience' && state.experience.length) {
        paras.push(_para(_run('EXPERIENCE', { bold: true, sz: 18, color }), { spaceBefore: 160, spaceAfter: 80, borderColor: color }));
        state.experience.forEach(e => {
          const dates = e.current ? `${e.start} – Present` : [e.start, e.end].filter(Boolean).join(' – ');
          paras.push(_para(_run(e.role, { bold: true, sz: 24 }) + _run('    ' + dates, { sz: 20, color: '9399AD' }), { spaceBefore: 120, spaceAfter: 40 }));
          if (e.company) paras.push(_para(_run(e.company, { sz: 22, color }), { spaceAfter: 40 }));
          if (e.description) paras.push(_para(_run(e.description, { sz: 22, color: '4A4F65' }), { spaceAfter: 60 }));
          if (e.metrics) paras.push(_para(_run('Metrics: ' + e.metrics, { bold: true, sz: 22, color: '4A4F65' }), { spaceAfter: 60 }));
        });
      }
      if (section === 'education' && state.education.length) {
        paras.push(_para(_run('EDUCATION', { bold: true, sz: 18, color }), { spaceBefore: 160, spaceAfter: 80, borderColor: color }));
        state.education.forEach(e => {
          const deg = [e.degree, e.field].filter(Boolean).join(' in ');
          const dates = [e.start, e.end].filter(Boolean).join(' – ');
          paras.push(_para(_run(deg || e.school, { bold: true, sz: 24 }) + _run('    ' + dates, { sz: 20, color: '9399AD' }), { spaceBefore: 120, spaceAfter: 40 }));
          if (deg && e.school) paras.push(_para(_run(e.school, { sz: 22, color }), { spaceAfter: 40 }));
          if (e.gpa) paras.push(_para(_run('GPA: ' + e.gpa, { sz: 22, color: '4A4F65' }), { spaceAfter: 60 }));
        });
      }
      if (section === 'skills' && state.skills.length) {
        paras.push(_para(_run('SKILLS', { bold: true, sz: 18, color }), { spaceBefore: 160, spaceAfter: 80, borderColor: color }));
        paras.push(_para(_run(state.skills.map(s => `${s.name} (${s.level})`).join('   ·   '), { sz: 22, color: '4A4F65' }), { spaceAfter: 60 }));
      }
      if (section === 'projects' && state.projects.length) {
        paras.push(_para(_run('PROJECTS', { bold: true, sz: 18, color }), { spaceBefore: 160, spaceAfter: 80, borderColor: color }));
        state.projects.forEach(pr => {
          paras.push(_para(_run(pr.name, { bold: true, sz: 24 }), { spaceBefore: 120, spaceAfter: 40 }));
          if (pr.url) paras.push(_para(_run(pr.url, { sz: 22, color }), { spaceAfter: 40 }));
          if (pr.tech) paras.push(_para(_run('Stack: ' + pr.tech, { sz: 22, color: '374151' }), { spaceAfter: 60 }));
          if (pr.description) paras.push(_para(_run(pr.description, { sz: 22, color: '4A4F65' }), { spaceAfter: 60 }));
        });
      }
    });

    const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>${paras.join('\n')}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="900" w:bottom="720" w:left="900"/></w:sectPr></w:body>
      </w:document>`;

    const zip = new JSZip();
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
    zip.file('word/document.xml', docXml);

    const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${(p.name || 'Resume').replace(/\s+/g, '_')}_Resume.docx`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('DOCX exported successfully!', 'success');
  } catch (err) {
    console.error('DOCX error:', err);
    showToast('Failed to export DOCX', 'error');
  } finally {
    if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
  }
}

/* ══════════════════════════════════════════════════
   TOAST NOTIFICATIONS
══════════════════════════════════════════════════ */
function showToast(message, type = 'info') {
  const container = $('#toastContainer'); if (!container) return;
  const toast = document.createElement('div'); toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon"></span><span>${escHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 250); }, 3200);
}