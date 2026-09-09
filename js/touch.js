// On-screen touch controls, drawn in canvas space so they scale with the pixel art.
// Buttons drive PH.input's virtual key state, so every existing code path is reused.
// Tap regions are registered by whatever drew them, so hit areas always match the pixels.
(function (PH) {
  'use strict';
  const I = PH.input;
  const T = {
    buttons: [], active: [], pending: [], pointers: {}, enabled: false, armed: false, hint: 0,
  };

  function btn(id, x, y, w, h, code, kind, glyph) { return { id, x, y, w, h, code, kind, glyph, lit: 0, on: false, rep: 0 }; }

  T.build = function () {
    T.buttons = [
      // movement cross, bottom left
      btn('up', 30, 188, 28, 24, 'ArrowUp', 'hold', 'up'),
      btn('left', 3, 212, 28, 28, 'ArrowLeft', 'hold', 'left'),
      btn('right', 57, 212, 28, 28, 'ArrowRight', 'hold', 'right'),
      btn('down', 30, 240, 28, 24, 'ArrowDown', 'hold', 'down'),
      // actions, bottom right
      btn('hop', 384, 179, 40, 28, 'VirtualHop', 'tap', 'hop'),
      btn('use', 380, 221, 38, 35, 'KeyF', 'tap', 'F'),
      btn('act', 422, 208, 50, 48, 'KeyE', 'tap', 'E'),
      // utilities, right edge
      btn('phone', 452, 30, 26, 24, 'Tab', 'tap', 'phone'),
      btn('menu', 452, 58, 26, 24, 'Escape', 'tap', 'menu'),
      btn('breathe', 452, 86, 26, 24, 'ShiftLeft', 'toggle', 'breathe'),
    ];
  };

  T.init = function (canvas) {
    T.build();
    T.enabled = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || (navigator.maxTouchPoints || 0) > 0;
    const toCanvas = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * PH.W, (e.clientY - r.top) / r.height * PH.H]; };
    const arm = () => { if (!T.armed) { T.armed = true; if (PH.armAudio) PH.armAudio(); } };
    canvas.addEventListener('pointerdown', (e) => {
      const [x, y] = toCanvas(e); I.mouse.x = x; I.mouse.y = y; I.mouse.down = true;
      if (e.pointerType === 'touch' || e.pointerType === 'pen') { T.enabled = true; T.hint = 0; }
      arm();
      if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) { } }
      T.onDown(e.pointerId, x, y);
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('pointermove', (e) => {
      const [x, y] = toCanvas(e); I.mouse.x = x; I.mouse.y = y;
      if (T.pointers[e.pointerId] !== undefined) T.onMove(e.pointerId, x, y);
    }, { passive: true });
    const end = (e) => { T.onUp(e.pointerId); I.mouse.down = false; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('pointerleave', end);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  };

  // ---- tap regions: registered while drawing frame N, hit-tested until frame N+1 draws ----
  T.beginFrame = function () { T.active = T.pending; T.pending = []; };
  T.region = function (x, y, w, h, fn) { T.pending.push({ x, y, w, h, fn }); };
  T.regionAll = function (fn) { T.pending.push({ x: 0, y: 0, w: PH.W, h: PH.H, fn }); };

  T.hitButton = function (x, y) {
    if (!T.enabled || !T.showButtons) return null;
    for (let i = T.buttons.length - 1; i >= 0; i--) {
      const b = T.buttons[i];
      if (x >= b.x - 5 && x <= b.x + b.w + 5 && y >= b.y - 5 && y <= b.y + b.h + 5) return b;
    }
    return null;
  };
  T.onDown = function (id, x, y) {
    const b = T.hitButton(x, y);
    if (b) { T.pointers[id] = b; T.press(b); return; }
    for (let i = T.active.length - 1; i >= 0; i--) {
      const r = T.active[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { T.pointers[id] = null; r.fn(); return; }
    }
    T.pointers[id] = null;
    I.mouse.clicked = true;
  };
  T.onMove = function (id, x, y) {
    const cur = T.pointers[id];
    const b = T.hitButton(x, y);
    if (b === cur) return;
    if (cur && cur.kind === 'hold') T.release(cur);
    if (b && b.kind === 'hold') { T.pointers[id] = b; T.press(b); } else if (cur && cur.kind === 'hold') T.pointers[id] = null;
  };
  T.onUp = function (id) {
    const b = T.pointers[id];
    if (b && b.kind === 'hold') T.release(b);
    delete T.pointers[id];
  };
  T.press = function (b) {
    b.lit = 1;
    if (b.kind === 'hold') { I.hold(b.code, true); I.tap(b.code); b.rep = 0.36; }
    else if (b.kind === 'toggle') { b.on = !b.on; I.hold(b.code, b.on); }
    else I.tap(b.code);
  };
  T.release = function (b) { I.hold(b.code, false); b.rep = 0; };

  T.update = function (dt) {
    const holding = {};
    for (const id in T.pointers) { const b = T.pointers[id]; if (b) holding[b.id] = true; }
    for (const b of T.buttons) {
      if (b.lit > 0) b.lit = Math.max(0, b.lit - dt * 4);
      // auto-repeat for menu paging, so holding up/down scrolls a list
      if ((b.id === 'up' || b.id === 'down') && holding[b.id] && b.rep > 0) {
        b.rep -= dt; if (b.rep <= 0) { I.tap(b.code); b.rep = 0.14; b.lit = 0.7; }
      }
      if (b.kind === 'toggle' && b.on) b.lit = Math.max(b.lit, 0.5);
    }
  };

  // ---- drawing ----
  function box(ctx, b) {
    const lit = Math.min(1, b.lit);
    ctx.fillStyle = 'rgba(8,7,12,' + (0.42 + lit * 0.34) + ')';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    const a = 0.26 + lit * 0.54;
    ctx.fillStyle = 'rgba(216,201,166,' + a + ')';
    ctx.fillRect(b.x + 1, b.y, b.w - 2, 1); ctx.fillRect(b.x + 1, b.y + b.h - 1, b.w - 2, 1);
    ctx.fillRect(b.x, b.y + 1, 1, b.h - 2); ctx.fillRect(b.x + b.w - 1, b.y + 1, 1, b.h - 2);
    return 'rgba(232,224,208,' + (0.5 + lit * 0.5) + ')';
  }
  // one triangle, tip first: column/row i is 2i+1 long, so the point sits at i = 0
  function arrow(ctx, cx, cy, dir, size, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < size; i++) {
      const run = i * 2 + 1;
      if (dir === 'left') ctx.fillRect(cx - size / 2 + i, cy - run / 2, 1, run);
      else if (dir === 'right') ctx.fillRect(cx + size / 2 - i, cy - run / 2, 1, run);
      else if (dir === 'up') ctx.fillRect(cx - run / 2, cy - size / 2 + i, run, 1);
      else ctx.fillRect(cx - run / 2, cy + size / 2 - i, run, 1);
    }
  }
  T.draw = function (ctx, game) {
    T.showButtons = T.enabled && !game.title && !game.ending;
    if (!T.showButtons) return;
    const F = PH.font;
    const inMenu = game.ui.blocking();
    for (const b of T.buttons) {
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      const quiet = (b.id === 'up' || b.id === 'down') && !inMenu && b.lit <= 0;
      if (quiet) ctx.globalAlpha = 0.45;
      const col = box(ctx, b);
      switch (b.glyph) {
        case 'left': case 'right': case 'up': case 'down': arrow(ctx, cx, cy, b.glyph, 7, col); break;
        case 'E': F.drawCentered(ctx, 'E', cx, cy - 4, { color: col, scale: 2 }); break;
        case 'F': F.drawCentered(ctx, 'F', cx, cy - 4, { color: col, scale: 2 }); break;
        case 'hop': arrow(ctx, cx, cy - 3, 'up', 5, col); ctx.fillStyle = col; ctx.fillRect(cx - 6, cy + 5, 12, 1); break;
        case 'phone': ctx.globalAlpha = 0.55 + b.lit * 0.45; ctx.drawImage(PH.items.icon('phone'), Math.round(cx - 6), Math.round(cy - 6)); ctx.globalAlpha = 1;
          if (game.phone && game.phone.totalUnread() > 0) { ctx.fillStyle = '#e04040'; ctx.fillRect(b.x + b.w - 6, b.y + 2, 5, 5); } break;
        case 'menu': ctx.fillStyle = col; for (let i = 0; i < 3; i++) ctx.fillRect(cx - 6, cy - 4 + i * 4, 12, 1); break;
        case 'breathe': { ctx.fillStyle = col; const r = 3 + (b.on ? 1 + Math.sin(PH.time * 1.6) * 1.4 : 0); ctx.beginPath(); ctx.arc(cx, cy, Math.max(2, r), 0, 6.29); ctx.fill(); break; }
      }
      ctx.globalAlpha = 1;
    }
    // one-time orientation nudge: the game is 16:9, so portrait is a thin band
    if (PH.portrait && !game.ui.blocking()) {
      PH.font.drawCentered(ctx, 'turn your phone sideways for a bigger screen', PH.W / 2, 118, { color: 'rgba(216,201,166,0.5)', shadow: '#000' });
    }
  };
  PH.touch = T;
})(window.PH);
