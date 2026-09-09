// Title screen, the dead aviary, and the three endings.
(function (PH) {
  'use strict';
  const F = PH.font, G = PH.gfx, Pr = PH.props;
  const E = {};

  E.drawTitle = function (ctx, game) {
    const t = PH.time;
    const g = ctx.createLinearGradient(0, 0, 0, PH.H); g.addColorStop(0, '#07071a'); g.addColorStop(1, '#1a1a34'); ctx.fillStyle = g; ctx.fillRect(0, 0, PH.W, PH.H);
    for (let i = 0; i < 80; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + PH.hash(i, Math.floor(t * 2)) * 0.5) + ')'; ctx.fillRect((i * 97 + 13) % PH.W, (i * 53) % 150, 1, 1); }
    // dome silhouette lit from inside
    const fy = 184, rx = 126, ry = 90;
    ctx.fillStyle = '#0c0c18'; ctx.fillRect(0, fy, PH.W, PH.H - fy);
    ctx.beginPath(); ctx.ellipse(PH.W / 2, fy, rx, ry, 0, Math.PI, 0); ctx.fillStyle = 'rgba(255,230,180,0.10)'; ctx.fill();
    ctx.strokeStyle = '#4a5058'; ctx.lineWidth = 1; ctx.stroke();
    for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; ctx.beginPath(); ctx.moveTo(PH.W / 2, fy); ctx.lineTo(PH.W / 2 + Math.cos(a) * rx, fy + Math.sin(a) * ry); ctx.stroke(); }
    // bird silhouettes on perches
    ctx.fillStyle = '#1a1a26'; ctx.fillRect(PH.W / 2 - 74, 142, 56, 2); ctx.fillRect(PH.W / 2 + 18, 124, 64, 2);
    [[PH.W / 2 - 56, 142], [PH.W / 2 - 36, 142], [PH.W / 2 + 36, 124], [PH.W / 2 + 64, 124]].forEach((p, i) => { const bob = Math.sin(t * 2 + i) * 0.5; ctx.fillStyle = '#1a1a26'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 5 + bob, 5, 4, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(p[0] + 4, p[1] - 9 + bob, 3, 0, 7); ctx.fill(); });
    // a man, small, at the dome door
    ctx.fillStyle = '#0a0a12'; ctx.fillRect(PH.W / 2 + 118, 162, 5, 22);
    F.drawCentered(ctx, 'HOLLOW DOME', PH.W / 2, 30, { color: '#d8c9a6', scale: 3, glitch: 0.01 });
    F.drawCentered(ctx, 'six parrots. one man. a house on a hill.', PH.W / 2, 60, { color: '#8a7a68' });
    const opts = game.titleOpts();
    opts.forEach((o, i) => {
      const y = 188 + i * 12;
      PH.touch.region(PH.W / 2 - 84, y - 5, 168, 13, () => { game.titleCursor = i; PH.input.tap('KeyE'); });
      if (i === game.titleCursor) { ctx.fillStyle = '#d8c9a6'; ctx.fillRect(PH.W / 2 - 62, y + 2, 3, 3); }
      F.drawCentered(ctx, o.t, PH.W / 2, y, { color: i === game.titleCursor ? '#fff8e0' : '#a89880' });
    });
    ctx.fillStyle = '#8a1220'; ctx.fillRect(PH.W / 2 - 122, 230, 1, 22);
    ['Contains psychological horror: depression, suicidal', 'ideation (non-instructional), blood, surreal imagery.', 'If any of it is close to home, please tell someone.']
      .forEach((l, i) => F.draw(ctx, l, PH.W / 2 - 114, 230 + i * 8, { color: '#6a6058' }));
    F.drawCentered(ctx, PH.touch.enabled ? 'tap an option' : 'Enter to choose  -  H for help', PH.W / 2, 257, { color: '#4a4139' });
  };

  E.drawDeadAviary = function (ctx, game, camx, env) {
    const room = PH.world.room('aviary2');
    // dead perches with six dark shapes that face you
    const perches = [[110, 210, 160], [300, 420, 150], [470, 600, 170], [560, 680, 130], [650, 780, 190], [180, 300, 120]];
    perches.forEach((p, i) => { const x1 = p[0] - camx, x2 = p[1] - camx; ctx.fillStyle = '#3a3a3a'; ctx.fillRect(x1, p[2], x2 - x1, 3); const bx = (x1 + x2) / 2; const pl = game.player.x - camx; const dir = pl > bx ? 1 : -1; ctx.fillStyle = '#0a0a0c'; ctx.beginPath(); ctx.ellipse(bx, p[2] - 5, 6, 5, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(bx + dir * 4, p[2] - 10, 3.5, 0, 7); ctx.fill(); if (PH.hash(i, Math.floor(PH.time * 1.5)) < 0.7) { ctx.fillStyle = '#7a0b12'; ctx.fillRect(bx + dir * 5, p[2] - 11, 1, 1); } });
    // empty bowls, dust
    for (let i = 0; i < 5; i++) ctx.drawImage(Pr.get('bowl'), 150 + i * 120 - camx, room.floor - 6);
    F.drawCentered(ctx, PH.glitchText('nobody came', 0.2, 4), 360 - camx, 60, { color: '#3a3a44' });
  };

  // ---- Endings ----
  E.begin = function (game, kind) {
    game.ending = { kind, t: 0, stage: 0 }; game.fade = 0; PH.audio.music(false); PH.audio.setEnvironment({ outdoor: false, wind: 0, rain: 0, dread: kind === 'connection' ? 0 : 0.6, whisper: 0 });
    localStorage.removeItem('hollowdome_save');
  };
  E.update = function (dt, game) {
    const e = game.ending; e.t += dt;
    const I = PH.input; if ((I.just('interact') || I.just('use')) && e.t > 0.8) { e.stage++; e.t = 0; PH.audio.click(); }
    const script = E.scripts[e.kind](game);
    if (e.stage >= script.length) { game.toTitle(); }
  };
  E.scripts = {
    connection: (game) => {
      const st = game.story, alive = game.flock.alive(); const names = alive.map((b) => b.name);
      return [
        { bg: 'road', lines: ['You walk down to the road.', 'It takes twelve minutes. Noor is sitting on the wall by the gate with a loaf of bread in a paper bag, and she does not get up, because she knows that if she gets up you will stop.'] },
        { bg: 'road', lines: ['"Hi," she says.', '"Hi."', 'That is all either of you can manage for a while. The dome glows behind you. ' + (alive.length === 6 ? 'All six of them are fed.' : (alive.length + ' of them are fed. You will carry the others for a long time.')) ] },
        { bg: 'road', lines: [st.has('confront_fire') ? 'You tell her about the spreadsheet. The one line. You tell her their names. She already knows them; she has been to the inquiry twice, in the back row, for you.' : 'You do not tell her about the spreadsheet yet. But you tell her that there is one, and that you will.', 'She says: "Ok." Then: "Come and eat something."'] },
        { bg: 'dome', lines: ['Later, the two of you stand in the aviary with the lights low. ' + (names.includes('Pepper') ? 'Pepper says goodnight in your mother\'s voice and Noor makes a sound like she has been hit.' : 'The birds settle in a row.'), (names.includes('Wren') ? 'Wren sings, briefly, from the top perch. She only does that when she feels safe.' : 'It is quiet.'), 'Nothing is fixed. The inquiry is in March. Mara is not coming back. The board voted.'] },
        { bg: 'dome', lines: ['But the phone is on the workbench, face up, with the sound turned on.', 'And in the morning the birds will need feeding, and you will feed them, and then - in that order if you must, but both - you will feed yourself.', 'CONNECTION', 'The birds trusted you ' + Math.round(game.flock.avgTrust()) + '%. You answered ' + st.totalReplies() + ' messages from ' + st.distinctContacts() + ' people. You looked at ' + st.confronted + ' things you did not want to look at.', 'Thank you for playing.'] },
      ];
    },
    aviary: (game) => {
      const alive = game.flock.alive();
      return [
        { bg: 'dome', lines: ['You stop going into the house.', 'There is a tap in the aviary and a sack of seed in the shed and the phone runs out of charge on the third day, face down in the fern, and you do not notice.'] },
        { bg: 'dome', lines: ['The birds are magnificent. You have never cared for them better. ' + (alive.length === 6 ? 'All six' : 'The ' + alive.length + ' that remain') + ' come to your hands. Marlowe sleeps against your neck. Even Wren.', 'At night the dome is so bright it can be seen from the city, and you have stopped wondering who is looking.'] },
        { bg: 'dome2', lines: ['One morning you notice the glass has no edge. You walk toward the wall and the perches continue. There is another Pepper on the next branch, and beyond her, another.', 'The garden is gone. The house is gone. There is only the dome, and it is exactly as large as you need it to be, and it goes on.'] },
        { bg: 'dome2', lines: ['Somewhere, faintly, someone is knocking on glass. A woman\'s voice says a name that used to be yours.', 'Pepper tilts her head. "Who is it," she says, in your mother\'s voice.', 'You do not know. You feed the birds.'] },
        { bg: 'dome2', lines: ['THE AVIARY', 'You are with them. Whether you are asleep, or alive, or in a white room somewhere being asked to blink twice, the birds are fed, and they are not afraid, and they trust you ' + Math.round(game.flock.avgTrust()) + '%.', 'Whatever this is, you built it for them. Whatever this is, it has no door.', 'Thank you for playing.'] },
      ];
    },
    collapse: (game) => {
      const alive = game.flock.alive(); const trust = game.flock.avgTrust();
      return [
        { bg: 'black', lines: ['The house is very quiet.', 'You go up the stairs. You do not remember deciding to.', 'From the aviary, faintly, something says "goodnight" in a voice you have not heard in a year.'] },
        { bg: 'black', lines: ['', '', ''] },
        { bg: 'house_after', lines: ['Teodor finds the gate unlocked on Friday.', 'He does not go into the house. He has been told not to, by the police, who are kind and slow and who do not tell him anything he does not already know from the way the lights were left on.'] },
        { bg: 'dome_after', lines: ['The dome is warm. The birds have not been fed for two days.', (alive.length ? (trust > 60 ? 'They come to him anyway, because he has a face they know from the shed, and because there is nobody else. ' : 'They will not come to him. They scream from the high perches until he leaves the seed and backs away. ') : 'The dome is silent. He does not go in.'), (game.flock.get('pepper') && !game.flock.get('pepper').dead ? 'Pepper says, in a voice he has never heard, "Sign it, Adrian", and then, in another voice, softer: "Feed the birds. Then feed yourself."' : '')] },
        { bg: 'dome_after', lines: ['Noor takes them. All ' + alive.length + '. It takes a week to arrange and she does not sleep, and on the first night in her flat Wren sings at 3am and she sits on the kitchen floor and listens to the whole thing.', 'The house stays on the hill. The dome stays lit for a month on a timer nobody can find, and then, one evening, goes dark.'] },
        { bg: 'black', lines: ['COLLAPSE', 'He had six reasons. On the last night none of them were in the room, and no one else was either.', 'If any of this is close to home: please tell someone. Anyone. A full stop. A bird emoji.', 'Thank you for playing.'] },
      ];
    },
  };
  E.draw = function (ctx, game) {
    const e = game.ending;
    PH.touch.regionAll(() => PH.input.tap('KeyE')); const script = E.scripts[e.kind](game); const s = script[Math.min(e.stage, script.length - 1)];
    // background
    ctx.fillStyle = '#050407'; ctx.fillRect(0, 0, PH.W, PH.H);
    if (s.bg === 'road') { const g = ctx.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#d99a7a'); g.addColorStop(1, '#f0c8a0'); ctx.fillStyle = g; ctx.fillRect(0, 0, PH.W, 200); ctx.fillStyle = '#2a3a28'; ctx.fillRect(0, 200, PH.W, 70); ctx.fillStyle = '#5b4632'; ctx.beginPath(); ctx.moveTo(200, 200); ctx.lineTo(280, 200); ctx.lineTo(480, 270); ctx.lineTo(60, 270); ctx.fill(); ctx.drawImage(Pr.get('gate'), 300, 140); ctx.fillStyle = '#3a3a3a'; ctx.fillRect(340, 180, 60, 20); ctx.drawImage(game.player.frames.idle[0], 250, 168); ctx.fillStyle = '#5a3a4a'; ctx.fillRect(350, 160, 10, 20); ctx.fillStyle = '#d9b39a'; ctx.fillRect(351, 152, 8, 8); ctx.fillStyle = '#c8a060'; ctx.fillRect(362, 170, 8, 6); }
    else if (s.bg === 'dome' || s.bg === 'dome2' || s.bg === 'dome_after') {
      const dead = s.bg === 'dome_after'; const g = ctx.createLinearGradient(0, 0, 0, 230); g.addColorStop(0, dead ? '#3a3a4a' : '#0d0d24'); g.addColorStop(1, dead ? '#8a8a9a' : '#1a1a34'); ctx.fillStyle = g; ctx.fillRect(0, 0, PH.W, 230);
      const reps = s.bg === 'dome2' ? 5 : 1;
      for (let r = 0; r < reps; r++) { const cx = PH.W / 2 + (r - 2) * 190 * (s.bg === 'dome2' ? 1 : 0); ctx.beginPath(); ctx.ellipse(cx, 230, 200, 170, 0, Math.PI, 0); ctx.fillStyle = dead ? 'rgba(165,216,230,0.15)' : 'rgba(255,230,180,0.12)'; ctx.fill(); ctx.strokeStyle = '#4a5058'; ctx.lineWidth = 2; ctx.stroke(); for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; ctx.beginPath(); ctx.moveTo(cx, 230); ctx.lineTo(cx + Math.cos(a) * 200, 230 + Math.sin(a) * 170); ctx.stroke(); } }
      ctx.fillStyle = '#2a3a20'; ctx.fillRect(0, 230, PH.W, 40);
      // birds
      const birds = game.flock.alive(); birds.forEach((b, i) => { b.x = 120 + i * 60 + Math.sin(PH.time + i) * 2; b.y = 150 + (i % 2) * 30; b.dir = i % 2 ? -1 : 1; b.state = 'perch'; b.anim.puff.t = 1.1; b.updateAnim(1 / 60, {}); ctx.fillStyle = '#6b4a2f'; ctx.fillRect(b.x - 20, b.y, 40, 3); b.draw(ctx, 0, 0); });
      if (!dead) ctx.drawImage(game.player.frames.idle[Math.floor(PH.time * 2) % 4], 60, 196);
      if (s.bg === 'dome' && e.kind === 'connection') { ctx.fillStyle = '#5a3a4a'; ctx.fillRect(84, 200, 10, 22); ctx.fillStyle = '#d9b39a'; ctx.fillRect(85, 192, 8, 8); ctx.fillStyle = '#2a2321'; ctx.fillRect(84, 190, 10, 4); }
      if (dead) { ctx.fillStyle = '#3a4050'; ctx.fillRect(400, 200, 10, 30); ctx.fillStyle = '#d9b39a'; ctx.fillRect(401, 192, 8, 8); }
    }
    else if (s.bg === 'house_after') { const g = ctx.createLinearGradient(0, 0, 0, 230); g.addColorStop(0, '#6a7a8a'); g.addColorStop(1, '#a8b0b8'); ctx.fillStyle = g; ctx.fillRect(0, 0, PH.W, 230); ctx.fillStyle = '#2a3a28'; ctx.fillRect(0, 230, PH.W, 40); ctx.fillStyle = '#4a4046'; ctx.fillRect(140, 110, 200, 120); ctx.fillStyle = '#2a2430'; ctx.beginPath(); ctx.moveTo(130, 110); ctx.lineTo(240, 60); ctx.lineTo(350, 110); ctx.fill(); for (let i = 0; i < 4; i++) { ctx.fillStyle = '#e8c880'; ctx.fillRect(160 + i * 45, 130, 18, 22); ctx.fillRect(160 + i * 45, 175, 18, 22); } ctx.drawImage(Pr.get('gate'), 40, 170); ctx.fillStyle = '#3a4a6a'; ctx.fillRect(390, 205, 60, 22); ctx.fillStyle = '#1a2a3a'; ctx.fillRect(400, 195, 40, 12); ctx.fillStyle = '#ffffff'; ctx.fillRect(420, 228, 8, 3); ctx.fillStyle = PH.hash(Math.floor(PH.time * 3), 1) < 0.5 ? '#4060ff' : '#ff4040'; ctx.fillRect(410, 190, 6, 4); }
    // text
    const lines = s.lines; let y = 40; const isBlack = s.bg === 'black';
    ctx.fillStyle = 'rgba(0,0,0,' + (isBlack ? 0 : 0.55) + ')'; if (!isBlack) ctx.fillRect(0, 26, PH.W, 4 + lines.reduce((a, l) => a + PH.wrapText(l, 70).length * 9 + 6, 0));
    const shown = Math.floor(e.t * 60); let count = 0;
    for (const l of lines) { const isTitle = l === l.toUpperCase() && l.length > 3 && l.length < 20 && !l.includes(' ') === false && ['CONNECTION', 'THE AVIARY', 'COLLAPSE'].includes(l); const wrapped = PH.wrapText(l, 70); for (const wl of wrapped) { const vis = wl.slice(0, Math.max(0, shown - count)); count += wl.length; if (isTitle) F.drawCentered(ctx, vis, PH.W / 2, y + 4, { color: '#d8c9a6', scale: 2 }); else F.draw(ctx, vis, 30, y, { color: '#e8e0d0' }); y += isTitle ? 20 : 9; } y += 6; }
    if (e.t > 0.8) F.drawRight(ctx, PH.touch.enabled ? (e.stage >= script.length - 1 ? 'tap for title' : 'tap') : (e.stage >= script.length - 1 ? '[E] title' : '[E]'), PH.W - 12, PH.H - 12, { color: '#6a6058' });
  };
  PH.endings = E;
})(window.PH);
