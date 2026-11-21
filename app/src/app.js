// app.js — the Vice Panels editor: wires the page controls to the renderer.
//
// Everything runs on the visitor's own machine. Photos are read from local
// files (or the bundled samples) into memory, composed on a canvas by
// render.js, and exported as a PNG download. Nothing is uploaded anywhere.

import { LAYOUTS, layoutById, panelBounds } from './layouts.js';
import { GRADES, gradeById } from './grades.js';
import { drawCover, panelAt, strokePanelHighlight } from './render.js';

const SIZES = {
  '1080x1080': { width: 1080, height: 1080, label: 'Square · 1080 × 1080' },
  '1080x1350': { width: 1080, height: 1350, label: 'Portrait · 1080 × 1350' },
  '1920x1080': { width: 1920, height: 1080, label: 'Landscape · 1920 × 1080' },
};

const SAMPLE_PATHS = ['samples/hero.jpg', 'samples/night.jpg', 'samples/beach.jpg'];

const state = {
  photos: [], // [{ img, name }]
  layoutId: 'riot-five',
  gradeId: 'vice-sunset',
  sizeId: '1920x1080',
  edits: [], // [{ photo, dx, dy, zoom }] — one per panel of the layout
  selectedPanel: 0,
  caption: {
    title: 'Neon Harbor',
    subtitle: 'Vice Panels Original',
    badge: 'Est. 2026',
  },
};

const els = {};
for (const id of [
  'photo-input', 'sample-button', 'photo-strip', 'layout-list', 'grade-list',
  'zoom-range', 'center-button', 'cycle-button', 'selected-label',
  'caption-title', 'caption-subtitle', 'caption-badge',
  'export-button', 'stage-canvas', 'photo-count',
]) {
  els[id] = document.getElementById(id);
}

function currentLayout() { return layoutById(state.layoutId); }
function currentGrade() { return gradeById(state.gradeId); }
function currentSize() { return SIZES[state.sizeId]; }

function scene() {
  return {
    photos: state.photos.map((entry) => entry.img),
    layout: currentLayout(),
    grade: currentGrade(),
    edits: state.edits,
    caption: state.caption,
  };
}

// Keep one edit record per panel. New panels start centred, filled with the
// next photo in turn, so loading three photos fills a collage at once.
function syncEdits() {
  const count = currentLayout().panels.length;
  const next = [];
  for (let i = 0; i < count; i++) {
    next.push(state.edits[i] ?? {
      photo: state.photos.length ? i % state.photos.length : -1,
      auto: true, // photo chosen by the round-robin fill, not by the visitor
      dx: 0,
      dy: 0,
      zoom: 1,
    });
  }
  state.edits = next;
  if (state.selectedPanel >= count) state.selectedPanel = 0;
}

function refreshPhotoAssignments() {
  // Panels the visitor has not filled by hand are (re)dealt the photos
  // round-robin whenever the photo set changes, so three photos landing one
  // by one still end up spread across the whole collage.
  state.edits.forEach((edit, i) => {
    if (edit.auto) {
      edit.photo = state.photos.length ? i % state.photos.length : -1;
    } else if (edit.photo >= state.photos.length) {
      edit.photo = state.photos.length - 1;
    }
  });
}

let redrawQueued = false;
function redraw() {
  if (redrawQueued) return;
  redrawQueued = true;
  requestAnimationFrame(() => {
    redrawQueued = false;
    const canvas = els['stage-canvas'];
    const { width, height } = currentSize();
    const scale = Math.min(920 / width, 700 / height);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    drawCover(ctx, canvas.width, canvas.height, scene());
    const panel = currentLayout().panels[state.selectedPanel];
    if (panel) strokePanelHighlight(ctx, panel, canvas.width, canvas.height);
    els['selected-label'].textContent = state.photos.length
      ? `Panel ${state.selectedPanel + 1} of ${currentLayout().panels.length} — drag to move its photo, scroll to zoom`
      : 'Load a photo to begin — the samples are already on the board';
    els['photo-count'].textContent = `${state.photos.length} photo${state.photos.length === 1 ? '' : 's'} loaded`;
  });
}

function renderPhotoStrip() {
  els['photo-strip'].replaceChildren();
  state.photos.forEach((entry, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb';
    button.title = `${entry.name} — click to put it in the selected panel`;
    const img = document.createElement('img');
    img.src = entry.img.src;
    img.alt = entry.name;
    button.append(img);
    button.addEventListener('click', () => {
      const edit = state.edits[state.selectedPanel];
      if (edit) { edit.photo = index; edit.auto = false; }
      redraw();
    });
    els['photo-strip'].append(button);
  });
}

function addPhoto(img, name) {
  state.photos.push({ img, name });
  refreshPhotoAssignments();
  renderPhotoStrip();
  redraw();
}

function loadImageFromFile(file) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => addPhoto(img, file.name);
  img.src = url;
}

function loadSamplePhotos() {
  return Promise.all(SAMPLE_PATHS.map((path) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { addPhoto(img, path.split('/').pop()); resolve(true); };
    img.onerror = () => resolve(false);
    img.src = path;
  })));
}

function buildChoiceList(element, items, currentId, onPick) {
  element.replaceChildren();
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice' + (item.id === currentId ? ' is-active' : '');
    const name = document.createElement('strong');
    name.textContent = item.name;
    const tagline = document.createElement('span');
    tagline.textContent = item.tagline;
    button.append(name, tagline);
    button.addEventListener('click', () => onPick(item.id));
    element.append(button);
  }
}

function buildPickers() {
  buildChoiceList(els['layout-list'], LAYOUTS, state.layoutId, (id) => {
    state.layoutId = id;
    syncEdits();
    buildPickers();
    redraw();
  });
  buildChoiceList(els['grade-list'], GRADES, state.gradeId, (id) => {
    state.gradeId = id;
    buildPickers();
    redraw();
  });
}

// --- stage pointer handling: select a panel, drag its photo, wheel-zoom ---
let drag = null;
function canvasPoint(event) {
  const rect = els['stage-canvas'].getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (els['stage-canvas'].width / rect.width),
    y: (event.clientY - rect.top) * (els['stage-canvas'].height / rect.height),
  };
}

els['stage-canvas'].addEventListener('pointerdown', (event) => {
  const { x, y } = canvasPoint(event);
  const hit = panelAt(currentLayout(), els['stage-canvas'].width, els['stage-canvas'].height, x, y);
  if (hit >= 0) {
    state.selectedPanel = hit;
    drag = { lastX: x, lastY: y };
    els['stage-canvas'].setPointerCapture(event.pointerId);
    syncZoomControl();
    redraw();
  }
});

els['stage-canvas'].addEventListener('pointermove', (event) => {
  if (!drag) return;
  const { x, y } = canvasPoint(event);
  const edit = state.edits[state.selectedPanel];
  const bounds = panelBounds(currentLayout().panels[state.selectedPanel]);
  if (edit) {
    edit.dx += (x - drag.lastX) / (bounds.width * els['stage-canvas'].width);
    edit.dy += (y - drag.lastY) / (bounds.height * els['stage-canvas'].height);
  }
  drag = { lastX: x, lastY: y };
  redraw();
});

els['stage-canvas'].addEventListener('pointerup', () => { drag = null; });
els['stage-canvas'].addEventListener('pointercancel', () => { drag = null; });

els['stage-canvas'].addEventListener('wheel', (event) => {
  event.preventDefault();
  const edit = state.edits[state.selectedPanel];
  if (!edit) return;
  edit.zoom = Math.min(4, Math.max(1, edit.zoom * Math.exp(-event.deltaY * 0.0012)));
  syncZoomControl();
  redraw();
}, { passive: false });

// Keyboard finish work: arrows nudge the selected panel's photo a step at
// a time, + / - zoom it, and Tab-cycling panels is left to the buttons.
window.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
  const edit = state.edits[state.selectedPanel];
  if (!edit) return;
  const step = event.shiftKey ? 0.005 : 0.02;
  if (event.key === 'ArrowLeft') edit.dx -= step;
  else if (event.key === 'ArrowRight') edit.dx += step;
  else if (event.key === 'ArrowUp') edit.dy -= step;
  else if (event.key === 'ArrowDown') edit.dy += step;
  else if (event.key === '+' || event.key === '=') edit.zoom = Math.min(4, edit.zoom * 1.06);
  else if (event.key === '-') edit.zoom = Math.max(1, edit.zoom / 1.06);
  else return;
  event.preventDefault();
  syncZoomControl();
  redraw();
});

function syncZoomControl() {
  const edit = state.edits[state.selectedPanel];
  els['zoom-range'].value = edit ? String(Math.round(edit.zoom * 100)) : '100';
}

els['zoom-range'].addEventListener('input', () => {
  const edit = state.edits[state.selectedPanel];
  if (edit) edit.zoom = Number(els['zoom-range'].value) / 100;
  redraw();
});

els['center-button'].addEventListener('click', () => {
  const edit = state.edits[state.selectedPanel];
  if (edit) { edit.dx = 0; edit.dy = 0; edit.zoom = 1; }
  syncZoomControl();
  redraw();
});

els['cycle-button'].addEventListener('click', () => {
  const edit = state.edits[state.selectedPanel];
  if (edit && state.photos.length) {
    edit.photo = (edit.photo + 1) % state.photos.length;
    edit.auto = false;
  }
  redraw();
});

// --- controls wiring ---
els['photo-input'].addEventListener('change', () => {
  for (const file of els['photo-input'].files) {
    if (file.type.startsWith('image/')) loadImageFromFile(file);
  }
  els['photo-input'].value = '';
});

els['sample-button'].addEventListener('click', () => { loadSamplePhotos(); });

for (const radio of document.querySelectorAll('input[name="size"]')) {
  radio.addEventListener('change', () => {
    state.sizeId = radio.value;
    redraw();
  });
}

for (const [input, key] of [
  [els['caption-title'], 'title'],
  [els['caption-subtitle'], 'subtitle'],
  [els['caption-badge'], 'badge'],
]) {
  input.addEventListener('input', () => {
    state.caption[key] = input.value;
    redraw();
  });
}

function renderExport(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas.getContext('2d'), width, height, scene());
  return canvas;
}

els['export-button'].addEventListener('click', () => {
  const { width, height } = currentSize();
  renderExport(width, height).toBlob((blob) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vice-panels-${width}x${height}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
  }, 'image/png');
});

// A small public handle so the maker (and any curious visitor with devtools)
// can drive the board: handy for taking the entry's screenshots honestly —
// every exported cover in them is a real render of this very code.
window.VicePanels = {
  state,
  loadSamplePhotos,
  setCaption(patch) { Object.assign(state.caption, patch); redraw(); },
  setLayout(id) { state.layoutId = id; syncEdits(); buildPickers(); redraw(); },
  setGrade(id) { state.gradeId = id; buildPickers(); redraw(); },
  setSize(id) {
    state.sizeId = id;
    document.querySelector(`input[name="size"][value="${id}"]`).checked = true;
    redraw();
  },
  exportDataURL(width, height) { return renderExport(width, height).toDataURL('image/png'); },
};

// --- boot ---
els['caption-title'].value = state.caption.title;
els['caption-subtitle'].value = state.caption.subtitle;
els['caption-badge'].value = state.caption.badge;
buildPickers();
syncEdits();
redraw();
window.VicePanels.ready = loadSamplePhotos().then(() => redraw());
