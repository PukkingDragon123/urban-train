// World: rooms, procedural backgrounds, doors, props, hazards, and interactions.
(function (PH) {
  'use strict';
  const G = PH.gfx, P = G.pal, Pr = PH.props;
  const W = {};
  const FLOOR = 222;

  // Room definitions. Prop: {p: propName, x, y(bottom), id, fromRight, interact, hazard:{rate,range}, layer:'back'|'front'}
  // Doors: {x, to, tx (arrival x), w, label, locked, key, hidden(fn)}
  const R = {};
  R.garden = { name: 'The Garden', outdoor: true, width: 1240, floor: 232, surface: 'grass', bg: 'garden',
    props: [
      { p: 'gate', x: 20, y: 232, id: 'gate', interact: 'gate' }, { p: 'hedge', x: 70, y: 232 }, { p: 'tree', x: 120, y: 236 }, { p: 'mailbox', x: 220, y: 232, id: 'mailbox', interact: 'mailbox' },
      { p: 'flowers', x: 250, y: 232, id: 'flowers1', alt: 'flowers_dead' }, { p: 'hedge', x: 380, y: 232 }, { p: 'bench', x: 470, y: 232, id: 'bench', interact: 'bench' }, { p: 'fountain', x: 560, y: 234, id: 'fountain', alt: 'fountain_dry' },
      { p: 'tree', x: 650, y: 236 }, { p: 'flowers', x: 720, y: 232, id: 'flowers2', alt: 'flowers_dead' }, { p: 'shed', x: 760, y: 232, id: 'shed', interact: 'shed' }, { p: 'hedge', x: 850, y: 232 },
      { p: 'tree', x: 1000, y: 236 }, { p: 'tree_dead', x: 1150, y: 236 }, { p: 'flowers_dead', x: 1090, y: 232 }, { p: 'hedge', x: 1190, y: 232 },
    ],
    doors: [
      { x: 300, to: 'foyer', tx: 60, label: 'Front door', kind: 'house' }, { x: 920, to: 'aviary', tx: 70, label: 'Aviary door', kind: 'glass' },
      { x: 1210, to: 'poolside', tx: 40, label: 'Path to the pool', kind: 'path', hidden: () => PH.game.day < 2 && PH.game.sanity.value > 60 },
    ],
  };
  R.foyer = { name: 'Foyer', width: 480, floor: FLOOR, surface: 'wood', wall: '#5a4a5e', wallD: '#3f3342', bg: 'interior',
    props: [{ p: 'coatrack', x: 100, y: FLOOR }, { p: 'console', x: 130, y: FLOOR, layer: 'back' }, { p: 'mirror', x: 140, y: 160, id: 'foyermirror', interact: 'mirror', hazard: { rate: 0.6, range: 40 }, alt: 'mirror_cracked' }, { p: 'chandelier', x: 225, y: 66 }, { p: 'stairs', x: 300, y: FLOOR, id: 'stairs' }, { p: 'painting', x: 250, y: 130, id: 'painting', alt: 'painting_bad' }, { p: 'clock', x: 200, y: 110, id: 'clock' }],
    doors: [{ x: 40, to: 'garden', tx: 320, label: 'Front door' }, { x: 440, to: 'living', tx: 50, label: 'Living room' }, { x: 200, to: 'study', tx: 60, label: 'Study', back: true }, { x: 330, to: 'hall', tx: 60, label: 'Upstairs', kind: 'stairs' }],
  };
  R.living = { name: 'Living Room', width: 660, floor: FLOOR, surface: 'wood', wall: '#4a4a5a', wallD: '#33333f', bg: 'interior',
    props: [{ p: 'window', x: 80, y: 170, id: 'lwindow', window: true }, { p: 'plant_dead', x: 130, y: FLOOR, id: 'plant', alt: 'plant_bloom' }, { p: 'bookshelf', x: 160, y: FLOOR }, { p: 'couch', x: 220, y: FLOOR, id: 'couch', interact: 'couch' }, { p: 'rug', x: 210, y: FLOOR + 2, layer: 'back' }, { p: 'tv', x: 320, y: 170, id: 'tv', interact: 'tv', hazard: { rate: 0.5, range: 50, cond: 'tvstatic' } }, { p: 'lamp', x: 300, y: FLOOR }, { p: 'fireplace', x: 380, y: FLOOR, id: 'fireplace' }, { p: 'photo_wall', x: 450, y: 150, id: 'photowall', interact: 'photowall', hazard: { rate: 0.45, range: 40 }, alt: 'photo_wall_bad' }, { p: 'recordplayer', x: 530, y: FLOOR, id: 'record', interact: 'record' }, { p: 'piano', x: 570, y: FLOOR, id: 'piano', interact: 'piano' }, { p: 'window', x: 590, y: 170, window: true }],
    doors: [{ x: 30, to: 'foyer', tx: 420, label: 'Foyer' }, { x: 640, to: 'kitchen', tx: 50, label: 'Kitchen' }],
  };
  R.kitchen = { name: 'Kitchen', width: 540, floor: FLOOR, surface: 'tile', wall: '#7a8a80', wallD: '#5a6a60', bg: 'interior',
    props: [{ p: 'fridge', x: 80, y: FLOOR, id: 'fridge', interact: 'fridge' }, { p: 'counter', x: 110, y: FLOOR, layer: 'back' }, { p: 'kettle', x: 120, y: FLOOR - 30, id: 'kettle', interact: 'kettle' }, { p: 'knives', x: 165, y: FLOOR - 30, id: 'knives', hazard: { rate: 0.7, range: 30, cond: 'lowsanity' }, alt: 'knives_bad' }, { p: 'sink', x: 200, y: FLOOR, id: 'sink', interact: 'sink' }, { p: 'faucet', x: 209, y: FLOOR - 30 }, { p: 'window', x: 195, y: 165, window: true }, { p: 'stove', x: 240, y: FLOOR }, { p: 'table', x: 320, y: FLOOR }, { p: 'chair', x: 305, y: FLOOR }, { p: 'chair', x: 372, y: FLOOR }, { p: 'clock', x: 340, y: 120 }, { p: 'wine', x: 440, y: 150, id: 'wine', interact: 'wine', hazard: { rate: 0.3, range: 30 } }],
    doors: [{ x: 30, to: 'living', tx: 610, label: 'Living room' }, { x: 490, to: 'basement', tx: 60, label: 'Basement', locked: true, key: 'key', kind: 'locked' }],
  };
  R.study = { name: 'Study', width: 520, floor: FLOOR, surface: 'wood', wall: '#4a3a3a', wallD: '#332828', bg: 'interior',
    props: [{ p: 'bookshelf', x: 90, y: FLOOR }, { p: 'desk', x: 170, y: FLOOR, id: 'desk' }, { p: 'computer', x: 180, y: FLOOR - 30, id: 'computer', interact: 'computer', hazard: { rate: 0.35, range: 40, cond: 'reading' }, alt: 'computer_on' }, { p: 'monitors', x: 270, y: 150, id: 'monitors', interact: 'monitors', hazard: { rate: 0.4, range: 40 } }, { p: 'filing', x: 350, y: FLOOR }, { p: 'safe', x: 390, y: FLOOR, id: 'safe', interact: 'safe', alt: 'safe_open' }, { p: 'whiteboard', x: 400, y: 150, id: 'whiteboard', interact: 'whiteboard', alt: 'whiteboard_bad' }, { p: 'window', x: 460, y: 170, window: true }, { p: 'lamp', x: 240, y: FLOOR }],
    doors: [{ x: 40, to: 'foyer', tx: 210, label: 'Foyer' }],
  };
  R.hall = { name: 'Upstairs Hall', width: 560, floor: FLOOR, surface: 'wood', wall: '#5a5a6a', wallD: '#40404c', bg: 'interior',
    props: [{ p: 'painting', x: 150, y: 130, id: 'hallpainting', alt: 'painting_bad' }, { p: 'window', x: 260, y: 170, window: true }, { p: 'plant_dead', x: 330, y: FLOOR, id: 'plant2', alt: 'plant_bloom' }, { p: 'lamp', x: 480, y: FLOOR }, { p: 'clock', x: 400, y: 110, id: 'hallclock' }],
    doors: [{ x: 40, to: 'foyer', tx: 340, label: 'Downstairs', kind: 'stairs' }, { x: 200, to: 'bedroom', tx: 50, label: 'Bedroom', back: true }, { x: 380, to: 'bathroom', tx: 50, label: 'Bathroom', back: true }, { x: 530, to: 'longhall', tx: 40, label: 'Door', hidden: () => PH.game.sanity.value > 45 && !PH.game.flags.longhall_open, kind: 'strange' }],
  };
  R.bedroom = { name: 'Bedroom', width: 440, floor: FLOOR, surface: 'wood', wall: '#3a4a5a', wallD: '#28343f', bg: 'interior',
    props: [{ p: 'wardrobe', x: 90, y: FLOOR, id: 'wardrobe', interact: 'wardrobe', alt: 'wardrobe_open' }, { p: 'bed', x: 160, y: FLOOR, id: 'bed', interact: 'bed' }, { p: 'nightstand', x: 230, y: FLOOR, id: 'nightstand' }, { p: 'pills', x: 236, y: FLOOR - 22, id: 'pills', interact: 'pills', hazard: { rate: 0.8, range: 34 } }, { p: 'window', x: 280, y: 170, window: true }, { p: 'easel', x: 350, y: FLOOR, id: 'easel', interact: 'easel', hazard: { rate: 0.4, range: 40 }, alt: 'easel_bad' }, { p: 'lamp', x: 400, y: FLOOR }],
    doors: [{ x: 40, to: 'hall', tx: 215, label: 'Hall' }],
  };
  R.bathroom = { name: 'Bathroom', width: 360, floor: FLOOR, surface: 'tile', wall: '#a8b8b8', wallD: '#7a8a8a', bg: 'interior', tiles: true,
    props: [{ p: 'toilet', x: 90, y: FLOOR }, { p: 'sink', x: 130, y: FLOOR, id: 'bathsink', interact: 'sink' }, { p: 'faucet', x: 139, y: FLOOR - 30 }, { p: 'mirror', x: 130, y: 172, id: 'mirror', interact: 'mirror', hazard: { rate: 1.0, range: 40 }, alt: 'mirror_cracked' }, { p: 'cabinet', x: 180, y: 160, id: 'cabinet', interact: 'cabinet' }, { p: 'bathtub', x: 230, y: FLOOR, id: 'bathtub', hazard: { rate: 0.7, range: 44, cond: 'lowsanity' }, alt: 'bathtub_bad', interact: 'bathtub' }],
    doors: [{ x: 40, to: 'hall', tx: 395, label: 'Hall' }],
  };
  R.basement = { name: 'Basement', width: 600, floor: FLOOR + 10, surface: 'stone', wall: '#3a3a3a', wallD: '#2a2a2a', bg: 'basement', dark: true,
    props: [{ p: 'boxes', x: 100, y: FLOOR + 10, id: 'boxes', interact: 'boxes' }, { p: 'boiler', x: 180, y: FLOOR + 10 }, { p: 'workbench', x: 250, y: FLOOR + 10, id: 'workbench', interact: 'workbench' }, { p: 'cage_old', x: 360, y: FLOOR + 10, id: 'oldcage', interact: 'oldcage', hazard: { rate: 0.6, range: 40 }, alt: 'cage_old_bird' }, { p: 'boxes', x: 480, y: FLOOR + 10 }],
    doors: [{ x: 40, to: 'kitchen', tx: 470, label: 'Upstairs', kind: 'stairs' }, { x: 560, to: 'archive', tx: 50, label: 'Steel door', kind: 'steel', hidden: () => PH.game.day < 2 }],
  };
  R.archive = { name: 'Archive', width: 520, floor: FLOOR + 10, surface: 'stone', wall: '#22262a', wallD: '#161a1e', bg: 'archive', dark: true,
    props: [{ p: 'servers', x: 90, y: FLOOR + 10, id: 'servers' }, { p: 'desk', x: 200, y: FLOOR + 10 }, { p: 'tapes', x: 210, y: FLOOR - 20, id: 'tapes', interact: 'tapes', hazard: { rate: 0.4, range: 40 } }, { p: 'monitors', x: 300, y: 150, id: 'archmonitors', interact: 'monitors' }, { p: 'filing', x: 400, y: FLOOR + 10 }],
    doors: [{ x: 40, to: 'basement', tx: 530, label: 'Basement' }, { x: 490, to: 'aviary2', tx: 60, label: 'Glass door', kind: 'glass', hidden: () => PH.game.sanity.value > 35 && !PH.game.flags.aviary2_seen }],
  };
  R.longhall = { name: '', width: 1500, floor: FLOOR, surface: 'wood', wall: '#5a5a6a', wallD: '#40404c', bg: 'longhall', hazard: 'ambient',
    props: [], doors: [{ x: 30, to: 'hall', tx: 500, label: 'Back' }, { x: 1470, to: 'aviary', tx: 400, label: '?', kind: 'glass' }],
  };
  R.aviary2 = { name: '', width: 720, floor: 232, surface: 'stone', bg: 'aviary2', hazard: 'ambient', dark: true,
    props: [], doors: [{ x: 40, to: 'archive', tx: 460, label: 'Back' }],
  };
  R.poolside = { name: 'Poolside', width: 620, floor: 232, surface: 'stone', outdoor: true, bg: 'poolside',
    props: [{ p: 'pool', x: 200, y: 234, id: 'pool', interact: 'pool', hazard: { rate: 0.5, range: 80, cond: 'night' }, alt: 'pool_bad' }, { p: 'bench', x: 100, y: 232 }, { p: 'bench', x: 480, y: 232 }, { p: 'lamp', x: 60, y: 232 }, { p: 'lamp', x: 560, y: 232 }, { p: 'hedge', x: 580, y: 232 }],
    doors: [{ x: 20, to: 'garden', tx: 1180, label: 'Garden path', kind: 'path' }],
  };
  R.aviary = { name: 'The Aviary', width: 900, floor: 232, surface: 'grass', bg: 'aviary', glass: true,
    props: [{ p: 'fern', x: 140, y: 232 }, { p: 'fern', x: 520, y: 232 }, { p: 'fern', x: 800, y: 232 }, { p: 'nestbox', x: 250, y: 120, id: 'nest1' }, { p: 'nestbox', x: 700, y: 110, id: 'nest2' }, { p: 'ladder', x: 600, y: 200 }],
    doors: [{ x: 40, to: 'garden', tx: 940, label: 'Garden', kind: 'glass' }],
    perches: [{ x1: 110, x2: 210, y: 160 }, { x1: 180, x2: 300, y: 120 }, { x1: 300, x2: 420, y: 150 }, { x1: 260, x2: 340, y: 195 }, { x1: 400, x2: 520, y: 105 }, { x1: 470, x2: 600, y: 170 }, { x1: 560, x2: 680, y: 130 }, { x1: 650, x2: 780, y: 190 }, { x1: 720, x2: 840, y: 100 }, { x1: 780, x2: 860, y: 160 }],
    climbs: [{ x: 460, y1: 60, y2: 165 }, { x: 250, y1: 60, y2: 120 }, { x: 730, y1: 60, y2: 100 }],
    bowls: [{ x: 160, y: 232, kind: 'food', amount: 4, food: 'seeds', id: 'bowlA' }, { x: 240, y: 195, kind: 'food', amount: 3, food: 'pellets', id: 'bowlB' }, { x: 700, y: 190, kind: 'food', amount: 2, food: 'fruit', id: 'bowlC' }, { x: 340, y: 232, kind: 'water', amount: 6, id: 'waterA' }, { x: 640, y: 232, kind: 'water', amount: 5, id: 'waterB' }],
    toys: [{ x: 370, y: 100, type: 'bell' }, { x: 580, y: 60, type: 'swing' }, { x: 460, y: 60, type: 'rope' }, { x: 810, y: 60, type: 'swing' }],
  };
  W.rooms = R;

  // Runtime prop state
  W.init = function () {
    for (const id in R) { const r = R[id]; r.id = id; r.stretch = 1; for (const p of r.props) { p.state = {}; p.altActive = false; } }
  };
  W.room = (id) => R[id];
  W.effWidth = (r) => Math.round(r.width * r.stretch);
  W.propX = (r, p) => { // rooms stretch: props on right half slide with the far wall
    if (p.x > r.width / 2) return p.x + W.effWidth(r) - r.width; return p.x;
  };
  W.doorX = (r, d) => d.x > r.width / 2 ? d.x + W.effWidth(r) - r.width : d.x;
  W.visibleDoors = (r) => r.doors.filter((d) => !d.hidden || !d.hidden());

  // ---------------------------------------------------------------- Backgrounds
  const bgCache = {};
  function interiorTile(r) {
    const key = 'int_' + r.id; if (bgCache[key]) return bgCache[key];
    const c = G.make(96, 270, (p) => {
      const wall = r.wall || P.wallpaper, wallD = r.wallD || P.wallpaperD;
      p.rect(0, 0, 96, 270, wall);
      if (r.tiles) { for (let y = 40; y < r.floor; y += 12) for (let x = 0; x < 96; x += 12) { p.rect(x, y, 12, 12, (x / 12 + y / 12) % 2 ? wall : wallD); p.hline(x, y, 12, PH.shade(wall, 0.8)); } }
      else { for (let y = 40; y < r.floor; y += 16) for (let x = 0; x < 96; x += 24) { p.px(x + 4 + ((y / 16) % 2) * 12, y + 6, wallD); p.px(x + 5 + ((y / 16) % 2) * 12, y + 7, wallD); p.px(x + 3 + ((y / 16) % 2) * 12, y + 7, wallD); p.px(x + 4 + ((y / 16) % 2) * 12, y + 8, wallD); } for (let x = 0; x < 96; x += 48) p.vline(x, 40, r.floor - 40, PH.shade(wall, 0.92)); }
      // ceiling & molding
      p.rect(0, 0, 96, 40, PH.shade(wall, 0.55)); p.rect(0, 38, 96, 3, PH.shade(wall, 1.3)); p.rect(0, 41, 96, 1, PH.shade(wall, 0.7));
      // baseboard
      p.rect(0, r.floor - 8, 96, 8, PH.shade(wall, 0.7)); p.rect(0, r.floor - 8, 96, 1, PH.shade(wall, 1.2));
      // floor
      if (r.surface === 'tile') { for (let y = r.floor; y < 270; y += 8) for (let x = 0; x < 96; x += 16) { p.rect(x, y, 16, 8, ((x / 16 + y / 8) % 2) ? P.tile : P.tileD); p.hline(x, y, 16, '#6a645c'); p.vline(x, y, 8, '#6a645c'); } }
      else if (r.surface === 'stone') { p.rect(0, r.floor, 96, 48, '#4a4a48'); p.dither(0, r.floor, 96, 48, '#3a3a38', 0.3); p.hline(0, r.floor, 96, '#5a5a58'); }
      else { for (let y = r.floor; y < 270; y += 6) { p.rect(0, y, 96, 6, (y / 6) % 2 ? P.floor : P.floorL); p.hline(0, y, 96, P.woodD); for (let x = (y / 6 % 3) * 32; x < 96; x += 48) p.vline(x, y, 6, P.woodD); } }
      // floor gradient darkening toward bottom
      for (let y = r.floor + 20; y < 270; y++) p.dither(0, y, 96, 1, '#000000', (y - r.floor - 20) / 60);
    });
    bgCache[key] = c; return c;
  }
  W.sky = function (hour) {
    // returns [top, bottom] colors
    const h = hour;
    const K = [[0, '#07071a', '#0f0f24'], [5, '#1a1a3a', '#3a2a40'], [6.5, '#d99a7a', '#f0c8a0'], [8, '#8fb7d9', '#cfe0ea'], [13, '#7fb0dd', '#c8dce8'], [17.5, '#a08ab0', '#e8a070'], [19, '#3a2438', '#8a4a50'], [21, '#0d0d24', '#1a1a34'], [24, '#07071a', '#0f0f24']];
    let i = 0; while (i < K.length - 2 && K[i + 1][0] <= h) i++;
    const a = K[i], b = K[i + 1], t = PH.clamp((h - a[0]) / (b[0] - a[0]), 0, 1);
    return [PH.mix(a[1], b[1], t), PH.mix(a[2], b[2], t)];
  };
  W.daylight = function (hour) { // 0 night .. 1 day
    if (hour < 5 || hour > 21) return 0; if (hour < 7.5) return (hour - 5) / 2.5; if (hour > 18) return 1 - (hour - 18) / 3; return 1;
  };

  W.drawBackground = function (ctx, r, camx, env) {
    const eff = W.effWidth(r);
    if (r.bg === 'interior' || r.bg === 'basement' || r.bg === 'archive' || r.bg === 'longhall') {
      const tile = interiorTile(r);
      for (let x = -PH.mod(camx, 96); x < PH.W; x += 96) ctx.drawImage(tile, x, 0);
      if (r.bg === 'longhall') { // repeating doors, growing in number
        const count = 10 + Math.floor(env.distortion * 20);
        for (let i = 0; i < count; i++) { const dx = 120 + i * 130 - camx; if (dx > -30 && dx < PH.W) { ctx.drawImage(Pr.get(i % 3 === 2 ? 'door_open' : 'door'), dx, r.floor - 50); if (i % 4 === 1) ctx.drawImage(Pr.get('painting_bad'), dx + 40, 130); } }
        // the hall's far end looks like the aviary
        const endx = eff - 60 - camx; if (endx < PH.W + 100) { ctx.fillStyle = '#a5d8e6'; ctx.globalAlpha = 0.5; ctx.fillRect(endx - 40, 40, 200, r.floor - 40); ctx.globalAlpha = 1; }
      }
      if (r.bg === 'basement' || r.bg === 'archive') { // pipes
        ctx.fillStyle = '#5a5a60'; ctx.fillRect(0, 44, PH.W, 3); ctx.fillStyle = '#3a3a40'; ctx.fillRect(0, 47, PH.W, 1);
        for (let x = -PH.mod(camx, 140) + 30; x < PH.W; x += 140) { ctx.fillStyle = '#5a5a60'; ctx.fillRect(x, 44, 4, 30); ctx.fillStyle = env.flicker ? '#e8e0b0' : '#a8a080'; ctx.fillRect(x - 3, 74, 10, 3); }
      }
      // wall clock / windows drawn as props. Doors: back wall doors
      return;
    }
    // Outdoor / aviary: sky
    const sky = W.sky(env.hour);
    const g = ctx.createLinearGradient(0, 0, 0, r.floor); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, PH.W, r.floor);
    // stars
    const dl = W.daylight(env.hour);
    if (dl < 0.5) { ctx.fillStyle = 'rgba(255,255,255,' + (0.5 - dl) * 1.6 + ')'; for (let i = 0; i < 60; i++) { const sx = PH.mod(i * 97 + 13 - camx * 0.1, PH.W), sy = (i * 53) % 140; if (PH.hash(i, Math.floor(PH.time * 2)) > 0.1) ctx.fillRect(sx, sy, 1, 1); } }
    // moon
    if (dl < 0.6) { const mx = PH.mod(300 - camx * 0.05, PH.W + 40) - 20, my = 50; ctx.fillStyle = 'rgba(240,235,210,' + (0.6 - dl) * 1.5 + ')'; ctx.beginPath(); ctx.arc(mx, my, 9, 0, 6.29); ctx.fill(); ctx.fillStyle = sky[0]; ctx.beginPath(); ctx.arc(mx + 4, my - 3, 8, 0, 6.29); ctx.fill(); }
    // sun
    if (dl > 0.2 && env.hour < 18) { const sx = 60 + (env.hour - 6) / 12 * (PH.W - 120), sy = 120 - Math.sin((env.hour - 6) / 12 * Math.PI) * 90; ctx.fillStyle = 'rgba(255,240,200,' + dl * 0.9 + ')'; ctx.beginPath(); ctx.arc(sx, sy, 7, 0, 6.29); ctx.fill(); }
    // clouds (parallax)
    ctx.fillStyle = dl > 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(120,120,150,0.25)';
    for (let i = 0; i < 7; i++) { const cx = PH.mod(i * 190 + PH.time * (4 + i) - camx * 0.15, PH.W + 120) - 60, cy = 30 + (i * 37) % 60; ctx.fillRect(cx, cy, 40 + i * 6, 6); ctx.fillRect(cx + 8, cy - 4, 24 + i * 3, 4); ctx.fillRect(cx + 14, cy + 6, 20, 3); }
    // far hills (parallax)
    ctx.fillStyle = PH.mix('#1a2a2a', sky[1], 0.35 * dl); for (let x = 0; x < PH.W; x += 2) { const h = 30 + PH.noise1((x + camx * 0.2) * 0.01) * 40; ctx.fillRect(x, r.floor - 20 - h, 2, h + 20); }
    ctx.fillStyle = PH.mix('#142018', sky[1], 0.2 * dl); for (let x = 0; x < PH.W; x += 2) { const h = 10 + PH.noise1((x + camx * 0.4) * 0.02 + 50) * 30; ctx.fillRect(x, r.floor - 10 - h, 2, h + 10); }
    // distant house silhouette for garden/pool
    if (r.bg !== 'aviary' && r.bg !== 'aviary2') {
      const hx = (r.bg === 'garden' ? 300 : -200) - camx * 0.6; ctx.fillStyle = PH.mix('#2a2430', sky[1], 0.15 * dl);
      ctx.fillRect(hx - 140, r.floor - 130, 280, 130); ctx.beginPath(); ctx.moveTo(hx - 150, r.floor - 130); ctx.lineTo(hx, r.floor - 190); ctx.lineTo(hx + 150, r.floor - 130); ctx.fill();
      const lit = dl < 0.5 && PH.game && PH.game.day > 0; for (let i = 0; i < 6; i++) { const wx = hx - 110 + i * 40; ctx.fillStyle = lit && ((i + PH.game.day) % 3 !== 0) ? 'rgba(255,220,150,0.6)' : 'rgba(40,40,60,0.6)'; ctx.fillRect(wx, r.floor - 100, 14, 18); ctx.fillRect(wx, r.floor - 60, 14, 18); }
    }
    // ground
    if (r.bg === 'aviary' || r.bg === 'aviary2') {
      const dead = r.bg === 'aviary2';
      // dome interior: floor planting
      ctx.fillStyle = dead ? '#2a2a2a' : '#3a4a2a'; ctx.fillRect(0, r.floor, PH.W, 270 - r.floor);
      for (let x = 0; x < PH.W; x++) { const wx = x + camx; const h = 2 + PH.hash(wx, 3) * 5 + (dead ? 0 : Math.sin(PH.time * 2 + wx * 0.2) * env.wind * 1.5); ctx.fillStyle = dead ? '#3a3a38' : (PH.hash(wx, 4) < 0.5 ? P.grass : P.grassL); ctx.fillRect(x, r.floor - h, 1, h + 2); }
      ctx.fillStyle = dead ? '#1e1e1e' : '#2a3a20'; ctx.fillRect(0, r.floor + 6, PH.W, 270 - r.floor);
    } else {
      // grass
      ctx.fillStyle = P.grassD; ctx.fillRect(0, r.floor, PH.W, 270 - r.floor);
      for (let x = 0; x < PH.W; x++) { const wx = x + camx; const h = 3 + PH.hash(wx, 1) * 6 + Math.sin(PH.time * 3 + wx * 0.15) * env.wind * 2; ctx.fillStyle = PH.hash(wx, 2) < 0.5 ? P.grass : P.grassL; ctx.fillRect(x, r.floor - h, 1, h + 1); }
      // path
      ctx.fillStyle = r.bg === 'poolside' ? '#8a8a86' : P.dirt; ctx.fillRect(0, r.floor + 6, PH.W, 10); ctx.fillStyle = PH.shade(P.dirt, 0.8); for (let x = -PH.mod(camx, 20); x < PH.W; x += 20) ctx.fillRect(x, r.floor + 9, 8, 2);
      ctx.fillStyle = '#1e2a18'; ctx.fillRect(0, r.floor + 16, PH.W, 270 - r.floor - 16);
    }
  };

  // Dome: drawn after props (frame) and again in front for glass reflections.
  W.drawDomeBack = function (ctx, r, camx, env) {
    const eff = W.effWidth(r), dead = r.bg === 'aviary2';
    const cx = eff / 2 - camx, top = 28, floor = r.floor; const rx = eff / 2 + 20, ry = floor - top;
    ctx.save();
    // glass tint interior back wall
    ctx.beginPath(); ctx.ellipse(cx, floor, rx, ry, 0, Math.PI, 0); ctx.closePath();
    ctx.fillStyle = dead ? 'rgba(40,40,50,0.35)' : 'rgba(165,216,230,0.10)'; ctx.fill();
    // frame ribs
    ctx.strokeStyle = dead ? 'rgba(58,58,64,0.8)' : 'rgba(74,80,88,0.45)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) { const a = Math.PI + (i / 10) * Math.PI; ctx.beginPath(); ctx.moveTo(cx, floor); ctx.lineTo(cx + Math.cos(a) * rx, floor + Math.sin(a) * ry); ctx.stroke(); }
    for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.ellipse(cx, floor, rx * k / 3.2, ry * k / 3.2, 0, Math.PI, 0); ctx.stroke(); }
    ctx.restore();
  };
  W.drawDomeFront = function (ctx, r, camx, env) {
    const eff = W.effWidth(r), dead = r.bg === 'aviary2';
    const cx = eff / 2 - camx, top = 28, floor = r.floor; const rx = eff / 2 + 20, ry = floor - top;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(cx, floor, rx, ry, 0, Math.PI, 0); ctx.closePath(); ctx.clip();
    // reflections: sheen bands that drift
    const dl = W.daylight(env.hour);
    for (let i = 0; i < 4; i++) {
      const bx = PH.mod(i * 170 + PH.time * 6 - camx * 0.3, eff + 200) - 100 - camx * 0 ; ctx.fillStyle = 'rgba(255,255,255,' + (0.05 + dl * 0.06) + ')';
      ctx.beginPath(); ctx.moveTo(bx, top); ctx.lineTo(bx + 30, top); ctx.lineTo(bx - 60, floor); ctx.lineTo(bx - 90, floor); ctx.fill();
    }
    // rain streaks on glass
    if (env.rain > 0) { ctx.fillStyle = 'rgba(200,230,240,' + env.rain * 0.4 + ')'; for (let i = 0; i < 40 * env.rain; i++) { const x = PH.hash(i, 9) * PH.W, y = PH.mod(PH.hash(i, 10) * 300 + PH.time * (30 + PH.hash(i, 11) * 40), floor); ctx.fillRect(x, y, 1, 4); } }
    // dust in light
    // frame outer
    ctx.restore();
    ctx.strokeStyle = dead ? '#4a4a50' : P.metal; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, floor, rx, ry, 0, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = dead ? '#4a4a50' : P.metal; ctx.fillRect(0, floor - 2, PH.W, 4);
    // cracks in the dead dome
    if (dead) { ctx.strokeStyle = '#111'; ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { const x = PH.hash(i, 21) * eff - camx, y = top + PH.hash(i, 22) * 80; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20, y + 40); ctx.lineTo(x + 10, y + 70); ctx.stroke(); } }
  };

  // ---------------------------------------------------------------- Interactions
  const T = {}; // interaction handlers
  const say = (lines, opts) => PH.game.say(lines, opts);
  const g = () => PH.game;
  T.gate = function () {
    const st = g().story;
    if (st.canLeave()) { say(['The gate is unlocked. It has been unlocked the whole time.', 'The road goes down the hill and into the rest of the world.'], { choices: [{ t: 'Not yet. The birds need feeding first.', f: () => { } }, { t: 'Walk down to the road.', f: () => g().beginEnding('connection') }] }); return; }
    say(PH.pick([['The gate is locked. You do not remember locking it.', 'Beyond it: the road, the hill, forty minutes of nothing, then the city.'], ['You put your hand on the cold bars.', 'Teodor still has a key. Teodor has not used it in weeks.'], ['Somewhere down there people are having lunch.']]));
    g().sanity.exposure('gate', 0.4);
  };
  T.mailbox = function () { g().story.readClipping(); };
  T.bench = function () { g().sitDown('bench'); };
  T.shed = function () {
    const pl = g().player;
    if (!g().flags.shed) { g().flags.shed = true; pl.giveItem('flashlight', 1); pl.giveItem('toy', 2); pl.giveItem('brush', 1); say(['Garden tools. A flashlight that still works. Two bells the birds have not seen yet.', 'You take what is useful.']); PH.audio.pickup(); }
    else { pl.giveItem('toy', 1); say(['Cobwebs, fertiliser, a ladder you never use.', 'There is one more bell in a box.']); PH.audio.pickup(); }
  };
  T.fridge = function () { const pl = g().player; pl.giveItem('seeds', 5); pl.giveItem('pellets', 5); pl.giveItem('fruit', 4); pl.giveItem('nuts', 4); pl.giveItem('treat', 3); PH.audio.pickup(); say(['Seed, pellets, chopped mango, walnuts. The birds eat better than you do.', PH.game.sanity.value < 50 ? 'Behind the fruit there is something wrapped in foil you do not remember buying.' : 'You take enough for the day.']); g().story.flag('took_food'); };
  T.kettle = function () { const pl = g().player; if (pl.hasItem('tea')) { say(['You already have a cup going cold somewhere.']); return; } pl.giveItem('tea', 1); PH.audio.pour(); say(['You put the kettle on. The sound fills the kitchen for a while.', 'Tea. Something to hold.']); g().sanity.ground(4, 'tea'); };
  T.sink = function () { const pl = g().player; pl.giveItem('water', 6); PH.audio.pour(); say(['You fill the watering can. The tap shudders the way it always has.']); };
  T.wine = function () { say(g().sanity.value > 50 ? ['A wall of bottles. Gifts from people who wanted things.', 'You leave them.'] : ['A wall of bottles. Most of them are empty.', 'You do not remember that.']); g().sanity.exposure('wine', 1); };
  T.couch = function () { g().sitDown('couch'); };
  T.tv = function () {
    const f = g().flags; f.tv = !f.tv; PH.audio.click();
    if (f.tv) { const s = g().sanity.value; if (s > 55) say(g().story.tvLine()); else say(['Static. Every channel.', 'For a moment the static arranges itself into a room very much like this one.']); }
    else say(['Off.']);
  };
  T.photowall = function () { g().story.viewPhotos(); };
  T.record = function () { const on = !PH.audio.musicPlaying(); PH.audio.music(on); g().flags.music = on; say(on ? ['The needle finds the groove. Something slow, from before.', 'Your shoulders come down half an inch.'] : ['You lift the needle. The room is very quiet.']); };
  T.piano = function () { g().playPiano(); };
  T.mirror = function (prop) { g().sanity.mirrorInteract(prop); };
  T.bed = function () { g().trySleep(); };
  T.pills = function (prop) {
    const s = g().sanity;
    if (g().flags.pills_away) { say(['The drawer is closed. You leave it closed.']); s.ground(2, 'choice'); return; }
    say(['Your prescription. The bottle is heavier than it should be; you keep forgetting whether you have taken today\'s.', 'You are aware of how long you have been looking at it.'], { choices: [{ t: 'Put the bottle in the drawer.', f: () => { g().flags.pills_away = true; s.ground(8, 'choice'); g().story.flag('pills_away'); say(['You put it away. It is a small thing. It counts.']); } }, { t: 'Leave it where it is.', f: () => { s.exposure('pills', 4); } }] });
  };
  T.easel = function () { g().story.viewEasel(); };
  T.wardrobe = function (prop) { prop.altActive = !prop.altActive; PH.audio.door(); if (prop.altActive) { if (g().sanity.value < 40 && !g().flags.wardrobe_figure) { g().flags.wardrobe_figure = true; g().sanity.hallucinate('figure_wardrobe'); } else say(['Suits. Twelve of them, the same charcoal grey.', 'Mara\'s coat is still on the last hanger.']); } };
  T.cabinet = function () { const pl = g().player; pl.giveItem('medicine', 2); pl.giveItem('bandage', 2); PH.audio.pickup(); say(['Bird medicine from the avian vet, antiseptic, bandages.', 'Your own prescriptions are in the bedroom. You do not think about that.']); };
  T.bathtub = function (prop) { if (prop.altActive) { say(['You do not look at the bathtub.', 'You do not look at the bathtub.']); g().sanity.exposure('tub', 3); } else say(['Cold porcelain. You cannot remember the last time you ran a bath.']); };
  T.computer = function () { g().story.readRecords(); };
  T.monitors = function () { g().story.viewFootage(); };
  T.safe = function (prop) { const pl = g().player; if (prop.altActive) { say(['Empty now.']); return; } if (g().flags.records_read) { prop.altActive = true; pl.giveItem('key', 1); PH.audio.pickup(); say(['The combination was Mara\'s birthday. It was always Mara\'s birthday.', 'Inside: a brass key labelled B, and nothing else.']); g().story.flag('got_key'); } else say(['A safe. You have not opened it in months and the combination has slid out of your head.', 'Something on the computer might remind you.']); };
  T.whiteboard = function () { say(g().sanity.value > 45 ? ['Q3 targets. A diagram of the dome\'s climate system. A phone number with no name.', 'In the corner, in Mara\'s handwriting: "eat something".'] : ['The board is covered edge to edge in the same three words.', 'You do not read them aloud.']); if (g().sanity.value <= 45) g().sanity.exposure('board', 2); };
  T.boxes = function () { g().story.viewBoxPhoto(); };
  T.workbench = function () { const pl = g().player; pl.giveItem('bandage', 1); say(['Wire cutters, perch brackets, a half-built nest box.', 'You built the first perches yourself, before there was money for people to build them for you.']); g().sanity.ground(2, 'memory'); };
  T.oldcage = function () { g().story.viewOldCage(); };
  T.tapes = function () { g().story.viewTapes(); };
  T.pool = function () { const night = g().isNight(); if (night) { say(['The pool lights are on. The water is very still and very dark.', 'You could stand here a long time.']); g().sanity.exposure('pool', 3); } else say(['Nobody has swum in it since the summer. Leaves turn slowly on the surface.']); };

  W.interact = function (prop) { const h = T[prop.interact]; if (h) h(prop); };
  PH.world = W;
})(window.PH);
