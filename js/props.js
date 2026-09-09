// Procedurally drawn furniture / environment props. Each returns a cached canvas.
(function (PH) {
  'use strict';
  const G = PH.gfx, P = G.pal;
  const cache = {};
  const D = {};
  const O = '#14101a';

  D.couch = [64, 26, (p) => { p.rect(2, 8, 60, 14, '#5a3a4a'); p.rect(0, 4, 8, 20, '#6a4a5a'); p.rect(56, 4, 8, 20, '#6a4a5a'); p.rect(8, 4, 48, 8, '#6a4a5a'); p.rect(8, 12, 22, 6, '#7a5a6a'); p.rect(32, 12, 22, 6, '#7a5a6a'); p.rect(2, 22, 4, 4, '#2a1a20'); p.rect(58, 22, 4, 4, '#2a1a20'); p.rect(20, 6, 16, 5, '#9a7a5a'); }];
  D.fireplace = [52, 46, (p) => { p.rect(0, 0, 52, 46, '#6a5a58'); p.checker(0, 0, 52, 46, '#7a6a66'); p.rect(0, 0, 52, 4, '#3a3230'); p.rect(10, 10, 32, 36, '#1a1210'); p.rect(12, 40, 28, 6, '#2a2220'); p.rect(0, 4, 52, 2, '#8a7a76'); }];
  D.tv = [44, 30, (p) => { p.rect(0, 0, 44, 26, '#1a1a20'); p.rect(2, 2, 40, 22, '#0a0a10'); p.rect(18, 26, 8, 4, '#2a2a30'); p.rect(12, 29, 20, 1, '#2a2a30'); p.px(40, 24, '#ff3030'); }];
  D.recordplayer = [30, 22, (p) => { p.rect(0, 8, 30, 14, P.woodD); p.rect(1, 9, 28, 12, P.wood); p.rect(3, 4, 24, 5, '#3a3a40'); p.disc(14, 6, 9, '#1a1a1a'); p.disc(14, 6, 3, '#a03030'); p.rect(24, 1, 2, 7, '#8a8a90'); p.rect(0, 20, 30, 2, P.woodD); }];
  D.bookshelf = [40, 70, (p) => { p.rect(0, 0, 40, 70, P.woodD); for (let s = 0; s < 4; s++) { const y = 4 + s * 16; p.rect(2, y, 36, 14, '#2a1e16'); let x = 3; while (x < 36) { const w = 2 + Math.floor(PH.hash(x, s) * 3), h = 9 + Math.floor(PH.hash(x, s + 9) * 5); const cols = ['#7a3a3a', '#3a5a7a', '#6a6a3a', '#4a3a6a', '#8a7a5a', '#3a6a4a']; p.rect(x, y + 14 - h, w, h, cols[Math.floor(PH.hash(x, s + 3) * cols.length)]); x += w + 1; } p.rect(2, y + 14, 36, 2, P.wood); } }];
  D.window = [40, 44, (p) => { p.rect(0, 0, 40, 44, P.wood); p.rect(3, 3, 34, 38, '#8fb7d9'); p.rect(19, 3, 2, 38, P.wood); p.rect(3, 21, 34, 2, P.wood); p.rect(0, 41, 40, 3, P.woodL); }];
  D.window_night = [40, 44, (p) => { p.rect(0, 0, 40, 44, P.wood); p.rect(3, 3, 34, 38, '#0e1024'); p.rect(19, 3, 2, 38, P.wood); p.rect(3, 21, 34, 2, P.wood); p.rect(0, 41, 40, 3, P.woodL); }];
  D.lamp = [14, 46, (p) => { p.rect(6, 6, 2, 36, '#5a5a60'); p.rect(2, 40, 10, 4, '#3a3a40'); p.tri(0, 8, 14, 8, 7, -2, '#c8b890'); p.rect(0, 8, 14, 2, '#a89870'); }];
  D.rug = [80, 6, (p) => { p.rect(0, 0, 80, 6, '#6a2a2a'); p.rect(4, 1, 72, 4, '#8a3a3a'); p.checker(8, 2, 64, 2, '#a05050'); }];
  D.plant_dead = [20, 40, (p) => { p.rect(5, 30, 10, 10, '#6a4a3a'); p.rect(6, 29, 8, 1, '#8a6a5a'); p.line(10, 30, 8, 12, '#4a3a2a'); p.line(10, 30, 13, 16, '#4a3a2a'); p.line(8, 18, 4, 14, '#4a3a2a'); p.line(13, 20, 17, 17, '#4a3a2a'); p.px(3, 13, '#5a4a30'); p.px(17, 16, '#5a4a30'); p.rect(4, 38, 12, 1, '#3a2a20'); }];
  D.plant_bloom = [20, 40, (p) => { p.rect(5, 30, 10, 10, '#6a4a3a'); p.rect(6, 29, 8, 1, '#8a6a5a'); p.line(10, 30, 8, 12, '#3a6a2a'); p.line(10, 30, 13, 16, '#3a6a2a'); p.line(8, 18, 4, 14, '#3a6a2a'); p.line(13, 20, 17, 17, '#3a6a2a'); p.disc(8, 11, 3, '#5a9a3a'); p.disc(4, 13, 2, '#e05080'); p.disc(17, 16, 2.5, '#f0a0c0'); p.disc(13, 15, 2, '#5a9a3a'); p.px(4, 13, '#fff0a0'); p.px(17, 16, '#fff0a0'); }];
  D.photo_wall = [56, 30, (p) => { const fr = [[0, 2, 14, 12], [17, 0, 12, 14], [32, 3, 22, 12], [4, 17, 18, 12], [26, 18, 26, 11]]; fr.forEach((f, i) => { p.rect(f[0], f[1], f[2], f[3], '#2a2220'); p.rect(f[0] + 1, f[1] + 1, f[2] - 2, f[3] - 2, ['#8a9aa8', '#a89a8a', '#7a8a7a', '#9a8a9a', '#8a8a7a'][i]); p.rect(f[0] + 3, f[1] + f[3] - 5, 3, 3, '#c8a888'); if (i === 2) p.rect(f[0] + 12, f[1] + 4, 3, 5, '#c8a888'); if (i === 4) { p.rect(f[0] + 8, f[1] + 3, 2, 5, '#c8a888'); p.rect(f[0] + 14, f[1] + 3, 2, 5, '#c8a888'); } }); }];
  D.photo_wall_bad = [56, 30, (p) => { D.photo_wall[2](p); p.rect(33, 4, 20, 10, '#3a2a2a'); p.rect(27, 19, 24, 9, '#2a1a1a'); p.line(5, 18, 21, 28, '#1a1010'); for (let i = 0; i < 12; i++) p.px(34 + PH.hash(i, 1) * 18, 5 + PH.hash(i, 2) * 8, '#7a0b12'); }];
  D.mirror = [24, 40, (p) => { p.rect(0, 0, 24, 40, '#a08850'); p.rect(2, 2, 20, 36, '#8aa8b0'); p.rect(3, 3, 18, 34, '#9ab8c0'); p.line(5, 34, 18, 5, '#b0d0d8'); }];
  D.mirror_cracked = [24, 40, (p) => { D.mirror[2](p); p.line(12, 2, 8, 20, '#1a1a1a'); p.line(8, 20, 14, 37, '#1a1a1a'); p.line(8, 20, 2, 26, '#1a1a1a'); p.line(12, 12, 21, 8, '#1a1a1a'); }];
  D.door = [22, 50, (p) => { p.rect(0, 0, 22, 50, P.woodD); p.rect(2, 2, 18, 48, P.wood); p.rect(4, 5, 14, 18, P.woodD); p.rect(5, 6, 12, 16, P.woodL); p.rect(4, 27, 14, 18, P.woodD); p.rect(5, 28, 12, 16, P.woodL); p.px(17, 26, '#c8a850'); p.px(18, 26, '#c8a850'); }];
  D.door_open = [22, 50, (p) => { p.rect(0, 0, 22, 50, P.woodD); p.rect(2, 2, 18, 48, '#0a0810'); }];
  D.door_locked = [22, 50, (p) => { D.door[2](p); p.rect(6, 20, 10, 2, '#5a5a60'); p.rect(6, 28, 10, 2, '#5a5a60'); p.rect(9, 18, 4, 14, '#5a5a60'); p.rect(10, 22, 2, 6, '#c8a850'); }];
  D.door_glass = [24, 52, (p) => { p.rect(0, 0, 24, 52, '#7c8590'); p.rect(2, 2, 20, 48, '#a5d8e6'); p.rect(11, 2, 2, 48, '#7c8590'); p.rect(2, 25, 20, 2, '#7c8590'); p.line(4, 46, 9, 6, '#d0f0f8'); }];
  D.stairs = [60, 60, (p) => { for (let i = 0; i < 6; i++) { p.rect(i * 10, 50 - i * 10, 60 - i * 10, 10, P.wood); p.rect(i * 10, 50 - i * 10, 60 - i * 10, 2, P.woodL); } p.rect(0, 0, 3, 60, P.woodD); }];
  D.console = [40, 24, (p) => { p.rect(0, 0, 40, 3, P.woodL); p.rect(2, 3, 36, 4, P.wood); p.rect(3, 7, 3, 17, P.woodD); p.rect(34, 7, 3, 17, P.woodD); p.rect(14, 0 - 0, 12, 0, P.wood); p.rect(28, -8 + 8, 6, 0, P.wood); }];
  D.coatrack = [12, 50, (p) => { p.rect(5, 0, 2, 46, '#3a3a40'); p.rect(2, 46, 8, 4, '#3a3a40'); p.rect(1, 4, 10, 1, '#3a3a40'); p.rect(0, 6, 5, 20, '#3a4050'); p.rect(7, 6, 5, 16, '#5a3030'); }];
  D.chandelier = [30, 22, (p) => { p.rect(14, 0, 2, 8, '#8a8a70'); p.rect(2, 8, 26, 2, '#a89860'); for (let i = 0; i < 5; i++) { const x = 3 + i * 6; p.rect(x, 10, 2, 5, '#e8e0b0'); p.px(x, 16, '#fff8c0'); p.rect(x - 1, 17, 4, 2, '#a89860'); } }];
  D.fridge = [26, 56, (p) => { p.rect(0, 0, 26, 56, '#c8c8cc'); p.rect(1, 1, 24, 20, '#dcdce0'); p.rect(1, 23, 24, 32, '#dcdce0'); p.rect(20, 8, 2, 8, '#888'); p.rect(20, 28, 2, 12, '#888'); p.rect(4, 30, 6, 6, '#e0d060'); p.px(6, 31, '#333'); }];
  D.counter = [80, 30, (p) => { p.rect(0, 0, 80, 4, '#b0b0b8'); p.rect(0, 4, 80, 26, P.woodD); for (let i = 0; i < 4; i++) { p.rect(2 + i * 20, 6, 16, 22, P.wood); p.rect(8 + i * 20, 16, 4, 1, '#c8a850'); } p.rect(30, 1, 20, 3, '#8ab0c0'); p.rect(38, -6 + 6, 2, 1, '#ccc'); }];
  D.sink = [28, 30, (p) => { p.rect(0, 0, 28, 4, '#b0b0b8'); p.rect(2, 1, 24, 3, '#8ab0c0'); p.rect(12, -4 + 4, 2, 0, '#ccc'); p.rect(0, 4, 28, 26, P.woodD); p.rect(2, 6, 24, 22, P.wood); }];
  D.faucet = [10, 10, (p) => { p.rect(4, 2, 2, 8, '#c8c8d0'); p.rect(4, 2, 6, 2, '#c8c8d0'); p.px(9, 4, '#c8c8d0'); }];
  D.stove = [30, 30, (p) => { p.rect(0, 0, 30, 30, '#4a4a50'); p.rect(0, 0, 30, 4, '#6a6a70'); p.disc(8, 2, 3, '#2a2a2a'); p.disc(21, 2, 3, '#2a2a2a'); p.rect(3, 8, 24, 18, '#2a2a30'); p.rect(5, 10, 20, 12, '#1a1a20'); p.rect(4, 6, 22, 1, '#8a8a90'); }];
  D.kettle = [12, 10, (p) => { p.rect(2, 3, 8, 7, '#b0b0b8'); p.rect(3, 2, 6, 1, '#b0b0b8'); p.rect(10, 4, 2, 2, '#b0b0b8'); p.rect(4, 0, 4, 2, '#5a5a60'); }];
  D.table = [50, 26, (p) => { p.rect(0, 0, 50, 4, P.woodL); p.rect(2, 4, 3, 22, P.wood); p.rect(45, 4, 3, 22, P.wood); }];
  D.chair = [14, 26, (p) => { p.rect(2, 0, 2, 26, P.wood); p.rect(2, 0, 10, 2, P.wood); p.rect(2, 12, 12, 3, P.woodL); p.rect(11, 15, 2, 11, P.wood); p.rect(3, 15, 2, 11, P.wood); }];
  D.knives = [14, 12, (p) => { p.rect(2, 6, 10, 6, P.woodD); for (let i = 0; i < 4; i++) { p.rect(3 + i * 2.5, 0, 1, 6, '#2a2a30'); p.px(3 + i * 2.5, 1, '#c8c8d0'); } }];
  D.knives_bad = [14, 12, (p) => { p.rect(2, 6, 10, 6, P.woodD); for (let i = 0; i < 4; i++) { p.rect(3 + i * 2.5, -2 + 2, 1, 6, '#2a2a30'); p.px(3 + i * 2.5, 1, '#b3141c'); } p.rect(2, 11, 6, 1, '#7a0b12'); }];
  D.bed = [64, 30, (p) => { p.rect(0, 0, 6, 30, P.woodD); p.rect(0, 0, 64, 4, P.woodD); p.rect(4, 8, 58, 14, '#7a7a90'); p.rect(4, 8, 58, 4, '#a0a0b8'); p.rect(8, 6, 16, 6, '#e8e8f0'); p.rect(4, 20, 58, 6, '#4a4a60'); p.rect(4, 26, 58, 4, P.woodD); }];
  D.nightstand = [20, 22, (p) => { p.rect(0, 0, 20, 22, P.wood); p.rect(1, 1, 18, 3, P.woodL); p.rect(3, 7, 14, 6, P.woodD); p.rect(9, 9, 2, 2, '#c8a850'); p.rect(3, 14, 14, 6, P.woodD); p.rect(4, -6 + 6, 5, 0, '#fff'); }];
  D.pills = [8, 8, (p) => { p.rect(1, 2, 6, 6, '#e8a040'); p.rect(1, 1, 6, 2, '#f0f0f0'); p.px(3, 5, '#fff'); }];
  D.wardrobe = [40, 66, (p) => { p.rect(0, 0, 40, 66, P.woodD); p.rect(2, 2, 17, 62, P.wood); p.rect(21, 2, 17, 62, P.wood); p.rect(17, 30, 2, 6, '#c8a850'); p.rect(21, 30, 2, 6, '#c8a850'); p.rect(4, 4, 13, 26, P.woodL); p.rect(23, 4, 13, 26, P.woodL); }];
  D.wardrobe_open = [40, 66, (p) => { p.rect(0, 0, 40, 66, P.woodD); p.rect(2, 2, 36, 62, '#0a0810'); p.rect(2, 2, 6, 62, P.wood); p.rect(6, 10, 30, 2, '#5a5a60'); for (let i = 0; i < 5; i++) p.rect(9 + i * 6, 12, 4, 22, ['#3a4050', '#5a3030', '#2a2a30', '#4a4a5a', '#3a3a3a'][i]); }];
  D.bathtub = [56, 24, (p) => { p.rect(0, 4, 56, 20, '#e0e0e8'); p.rect(2, 2, 52, 4, '#f0f0f8'); p.rect(4, 6, 48, 10, '#b8d0e0'); p.rect(4, 20, 48, 2, '#c8c8d0'); p.rect(48, -4 + 4, 3, 6, '#b0b0b8'); }];
  D.bathtub_bad = [56, 24, (p) => { p.rect(0, 4, 56, 20, '#e0e0e8'); p.rect(2, 2, 52, 4, '#f0f0f8'); p.rect(4, 6, 48, 10, '#7a0b12'); p.rect(4, 6, 48, 2, '#b3141c'); p.rect(10, 16, 12, 6, '#7a0b12'); p.rect(30, 17, 20, 7, '#7a0b12'); p.rect(48, 0, 3, 6, '#b0b0b8'); p.line(20, 22, 26, 30, '#7a0b12'); }];
  D.cabinet = [24, 30, (p) => { p.rect(0, 0, 24, 30, '#d0d0d8'); p.rect(2, 2, 20, 26, '#a8c0c8'); p.rect(11, 2, 2, 26, '#d0d0d8'); p.px(9, 15, '#555'); p.px(14, 15, '#555'); }];
  D.toilet = [16, 26, (p) => { p.rect(2, 0, 12, 12, '#e8e8f0'); p.rect(0, 12, 16, 6, '#e8e8f0'); p.rect(3, 18, 10, 8, '#d8d8e0'); p.rect(2, 12, 12, 2, '#c0c8d0'); }];
  D.desk = [70, 30, (p) => { p.rect(0, 0, 70, 4, P.woodL); p.rect(0, 4, 70, 2, P.wood); p.rect(2, 6, 4, 24, P.woodD); p.rect(50, 6, 18, 24, P.wood); p.rect(52, 8, 14, 6, P.woodD); p.rect(52, 16, 14, 6, P.woodD); p.rect(58, 10, 2, 2, '#c8a850'); p.rect(58, 18, 2, 2, '#c8a850'); }];
  D.computer = [26, 22, (p) => { p.rect(0, 0, 26, 18, '#2a2a30'); p.rect(2, 2, 22, 14, '#1a2a30'); p.rect(10, 18, 6, 2, '#3a3a40'); p.rect(6, 20, 14, 2, '#3a3a40'); }];
  D.computer_on = [26, 22, (p) => { p.rect(0, 0, 26, 18, '#2a2a30'); p.rect(2, 2, 22, 14, '#0c2030'); for (let i = 0; i < 6; i++) p.rect(4, 4 + i * 2, 6 + Math.floor(PH.hash(i, 4) * 12), 1, '#4a9ab0'); p.rect(10, 18, 6, 2, '#3a3a40'); p.rect(6, 20, 14, 2, '#3a3a40'); }];
  D.monitors = [60, 40, (p) => { for (let i = 0; i < 6; i++) { const x = (i % 3) * 20, y = Math.floor(i / 3) * 20; p.rect(x, y, 19, 19, '#2a2a30'); p.rect(x + 1, y + 1, 17, 17, '#101418'); p.dither(x + 1, y + 1, 17, 17, '#2a3a40', 0.3); p.rect(x + 3, y + 12, 8, 5, '#3a4a50'); p.rect(x + 12, y + 14, 4, 1, '#4a8a5a'); } }];
  D.filing = [24, 50, (p) => { p.rect(0, 0, 24, 50, '#6a6a72'); for (let i = 0; i < 4; i++) { p.rect(2, 2 + i * 12, 20, 10, '#7a7a82'); p.rect(9, 6 + i * 12, 6, 2, '#3a3a40'); } }];
  D.safe = [24, 28, (p) => { p.rect(0, 0, 24, 28, '#3a3a44'); p.rect(2, 2, 20, 24, '#4a4a54'); p.disc(12, 14, 5, '#2a2a30'); p.disc(12, 14, 3, '#8a8a90'); p.rect(11, 10, 2, 4, '#3a3a44'); p.rect(19, 12, 2, 6, '#c8a850'); }];
  D.safe_open = [24, 28, (p) => { p.rect(0, 0, 24, 28, '#3a3a44'); p.rect(2, 2, 20, 24, '#0a0a10'); p.rect(3, 12, 8, 12, '#4a4a54'); p.rect(6, 6, 12, 8, '#8a7a5a'); }];
  D.whiteboard = [50, 34, (p) => { p.rect(0, 0, 50, 34, '#8a8a90'); p.rect(2, 2, 46, 30, '#e8e8e8'); p.line(6, 8, 30, 8, '#3a3a8a'); p.line(6, 14, 40, 14, '#3a3a8a'); p.line(6, 20, 20, 20, '#a03030'); p.disc(36, 22, 5, '#a03030'); p.line(6, 26, 44, 26, '#3a3a8a'); }];
  D.whiteboard_bad = [50, 34, (p) => { p.rect(0, 0, 50, 34, '#8a8a90'); p.rect(2, 2, 46, 30, '#e8e8e8'); for (let i = 0; i < 20; i++) p.line(4 + PH.hash(i, 1) * 40, 4 + PH.hash(i, 2) * 26, 4 + PH.hash(i, 3) * 40, 4 + PH.hash(i, 4) * 26, '#a03030'); p.rect(6, 26, 30, 5, '#7a0b12'); }];
  D.boxes = [40, 30, (p) => { p.rect(0, 12, 20, 18, '#8a6a40'); p.rect(4, 0, 18, 12, '#9a7a4a'); p.rect(20, 8, 20, 22, '#7a5a38'); p.rect(2, 20, 16, 1, '#5a4020'); p.rect(22, 18, 16, 1, '#5a4020'); p.rect(8, 4, 10, 1, '#5a4020'); }];
  D.boiler = [30, 60, (p) => { p.rect(2, 0, 26, 56, '#5a5a62'); p.rect(4, 2, 22, 52, '#6a6a72'); p.rect(0, 56, 30, 4, '#3a3a40'); p.rect(8, 10, 14, 14, '#2a2a30'); p.rect(10, 14, 10, 6, '#c04020'); p.rect(12, 30, 6, 6, '#8a8a90'); p.rect(14, 60 - 60, 2, 0, '#333'); p.rect(26, 20, 4, 30, '#4a4a50'); }];
  D.workbench = [60, 30, (p) => { p.rect(0, 0, 60, 4, P.woodL); p.rect(2, 4, 4, 26, P.woodD); p.rect(54, 4, 4, 26, P.woodD); p.rect(10, 2, 8, 1, '#8a8a90'); p.rect(30, 1, 6, 3, '#4a4a50'); p.rect(40, 2, 12, 1, '#a08050'); }];
  D.cage_old = [40, 50, (p) => { p.rect(0, 46, 40, 4, '#4a4a50'); p.rect(2, 4, 36, 42, '#2a2a30'); for (let x = 4; x < 38; x += 4) p.vline(x, 4, 42, '#7a7a80'); p.rect(2, 4, 36, 2, '#7a7a80'); p.rect(2, 44, 36, 2, '#7a7a80'); p.tri(2, 4, 38, 4, 20, -4, '#7a7a80'); p.rect(8, 30, 24, 1, '#5a4a30'); p.rect(14, 34, 12, 3, '#3a3a30'); }];
  D.cage_old_bird = [40, 50, (p) => { D.cage_old[2](p); p.ellipse(20, 27, 4, 3, '#3a3a3a'); p.disc(24, 24, 2, '#3a3a3a'); p.px(25, 24, '#7a0b12'); }];
  D.servers = [80, 60, (p) => { for (let i = 0; i < 4; i++) { const x = i * 20; p.rect(x, 0, 19, 60, '#1a1a22'); for (let j = 0; j < 12; j++) { p.rect(x + 2, 2 + j * 5, 15, 4, '#2a2a34'); p.px(x + 15, 3 + j * 5, PH.hash(i, j) < 0.6 ? '#30c050' : '#c03030'); } } }];
  D.tapes = [30, 20, (p) => { for (let i = 0; i < 3; i++) { p.rect(i * 10, 4 + (i % 2) * 2, 9, 14, '#1a1a1a'); p.rect(i * 10 + 1, 6 + (i % 2) * 2, 7, 3, '#e8e0c0'); } }];
  D.bench = [50, 22, (p) => { p.rect(0, 6, 50, 4, P.wood); p.rect(0, 0, 50, 3, P.wood); p.rect(2, 3, 46, 3, P.woodD); p.rect(3, 10, 3, 12, '#3a3a40'); p.rect(44, 10, 3, 12, '#3a3a40'); p.rect(3, 20, 44, 2, '#3a3a40'); }];
  D.fountain = [50, 34, (p) => { p.rect(0, 22, 50, 12, P.stone); p.rect(4, 24, 42, 8, '#6aa0b8'); p.rect(4, 24, 42, 2, '#9ac8d8'); p.rect(20, 6, 10, 18, P.stoneD); p.rect(14, 4, 22, 4, P.stone); p.rect(23, 0, 4, 6, P.stoneD); }];
  D.fountain_dry = [50, 34, (p) => { p.rect(0, 22, 50, 12, P.stone); p.rect(4, 24, 42, 8, '#5a5a56'); p.dither(4, 24, 42, 8, '#3a3a36', 0.4); p.rect(20, 6, 10, 18, P.stoneD); p.rect(14, 4, 22, 4, P.stone); p.rect(23, 0, 4, 6, P.stoneD); }];
  D.mailbox = [12, 34, (p) => { p.rect(5, 12, 2, 22, '#5a4a3a'); p.rect(0, 4, 12, 9, '#3a5a8a'); p.rect(0, 2, 12, 2, '#4a6a9a'); p.px(10, 8, '#c8a850'); }];
  D.shed = [70, 60, (p) => { p.rect(0, 14, 70, 46, '#6a5a48'); for (let y = 16; y < 60; y += 4) p.hline(0, y, 70, '#5a4a38'); p.tri(-4, 14, 74, 14, 35, -4, '#4a3a30'); p.rect(26, 26, 18, 34, '#3a2a20'); p.rect(28, 28, 14, 30, '#4a3a2a'); p.px(40, 44, '#c8a850'); p.rect(8, 24, 12, 10, '#8fb7d9'); p.rect(13, 24, 2, 10, '#5a4a38'); }];
  D.gate = [40, 60, (p) => { p.rect(0, 0, 6, 60, P.stoneD); p.rect(34, 0, 6, 60, P.stoneD); for (let x = 8; x < 34; x += 4) p.vline(x, 8, 52, '#2a2a30'); p.rect(6, 8, 28, 2, '#2a2a30'); p.rect(6, 30, 28, 2, '#2a2a30'); p.rect(6, 56, 28, 2, '#2a2a30'); p.rect(17, 24, 6, 8, '#5a5a60'); p.px(19, 27, '#c8a850'); }];
  D.hedge = [40, 24, (p) => { p.rect(0, 4, 40, 20, P.grassD); p.rect(2, 2, 36, 4, P.grass); for (let i = 0; i < 40; i++) p.px(PH.hash(i, 5) * 40, 3 + PH.hash(i, 6) * 20, PH.hash(i, 7) < 0.5 ? P.grassL : P.grassD); }];
  D.tree = [60, 110, (p) => { p.rect(26, 60, 8, 50, '#4a3626'); p.rect(28, 60, 2, 50, '#5c4632'); p.disc(30, 40, 26, '#2f4f2a'); p.disc(18, 50, 16, '#3a5f32'); p.disc(44, 48, 16, '#3a5f32'); p.disc(30, 28, 16, '#46733a'); for (let i = 0; i < 60; i++) p.px(6 + PH.hash(i, 8) * 48, 14 + PH.hash(i, 9) * 50, PH.hash(i, 10) < 0.5 ? P.grassL : '#2a4526'); }];
  D.tree_dead = [60, 110, (p) => { p.rect(26, 50, 8, 60, '#3a2a20'); p.line(30, 50, 12, 20, '#3a2a20'); p.line(30, 50, 48, 18, '#3a2a20'); p.line(30, 40, 30, 8, '#3a2a20'); p.line(20, 34, 8, 30, '#3a2a20'); p.line(40, 32, 54, 28, '#3a2a20'); p.line(12, 20, 6, 10, '#3a2a20'); p.line(48, 18, 56, 8, '#3a2a20'); }];
  D.flowers = [30, 12, (p) => { for (let i = 0; i < 6; i++) { const x = 2 + i * 5; p.vline(x, 4, 8, '#3a6a2a'); p.px(x, 3, ['#e05080', '#f0d040', '#f0f0f0', '#a060d0'][i % 4]); p.px(x - 1, 3, ['#e05080', '#f0d040', '#f0f0f0', '#a060d0'][i % 4]); p.px(x + 1, 3, ['#e05080', '#f0d040', '#f0f0f0', '#a060d0'][i % 4]); p.px(x, 2, ['#e05080', '#f0d040', '#f0f0f0', '#a060d0'][i % 4]); } }];
  D.flowers_dead = [30, 12, (p) => { for (let i = 0; i < 6; i++) { const x = 2 + i * 5; p.vline(x, 5, 7, '#5a4a30'); p.px(x + (i % 2 ? 1 : -1), 4, '#6a5a40'); } }];
  D.pool = [140, 30, (p) => { p.rect(0, 0, 140, 30, '#8a8a86'); p.rect(4, 4, 132, 24, '#2a6a8a'); p.rect(4, 4, 132, 3, '#4a9ab8'); for (let i = 0; i < 30; i++) p.px(6 + PH.hash(i, 11) * 128, 8 + PH.hash(i, 12) * 18, '#3a7a9a'); }];
  D.pool_bad = [140, 30, (p) => { p.rect(0, 0, 140, 30, '#8a8a86'); p.rect(4, 4, 132, 24, '#1a0608'); p.rect(4, 4, 132, 3, '#7a0b12'); for (let i = 0; i < 30; i++) p.px(6 + PH.hash(i, 11) * 128, 8 + PH.hash(i, 12) * 18, '#3a0a0e'); p.rect(60, 12, 20, 4, '#e8dcc8'); }];
  D.perch = [40, 6, (p) => { p.rect(0, 2, 40, 3, '#6b4a2f'); p.rect(0, 2, 40, 1, '#8d6640'); p.rect(0, 4, 40, 1, '#472f1c'); }];
  D.bowl = [14, 6, (p) => { p.rect(0, 0, 14, 6, '#8a8a90'); p.rect(1, 0, 12, 1, '#b0b0b8'); p.rect(2, 1, 10, 4, '#3a3a40'); }];
  D.nestbox = [18, 20, (p) => { p.rect(0, 2, 18, 18, P.wood); p.rect(0, 0, 18, 3, P.woodD); p.disc(9, 9, 3, '#0a0810'); p.rect(2, 16, 14, 1, P.woodL); }];
  D.swing = [20, 30, (p) => { p.vline(3, 0, 26, '#8a8a70'); p.vline(16, 0, 26, '#8a8a70'); p.rect(1, 26, 18, 3, '#6b4a2f'); p.disc(10, 4, 2, '#c8a040'); }];
  D.ladder = [12, 40, (p) => { p.vline(1, 0, 40, '#a08050'); p.vline(10, 0, 40, '#a08050'); for (let y = 3; y < 40; y += 6) p.hline(1, y, 10, '#c0a070'); }];
  D.rope = [4, 60, (p) => { for (let y = 0; y < 60; y++) p.px(1 + (y % 4 < 2 ? 0 : 1), y, y % 3 === 0 ? '#8a7a50' : '#a09060'); }];
  D.fern = [24, 20, (p) => { p.tri(12, 20, 0, 6, 12, 0, '#2a5a2a'); p.tri(12, 20, 24, 6, 12, 0, '#2a5a2a'); p.tri(12, 20, 4, 16, 12, 4, '#3a7a3a'); p.tri(12, 20, 20, 16, 12, 4, '#3a7a3a'); p.vline(12, 4, 16, '#1a3a1a'); }];
  D.pillar = [6, 100, (p) => { p.rect(0, 0, 6, 100, '#7c8590'); p.vline(1, 0, 100, '#9aa3ae'); p.vline(5, 0, 100, '#4a5058'); }];
  D.figure = [16, 40, (p) => { p.rect(4, 0, 8, 8, '#050407'); p.rect(3, 8, 10, 22, '#050407'); p.rect(4, 30, 3, 10, '#050407'); p.rect(9, 30, 3, 10, '#050407'); p.px(6, 3, '#e8e0d0'); p.px(9, 3, '#e8e0d0'); }];
  D.easel = [30, 50, (p) => { p.line(4, 50, 12, 6, '#5a4a30'); p.line(26, 50, 18, 6, '#5a4a30'); p.rect(3, 4, 24, 30, '#e8e0d0'); p.rect(4, 5, 22, 28, '#d8d0c0'); p.disc(15, 18, 7, '#8a9aa8'); p.disc(15, 18, 4, '#c8a888'); }];
  D.easel_bad = [30, 50, (p) => { p.line(4, 50, 12, 6, '#5a4a30'); p.line(26, 50, 18, 6, '#5a4a30'); p.rect(3, 4, 24, 30, '#e8e0d0'); p.rect(4, 5, 22, 28, '#d8d0c0'); p.disc(15, 18, 7, '#1a1a1a'); p.rect(8, 26, 14, 8, '#7a0b12'); p.px(12, 16, '#e8e0d0'); p.px(18, 16, '#e8e0d0'); }];
  D.piano = [70, 40, (p) => { p.rect(0, 0, 70, 30, '#1a1a1e'); p.rect(2, 30, 66, 3, '#e8e8e8'); for (let x = 3; x < 68; x += 4) p.rect(x, 30, 2, 2, '#1a1a1e'); p.rect(0, 33, 70, 2, '#1a1a1e'); p.rect(4, 35, 4, 5, '#1a1a1e'); p.rect(62, 35, 4, 5, '#1a1a1e'); }];
  D.clock = [14, 14, (p) => { p.disc(7, 7, 6, '#e8e0d0'); p.disc(7, 7, 7, '#5a4a30'); p.disc(7, 7, 6, '#e8e0d0'); p.vline(7, 3, 4, '#222'); p.hline(7, 7, 3, '#222'); }];
  D.painting = [30, 22, (p) => { p.rect(0, 0, 30, 22, '#8a7040'); p.rect(2, 2, 26, 18, '#5a7a9a'); p.rect(2, 12, 26, 8, '#3a5a3a'); p.disc(20, 7, 3, '#f0e0a0'); }];
  D.painting_bad = [30, 22, (p) => { p.rect(0, 0, 30, 22, '#8a7040'); p.rect(2, 2, 26, 18, '#2a1a1a'); p.rect(2, 12, 26, 8, '#1a0a0a'); p.disc(20, 7, 3, '#7a0b12'); p.rect(8, 8, 4, 10, '#050407'); }];
  D.wine = [24, 30, (p) => { p.rect(0, 0, 24, 30, P.woodD); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { p.disc(4 + i * 5.5, 5 + j * 9, 2, '#2a1a2a'); p.px(4 + i * 5.5, 5 + j * 9, '#5a2a3a'); } }];

  const Pr = {
    get(name) {
      if (cache[name]) return cache[name];
      const d = D[name]; if (!d) { console.warn('no prop', name); return G.make(8, 8, (p) => p.rect(0, 0, 8, 8, '#f0f')); }
      const c = G.make(d[0], d[1], (p) => { d[2](p); if (!d[3]) p.outline(d[0], d[1], O); });
      cache[name] = c; return c;
    },
    size(name) { const d = D[name]; return d ? [d[0], d[1]] : [8, 8]; },
    has(name) { return !!D[name]; },
  };
  PH.props = Pr;
})(window.PH);
