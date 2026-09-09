// Story: fractured fragments, flags, connection/isolation/care tracking, dreams, ending evaluation.
(function (PH) {
  'use strict';
  const g = () => PH.game;
  const say = (l, o) => g().say(l, o);

  function Story() {
    this.flags = {}; this.fragments = []; this.replies = {}; this.ignores = {}; this.msgDays = {}; this.repliesByDay = {}; this.careDays = {}; this.clippingsRead = 0; this.recordsRead = 0; this.tapesRead = 0; this.footageSeen = 0; this.confronted = 0;
  }
  Story.prototype.flag = function (f) { if (!this.flags[f]) { this.flags[f] = g().day; if (['confront_fire', 'confront_mara', 'honest_mara', 'honest_noor', 'told_gaps', 'asked_help', 'pills_away', 'grave', 'lena_letter', 'cage_memory', 'refused_unknown'].includes(f)) this.confronted++; } };
  Story.prototype.has = function (f) { return !!this.flags[f]; };
  Story.prototype.addFragment = function (id, title, text) { if (this.fragments.find((f) => f.id === id)) return false; this.fragments.push({ id, title, text, day: g().day }); g().notify('Journal updated: ' + title, 'journal'); return true; };
  Story.prototype.onMessage = function (id) { };
  Story.prototype.onReply = function (id) { this.replies[id] = (this.replies[id] || 0) + 1; const d = g().day; this.repliesByDay[d] = (this.repliesByDay[d] || 0) + 1; (this.msgDays[d] = this.msgDays[d] || {})[id] = true; };
  Story.prototype.onIgnore = function (id) { this.ignores[id] = (this.ignores[id] || 0) + 1; };
  Story.prototype.replied = function (id) { return this.replies[id] || 0; };
  Story.prototype.ignoredBy = function (id) { return this.ignores[id] || 0; };
  Story.prototype.contactsToday = function () { const m = this.msgDays[g().day]; return m ? Object.keys(m).length : 0; };
  Story.prototype.totalReplies = function () { let s = 0; for (const k in this.replies) s += this.replies[k]; return s; };
  Story.prototype.distinctContacts = function () { return Object.keys(this.replies).length; };
  Story.prototype.isolationDays = function () { let n = 0; for (let d = Math.max(1, g().day - 3); d <= g().day; d++) if (!this.repliesByDay[d]) n++; return n; };
  Story.prototype.markCare = function (kind) { const d = g().day; (this.careDays[d] = this.careDays[d] || {})[kind] = true; };
  Story.prototype.careComplete = function (day) { const c = this.careDays[day || g().day]; return !!(c && c.feed && c.water && c.clean); };
  Story.prototype.careScore = function () { let n = 0, tot = 0; for (let d = 1; d <= g().day; d++) { tot++; if (this.careComplete(d)) n++; } return tot ? n / tot : 0; };
  Story.prototype.canLeave = function () { return !!g().flags.gate_can_open && g().day >= 6; };

  // ---- Strange phrases the parrots may repeat (not said by the player) ----
  Story.prototype.strangePhrases = function () {
    const base = ['sign it Adrian', 'the dome stays', 'I didn\'t see the footage', 'one line, Mara', 'goodnight', 'who is it', 'not tonight', 'come down', 'it was a spreadsheet', 'don\'t look'];
    if (this.has('lena_left')) base.push('Lisbon'); if (this.has('told_gaps')) base.push('two hours'); if (this.has('noor_coming')) base.push('Saturday');
    return base;
  };

  // ---- Fragments ----
  const CLIPPINGS = [
    ['HALEWOOD CHIEF "UNAVAILABLE" AS BLACKWATER INQUIRY OPENS', 'The Financial Ledger, page 3. "Adrian Hale, 41, founder of Halewood Capital, has not been seen publicly since the March fire at the Blackwater logistics facility that killed three night-shift workers. A spokesperson said Mr Hale was \'cooperating fully and grieving privately\'. Sources close to the board describe a leadership vacuum."'],
    ['"HE BUILT THEM A CATHEDRAL": INSIDE THE BILLIONAIRE\'S AVIARY', 'Weekend supplement, torn along one edge. A photograph of the dome at dusk. "The 14-metre glass structure houses six rescued and inherited parrots, including an African grey that belonged to Hale\'s late mother. \'He talks to them more than to us,\' said a former employee, who asked not to be named."'],
    ['SPRINKLER RETROFIT WAS DEFERRED TWICE, DOCUMENTS SHOW', 'A photocopy, folded small. "Internal Halewood memoranda seen by this paper show a fire-suppression upgrade at Blackwater was postponed in two consecutive budget cycles. The second deferral carries the signature of the chief executive. Former CFO Lena Marsh declined to comment. She is understood to have left the country."'],
    ['OBITUARY: HELENA HALE, 71', 'Local paper, a year old, soft at the folds. "...a retired music teacher, survived by her daughter Noor and her son Adrian. She leaves behind two parrots, Pepper and Ada, of whom she said: \'They\'re the only ones who never interrupted.\' A private funeral was held."'],
    ['LETTERS: THE GLASS HOUSE ON THE HILL', 'A reader writes: "Every night the dome up there glows. My son asks who lives in it. I tell him: a man who has everything. My son asks why he never comes down. I don\'t have an answer."'],
    ['BOARD MOVES TO REMOVE HALE; VOTE FRIDAY', 'Business pages. "...cite \'prolonged absence and unresponsiveness\'. Hale\'s assistant said his employer was \'attending to responsibilities at home\'. Asked to elaborate, he said: \'Six of them.\'"'],
    ['(no headline)', 'The clipping is blank. Not faded: blank, as though the ink was never there. On the back, in your mother\'s handwriting: "Adrian. Feed the birds. Then feed yourself. In that order if you must, but both."'],
  ];
  Story.prototype.readClipping = function () {
    const i = Math.min(this.clippingsRead, CLIPPINGS.length - 1);
    if (this.clippingsRead >= g().day && this.clippingsRead > 0) { say(['The mailbox is empty. Teodor brings the papers up once a day.']); return; }
    const c = CLIPPINGS[i]; this.clippingsRead++;
    this.addFragment('clip' + i, 'Clipping: ' + c[0], c[1]);
    say(['A newspaper clipping, cut out neatly and left in the mailbox. Nobody delivers the paper this way.', c[0], c[1]], { reading: true });
    if (i === 3) { g().flock.get('pepper').learn('goodnight', true); }
    if (i === 6) g().sanity.change(-4, 'clipping');
  };
  Story.prototype.tvLine = function () { return PH.pick([['"...the inquiry heard that the deferral saved the company an estimated four hundred thousand. Halewood shares..." You change the channel.', 'A nature programme. Macaws over a river in Peru. You leave it on for Marlowe, who cannot see it.'], ['A cooking show. Someone is very excited about butter.', 'For eleven minutes you do not think about anything.'], ['The news. Your face, from the good years. The caption says UNAVAILABLE.', 'You turn it off.']]); };
  Story.prototype.viewPhotos = function () {
    const s = g().sanity.value; this.addFragment('photos', 'Photographs, living room', 'The wall of photographs: Mum with Pepper on her shoulder. Noor at graduation. You and Mara at the dome\'s opening, both squinting. A team photo from Blackwater\'s launch: eleven people in hi-vis. Three of them have been circled in pen. You do not remember circling them.');
    if (s > 50) say(['Mum with Pepper on her shoulder. Noor\'s graduation. You and Mara at the dome opening, squinting into the sun.', 'The Blackwater launch photo: eleven people in hi-vis. Three are circled in pen.', 'You do not remember circling them.'], { reading: true });
    else { say(['The photographs have changed. Mum\'s eyes are closed in all of them. Mara is not in the dome picture; there is a gap where she stood.', 'In the Blackwater photo the three circled people are looking directly at you. The other eight are looking at the fire.'], { reading: true }); g().sanity.exposure('photowall', 2); }
    if (s <= 50) g().flock.get('pepper').learn('don\'t look', false);
  };
  Story.prototype.readRecords = function () {
    const n = this.recordsRead; const s = g().sanity.value; g().flags.records_read = true;
    const docs = [
      ['BUDGET CYCLE Q3 - CAPEX DEFERRALS (INTERNAL)', 'Line 14: Blackwater Site - Fire Suppression Retrofit - 412,000 - DEFER TO Q1 - Risk: LOW (sprinkler system rated to 2019 standard) - Approver: L. Marsh - Signatory: A. Hale. \n\nThe cursor blinks after your name. Below it someone has typed and not deleted: "sign it adrian we\'ll do it next quarter".'],
      ['INCIDENT REPORT 0447-B (DRAFT - LEGAL HOLD)', 'Ignition at 02:51 in the battery storage cage. Detection at 02:58. Suppression: MANUAL (extinguishers). Night crew: 5. Evacuated: 2. \n\nThe names of the other three are redacted in the document. You know them anyway. You knew them before you opened this.'],
      ['EMAIL - FROM: L.MARSH TO: A.HALE - SUBJ: (none)', '"I recommended it. You signed it. Neither of those sentences is the whole truth and both of them are going to be in the papers. I\'m leaving before that. Take care of the birds, they\'re the best thing either of us did. - L" \n\nThe email is dated six weeks ago. You have opened it fourteen times, according to the log.'],
      ['HALEWOOD CAPITAL - AVIARY CLIMATE SYSTEM - MAINTENANCE LOG', 'Every entry for the past five weeks is in your handwriting, scanned. Filter changes. Humidity readings. Under Week 4: "Pepper said Mum\'s goodnight at 3am. I was in the dome. I do not remember walking there." \n\nUnder Week 5, three words, pressed hard enough to tear the page: "STILL FEEDING THEM."'],
      ['(FILE CORRUPTED)', 'The document opens as noise. Every eleventh character is legible: s . i . g . n . i . t . a . d . r . i . a . n . \n\nYou close it. It reopens. You close it again.'],
    ];
    const d = docs[Math.min(n, docs.length - 1)]; this.recordsRead++;
    if (n < docs.length) this.addFragment('rec' + n, 'Record: ' + d[0], d[1]);
    const lines = ['You wake the machine. Teodor has forwarded everything.', d[0], ...d[1].split('\n\n')];
    if (s < 40 && n >= 2) lines.push('Behind the text, faintly, the screen shows the aviary camera. Live. Someone is standing in it.');
    say(lines, { reading: true });
    if (n === 0) g().flock.get('pepper').storyPhrases.push('sign it Adrian');
    if (n === 2) { this.flag('lena_letter'); g().flock.get('pepper').storyPhrases.push('take care of the birds'); }
    if (n >= 3) g().sanity.exposure('computer', 2);
  };
  Story.prototype.viewFootage = function () {
    const s = g().sanity.value, n = this.footageSeen; this.footageSeen++;
    const feeds = [
      ['FEED 4 - DOME INTERIOR - 02:40', 'Grey-green night vision. The dome. The birds asleep in a row. At 02:41 you walk in from the garden door in your cardigan and stand by the water bowls. You do not move for one hour and thirty-four minutes. At 04:15 you leave. Pepper watches you the whole time.'],
      ['FEED 4 - DOME INTERIOR - 03:10 - AUDIO', 'You are standing under Pepper\'s perch, talking. The audio is poor. You hear yourself say: "...didn\'t see it. I didn\'t see the footage. Tell them I didn\'t." Pepper answers, in Lena\'s voice: "Sign it, Adrian." You laugh on the recording. It is not a good sound.'],
      ['FEED 2 - GATEHOUSE - 06:02', 'Bram at his desk, watching feed 4 on his own monitor. He rewinds it three times. Then he puts his head in his hands. He is like that for six minutes. Then he writes something on a pad and tears it off.'],
      ['FEED 4 - DOME INTERIOR - 03:33', 'You are in the dome. The timestamp says you are in the dome. The house door log says the house door has not opened. You watch yourself, on the screen, turn slowly toward the camera, and you watch yourself, in the study, stop breathing until the figure turns back to the birds.'],
      ['FEED 4 - LIVE', 'The dome. The birds. Nobody there. \nThen: you, walking in. You look at your hands. You are in the study. You look at the screen. You are in the dome, looking at your hands.'],
    ];
    const f = feeds[Math.min(n, feeds.length - 1)]; this.addFragment('feed' + Math.min(n, feeds.length - 1), 'Footage: ' + f[0], f[1]);
    say(['The security system. Six feeds. Bram has flagged one.', f[0], ...f[1].split('\n')], { reading: true });
    if (n >= 3 || s < 35) { g().sanity.exposure('monitors', 2.5); }
    if (n === 1) g().flock.get('pepper').storyPhrases.push('I didn\'t see the footage');
    this.flag('footage');
  };
  Story.prototype.viewTapes = function () {
    const n = this.tapesRead; this.tapesRead++;
    const tapes = [
      ['TAPE: BLACKWATER SITE VISIT (2 YRS AGO)', 'Handheld. You, in a hard hat, laughing with a woman in hi-vis - one of the three. She is showing you the battery cage. She says "this whole wall needs the retrofit, boss". You say "next quarter, promise". The camera operator - Lena - says "he always says that". Everyone laughs.'],
      ['TAPE: DOME CONSTRUCTION, MONTH 3', 'Time-lapse. The dome rising over the garden. In the last frames Mara stands inside the frame with Wren on her finger, before the glass went in. She looks up. It is the happiest anyone in this house has ever looked.'],
      ['TAPE: (UNLABELLED)', 'The basement. This room. The old cage on the workbench, with a bird in it - not Pepper; smaller, darker. Your mother\'s other parrot, Ada. The tape is from the week after the funeral. You are meant to be feeding her. The tape is eleven hours long. Nobody comes.'],
    ];
    const t = tapes[Math.min(n, tapes.length - 1)];
    if (n < tapes.length) this.addFragment('tape' + n, t[0], t[1]);
    say(['Old tapes in a box, hand-labelled. There is a deck under the monitors.', t[0], t[1]], { reading: true });
    if (n === 2) { this.flag('ada'); g().sanity.change(-8, 'ada'); g().flock.get('pepper').storyPhrases.push('Ada'); g().flock.get('pepper').learn('Ada', true); }
    if (n >= 3) say(['You have watched them all. You do not need to watch them again.', 'You watch the last one again.']);
    g().sanity.exposure('tapes', 1.5);
  };
  Story.prototype.viewBoxPhoto = function () {
    this.addFragment('boxphoto', 'Damaged photograph', 'Water-stained. Your mother\'s flat: two cages by the window, Pepper and a smaller dark bird. Your mother, mid-sentence, pointing at the camera. On the back: "Ada + Pepper, for Adrian when he\'s ready." The date is the week before she died.');
    say(['Boxes from your mother\'s flat, never unpacked. A photograph on top, water-stained.', 'Two cages by a window. Pepper, and a smaller dark bird you have not let yourself think about.', 'On the back: "Ada + Pepper, for Adrian when he\'s ready."']);
    this.flag('box_photo');
  };
  Story.prototype.viewOldCage = function () {
    const s = g().sanity.value;
    if (!this.has('ada')) { say(['A small old cage. Your mother\'s. There is still a perch in it and a bowl with dust in it.', 'You know whose it was. You are not going to say the name.']); g().sanity.exposure('oldcage', 1.5); return; }
    if (this.has('cage_memory')) { say(['Ada\'s cage. You cleaned the bowl. You left the little bell.']); g().sanity.ground(2, 'memory'); return; }
    say(['Ada\'s cage.', 'You did not come down for eleven days. You were burying your mother and losing a company and you told yourself Noor was feeding her, and Noor thought you were.', 'Nobody was.'], { choices: [
      { t: 'Clean the bowl. Say her name.', f: () => { this.flag('cage_memory'); g().sanity.change(-5, 'ada'); g().sanity.ground(14, 'memory'); say(['You clean the dusty bowl with your sleeve. "Ada," you say, out loud, to the basement.', 'It does not fix anything. But the birds upstairs are fed, and that is the same muscle.']); g().flock.get('pepper').learn('Ada', true); } },
      { t: 'Leave. Do not think about it.', f: () => { g().sanity.exposure('oldcage', 3); const p = g().flock.get('pepper'); p.storyPhrases.push('nobody came'); } }] });
  };
  Story.prototype.viewEasel = function () {
    const s = g().sanity.value; this.addFragment('easel', 'Mara\'s unfinished painting', 'A portrait of Wren, half done. The eye is finished; in it, tiny, the reflection of the dome. Mara stopped painting it the week she left.');
    if (s > 45) say(['Mara\'s unfinished painting. Wren, half done, one eye finished.', 'In the eye, tiny, is the reflection of the dome. You had never noticed.'], { reading: true });
    else { say(['The painting is finished now. It is not of Wren.', 'It is of the dome at night, from inside. Someone with your shape stands among the perches. Where the eye was, there is a hole in the canvas.'], { reading: true }); g().sanity.exposure('easel', 2); }
  };
  // Dreams shown on sleep
  Story.prototype.dream = function () {
    const s = g().sanity.value, d = g().day;
    const pool = [];
    if (s > 60) pool.push(['You dream the dome is bigger than the house.', 'The birds are all speaking at once, and it is a language, and you almost understand it.'], ['You dream of the good year. Mara is laughing at something Pepper said.', 'When you wake you cannot remember the joke, only that there was one.']);
    else if (s > 35) pool.push(['You dream you are standing in the aviary and the glass is water.', 'The birds swim. You cannot.'], ['You dream of a spreadsheet with one line on it. The line is a hallway. You walk down it for hours.'], ['Your mother is in the kitchen. "Feed the birds," she says, "then feed yourself." You say you did. She says, "in that order?"']);
    else pool.push(['You dream of the fire, except the workers are birds and the birds are people, and you are signing something.', 'Lena hands you the pen. It is a feather.'], ['You dream you wake up. You feed the birds. You wake up. You feed the birds. You wake up. There is no one to feed. You wake up.'], ['You are inside the mirror. On the other side, you are feeding the birds, and you look content, and you do not look at yourself once.']);
    if (this.has('ada')) pool.push(['Ada is in the dome, small and dark on the highest perch. The others make room for her.', 'She is not angry. That is the worst part.']);
    if (this.has('noor_visit') || this.has('grave')) pool.push(['You dream Noor is at the gate with bread. You walk down. It takes forty years. She waits.']);
    return PH.pick(pool);
  };
  // Ending evaluation
  Story.prototype.evaluate = function () {
    const game = g(); const trust = game.flock.avgTrust(); const care = this.careScore(); const conn = this.totalReplies(); const distinct = this.distinctContacts(); const conf = this.confronted; const alive = game.flock.alive().length;
    const connection = conn * 1.0 + distinct * 2 + conf * 2.5 + (this.has('noor_visit') ? 6 : 0) + (this.has('deal') ? 2 : 0);
    const aviary = trust / 10 + care * 8 + (this.has('birds_reason') ? 2 : 0) + (this.has('tempted') ? 3 : 0) - distinct * 1.5;
    const collapse = (100 - game.sanity.value) / 10 + this.isolationDays() * 2 + (6 - alive) * 3 - conf;
    const scores = { connection, aviary, collapse };
    let best = 'connection'; for (const k in scores) if (scores[k] > scores[best]) best = k;
    if (connection >= 14 && conf >= 3 && game.sanity.value > 25) best = 'connection';
    else if (trust > 70 && care > 0.6 && distinct <= 2) best = 'aviary';
    return { ending: best, scores, trust, care, conn, distinct, conf, alive };
  };
  Story.prototype.serialize = function () { return { flags: this.flags, fragments: this.fragments, replies: this.replies, ignores: this.ignores, msgDays: this.msgDays, repliesByDay: this.repliesByDay, careDays: this.careDays, clippingsRead: this.clippingsRead, recordsRead: this.recordsRead, tapesRead: this.tapesRead, footageSeen: this.footageSeen, confronted: this.confronted }; };
  Story.prototype.deserialize = function (d) { if (d) Object.assign(this, d); };
  PH.Story = Story;
})(window.PH);
