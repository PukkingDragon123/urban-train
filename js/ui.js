// UI: HUD, dialog, phone, journal, bird menu, notifications. Fractures with sanity.
(function (PH) {
  'use strict';
  const F = PH.font, G = PH.gfx;
  function UI() {
    this.dialog = null; this.phoneOpen = false; this.journalOpen = false; this.birdMenu = null; this.help = false; this.notes = []; this.reading = false; this.roomTitleT = 0; this.roomTitle = ''; this.paused = false; this.journalPage = 0; this.phoneTab = 'contacts'; this.phoneScroll = 0; this.cursor = 0;
  }
  UI.prototype.blocking = function () { return !!(this.dialog || this.phoneOpen || this.journalOpen || this.birdMenu || this.help || this.paused); };
  UI.prototype.notify = function (text, kind) { this.notes.push({ text, kind, t: 5 }); if (this.notes.length > 4) this.notes.shift(); };
  UI.prototype.showRoom = function (name) { if (!name) return; this.roomTitle = name; this.roomTitleT = 2.5; };
  UI.prototype.say = function (lines, opts) {
    opts = opts || {}; const arr = Array.isArray(lines) ? lines.slice() : [String(lines)];
    this.dialog = { lines: arr, idx: 0, chars: 0, choices: opts.choices || null, cursor: 0, reading: !!opts.reading, onClose: opts.onClose, speaker: opts.speaker };
    this.reading = !!opts.reading;
  };
  UI.prototype.closeDialog = function () { const d = this.dialog; this.dialog = null; this.reading = false; if (d && d.onClose) d.onClose(); };
  UI.prototype.openPhone = function () { this.phoneOpen = true; this.phoneTab = 'contacts'; this.cursor = 0; PH.audio.click(); PH.game.phone.selected = null; };
  UI.prototype.openBirdMenu = function (bird) { this.birdMenu = { bird, cursor: 0 }; PH.audio.click(); };

  UI.prototype.update = function (dt, game) {
    const I = PH.input;
    for (let i = this.notes.length - 1; i >= 0; i--) { this.notes[i].t -= dt; if (this.notes[i].t <= 0) this.notes.splice(i, 1); }
    if (this.roomTitleT > 0) this.roomTitleT -= dt;
    if (this.help) { if (I.just('help') || I.just('cancel') || I.just('interact')) this.help = false; return; }
    if (I.just('help')) { this.help = true; return; }
    // Dialog
    if (this.dialog) {
      const d = this.dialog; const line = d.lines[d.idx] || '';
      d.chars += dt * 60; if (d.chars > line.length) d.chars = line.length;
      const last = d.idx >= d.lines.length - 1;
      if (last && d.choices) {
        if (I.just('up')) { d.cursor = PH.mod(d.cursor - 1, d.choices.length); PH.audio.click(); }
        if (I.just('down')) { d.cursor = PH.mod(d.cursor + 1, d.choices.length); PH.audio.click(); }
        if (I.just('interact') || I.just('use')) { if (d.chars < line.length) { d.chars = line.length; return; } const c = d.choices[d.cursor]; this.closeDialog(); if (c.f) c.f(); }
        return;
      }
      if (I.just('interact') || I.just('use') || I.just('cancel') || I.mouse.clicked) {
        if (d.chars < line.length && !I.just('cancel')) { d.chars = line.length; return; }
        if (last) { this.closeDialog(); } else { d.idx++; d.chars = 0; }
      }
      return;
    }
    if (this.birdMenu) { this.updateBirdMenu(game); return; }
    if (this.phoneOpen) { this.updatePhone(game); return; }
    if (this.journalOpen) { if (I.just('journal') || I.just('cancel') || I.just('phone')) { this.journalOpen = false; PH.audio.click(); } const n = Math.max(1, game.story.fragments.length + 1); if (I.just('right') || I.just('down')) this.journalPage = PH.mod(this.journalPage + 1, n); if (I.just('left') || I.just('up')) this.journalPage = PH.mod(this.journalPage - 1, n); return; }
    if (this.paused) { if (I.just('cancel')) this.paused = false; return; }
    if (I.just('phone')) { this.openPhone(); return; }
    if (I.just('journal')) { this.journalOpen = true; this.journalPage = Math.max(0, game.story.fragments.length); PH.audio.click(); return; }
    if (I.justKey('Escape')) { this.paused = true; return; }
  };
  UI.prototype.updatePhone = function (game) {
    const I = PH.input, ph = game.phone;
    if (I.just('phone') || (I.just('cancel') && !ph.selected)) { this.phoneOpen = false; PH.audio.click(); return; }
    if (this.phoneTab === 'contacts') {
      const list = ph.visible();
      if (I.just('up')) { this.cursor = PH.mod(this.cursor - 1, list.length + 1); PH.audio.click(); }
      if (I.just('down')) { this.cursor = PH.mod(this.cursor + 1, list.length + 1); PH.audio.click(); }
      if (I.just('interact') || I.just('use') || I.just('right')) { if (this.cursor === list.length) { this.phoneTab = 'notes'; this.journalPage = Math.max(0, game.story.fragments.length); } else { ph.selected = list[this.cursor]; ph.selected.unread = 0; this.phoneTab = 'chat'; this.cursor = 0; this.phoneScroll = 0; } PH.audio.click(); }
    } else if (this.phoneTab === 'chat') {
      const c = ph.selected;
      if (I.just('cancel') || I.just('left')) { this.phoneTab = 'contacts'; ph.selected = null; PH.audio.click(); return; }
      if (c.pending) {
        const n = c.pending.choices.length + 1;
        if (I.just('up')) { this.cursor = PH.mod(this.cursor - 1, n); PH.audio.click(); }
        if (I.just('down')) { this.cursor = PH.mod(this.cursor + 1, n); PH.audio.click(); }
        if (I.just('interact') || I.just('use')) { if (this.cursor === n - 1) { this.phoneTab = 'contacts'; ph.selected = null; } else ph.reply(c, this.cursor); this.cursor = 0; }
      } else {
        if (I.just('up')) this.phoneScroll = Math.min(this.phoneScroll + 1, Math.max(0, c.msgs.length - 3));
        if (I.just('down')) this.phoneScroll = Math.max(0, this.phoneScroll - 1);
        if (c.def.dead && (I.just('interact') || I.just('use'))) { c.msgs.push({ from: 'sys', text: 'Message not delivered.' }); PH.audio.click(); }
      }
    } else if (this.phoneTab === 'notes') {
      if (I.just('cancel') || I.just('left')) { this.phoneTab = 'contacts'; return; }
      const n = Math.max(1, game.story.fragments.length + 1); if (I.just('down')) this.journalPage = PH.mod(this.journalPage + 1, n); if (I.just('up')) this.journalPage = PH.mod(this.journalPage - 1, n);
    }
  };
  UI.prototype.updateBirdMenu = function (game) {
    const I = PH.input, m = this.birdMenu, opts = this.birdOptions(m.bird);
    if (I.just('cancel')) { this.birdMenu = null; return; }
    if (I.just('up')) { m.cursor = PH.mod(m.cursor - 1, opts.length); PH.audio.click(); }
    if (I.just('down')) { m.cursor = PH.mod(m.cursor + 1, opts.length); PH.audio.click(); }
    if (I.just('interact') || I.just('use')) { const o = opts[m.cursor]; this.birdMenu = null; o.f(); }
  };
  UI.prototype.birdOptions = function (b) {
    const game = PH.game; const o = [];
    o.push({ t: b.needs.fear > 40 ? 'Comfort ' + b.name : 'Pet ' + b.name, f: () => game.petBird(b) });
    o.push({ t: 'Whistle / sing with ' + b.name, f: () => game.singTo(b) });
    o.push({ t: 'Play with ' + b.name, f: () => game.playWith(b) });
    if (game.player.hasItem('treat')) o.push({ t: 'Give a treat', f: () => game.giveTreat(b) });
    if (game.player.hasItem('medicine') && (b.sick || b.needs.health < 60)) o.push({ t: 'Give medicine', f: () => game.giveMedicine(b) });
    o.push({ t: 'Look closely', f: () => game.examineBird(b) });
    o.push({ t: 'Leave', f: () => { } });
    return o;
  };

  // --------------------------------------------------------------- Drawing
  UI.prototype.draw = function (ctx, game) {
    const san = game.sanity, tier = san.tier(); const jit = tier >= 2 ? (tier - 1) : 0;
    const jx = jit ? Math.round((PH.hash(Math.floor(PH.time * 8), 1) - 0.5) * jit * 2) : 0, jy = jit ? Math.round((PH.hash(Math.floor(PH.time * 8), 2) - 0.5) * jit * 2) : 0;
    const gl = tier >= 2 ? (tier - 1) * 0.025 * (san.flicker ? 3 : 1) : 0;
    const textCol = '#e8e0d0';
    if (game.ending) return;
    // Room title
    if (this.roomTitleT > 0 && this.roomTitle) { ctx.globalAlpha = Math.min(1, this.roomTitleT); F.drawCentered(ctx, this.roomTitle.toUpperCase(), PH.W / 2, 96, { color: '#d8c9a6', shadow: '#000', glitch: gl }); ctx.globalAlpha = 1; }
    // Clock & day (top right)
    const hour = PH.mod(game.hour + (game.clockOffset || 0), 24);
    const clock = PH.fmtClock(hour); F.drawRight(ctx, clock, PH.W - 6 + jx, 5 + jy, { color: textCol, shadow: '#000', glitch: tier >= 3 ? 0.08 : 0 });
    F.drawRight(ctx, 'DAY ' + game.day, PH.W - 6 - jx, 14 - jy, { color: '#a89880', shadow: '#000' });
    // weather glyph
    if (game.weather.rain > 0.2) F.drawRight(ctx, '░ rain', PH.W - 6, 23, { color: '#7090a0', shadow: '#000' });
    // Care checklist (top left)
    const care = game.story.careDays[game.day] || {};
    const items = [['feed', 'seeds'], ['water', 'water'], ['clean', 'brush']];
    items.forEach((it, i) => { const x = 6 + i * 16 + jx, y = 5 + jy; ctx.globalAlpha = care[it[0]] ? 1 : 0.35; ctx.drawImage(PH.items.icon(it[1]), x, y); ctx.globalAlpha = 1; if (care[it[0]]) { ctx.fillStyle = '#7fd08a'; ctx.fillRect(x + 9, y + 9, 3, 3); } });
    F.draw(ctx, game.story.careComplete() ? 'birds cared for' : 'daily care', 6 + jx, 19 + jy, { color: game.story.careComplete() ? '#7fd08a' : '#a89880', shadow: '#000', glitch: gl });
    // Sanity indicator: an eye that narrows; not a bar
    this.drawEye(ctx, 6, 30, san);
    // Notifications
    let ny = 44; for (const n of this.notes) { ctx.globalAlpha = Math.min(1, n.t); const col = n.kind === 'phone' ? '#9fd0e0' : n.kind === 'journal' ? '#d8c080' : '#e8e0d0'; F.draw(ctx, n.text, 6 + jx, ny + jy, { color: col, shadow: '#000', glitch: gl }); ny += 9; ctx.globalAlpha = 1; }
    // Phone unread badge
    const un = game.phone.totalUnread(); if (un > 0 && !this.phoneOpen) { const bx = PH.W / 2 - 6, by = PH.H - 42 + Math.round(Math.sin(PH.time * 6) * 1); ctx.drawImage(PH.items.icon('phone'), bx, by); ctx.fillStyle = '#e04040'; ctx.fillRect(bx + 9, by - 2, 6, 6); F.draw(ctx, String(Math.min(9, un)), bx + 10, by - 2, { color: '#fff', scale: 1 }); }
    // Interaction prompt
    if (!this.blocking()) {
      const t = game.player.findTarget(game); if (t) { const px = Math.round(game.player.x - game.camx), py = Math.round(game.player.y - 46); let label = t.label; F.drawCentered(ctx, '[E] ' + label, px, py, { color: '#fff8e0', shadow: '#000', glitch: gl }); }
      const it = game.player.currentItem(); if (it && game.room === 'aviary' && it !== 'phone') { }
    }
    // Bird panel when near a bird
    if (game.room === 'aviary' && !this.blocking()) { const t = game.player.findTarget(game); if (t && t.type === 'bird') this.drawBirdPanel(ctx, t.obj, tier); }
    // Stare pressure vignette text
    if (san.pressure > 1.2 && !this.blocking()) { ctx.globalAlpha = PH.clamp((san.pressure - 1.2) / 1.5, 0, 1) * (0.6 + Math.sin(PH.time * 5) * 0.3); F.drawCentered(ctx, PH.pick(['look away', 'look away', 'leave', 'the birds', 'call someone']), PH.W / 2 + jx * 2, 90 + jy * 2, { color: '#c8b0b0', shadow: '#000', wobble: 1 }); ctx.globalAlpha = 1; }
    // Hotbar
    this.drawHotbar(ctx, game, tier);
    // Dialog
    if (this.dialog) this.drawDialog(ctx, game, gl);
    if (this.birdMenu) this.drawMenu(ctx, this.birdOptions(this.birdMenu.bird).map((o) => o.t), this.birdMenu.cursor, this.birdMenu.bird.name + ' - ' + this.birdMenu.bird.sp.name, (i) => { this.birdMenu.cursor = i; });
    if (this.phoneOpen) this.drawPhone(ctx, game, tier);
    if (this.journalOpen) this.drawJournal(ctx, game, PH.W / 2 - 150, 30, 300, 210);
    if (this.help) this.drawHelp(ctx);
    if (this.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, PH.W, PH.H);
      F.drawCentered(ctx, 'PAUSED', PH.W / 2, 72, { color: '#d8c9a6', scale: 2 });
      const rows = [
        ['Resume', () => { this.paused = false; }],
        ['Controls', () => { this.paused = false; this.help = true; }],
        ['Journal', () => { this.paused = false; this.journalOpen = true; this.journalPage = Math.max(0, game.story.fragments.length); }],
        [PH.audio.muted ? 'Sound: off' : 'Sound: on', () => PH.audio.toggleMute()],
      ];
      rows.forEach((r, i) => {
        const ry = 116 + i * 16;
        F.drawCentered(ctx, r[0], PH.W / 2, ry, { color: '#a89880' });
        PH.touch.region(PH.W / 2 - 72, ry - 5, 144, 16, () => { PH.audio.click(); r[1](); });
      });
      F.drawCentered(ctx, 'Progress saves when Adrian sleeps.', PH.W / 2, 198, { color: '#6a6058' });
      if (!PH.touch.enabled) F.drawCentered(ctx, 'Esc resume  -  H help  -  M mute', PH.W / 2, 212, { color: '#4a4139' });
    }
    // Breaking overlay
    if (san.breaking > 0 && san.value <= 0) { ctx.globalAlpha = Math.min(0.85, san.breaking / 45); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, PH.W, PH.H); ctx.globalAlpha = 1; F.drawCentered(ctx, PH.glitchText('go to the birds. or the phone. anything.', 0.15, 3), PH.W / 2, 130, { color: '#cbbfae', wobble: 1.5 }); }
  };
  UI.prototype.drawEye = function (ctx, x, y, san) {
    const v = san.value / 100; const open = Math.max(1, Math.round(3 * v + 0.5)); const tw = san.tier() >= 3 ? Math.round(Math.sin(PH.time * 20) * 0.6) : 0;
    ctx.fillStyle = '#000'; ctx.fillRect(x, y + 3 - open, 13, open * 2 + 1);
    ctx.fillStyle = v > 0.55 ? '#d8c9a6' : v > 0.3 ? '#b09070' : '#8a5050'; ctx.fillRect(x + 1, y + 3 - open + 1 + tw, 11, open * 2 - 1);
    ctx.fillStyle = '#1a1a1e'; ctx.fillRect(x + 5 + (san.tier() >= 2 ? Math.round(Math.sin(PH.time * 3) * 2) : 0), y + 2, 3, 3);
    if (san.flicker) { ctx.fillStyle = '#000'; ctx.fillRect(x, y, 13, 7); }
  };
  UI.prototype.drawHotbar = function (ctx, game, tier) {
    const pl = game.player, h = pl.hotbar(); const n = h.length; const w = n * 16 + 4; const x0 = Math.round(PH.W / 2 - w / 2), y0 = PH.H - 24;
    ctx.fillStyle = 'rgba(10,8,14,0.75)'; ctx.fillRect(x0, y0, w, 20);
    h.forEach((id, i) => {
      const rx = x0 + 2 + i * 16;
      if (!this.blocking()) PH.touch.region(rx - 1, y0, 16, 20, () => { pl.slot = i; PH.audio.click(); });
      let x = rx + (tier >= 3 && PH.hash(i, Math.floor(PH.time * 3)) < 0.06 ? 16 : 0);
      const sel = i === pl.slot; if (sel) { ctx.fillStyle = '#d8c9a6'; ctx.fillRect(x - 1, y0 + 1, 16, 18); ctx.fillStyle = '#2a2430'; ctx.fillRect(x, y0 + 2, 14, 16); }
      let icon = id; if (tier >= 4 && PH.hash(i, Math.floor(PH.time * 2)) < 0.08) icon = PH.pick(['record', 'photo', 'tape']);
      ctx.drawImage(PH.items.icon(icon), x + 1, y0 + 3);
      const cnt = pl.inv[id]; if (cnt > 1) F.draw(ctx, String(cnt), x + 9, y0 + 12, { color: '#fff', shadow: '#000' });
      if (sel) F.drawCentered(ctx, PH.items.label(id), PH.W / 2, y0 - 9, { color: '#d8c9a6', shadow: '#000', glitch: tier >= 2 ? 0.05 : 0 });
    });
    if (!PH.touch.enabled) { F.draw(ctx, 'Q/R', x0 - 22, y0 + 6, { color: '#6a6058' }); F.draw(ctx, 'F:use', x0 + w + 4, y0 + 6, { color: '#6a6058' }); }
  };
  UI.prototype.drawBirdPanel = function (ctx, b, tier) {
    const x = PH.W - (PH.touch.enabled ? 148 : 118), y = 34, w = 112, h = 62;
    ctx.fillStyle = 'rgba(10,8,14,0.8)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = b.sp.body; ctx.fillRect(x, y, 3, h);
    F.draw(ctx, b.name, x + 6, y + 3, { color: '#fff' }); F.draw(ctx, b.sp.name, x + 6, y + 11, { color: '#a89880' });
    F.draw(ctx, b.mood, x + 6, y + 20, { color: b.mood === 'frightened' || b.mood === 'unwell' || b.mood === 'starving' ? '#e07070' : '#c8d8a0', glitch: tier >= 3 ? 0.1 : 0 });
    const bars = [['food', 100 - b.needs.hunger, '#d0a050'], ['water', 100 - b.needs.thirst, '#60a0d0'], ['fun', 100 - b.needs.boredom, '#c080d0'], ['calm', 100 - b.needs.fear, '#80c0a0'], ['health', b.needs.health, '#e07070'], ['trust', b.trust, '#e8d080']];
    bars.forEach((bar, i) => { const bx = x + 6 + (i % 2) * 54, by = y + 30 + Math.floor(i / 2) * 10; F.draw(ctx, bar[0], bx, by, { color: '#8a7a68' }); ctx.fillStyle = '#2a2430'; ctx.fillRect(bx + 32, by + 2, 18, 3); ctx.fillStyle = bar[2]; ctx.fillRect(bx + 32, by + 2, Math.round(18 * PH.clamp(bar[1], 0, 100) / 100), 3); });
  };
  UI.prototype.drawDialog = function (ctx, game, gl) {
    const d = this.dialog; const line = d.lines[d.idx] || ''; const shown = line.slice(0, Math.floor(d.chars));
    const x = 20, w = PH.W - 40; const wrapped = PH.wrapText(shown, Math.floor((w - 16) / 6)); const fullWrapped = PH.wrapText(line, Math.floor((w - 16) / 6));
    const last = d.idx >= d.lines.length - 1; const choicesH = last && d.choices ? d.choices.length * 10 + 6 : 0;
    const h = fullWrapped.length * 9 + 16 + choicesH; const y = PH.H - 32 - h;
    ctx.fillStyle = 'rgba(8,6,12,0.9)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#4a4139'; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1);
    if (last && d.choices) PH.touch.region(x, y, w, h, () => PH.input.tap('KeyE'));
    else PH.touch.regionAll(() => PH.input.tap('KeyE'));
    wrapped.forEach((l, i) => F.draw(ctx, l, x + 8, y + 8 + i * 9, { color: '#e8e0d0', glitch: gl * 0.35 }));
    if (last && d.choices && d.chars >= line.length) {
      d.choices.forEach((c, i) => { const cy = y + 8 + fullWrapped.length * 9 + 4 + i * 10; PH.touch.region(x + 2, cy - 3, w - 4, 12, () => { d.cursor = i; PH.input.tap('KeyE'); }); if (i === d.cursor) { ctx.fillStyle = '#d8c9a6'; ctx.fillRect(x + 6, cy + 2, 3, 3); } F.draw(ctx, c.t, x + 14, cy, { color: i === d.cursor ? '#fff8e0' : '#a89880', glitch: gl * 0.4 }); });
    } else if (d.chars >= line.length) { F.drawRight(ctx, last ? '[E] close' : '[E] ...', x + w - 6, y + h - 9, { color: '#6a6058' }); }
  };
  UI.prototype.drawMenu = function (ctx, opts, cursor, title, onPick) {
    const w = 200, h = opts.length * 10 + 22, x = PH.W / 2 - w / 2, y = PH.H / 2 - h / 2;
    ctx.fillStyle = 'rgba(8,6,12,0.92)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#4a4139'; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1);
    F.draw(ctx, title, x + 8, y + 5, { color: '#d8c9a6' });
    opts.forEach((o, i) => { const cy = y + 16 + i * 10; if (onPick) PH.touch.region(x + 4, cy - 3, w - 8, 12, () => { onPick(i); PH.input.tap('KeyE'); }); if (i === cursor) { ctx.fillStyle = '#d8c9a6'; ctx.fillRect(x + 8, cy + 2, 3, 3); } F.draw(ctx, o, x + 16, cy, { color: i === cursor ? '#fff8e0' : '#a89880' }); });
  };
  UI.prototype.drawPhone = function (ctx, game, tier) {
    const ph = game.phone; const w = 150, h = 230, x = PH.W / 2 - w / 2, y = PH.H / 2 - h / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, PH.W, PH.H);
    ctx.fillStyle = '#16161c'; ctx.fillRect(x - 4, y - 8, w + 8, h + 16); ctx.fillStyle = '#0c1418'; ctx.fillRect(x, y, w, h);
    const gl = tier >= 2 ? tier * 0.02 : 0;
    // status bar
    F.draw(ctx, PH.fmtClock(PH.mod(game.hour + (game.clockOffset || 0), 24)), x + 4, y + 3, { color: '#8fb0b8' }); F.drawRight(ctx, tier >= 3 ? 'no signal' : '•••', x + w - 4, y + 3, { color: tier >= 3 ? '#a06060' : '#8fb0b8' });
    ctx.fillStyle = '#1e2a30'; ctx.fillRect(x, y + 12, w, 1);
    if (this.phoneTab === 'contacts') {
      F.draw(ctx, 'Messages', x + 6, y + 17, { color: '#e8e0d0' });
      const list = ph.visible();
      list.forEach((c, i) => {
        const cy = y + 30 + i * 20; const sel = i === this.cursor;
        PH.touch.region(x + 2, cy - 2, w - 4, 19, () => { this.cursor = i; PH.input.tap('KeyE'); });
        if (sel) { ctx.fillStyle = '#1a2a34'; ctx.fillRect(x + 2, cy - 2, w - 4, 19); }
        ctx.fillStyle = c.def.color; ctx.fillRect(x + 6, cy, 12, 12); F.draw(ctx, c.def.name[0], x + 9, cy + 2, { color: '#111' });
        F.draw(ctx, c.def.name + (c.def.dead ? '  (no service)' : ''), x + 22, cy, { color: c.def.dead ? '#707880' : '#e8e0d0', glitch: gl });
        const lastMsg = c.msgs.length ? c.msgs[c.msgs.length - 1].text : (c.def.role || '');
        F.draw(ctx, lastMsg.length > 19 ? lastMsg.slice(0, 18) + '…' : lastMsg, x + 22, cy + 8, { color: '#6a7a80', glitch: gl });
        if (c.unread) { ctx.fillStyle = '#e04040'; ctx.fillRect(x + w - 14, cy + 2, 8, 8); F.draw(ctx, String(c.unread), x + w - 13, cy + 3, { color: '#fff' }); }
      });
      const ny = y + 30 + list.length * 20; PH.touch.region(x + 2, ny - 3, w - 4, 14, () => { this.cursor = list.length; PH.input.tap('KeyE'); }); if (this.cursor === list.length) { ctx.fillStyle = '#1a2a34'; ctx.fillRect(x + 2, ny - 2, w - 4, 12); }
      F.draw(ctx, 'Notes (' + game.story.fragments.length + ')', x + 22, ny, { color: '#d8c080' });
      PH.touch.region(x, y + h - 15, w, 15, () => PH.input.tap('Tab'));
      F.drawCentered(ctx, PH.touch.enabled ? 'close' : 'Tab: close', x + w / 2, y + h - 10, { color: '#4a5a60' });
    } else if (this.phoneTab === 'chat') {
      const c = ph.selected; PH.touch.region(x, y + 13, 72, 14, () => PH.input.tap('Escape')); F.draw(ctx, '< ' + c.def.name, x + 6, y + 17, { color: '#e8e0d0' }); F.drawRight(ctx, c.def.role, x + w - 4, y + 17, { color: '#6a7a80' });
      // messages, bottom-up
      const choicesH = c.pending ? c.pending.choices.length * 10 + 12 : 12;
      let by = y + h - choicesH - 6; const end = c.msgs.length - this.phoneScroll;
      for (let i = end - 1; i >= 0; i--) {
        const m = c.msgs[i]; const maxc = 20; const lines = PH.wrapText(m.text, maxc); const mh = lines.length * 8 + 4;
        by -= mh + 3; if (by < y + 28) break;
        const mw = Math.min(w - 20, Math.max(...lines.map((l) => l.length)) * 6 + 8);
        const mx = m.from === 'me' ? x + w - 6 - mw : x + 6;
        if (m.from === 'sys') { F.drawCentered(ctx, m.text, x + w / 2, by + 2, { color: '#4a5a60' }); continue; }
        ctx.fillStyle = m.from === 'me' ? '#24404a' : (m.ghost ? '#2a1a20' : '#1e262c'); ctx.fillRect(mx, by, mw, mh);
        lines.forEach((l, k) => F.draw(ctx, l, mx + 4, by + 2 + k * 8, { color: m.ghost ? '#c09090' : '#e8e0d0', glitch: m.ghost ? 0.08 + gl : gl, seed: i }));
      }
      ctx.fillStyle = '#1e2a30'; ctx.fillRect(x, y + h - choicesH - 2, w, 1);
      if (c.pending) {
        c.pending.choices.forEach((ch, i) => { const cy = y + h - choicesH + 2 + i * 10; const sel = i === this.cursor; PH.touch.region(x + 2, cy - 2, w - 4, 11, () => { this.cursor = i; PH.input.tap('KeyE'); }); if (sel) { ctx.fillStyle = '#8fb0b8'; ctx.fillRect(x + 4, cy + 2, 3, 3); } const t = ch.t.length > 22 ? ch.t.slice(0, 21) + '…' : ch.t; F.draw(ctx, t, x + 10, cy, { color: sel ? '#fff' : '#8fa0a8', glitch: gl }); });
        const cy = y + h - 10; const sel = this.cursor === c.pending.choices.length; PH.touch.region(x + 2, cy - 2, w - 4, 11, () => { this.cursor = c.pending.choices.length; PH.input.tap('KeyE'); }); if (sel) { ctx.fillStyle = '#8fb0b8'; ctx.fillRect(x + 4, cy + 2, 3, 3); } F.draw(ctx, "Don't reply", x + 10, cy, { color: sel ? '#c09090' : '#6a5a60' });
      } else F.drawCentered(ctx, c.def.dead ? '[E] send anyway' : 'no new messages', x + w / 2, y + h - 10, { color: '#4a5a60' });
    } else if (this.phoneTab === 'notes') { this.drawJournal(ctx, game, x, y + 14, w, h - 14, true); }
  };
  UI.prototype.drawJournal = function (ctx, game, x, y, w, h, inPhone) {
    if (!inPhone) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, PH.W, PH.H); ctx.fillStyle = '#1a1712'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#4a4139'; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); }
    const fr = game.story.fragments; const maxc = Math.floor((w - 16) / 6);
    PH.touch.region(x, y + h - 16, w * 0.38, 16, () => PH.input.tap('ArrowLeft'));
    PH.touch.region(x + w * 0.62, y + h - 16, w * 0.38, 16, () => PH.input.tap('ArrowRight'));
    PH.touch.region(x + w * 0.38, y + h - 16, w * 0.24, 16, () => PH.input.tap(inPhone ? 'Escape' : 'KeyJ'));
    if (inPhone) PH.touch.region(x, y, 72, 12, () => PH.input.tap('Escape'));
    F.draw(ctx, inPhone ? '< Notes' : 'JOURNAL', x + 8, y + 5, { color: '#d8c080' });
    const page = this.journalPage; const total = fr.length + 1;
    F.drawRight(ctx, (page + 1) + '/' + total, x + w - 8, y + 5, { color: '#6a6058' });
    let yy = y + 18;
    if (page === fr.length) {
      // birds summary page
      F.draw(ctx, 'The birds', x + 8, yy, { color: '#e8e0d0' }); yy += 11;
      for (const b of game.flock.birds) { const t = b.dead ? 'gone' : b.mood + ', trust ' + Math.round(b.trust); F.draw(ctx, b.name + ': ' + t, x + 8, yy, { color: b.dead ? '#8a5050' : '#a89880' }); yy += 8; if (b.phrases.length && !b.dead) { F.draw(ctx, ' says: ' + b.phrases.slice(-3).join(', ').slice(0, maxc - 8), x + 8, yy, { color: '#7a8a70' }); yy += 8; } }
      yy += 4; F.draw(ctx, 'Replies sent: ' + game.story.totalReplies() + '   People: ' + game.story.distinctContacts(), x + 8, yy, { color: '#6a7a80' }); yy += 8;
      F.draw(ctx, 'Days of full care: ' + Math.round(game.story.careScore() * game.day) + '/' + game.day, x + 8, yy, { color: '#6a7a80' });
    } else if (fr[page]) {
      const f = fr[page]; F.draw(ctx, PH.wrapText(f.title, maxc)[0], x + 8, yy, { color: '#e8e0d0' }); yy += 10; F.draw(ctx, 'day ' + f.day, x + 8, yy, { color: '#6a6058' }); yy += 10;
      const lines = PH.wrapText(f.text.replace(/\n/g, ' '), maxc); for (const l of lines) { if (yy > y + h - 12) break; F.draw(ctx, l, x + 8, yy, { color: '#a89880', glitch: game.sanity.tier() >= 3 ? 0.03 : 0 }); yy += 8; }
    }
    F.drawCentered(ctx, PH.touch.enabled ? '\u2039  back  \u203a' : (inPhone ? 'up/down: pages' : 'arrows: pages  J: close'), x + w / 2, y + h - 9, { color: '#4a5a60' });
  };
  UI.prototype.drawHelp = function (ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, PH.W, PH.H);
    PH.touch.regionAll(() => PH.input.tap('KeyH'));
    if (PH.touch.enabled) { this.drawTouchHelp(ctx); return; }
    const L = ['HOLLOW DOME', '', 'Move: A/D or arrows     Hop: Space', 'Interact: E             Use item: F', 'Hotbar: 1-9, Q/R, wheel Phone: Tab', 'Journal: J              Breathe: hold Shift', 'Mute: M                 Pause: Esc', '', 'Feed, water and clean for the birds every day.', 'Then look after yourself. Answer the phone.', 'If something is hard to look at, look away.', 'You do not have to do this alone.', '', 'H to close'];
    L.forEach((l, i) => F.drawCentered(ctx, l, PH.W / 2, 40 + i * 12, { color: i === 0 ? '#d8c9a6' : '#a89880', scale: i === 0 ? 2 : 1 }));
  };
  UI.prototype.drawTouchHelp = function (ctx) {
    const L = ['HOLLOW DOME', '',
      'Arrows move him. Arrows also move the cursor in menus.',
      'E interacts and advances text. F uses the held item.',
      'The arrow-over-a-line button hops.',
      'Tap an item in the bar to hold it. Tap birds, bowls,',
      'doors and messages directly.',
      '',
      'The phone button opens his messages. The circle button',
      'is slow breathing: leave it on to steady him.',
      '',
      'Feed, water and clean for the birds every day.',
      'Then look after him. Answer people.',
      'If something is hard to look at, look away.',
      '', 'tap to close'];
    L.forEach((l, i) => F.drawCentered(ctx, l, PH.W / 2, 20 + i * 12, { color: i === 0 ? '#d8c9a6' : i === L.length - 1 ? '#4a5a60' : '#a89880', scale: i === 0 ? 2 : 1 }));
  };
  PH.UI = UI;
})(window.PH);
