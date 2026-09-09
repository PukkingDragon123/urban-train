// Phone: contacts, scripted-but-branching conversations, isolation tracking, ghost messages.
(function (PH) {
  'use strict';
  const g = () => PH.game;

  // Beat: {id, day, hour, cond, lines, choices:[{t, f, then}] , ignoredLines}
  const CONTACTS = [
    { id: 'noor', name: 'Noor', role: 'sister', color: '#e0a060', beats: [
      { id: 'n1', day: 1, hour: 8, lines: ['Adi. Did you eat something today or just feed the birds', 'Actual food. Not walnuts.'], choices: [
        { t: 'Toast. Tea. Fed the birds.', f: () => g().story.flag('honest_noor'), then: ['Ok. Good.', 'I\'m going to keep asking. You know that.'] },
        { t: 'I\'m fine, Noor.', then: ['You always say that in exactly those three words.', 'I\'m still going to ask.'] },
        { t: 'The birds are more important right now.', then: ['They\'re important. So are you. Both things.'] }] },
      { id: 'n2', day: 2, hour: 10, lines: ['I\'m coming up Saturday. Not asking.', 'I\'ll bring the good bread. The birds can have the crusts.'], choices: [
        { t: 'Ok. Come.', f: () => g().story.flag('noor_coming'), then: ['Really? Ok. Really. Saturday.', 'Adi I\'m glad.'] },
        { t: 'Not this week. The house is a mess.', then: ['The house is 900 square metres. I\'ll find a clean corner.', 'Think about it. Please.'] }] },
      { id: 'n3', day: 3, hour: 13, lines: ['Mara asked about you. She didn\'t want me to tell you that.', 'She asked if Wren was ok. Specifically Wren.'], choices: [
        { t: 'Wren is ok. Tell her.', f: () => g().story.flag('wren_msg'), then: ['I will.', 'She still cares, Adi. In her way.'] },
        { t: 'Why would she ask about a bird and not about me.', then: ['Because the bird didn\'t lie to her.', '...sorry. That was harsh. I\'m tired.', 'It\'s easier to ask about the bird. You know that.'] },
        { t: 'Don\'t talk to her about me.', then: ['Ok.', 'Ok.'] }] },
      { id: 'n4', day: 4, hour: 9, lines: ['It\'s a year on Friday.', 'Mum\'s. I\'m going to the grave. You don\'t have to come. I\'m telling you so you\'re not surprised by the date.'], choices: [
        { t: 'I know what day it is.', then: ['I know you know.', 'Pepper still says goodnight the way she did?', '(after a while) I miss that.'] },
        { t: 'I\'ll come.', f: () => g().story.flag('grave'), then: ['Ok.', 'I\'ll drive. Don\'t argue about the driving.'] },
        { t: 'I can\'t.', then: ['That\'s ok. That\'s allowed.', 'I\'ll say hello from you. And from Pepper.'] }] },
      { id: 'n5', day: 5, hour: 11, cond: () => g().story.ignoredBy('noor') >= 2, lines: ['Adrian please just send me one word', 'Anything. A full stop. A bird emoji.'], choices: [{ t: '.', f: () => g().story.flag('noor_dot'), then: ['Thank you.', 'Thank you.'] }, { t: 'I\'m here.', then: ['Ok. Ok. Stay there.'] }] },
      { id: 'n5b', day: 5, hour: 11, cond: () => g().story.ignoredBy('noor') < 2, lines: ['Teodor says the bird food shipment doubled. Are you feeding them for six or for sixty', 'Kidding. Mostly. How are they?'], choices: [{ t: 'Marlowe bit Saffron. Everyone else is fine.', then: ['Marlowe is a menace and I love him.'] }, { t: 'Honestly I think they\'re the only reason I get up.', f: () => g().story.flag('honest_noor'), then: ['Then I\'m glad they\'re there.', 'And I\'m glad you\'re there.', 'Both things.'] }] },
      { id: 'n6', day: 6, hour: 15, cond: () => g().story.replied('noor') >= 3, lines: ['I\'m at the gate.', 'It\'s locked. Bram isn\'t in the gatehouse. Adi?', 'I can see the dome from here. It\'s beautiful. I\'d forgotten.'], choices: [
        { t: 'I\'ll come down.', f: () => { g().story.flag('noor_visit'); g().flags.gate_can_open = true; }, then: ['Ok. I\'m here. Take your time.'] },
        { t: 'Not today. I\'m sorry.', then: ['...', 'Ok. I\'ll leave the bread on the wall.', 'I\'ll come back. I\'m going to keep coming back.'] }] },
      { id: 'n6b', day: 6, hour: 15, cond: () => g().story.replied('noor') < 3, lines: ['I drove up. Gate\'s locked, nobody answering.', 'I left bread on the wall. I stood there twenty minutes.', 'Whatever this is, I\'m not going away. But you have to open the door at some point.'], choices: [{ t: 'I\'m sorry.', then: ['Don\'t be sorry. Be reachable.'] }, { t: 'I saw you. I couldn\'t.', f: () => g().story.flag('honest_noor'), then: ['That\'s ok.', 'Next time, come halfway down the path. That\'s all. Halfway.'] }] },
    ] },
    { id: 'okafor', name: 'Dr. Okafor', role: 'therapist', color: '#70b0a0', beats: [
      { id: 'o1', day: 1, hour: 9, lines: ['Good morning Adrian. You missed Tuesday. That\'s alright. I\'d like to check in by text if that\'s easier.', 'How did you sleep?'], choices: [
        { t: 'Badly. I woke up in the study.', f: () => g().story.flag('told_sleep'), then: ['Thank you for telling me. Do you remember going there?', 'It\'s ok if you don\'t. Just notice it. We\'ll talk about it.'] },
        { t: 'Fine.', then: ['Ok. If "fine" changes, I\'m here.'] },
        { t: 'I don\'t want to do this by text.', then: ['Understood. I\'ll leave the offer open. No expiry.'] }] },
      { id: 'o2', day: 2, hour: 14, lines: ['A small exercise, if you want it. Name five things you can see right now that are alive.'], choices: [
        { t: 'Six parrots. A fern. Me, technically.', f: () => { g().sanity.ground(6, 'okafor'); g().story.flag('grounding'); }, then: ['"Technically" counts. Technically is where we start.'] },
        { t: 'Nothing here is alive.', then: ['The birds are. You\'re messaging me, so you are.', 'I know it doesn\'t feel that way. Feeling it isn\'t the requirement.'] }] },
      { id: 'o3', day: 3, hour: 10, lines: ['Adrian, the last time we spoke in person you started to tell me about the Blackwater facility and then stopped. I want you to know you can finish that sentence whenever you like.'], choices: [
        { t: 'Three people died. I deferred the sprinkler retrofit. I signed it.', f: () => { g().story.flag('confront_fire'); g().sanity.change(-4, 'confession'); g().sanity.ground(10, 'okafor'); }, then: ['Thank you.', 'I\'m not going to tell you it wasn\'t your fault. I don\'t know that and neither do you. What I know is that you\'re carrying it alone in a glass house, and that part is a choice we can work on.'] },
        { t: 'The lawyers told me not to talk about it.', then: ['The lawyers aren\'t in the room with you at 3am.', 'When you\'re ready.'] },
        { t: 'I don\'t remember signing anything.', f: () => g().story.flag('denial'), then: ['Ok. Then let\'s leave it there for now.', 'But notice that Pepper remembers.'] }] },
      { id: 'o4', day: 4, hour: 16, lines: ['Sleep check. Any more gaps in the day?'], choices: [
        { t: 'Yes. Hours. The cameras show me in the aviary.', f: () => g().story.flag('told_gaps'), then: ['That must be frightening. It\'s also information.', 'Dissociation under prolonged stress and isolation is not madness, Adrian. It\'s a system protecting itself badly. We can give it better options.'] },
        { t: 'No gaps.', then: ['Ok.'] }] },
      { id: 'o5', day: 5, hour: 9, cond: () => g().sanity.lowest < 35, lines: ['Adrian. Noor called me. I\'m going to ask directly: are you safe tonight?'], choices: [
        { t: 'I don\'t know.', f: () => { g().story.flag('asked_help'); g().sanity.ground(12, 'okafor'); }, then: ['Thank you for not saying "fine".', 'Here\'s what we do. You go to the aviary. You stay with the birds until it\'s light. You keep this phone on you and you text me every hour, one word. I\'ll be awake.', 'Can you do that?'] },
        { t: 'Yes.', then: ['Ok. I\'m going to check again in the morning.'] },
        { t: 'The birds need me. I\'m not going anywhere.', f: () => g().story.flag('birds_reason'), then: ['Good. Hold on to that. It\'s a real reason. It\'s allowed to be the reason.'] }] },
      { id: 'o5b', day: 5, hour: 9, cond: () => g().sanity.lowest >= 35, lines: ['You\'ve answered three of my messages this week. For you that\'s a marathon. I notice it.'], choices: [{ t: 'The birds are doing well. That helps.', f: () => g().sanity.ground(4, 'okafor'), then: ['Caring for something and being cared for use the same muscle.'] }, { t: 'Don\'t make it a thing.', then: ['Noted. It\'s a thing anyway.'] }] },
      { id: 'o6', day: 6, hour: 12, lines: ['Whatever happens this week, I want one commitment: no decisions after midnight. If it\'s after midnight, you feed a bird instead, and you decide in the morning. Deal?'], choices: [
        { t: 'Deal.', f: () => { g().story.flag('deal'); g().sanity.ground(6, 'okafor'); }, then: ['Deal.'] },
        { t: 'The birds are asleep after midnight.', then: ['Then you sit with them while they sleep. Deal?'] }] },
    ] },
    { id: 'teodor', name: 'Teodor', role: 'assistant', color: '#8090c0', beats: [
      { id: 't1', day: 1, hour: 7, lines: ['Morning sir. Bird food delivery is at the shed. Pool company comes tomorrow. The board is asking again for a statement on Blackwater; I\'ve told them you\'re unavailable.', 'Anything you need?'], choices: [
        { t: 'Nothing. Thank you, Teodor.', then: ['Understood.'] },
        { t: 'Tell the board I\'ll read whatever they send.', f: () => g().story.flag('board'), then: ['I\'ll forward it to the study machine. Fair warning, sir. It\'s not kind.'] },
        { t: 'Has Bram been in?', then: ['Bram\'s shift pattern is... I\'ll check. He was here Thursday.'] }] },
      { id: 't2', day: 2, hour: 9, lines: ['Sir, the press has your address. Two photographers at the gate this morning. Bram moved them along.', 'Also: the vet\'s report on Marlowe came back. Slight anaemia. She recommends more nuts, fewer pellets, and, quote, "less stress in the household".'], choices: [
        { t: 'Nuts for Marlowe. Noted.', f: () => g().story.flag('vet_marlowe'), then: ['I\'ve added walnuts to the standing order.'] },
        { t: 'Which part of the household is stressing a macaw.', then: ['I would not presume, sir.', '(But I do have a guess.)'] }] },
      { id: 't3', day: 3, hour: 11, lines: ['The archived Blackwater files are in the basement server room, sir, if you want them before the lawyers do. Steel door. It\'s not locked.', 'I\'m not supposed to tell you that. Lena asked me to, before she left.'], choices: [
        { t: 'Lena left?', f: () => g().story.flag('lena_left'), then: ['Six weeks ago, sir. Lisbon. She sent you a letter. It\'s on the desk in the study under the monitors.', 'You... don\'t remember.'] },
        { t: 'Thank you, Teodor.', then: ['Sir.'] }] },
      { id: 't4', day: 4, hour: 15, lines: ['Sir, Bram\'s given notice. Effective Friday. He asked me to tell you he\'s sorry and that "the night shifts up there aren\'t right".', 'I\'ve requested a replacement. It may take a week.'], choices: [
        { t: 'What did he mean, not right.', then: ['He didn\'t elaborate. He looked tired.', 'He said you\'d know.'] },
        { t: 'Fine. Let him go.', then: ['Sir.'] }] },
      { id: 't5', day: 5, hour: 8, lines: ['Standing order delivered to the shed. Papaya was out; substituted mango.', 'Sir, may I say one thing outside my remit? You have people. Use us.'], choices: [
        { t: 'Thank you. I mean that.', f: () => g().sanity.ground(4, 'teodor'), then: ['Sir.'] },
        { t: 'Stay in your remit.', then: ['Yes sir.'] }] },
      { id: 't6', day: 6, hour: 10, cond: () => g().story.replied('teodor') >= 2, lines: ['Your sister\'s car is at the gate, sir. The gatehouse is empty so nobody\'s buzzing her in. Should I drive up?'], choices: [{ t: 'No. I\'ll go down.', f: () => { g().flags.gate_can_open = true; }, then: ['Very good, sir.'] }, { t: 'Leave it.', then: ['...Sir.'] }] },
    ] },
    { id: 'mara', name: 'Mara', role: 'former partner', color: '#c07090', beats: [
      { id: 'm1', day: 2, hour: 20, lines: ['Noor said you\'re not answering anyone.', 'I said that\'s not my problem anymore. Then I sat with that for an hour. So.', 'Is Wren ok?'], choices: [
        { t: 'Wren is ok. She sings in the mornings.', f: () => g().story.flag('mara_wren'), then: ['Good.', 'Good. Ok. That\'s all I wanted.'] },
        { t: 'You could come see her.', then: ['No.', 'I don\'t think I can be in that house, Adrian.'] },
        { t: 'Why do you care.', then: ['I fed that bird for three years. I don\'t stop caring about things because I leave them.', 'Apparently.'] }] },
      { id: 'm2', day: 4, hour: 21, cond: () => g().story.replied('mara') >= 1, lines: ['I keep thinking about the night you told me. The dome lights were on and you said "it was a spreadsheet, Mara, it was one line on a spreadsheet".', 'You weren\'t wrong that it was one line. You were wrong that that made it small.'], choices: [
        { t: 'I know that now.', f: () => { g().story.flag('confront_mara'); g().sanity.change(-3, 'mara'); g().sanity.ground(8, 'mara'); }, then: ['Ok.', 'I believe you. It doesn\'t fix anything. But I believe you.'] },
        { t: 'It was Lena\'s recommendation.', f: () => g().story.flag('blame_lena'), then: ['Adrian.', 'Lena said "Sign it, Adrian". You signed it. Pepper still does her voice. I heard it every morning for a month.', 'I\'m not doing this. Goodnight.'] },
        { t: 'I can\'t talk about this.', then: ['Ok.'] }] },
      { id: 'm3', day: 6, hour: 19, cond: () => g().story.has('confront_mara'), lines: ['The painting on the easel. The one I didn\'t finish. You can throw it out. I mean it.', 'Or finish it. You were never bad at it, you were just never there.'], choices: [
        { t: 'I\'ll keep it as it is.', then: ['Ok.', 'Take care of yourself, Adrian. I mean that in the boring, literal way. Eat. Sleep. Answer your sister.'] },
        { t: 'I look at it too long. It scares me.', f: () => g().story.flag('honest_mara'), then: ['Then look at the birds instead. That\'s what it\'s a painting of, anyway. You never noticed. The reflection in the eye. It\'s the dome.'] }] },
      { id: 'm3b', day: 6, hour: 19, cond: () => !g().story.has('confront_mara') && g().story.replied('mara') === 0, lines: ['I\'m going to stop writing. Not to punish you. Because it isn\'t helping either of us.', 'Look after Wren.'], choices: [{ t: 'Wait.', then: ['...', 'I\'m here. Say the thing.'] }, { t: 'Ok.', then: [] }] },
    ] },
    { id: 'bram', name: 'Bram', role: 'security', color: '#a0a080', beats: [
      { id: 'b1', day: 1, hour: 6, lines: ['Sir. Cameras flagged motion in the dome, 02:40 to 04:15. It was you. Standing by the water bowls.', 'Just letting you know. In case you didn\'t.'], choices: [
        { t: 'I don\'t remember that.', f: () => g().story.flag('told_gaps_bram'), then: ['Right.', 'I\'ll keep flagging them. Somebody should.'] },
        { t: 'Couldn\'t sleep. Checked on the birds.', then: ['Understood, sir.'] }] },
      { id: 'b2', day: 2, hour: 6, lines: ['Same again. 03:10. Two hours. You were talking to the grey one.', 'Sir, the audio picked up some of it. You may want to review it before I archive it. Study monitors, feed 4.'], choices: [
        { t: 'Delete it.', f: () => g().story.flag('deleted_footage'), then: ['...Done, sir.'] },
        { t: 'Leave it. I\'ll look.', f: () => g().story.flag('footage_kept'), then: ['Yes sir.'] }] },
      { id: 'b3', day: 3, hour: 23, lines: ['Sir, are you in the dome right now?', 'Because there\'s someone in the dome right now and the house door hasn\'t opened.'], choices: [
        { t: 'I\'m in the house.', f: () => { g().sanity.change(-5, 'bram'); g().story.flag('bram_someone'); }, then: ['...', 'Nevermind sir. Camera glitch. It\'s gone.', 'Lock your doors anyway.'] },
        { t: 'It\'s me. Go to bed, Bram.', then: ['Sir, the house door hasn\'t opened since 19:00.', 'Sir?'] }] },
      { id: 'b4', day: 5, hour: 6, lines: ['Last shift Friday, sir. I\'m sorry. It isn\'t the pay.', 'I keep seeing you in that dome at night and I can\'t tell anymore if I\'m watching a man or a recording of one.'], choices: [{ t: 'I understand. Thank you for everything.', f: () => g().sanity.ground(3, 'bram'), then: ['Feed them well, sir. They\'re good birds.'] }, { t: 'Which one am I.', then: ['Sir, I genuinely don\'t know.'] }] },
    ] },
    { id: 'lena', name: 'Lena', role: 'former CFO', color: '#909090', dead: true, beats: [
      { id: 'l1', day: 3, hour: 2, cond: () => g().sanity.value < 40, ghost: true, lines: ['You there', 'The dome was my idea. Do you remember that. The glass. So they\'d have sky.', 'You remember the wrong things about me Adrian'], choices: [{ t: 'Lena? Where are you?', f: () => { g().sanity.change(-5, 'lena'); g().story.flag('lena_ghost'); }, then: ['Where you left me'] }, { t: 'This number is out of service.', then: ['Yes'] }] },
      { id: 'l2', day: 5, hour: 3, cond: () => g().sanity.value < 30, ghost: true, lines: ['Sign it Adrian', 'Sign it Adrian', 'Sign it Adrian'], choices: [{ t: 'Stop.', f: () => g().sanity.change(-6, 'lena'), then: ['The bird says it better'] }] },
    ] },
    { id: 'mom', name: 'Mum', role: '', color: '#c0b090', dead: true, beats: [
      { id: 'mm1', day: 4, hour: 23, cond: () => g().sanity.value < 45, ghost: true, lines: ['goodnight love', 'is pepper being good'], choices: [{ t: 'She says goodnight every night. In your voice.', f: () => { g().story.flag('mom_ghost'); g().sanity.change(-4, 'mom'); }, then: ['that\'s my girl', 'go to sleep adrian'] }, { t: 'You\'re not real.', then: ['neither is most of what you\'re frightened of'] }] },
    ] },
    { id: 'unknown', name: 'Unknown', role: '', color: '#606060', hidden: true, beats: [
      { id: 'u1', day: 2, hour: 0, cond: () => g().sanity.value < 40, ghost: true, lines: ['You left the aviary door open.'], choices: [{ t: 'Who is this?', then: ['Check.'] }, { t: 'I didn\'t.', then: ['Check.'] }] },
      { id: 'u2', day: 4, hour: 0, cond: () => g().sanity.value < 30, ghost: true, lines: ['They will be fine without you. That\'s the part you can\'t stand.'], choices: [{ t: 'They need me.', f: () => g().story.flag('unknown_need'), then: ['They need someone. It doesn\'t have to be the one who lets them starve on the bad days.'] }, { t: 'Leave me alone.', then: ['I\'m the only one who hasn\'t.'] }] },
      { id: 'u3', day: 6, hour: 0, cond: () => g().sanity.value < 25, ghost: true, lines: ['Come down to the dome. It\'s quiet. Nobody will ask you anything ever again.'], choices: [{ t: 'No.', f: () => { g().sanity.ground(6, 'refuse'); g().story.flag('refused_unknown'); }, then: ['Ok.', 'Ok.'] }, { t: '...', f: () => g().story.flag('tempted'), then: ['I\'ll leave the door open.'] }] },
    ] },
  ];

  function Phone() {
    this.contacts = CONTACTS.map((c) => ({ def: c, id: c.id, msgs: [], unread: 0, used: {}, pending: null, replied: 0, ignored: 0, lastIn: null }));
    this.selected = null; this.notifyQueue = []; this.ghostPending = null;
  }
  Phone.prototype.get = function (id) { return this.contacts.find((c) => c.id === id); };
  Phone.prototype.visible = function () { return this.contacts.filter((c) => !c.def.hidden || c.msgs.length > 0); };
  Phone.prototype.totalUnread = function () { return this.contacts.reduce((s, c) => s + c.unread, 0); };
  Phone.prototype.update = function (dt, game) {
    // deliver beats
    for (const c of this.contacts) {
      if (c.pending) continue;
      for (const b of c.def.beats) {
        if (c.used[b.id]) continue;
        if (game.day < b.day) continue; if (game.day === b.day && game.hour < b.hour) continue;
        if (b.cond && !b.cond()) continue;
        if (b.ghost && game.day > b.day + 1) { c.used[b.id] = true; continue; }
        c.used[b.id] = true; this.deliver(c, b, game); break;
      }
    }
  };
  Phone.prototype.deliver = function (c, b, game) {
    c.pending = b; c.lastIn = game.day; c.lastInHour = game.hour;
    const glitch = b.ghost;
    for (const l of b.lines) c.msgs.push({ from: 'them', text: l, day: game.day, hour: game.hour, ghost: glitch });
    c.unread += b.lines.length; PH.audio.phoneBuzz();
    game.notify(c.def.name + ': ' + (b.lines[0].length > 44 ? b.lines[0].slice(0, 42) + '...' : b.lines[0]), 'phone');
    game.story.onMessage(c.id);
  };
  Phone.prototype.reply = function (c, choiceIdx) {
    const game = PH.game, b = c.pending; if (!b) return;
    const ch = b.choices[choiceIdx]; if (!ch) return;
    c.msgs.push({ from: 'me', text: ch.t, day: game.day, hour: game.hour });
    if (ch.f) ch.f();
    c.pending = null; c.replied++;
    if (!c.def.dead && !b.ghost) { game.story.onReply(c.id); game.sanity.ground(3, 'phone'); }
    const then = ch.then || [];
    then.forEach((l, i) => setTimeout(() => { c.msgs.push({ from: 'them', text: l, day: game.day, hour: game.hour }); if (!(game.ui.phoneOpen && this.selected === c)) { c.unread++; } PH.audio.phoneBuzz(); }, 900 + i * 1400));
    PH.audio.click();
  };
  Phone.prototype.dismiss = function (c) { const game = PH.game; if (c.pending) { c.ignored++; game.story.onIgnore(c.id); c.pending = null; c.msgs.push({ from: 'sys', text: '(you did not reply)' }); } };
  Phone.prototype.endDay = function (game) { for (const c of this.contacts) if (c.pending && !c.pending.ghost) { c.ignored++; game.story.onIgnore(c.id); c.pending = null; c.msgs.push({ from: 'sys', text: '(you did not reply)' }); } };
  // Hallucination: a message the contact "never wrote"
  Phone.prototype.ghostMessage = function () {
    const game = PH.game; const cands = this.contacts.filter((c) => !c.def.dead && !c.def.hidden && c.msgs.length > 0); if (!cands.length) return;
    const c = PH.pick(cands);
    const lines = { noor: ['Why did you do it Adi', 'I saw you in the dome last night. You weren\'t alone.'], okafor: ['I\'ve reviewed your file. There is no file.', 'Have you considered that the birds are the ones keeping you?'], teodor: ['The board has voted. You\'re not to leave the property.', 'Sir, who is the man in the aviary?'], mara: ['I never left. Check the wardrobe.', 'Wren is dead, Adrian. She died in the spring. Who are you feeding?'], bram: ['Feed 4 shows two of you.', 'I quit because it isn\'t you on the cameras.'] };
    const l = PH.pick(lines[c.id] || ['...']);
    c.msgs.push({ from: 'them', text: l, day: game.day, hour: game.hour, ghost: true, fake: true }); c.unread++; PH.audio.phoneBuzz();
    game.notify(c.def.name + ': ' + l.slice(0, 40), 'phone'); game.sanity.change(-3, 'ghostmsg');
    // later, a retraction (only sometimes)
    if (PH.chance(0.6)) setTimeout(() => { if (PH.game.sanity.value > 30) { c.msgs.push({ from: 'them', text: PH.pick(['?? I didn\'t send that.', 'Adrian what are you replying to. I didn\'t write anything.', 'That last message isn\'t from me. Are you ok?']), day: PH.game.day, hour: PH.game.hour }); c.unread++; PH.audio.phoneBuzz(); } }, 60000 + Math.random() * 60000);
  };
  Phone.prototype.serialize = function () { return this.contacts.map((c) => ({ id: c.id, msgs: c.msgs, used: c.used, replied: c.replied, ignored: c.ignored, pendingId: c.pending ? c.pending.id : null })); };
  Phone.prototype.deserialize = function (d) { if (!d) return; for (const s of d) { const c = this.get(s.id); if (!c) continue; c.msgs = s.msgs || []; c.used = s.used || {}; c.replied = s.replied || 0; c.ignored = s.ignored || 0; c.pending = s.pendingId ? c.def.beats.find((b) => b.id === s.pendingId) : null; } };
  PH.Phone = Phone;
})(window.PH);
