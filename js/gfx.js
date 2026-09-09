// Graphics core: canvas, pixel painter, sprite factory, palette, protagonist + item sprites, particles, lighting.
(function (PH) {
  'use strict';
  PH.W = 480; PH.H = 270;
  const G = {};

  // ---- Palette ----
  G.pal = {
    night: '#0b0a14', dusk: '#3a2438', day: '#8fb7d9', dawn: '#d99a7a',
    wood: '#6b4a2f', woodD: '#472f1c', woodL: '#8d6640', wall: '#d8cbb4', wallD: '#a8987c', wallpaper: '#5a4a5e', wallpaperD: '#3f3342',
    floor: '#3f2e22', floorL: '#5a4230', tile: '#c9c3b8', tileD: '#8f887d', glass: '#a5d8e6', metal: '#7c8590', metalD: '#4a5058',
    grass: '#4f7a3a', grassD: '#33532a', grassL: '#6c9a4a', dirt: '#5b4632', stone: '#8a8a86', stoneD: '#5c5c5a',
    skin: '#d9b39a', skinD: '#a67a5f', hair: '#2a2321', cardigan: '#3b3f4f', cardiganD: '#262933', trousers: '#2a2528', shoe: '#17141a',
    blood: '#7a0b12', bloodL: '#b3141c', black: '#000000', white: '#ffffff', outline: '#14101a',
  };

  // ---- Canvas factory & pixel painter ----
  G.canvas = function (w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingEnabled = false; return c; };
  G.painter = function (ctx) {
    return {
      ctx,
      rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); },
      px(x, y, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); },
      hline(x, y, w, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), 1); },
      vline(x, y, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, Math.round(h)); },
      ellipse(cx, cy, rx, ry, c) {
        ctx.fillStyle = c; rx = Math.max(0.5, rx); ry = Math.max(0.5, ry);
        for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
          const dy = (y + 0.5 - cy) / ry; if (Math.abs(dy) > 1) continue;
          const hw = rx * Math.sqrt(1 - dy * dy);
          ctx.fillRect(Math.round(cx - hw), y, Math.max(1, Math.round(cx + hw) - Math.round(cx - hw)), 1);
        }
      },
      disc(cx, cy, r, c) { this.ellipse(cx, cy, r, r, c); },
      line(x0, y0, x1, y1, c) {
        ctx.fillStyle = c; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
        for (let i = 0; i < 4000; i++) { ctx.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
      },
      tri(x0, y0, x1, y1, x2, y2, c) { // filled triangle via scanlines
        ctx.fillStyle = c;
        const pts = [[x0, y0], [x1, y1], [x2, y2]].sort((a, b) => a[1] - b[1]);
        const [a, b, d] = pts;
        const interp = (p, q, y) => q[1] === p[1] ? p[0] : p[0] + (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1]);
        for (let y = Math.round(a[1]); y <= Math.round(d[1]); y++) {
          let xa = interp(a, d, y), xb = y < b[1] ? interp(a, b, y) : interp(b, d, y);
          if (xa > xb) { const t = xa; xa = xb; xb = t; }
          ctx.fillRect(Math.round(xa), y, Math.max(1, Math.round(xb) - Math.round(xa) + 1), 1);
        }
      },
      poly(pts, c) { // convex-ish polygon via fan of triangles
        for (let i = 1; i < pts.length - 1; i++) this.tri(pts[0][0], pts[0][1], pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], c);
      },
      dither(x, y, w, h, c, density) {
        ctx.fillStyle = c;
        for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (PH.hash(x + xx, y + yy) < density) ctx.fillRect(x + xx, y + yy, 1, 1);
      },
      checker(x, y, w, h, c) { ctx.fillStyle = c; for (let yy = 0; yy < h; yy++) for (let xx = (yy & 1); xx < w; xx += 2) ctx.fillRect(x + xx, y + yy, 1, 1); },
      outline(w, h, color) { // 1px outline around non-transparent pixels of the ctx canvas
        const img = ctx.getImageData(0, 0, w, h), d = img.data; const src = new Uint8ClampedArray(d);
        const rgb = PH.hexToRgb(color);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4; if (src[i + 3] > 0) continue;
          let n = false;
          if (x > 0 && src[i - 4 + 3] > 0) n = true; if (x < w - 1 && src[i + 4 + 3] > 0) n = true;
          if (y > 0 && src[i - w * 4 + 3] > 0) n = true; if (y < h - 1 && src[i + w * 4 + 3] > 0) n = true;
          if (n) { d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255; }
        }
        ctx.putImageData(img, 0, 0);
      },
    };
  };
  G.make = function (w, h, fn) { const c = G.canvas(w, h); const p = G.painter(c.getContext('2d')); fn(p, w, h); return c; };
  G.flipH = function (src) { const c = G.canvas(src.width, src.height); const x = c.getContext('2d'); x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0); return c; };

  // ---- Protagonist sprites (Adrian Hale) ----
  // 16w x 34h. Frames: idle(2), walk(6), reach(1), crouch(1), sit(1), hold phone(1)
  G.buildPlayer = function () {
    const P = G.pal, frames = {};
    function man(p, pose, f) {
      const bob = pose === 'walk' ? [0, -1, 0, 0, -1, 0][f] : pose === 'idle' ? [0, 0, 0, 1][f % 4] : 0;
      const y0 = 2 + bob;
      // legs
      const legSets = pose === 'walk' ? [[-3, 3], [-2, 2], [0, 0], [3, -3], [2, -2], [0, 0]] : [[0, 0]];
      const ls = legSets[f % legSets.length];
      if (pose === 'sit') {
        p.rect(4, 24, 10, 4, P.trousers); p.rect(11, 24, 4, 8, P.trousers); p.rect(11, 31, 5, 2, P.shoe);
      } else if (pose === 'crouch') {
        p.rect(4, 22, 4, 8, P.trousers); p.rect(9, 22, 4, 8, P.trousers); p.rect(3, 30, 5, 2, P.shoe); p.rect(9, 30, 5, 2, P.shoe);
      } else {
        p.rect(5 + ls[0] * 0.4, 20, 3, 12, P.trousers); p.rect(9 + ls[1] * 0.4, 20, 3, 12, P.trousers);
        p.rect(4 + ls[0] * 0.7, 31, 5, 2, P.shoe); p.rect(9 + ls[1] * 0.7, 31, 5, 2, P.shoe);
        // knee highlights
        p.px(6 + ls[0] * 0.4, 25, '#3a3338'); p.px(10 + ls[1] * 0.4, 25, '#3a3338');
      }
      const ty = pose === 'crouch' ? y0 + 6 : pose === 'sit' ? y0 + 4 : y0;
      // torso (cardigan)
      p.rect(4, ty + 9, 9, 12, P.cardigan); p.rect(4, ty + 9, 2, 12, P.cardiganD); p.rect(8, ty + 10, 1, 10, '#5b6070');
      p.rect(6, ty + 9, 5, 3, '#6a6a72'); // shirt collar
      // arms
      if (pose === 'reach') { p.rect(11, ty + 4, 3, 7, P.cardigan); p.rect(12, ty + 2, 3, 3, P.skin); p.rect(2, ty + 10, 3, 9, P.cardigan); p.rect(2, ty + 19, 3, 2, P.skin); }
      else if (pose === 'phone') { p.rect(10, ty + 10, 3, 6, P.cardigan); p.rect(12, ty + 6, 3, 5, P.cardigan); p.rect(13, ty + 4, 3, 3, P.skin); p.rect(2, ty + 10, 3, 9, P.cardigan); p.rect(2, ty + 19, 3, 2, P.skin); p.rect(14, ty + 1, 3, 4, '#1b1b22'); p.px(15, ty + 2, '#6fb0c8'); }
      else {
        const sw = pose === 'walk' ? ls[0] * 0.5 : 0;
        p.rect(2, ty + 10 + sw, 3, 9, P.cardigan); p.rect(2, ty + 19 + sw, 3, 2, P.skin);
        p.rect(12, ty + 10 - sw, 3, 9, P.cardigan); p.rect(12, ty + 19 - sw, 3, 2, P.skin);
      }
      // neck & head
      p.rect(7, ty + 7, 3, 2, P.skinD);
      p.rect(5, ty, 7, 8, P.skin); p.rect(5, ty + 6, 7, 2, P.skinD); // jaw shadow
      p.rect(5, ty - 1, 8, 3, P.hair); p.rect(4, ty, 2, 4, P.hair); p.rect(12, ty, 1, 3, P.hair); p.px(6, ty + 3, P.hair);
      p.px(10, ty + 3, '#1a1a1a'); p.px(7, ty + 3, '#1a1a1a'); // eyes (facing right -> both visible-ish)
      p.rect(6, ty + 4, 1, 1, '#a08070'); p.rect(9, ty + 4, 2, 1, '#a08070'); // eye bags
      p.px(11, ty + 4, P.skinD); // nose
      p.rect(7, ty + 6, 3, 1, '#7a4b40'); // mouth line/stubble
    }
    const mk = (pose, f) => { const c = G.make(18, 34, (p) => { man(p, pose, f); p.outline(18, 34, P.outline); }); return c; };
    frames.idle = [0, 1, 2, 3].map((f) => mk('idle', f));
    frames.walk = [0, 1, 2, 3, 4, 5].map((f) => mk('walk', f));
    frames.reach = [mk('reach', 0)]; frames.crouch = [mk('crouch', 0)]; frames.sit = [mk('sit', 0)]; frames.phone = [mk('phone', 0)];
    for (const k in frames) frames[k + 'L'] = frames[k].map(G.flipH);
    return frames;
  };

  // ---- Item icons (12x12) ----
  G.buildItems = function () {
    const it = {};
    const mk = (fn) => G.make(12, 12, (p) => { fn(p); p.outline(12, 12, '#0e0b12'); });
    it.seeds = mk((p) => { p.rect(2, 4, 8, 6, '#c9a66b'); p.rect(3, 3, 6, 1, '#c9a66b'); for (let i = 0; i < 9; i++) p.px(3 + (i % 3) * 2 + (i > 5 ? 1 : 0), 5 + Math.floor(i / 3) * 1.5, ['#7a5a2a', '#e0d090', '#3a2a1a'][i % 3]); });
    it.pellets = mk((p) => { p.rect(2, 3, 8, 8, '#8b5a2b'); p.rect(3, 4, 6, 6, '#a06a30'); p.px(4, 5, '#5c3a1a'); p.px(7, 6, '#5c3a1a'); p.px(5, 8, '#5c3a1a'); });
    it.fruit = mk((p) => { p.disc(5, 6, 4, '#e0592a'); p.disc(6, 7, 3, '#ef7a3a'); p.rect(5, 1, 1, 3, '#4a6a2a'); p.rect(6, 1, 3, 2, '#5f8a35'); p.px(3, 5, '#ffb070'); });
    it.nuts = mk((p) => { p.ellipse(4, 7, 3, 2.5, '#8a6a3a'); p.ellipse(8, 5, 3, 2.5, '#a07a45'); p.px(4, 6, '#6a4a25'); p.px(8, 5, '#6a4a25'); p.px(3, 8, '#c8a070'); });
    it.medicine = mk((p) => { p.rect(3, 2, 6, 9, '#e0e0e6'); p.rect(3, 2, 6, 2, '#c03a3a'); p.rect(4, 6, 4, 3, '#c03a3a'); p.rect(5, 5, 2, 5, '#c03a3a'); });
    it.toy = mk((p) => { p.rect(5, 1, 2, 3, '#c8a040'); p.disc(6, 7, 4, '#e0b040'); p.rect(3, 9, 6, 1, '#a07020'); p.px(6, 10, '#404040'); p.px(4, 6, '#fff0a0'); });
    it.brush = mk((p) => { p.rect(5, 1, 2, 6, '#8a6a3a'); p.rect(2, 7, 8, 4, '#e0c060'); for (let x = 2; x < 10; x++) p.px(x, 11, '#c0a040'); p.rect(2, 7, 8, 1, '#3a3a3a'); });
    it.water = mk((p) => { p.rect(2, 4, 7, 7, '#5a8ab0'); p.rect(3, 3, 5, 1, '#5a8ab0'); p.rect(9, 5, 2, 1, '#5a8ab0'); p.rect(10, 3, 1, 3, '#5a8ab0'); p.rect(4, 2, 3, 1, '#3a6a90'); p.px(3, 5, '#8ab8d8'); });
    it.key = mk((p) => { p.disc(4, 4, 3, '#c8a850'); p.disc(4, 4, 1, '#0e0b12'); p.rect(6, 4, 5, 2, '#c8a850'); p.px(9, 6, '#c8a850'); p.px(11, 6, '#c8a850'); });
    it.flashlight = mk((p) => { p.rect(1, 5, 7, 3, '#4a4a55'); p.rect(8, 4, 3, 5, '#6a6a78'); p.px(11, 4, '#fff8c0'); p.px(11, 8, '#fff8c0'); p.rect(11, 5, 1, 3, '#ffe880'); p.px(3, 6, '#8a8a98'); });
    it.phone = mk((p) => { p.rect(3, 1, 6, 10, '#1a1a22'); p.rect(4, 2, 4, 7, '#3a5a70'); p.px(5, 3, '#6fb0c8'); p.px(6, 5, '#6fb0c8'); p.rect(5, 10, 2, 1, '#555'); });
    it.treat = mk((p) => { p.rect(2, 6, 8, 3, '#d0a060'); p.rect(3, 5, 6, 1, '#e0b070'); p.px(4, 7, '#ff6060'); p.px(7, 7, '#60c060'); p.px(5, 6, '#ffe0a0'); });
    it.bandage = mk((p) => { p.rect(2, 4, 8, 4, '#e8dcc8'); p.rect(4, 5, 4, 2, '#d8c8b0'); p.px(3, 5, '#c0b0a0'); p.px(8, 6, '#c0b0a0'); });
    it.tea = mk((p) => { p.rect(3, 4, 6, 6, '#e8e8e8'); p.rect(9, 5, 2, 3, '#e8e8e8'); p.rect(4, 5, 4, 1, '#7a4a20'); p.px(5, 2, '#bbb'); p.px(6, 1, '#bbb'); });
    it.tape = mk((p) => { p.rect(2, 3, 8, 6, '#222'); p.disc(4, 6, 1.5, '#888'); p.disc(8, 6, 1.5, '#888'); p.rect(3, 4, 6, 1, '#c0392b'); });
    it.photo = mk((p) => { p.rect(2, 2, 8, 8, '#e8e0d0'); p.rect(3, 3, 6, 5, '#6a7a8a'); p.rect(4, 5, 2, 2, '#c8a080'); p.px(7, 4, '#c8a080'); });
    it.record = mk((p) => { p.disc(6, 6, 5, '#1a1a1a'); p.disc(6, 6, 3, '#2a2a2a'); p.disc(6, 6, 1.5, '#c03a3a'); p.px(3, 3, '#444'); });
    return it;
  };

  // ---- Particles ----
  function Particles() { this.list = []; }
  Particles.prototype.spawn = function (o) { this.list.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, life: 1, age: 0, size: 1, color: '#fff', g: 0, drag: 0, type: 'dot' }, o)); if (this.list.length > 900) this.list.shift(); };
  Particles.prototype.update = function (dt) {
    const l = this.list;
    for (let i = l.length - 1; i >= 0; i--) {
      const p = l[i]; p.age += dt; if (p.age >= p.life) { l.splice(i, 1); continue; }
      p.vy += p.g * dt; p.vx *= (1 - p.drag * dt); p.vy *= (1 - p.drag * dt);
      if (p.type === 'feather') { p.vx += Math.sin(p.age * 6 + p.x * 0.1) * 12 * dt; p.vy = Math.min(p.vy, 14); }
      if (p.type === 'mote') { p.vx += Math.sin(p.age * 1.5 + p.y) * 3 * dt; p.vy += Math.cos(p.age * 1.1 + p.x) * 2 * dt; }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
  };
  Particles.prototype.draw = function (ctx, camx, camy) {
    for (const p of this.list) {
      const t = p.age / p.life; const a = p.fade === false ? 1 : (1 - t);
      ctx.globalAlpha = PH.clamp(a * (p.alpha || 1), 0, 1); ctx.fillStyle = p.color;
      const x = Math.round(p.x - camx), y = Math.round(p.y - camy);
      if (p.type === 'rain') { ctx.fillRect(x, y, 1, p.size); }
      else if (p.type === 'feather') { ctx.fillRect(x, y, 2, 1); ctx.fillRect(x + (Math.sin(p.age * 6) > 0 ? 1 : 0), y - 1, 1, 1); }
      else ctx.fillRect(x, y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  };
  G.Particles = Particles;

  // ---- Lighting layer ----
  G.lightCanvas = null;
  G.beginLights = function (ambient) {
    if (!G.lightCanvas) G.lightCanvas = G.canvas(PH.W, PH.H);
    const c = G.lightCanvas.getContext('2d'); c.globalCompositeOperation = 'source-over'; c.fillStyle = ambient; c.fillRect(0, 0, PH.W, PH.H); c.globalCompositeOperation = 'lighter';
    return c;
  };
  G.light = function (c, x, y, r, color, intensity) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    const rgb = PH.hexToRgb(color); const i = intensity === undefined ? 1 : intensity;
    g.addColorStop(0, PH.rgb(rgb[0], rgb[1], rgb[2], i)); g.addColorStop(0.5, PH.rgb(rgb[0], rgb[1], rgb[2], i * 0.35)); g.addColorStop(1, PH.rgb(rgb[0], rgb[1], rgb[2], 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  };
  G.lightCone = function (c, x, y, dir, len, color, intensity) {
    const g = c.createRadialGradient(x, y, 0, x, y, len);
    const rgb = PH.hexToRgb(color);
    g.addColorStop(0, PH.rgb(rgb[0], rgb[1], rgb[2], intensity)); g.addColorStop(1, PH.rgb(rgb[0], rgb[1], rgb[2], 0));
    c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.lineTo(x + dir * len, y - len * 0.35); c.lineTo(x + dir * len, y + len * 0.45); c.closePath(); c.fill();
  };
  G.lightRect = function (c, x, y, w, h, color, intensity) {
    const rgb = PH.hexToRgb(color); c.fillStyle = PH.rgb(rgb[0], rgb[1], rgb[2], intensity); c.fillRect(x, y, w, h);
  };
  G.endLights = function (target) { target.globalCompositeOperation = 'multiply'; target.drawImage(G.lightCanvas, 0, 0); target.globalCompositeOperation = 'source-over'; };

  PH.gfx = G;
})(window.PH);
