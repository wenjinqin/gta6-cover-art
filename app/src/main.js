// Neon Coast editor: wires the controls to the cover renderer.
// Photos come from the user's machine (file inputs, never uploaded); the preview
// canvas is live; dragging on it pans the selected panel's photo, the slider zooms
// it; Export renders the same state at full post size and downloads a PNG.
// A `?shot=` query sets up a fixed scene for screenshots instead (see shots.js).
import { drawCover, panelRectsPx, defaultState, SIZES, GRADES, CAPTION_STYLES } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const status = $('status');
const state = defaultState();
let selected = 0;
let dragging = null;

function redraw() {
  const size = SIZES[state.sizeKey];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawCover(canvas, state, selected);
  syncPanelControls();
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function setStatus(text) {
  status.textContent = text;
}

/** Refreshes the per-panel controls (photo picker, zoom) for the selected panel. */
function syncPanelControls() {
  const fill = $('panelPhoto');
  fill.value = String(state.panelPhoto[selected]);
  $('zoom').value = String(state.zooms[selected]);
  $('zoomVal').textContent = `${Math.round(state.zooms[selected] * 100)}%`;
  document.querySelectorAll('.panel-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === selected);
    dot.textContent = `Panel ${i + 1}`;
  });
}

/** Builds the option buttons for layout, size, grade and caption style. */
function buildOptionButtons() {
  const group = (id, entries, current, apply) => {
    const host = $(id);
    host.innerHTML = '';
    entries.forEach(([key, label]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt';
      b.textContent = label;
      b.setAttribute('aria-pressed', String(key === current));
      if (key === current) b.classList.add('on');
      b.addEventListener('click', () => {
        apply(key);
        host.querySelectorAll('.opt').forEach((x) => {
          x.classList.remove('on');
          x.setAttribute('aria-pressed', 'false');
        });
        b.classList.add('on');
        b.setAttribute('aria-pressed', 'true');
        redraw();
      });
      host.appendChild(b);
    });
  };
  group('layoutBtns', [['hero', 'Hero'], ['triptych', 'Triptych']], state.layout, (k) => { state.layout = k; });
  group('sizeBtns', Object.entries(SIZES).map(([k, v]) => [k, v.label]), state.sizeKey, (k) => { state.sizeKey = k; });
  group('gradeBtns', Object.entries(GRADES).map(([k, v]) => [k, v.label]), state.gradeKey, (k) => { state.gradeKey = k; });
  group('styleBtns', Object.entries(CAPTION_STYLES).map(([k, v]) => [k, v.label]), state.captionStyle, (k) => { state.captionStyle = k; });
}

/** Photo slots: three file inputs, each feeding one photo slot. */
function wirePhotoSlots() {
  const thumbs = [$('thumb0'), $('thumb1'), $('thumb2')];
  ['photo0', 'photo1', 'photo2'].forEach((id, i) => {
    $(id).addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        state.photos[i] = await loadImage(URL.createObjectURL(file));
        thumbs[i].src = URL.createObjectURL(file);
        thumbs[i].hidden = false;
        // First photo in: fill every panel with it, so one photo is already a cover.
        if (state.photos.filter(Boolean).length === 1) {
          state.panelPhoto = [i, i, i];
        }
        setStatus(`Photo ${i + 1} loaded — pick a panel and drag to frame it.`);
        redraw();
      } catch {
        setStatus('That file could not be read as a photo.');
      }
    });
  });
  $('fillAll').addEventListener('click', () => {
    const first = state.panelPhoto.findIndex((_, i) => state.photos[state.panelPhoto[i]]);
    const src = first === -1 ? 0 : state.panelPhoto[first];
    state.panelPhoto = [src, src, src];
    setStatus(`All panels now use photo ${src + 1}.`);
    redraw();
  });
}

/** Click a panel to select it; drag on the preview to pan its photo. */
function wirePreview() {
  const toCanvas = (e) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    };
  };
  canvas.addEventListener('pointerdown', (e) => {
    const p = toCanvas(e);
    const rects = panelRectsPx(canvas, state);
    const hit = rects.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
    if (hit === -1) return;
    selected = hit;
    dragging = { start: p, pan: { ...state.pans[hit] } };
    canvas.setPointerCapture(e.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = toCanvas(e);
    const rects = panelRectsPx(canvas, state);
    const r = rects[selected];
    state.pans[selected] = {
      x: Math.max(-0.5, Math.min(0.5, dragging.pan.x + (p.x - dragging.start.x) / r.w)),
      y: Math.max(-0.5, Math.min(0.5, dragging.pan.y + (p.y - dragging.start.y) / r.h)),
    };
    redraw();
  });
  canvas.addEventListener('pointerup', () => { dragging = null; });
}

function wireTextAndPanel() {
  $('caption').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
  $('subcaption').addEventListener('input', (e) => { state.subcaption = e.target.value; redraw(); });
  $('panelPhoto').addEventListener('change', (e) => {
    state.panelPhoto[selected] = Number(e.target.value);
    redraw();
  });
  $('zoom').addEventListener('input', (e) => {
    state.zooms[selected] = Number(e.target.value);
    redraw();
  });
  document.querySelectorAll('.panel-dot').forEach((dot, i) => {
    dot.addEventListener('click', () => { selected = i; redraw(); });
  });
  $('resetPan').addEventListener('click', () => {
    state.pans[selected] = { x: 0, y: 0 };
    state.zooms[selected] = 1;
    redraw();
  });
}

/** Exports the current cover at full size as a PNG download. */
function wireExport() {
  $('export').addEventListener('click', () => {
    const size = SIZES[state.sizeKey];
    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    drawCover(off, state, -1);
    off.toBlob((blob) => {
      if (!blob) { setStatus('Export failed — try again.'); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-coast-${state.sizeKey}-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setStatus(`Saved neon-coast-${state.sizeKey}-${size.w}x${size.h}.png`);
    }, 'image/png');
  });
}

buildOptionButtons();
wirePhotoSlots();
wirePreview();
wireTextAndPanel();
wireExport();

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, state, async (urls, text, sub) => {
    const imgs = await Promise.all(urls.map((u) => loadImage(u)));
    state.photos = imgs;
    state.caption = text;
    if (sub !== undefined) state.subcaption = sub;
    redraw();
  });
} else {
  redraw();
}
