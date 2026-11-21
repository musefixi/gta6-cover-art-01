// render.js — draws a Vice Panels cover onto any 2D canvas context.
//
// The same drawCover() paints the small live preview and the full-size PNG
// export, so what the visitor sees is exactly what they download. The scene
// it consumes is plain data:
//
//   scene = {
//     photos:  [HTMLImageElement, ...],          // may be empty
//     layout:  a layout from layouts.js,
//     grade:   a grade from grades.js,
//     edits:   [{ photo, dx, dy, zoom }, ...],   // one per layout panel
//     caption: { title, subtitle, badge },
//   }
//
// photo is an index into photos (or -1 for an empty panel), dx/dy pan the
// photo inside its panel as fractions of the panel's bounds, and zoom is a
// multiplier on top of the cover-fit scale.

import { panelBounds } from './layouts.js';

const INK = '#0a0a14';
const PAPER = '#fdfdf8';

function tracePolygon(ctx, poly, width, height) {
  ctx.beginPath();
  poly.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x * width, y * height);
    else ctx.lineTo(x * width, y * height);
  });
  ctx.closePath();
}

// Cover-fit: the rectangle a photo of (imgW x imgH) occupies when scaled by
// `zoom` to cover the box (boxW x boxH), centred, then panned by dx/dy.
function coverRect(imgW, imgH, boxW, boxH, dx, dy, zoom) {
  const scale = Math.max(boxW / imgW, boxH / imgH) * zoom;
  const w = imgW * scale;
  const h = imgH * scale;
  const x = (boxW - w) / 2 + dx * boxW;
  const y = (boxH - h) / 2 + dy * boxH;
  return { x, y, w, h };
}

function paintEmptyPanel(ctx, bounds, width, height, index) {
  // A panel with no photo yet: a dusk gradient and a large quiet numeral,
  // so an unfinished cover still reads as a poster, not an error.
  const x = bounds.minX * width;
  const y = bounds.minY * height;
  const w = bounds.width * width;
  const h = bounds.height * height;
  const fill = ctx.createLinearGradient(x, y, x + w, y + h);
  fill.addColorStop(0, '#3a1c5e');
  fill.addColorStop(0.55, '#8a2be2');
  fill.addColorStop(1, '#ff2e88');
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.font = `900 ${Math.round(h * 0.5)}px Impact, 'Arial Black', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(index + 1), x + w / 2, y + h / 2);
}

function paintPanels(ctx, width, height, scene) {
  scene.layout.panels.forEach((onePanel, index) => {
    const edit = scene.edits[index] ?? { photo: -1, dx: 0, dy: 0, zoom: 1 };
    const bounds = panelBounds(onePanel);
    ctx.save();
    tracePolygon(ctx, onePanel.poly, width, height);
    ctx.clip();
    const img = edit.photo >= 0 ? scene.photos[edit.photo] : null;
    if (img && img.naturalWidth > 0) {
      const boxW = bounds.width * width;
      const boxH = bounds.height * height;
      const rect = coverRect(img.naturalWidth, img.naturalHeight, boxW, boxH, edit.dx, edit.dy, edit.zoom);
      ctx.drawImage(img, bounds.minX * width + rect.x, bounds.minY * height + rect.y, rect.w, rect.h);
    } else {
      paintEmptyPanel(ctx, bounds, width, height, index);
    }
    ctx.restore();
  });
}

function strokePanels(ctx, width, height, scene) {
  // Two passes over every seam: a heavy ink keyline, then a hairline of
  // light inside it — the printed-poster border between GTA panels.
  for (const pass of [
    { lineWidth: Math.max(4, width * 0.0075), style: INK },
    { lineWidth: Math.max(1, width * 0.0016), style: 'rgba(255, 255, 255, 0.35)' },
  ]) {
    ctx.lineWidth = pass.lineWidth;
    ctx.strokeStyle = pass.style;
    ctx.lineJoin = 'round';
    for (const onePanel of scene.layout.panels) {
      tracePolygon(ctx, onePanel.poly, width, height);
      ctx.stroke();
    }
  }
}

function paintWash(ctx, width, height, grade) {
  if (!grade.wash) return;
  const { stops, mode, direction } = grade.wash;
  const gradient = direction === 'diagonal'
    ? ctx.createLinearGradient(0, 0, width, height)
    : ctx.createLinearGradient(0, 0, 0, height);
  for (const [at, colour] of stops) gradient.addColorStop(at, colour);
  ctx.save();
  ctx.globalCompositeOperation = mode;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function paintVignette(ctx, width, height, strength) {
  if (strength <= 0) return;
  const radius = Math.hypot(width, height) / 2;
  const gradient = ctx.createRadialGradient(width / 2, height / 2, radius * 0.45, width / 2, height / 2, radius);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, `rgba(4, 2, 12, ${strength})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function paintCaption(ctx, width, height, caption) {
  const title = (caption.title ?? '').trim();
  const subtitle = (caption.subtitle ?? '').trim();
  const badge = (caption.badge ?? '').trim();
  if (!title && !subtitle && !badge) return;

  // A soft dark fall at the top so lettering holds over busy photos.
  const shade = ctx.createLinearGradient(0, 0, 0, height * 0.34);
  shade.addColorStop(0, 'rgba(5, 3, 14, 0.52)');
  shade.addColorStop(1, 'rgba(5, 3, 14, 0)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height * 0.34);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  if (title) {
    let size = Math.round(width * 0.115);
    ctx.save();
    ctx.translate(width / 2, height * 0.145);
    ctx.rotate(-0.035);
    ctx.font = `900 ${size}px Impact, 'Arial Black', 'Arial Narrow Bold', sans-serif`;
    // Long titles shrink to fit the sheet instead of bleeding off its edges.
    const titleWidth = ctx.measureText(title.toUpperCase()).width;
    if (titleWidth > width * 0.94) {
      size = Math.max(12, Math.floor(size * (width * 0.94) / titleWidth));
      ctx.font = `900 ${size}px Impact, 'Arial Black', 'Arial Narrow Bold', sans-serif`;
    }
    try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* older engines */ }
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = INK;
    ctx.lineJoin = 'round';
    ctx.strokeText(title.toUpperCase(), 0, 0);
    ctx.save();
    ctx.translate(size * 0.045, size * 0.055);
    ctx.fillStyle = '#ff2e88';
    ctx.fillText(title.toUpperCase(), 0, 0);
    ctx.restore();
    ctx.fillStyle = PAPER;
    ctx.fillText(title.toUpperCase(), 0, 0);
    ctx.restore();
  }

  if (title && subtitle) {
    // A thin gold rule between the title and its subtitle, centred, fading
    // at both ends — the divider a printed poster puts under its masthead.
    const ruleWidth = width * 0.34;
    const ruleY = height * 0.145 + width * 0.115 * 0.30;
    const rule = ctx.createLinearGradient(width / 2 - ruleWidth / 2, 0, width / 2 + ruleWidth / 2, 0);
    rule.addColorStop(0, 'rgba(255, 209, 102, 0)');
    rule.addColorStop(0.5, 'rgba(255, 209, 102, 0.95)');
    rule.addColorStop(1, 'rgba(255, 209, 102, 0)');
    ctx.fillStyle = rule;
    ctx.fillRect(width / 2 - ruleWidth / 2, ruleY, ruleWidth, Math.max(2, width * 0.0035));
  }

  if (subtitle) {
    const size = Math.round(width * 0.030);
    ctx.save();
    ctx.translate(width / 2, height * 0.145 + size * 1.9);
    ctx.font = `700 ${size}px 'Arial Narrow', Arial, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(size * 0.42)}px`; } catch { /* older engines */ }
    ctx.lineWidth = size * 0.22;
    ctx.strokeStyle = 'rgba(10, 10, 20, 0.85)';
    ctx.lineJoin = 'round';
    ctx.strokeText(subtitle.toUpperCase(), 0, 0);
    ctx.fillStyle = '#ffd166';
    ctx.fillText(subtitle.toUpperCase(), 0, 0);
    ctx.restore();
  }

  if (badge) {
    const size = Math.round(width * 0.024);
    ctx.save();
    ctx.font = `700 ${size}px 'Arial Narrow', Arial, sans-serif`;
    const text = `★ ${badge.toUpperCase()} ★`;
    const padX = size * 0.9;
    const boxW = ctx.measureText(text).width + padX * 2 + size * 0.42 * 2;
    const boxH = size * 2.1;
    ctx.translate(width - boxW / 2 - width * 0.035, height - boxH / 2 - height * 0.03);
    ctx.rotate(-0.05);
    ctx.fillStyle = '#ffcf3f';
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(2, size * 0.14);
    ctx.beginPath();
    ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, size * 0.35);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    try { ctx.letterSpacing = `${Math.round(size * 0.18)}px`; } catch { /* older engines */ }
    ctx.fillText(text, 0, size * 0.05);
    ctx.restore();
  }
}

export function drawCover(ctx, width, height, scene) {
  // Backdrop: a deep dusk gradient behind the panels, visible in any seam.
  const backdrop = ctx.createLinearGradient(0, 0, 0, height);
  backdrop.addColorStop(0, '#1b0f33');
  backdrop.addColorStop(1, '#05030d');
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, width, height);

  // The collage is drawn offscreen first so the grade's filter applies to
  // the photographs and the panel borders together, as one printed sheet.
  const sheet = document.createElement('canvas');
  sheet.width = width;
  sheet.height = height;
  const sheetCtx = sheet.getContext('2d');
  paintPanels(sheetCtx, width, height, scene);
  strokePanels(sheetCtx, width, height, scene);

  ctx.save();
  ctx.filter = scene.grade.filter;
  ctx.drawImage(sheet, 0, 0);
  ctx.restore();

  paintWash(ctx, width, height, scene.grade);
  paintVignette(ctx, width, height, scene.grade.vignette);
  paintCaption(ctx, width, height, scene.caption);
}

// Hit test for the editor: which panel of the layout holds point (x, y),
// given in the same pixel space as a width x height canvas? -1 for none.
export function panelAt(layout, width, height, x, y) {
  for (let index = layout.panels.length - 1; index >= 0; index--) {
    const poly = layout.panels[index].poly;
    let inside = false;
    for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
      const [ax, ay] = [poly[a][0] * width, poly[a][1] * height];
      const [bx, by] = [poly[b][0] * width, poly[b][1] * height];
      if ((ay > y) !== (by > y) && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
    }
    if (inside) return index;
  }
  return -1;
}

// The editor's selection outline: one panel's seam in bright accent.
export function strokePanelHighlight(ctx, onePanel, width, height) {
  ctx.save();
  ctx.lineWidth = Math.max(3, width * 0.005);
  ctx.strokeStyle = '#19e3ff';
  ctx.setLineDash([width * 0.02, width * 0.012]);
  ctx.lineJoin = 'round';
  tracePolygon(ctx, onePanel.poly, width, height);
  ctx.stroke();
  ctx.restore();
}
