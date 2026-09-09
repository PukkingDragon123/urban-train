# Hollow Dome

A 2D pixel-art psychological horror game about raising six parrots while trying to keep their owner alive.

Adrian Hale is a billionaire who has stopped leaving his house on the hill. Across the garden is a glass dome aviary with six parrots that depend entirely on him. Every day he feeds them, waters them, cleans up after them, sings with them. Then he has to get through the rest of the day.

Everything in the game is drawn procedurally at runtime (no image assets) and all audio is synthesized with the Web Audio API.

## Running

Open `index.html` in a modern browser, or serve the folder:

```
python3 -m http.server 8000
# then open http://localhost:8000
```

Keyboard required. Headphones recommended.

### Single-file build

`dist/hollow-dome.html` is the whole game inlined into one full-bleed page,
suitable for hosting anywhere or opening straight off disk. Rebuild it after
changing anything in `js/`:

```
python3 tools/build-single-file.py
```

## Controls

On a touchscreen the controls are drawn into the game itself: a movement cross
bottom left, hop / use / interact bottom right, and phone, menu and slow-breathing
buttons down the right edge. Items in the bar, birds, bowls, doors, menu rows and
message replies are all tappable directly. Mouse clicks work on menus too.

| Action | Keys |
| --- | --- |
| Move | A / D or arrow keys |
| Hop | Space |
| Interact / advance text | E or Enter |
| Use selected item | F |
| Hotbar | 1-9, Q / R, mouse wheel |
| Phone | Tab (or P) |
| Journal | J |
| Whistle to the birds | V |
| Slow breathing (grounding) | hold Shift |
| Help | H |
| Mute | M |
| Pause | Esc |

## The loop

1. **Care for the parrots.** Fill food bowls (seed, pellets, fruit, nuts), refill water, scrub the mess, hang toys, hand out treats, comfort frightened birds, give medicine to sick ones, whistle with them. Each bird has its own personality, favourite food and toy, memories, friendships and rivalries, and a trust level that changes with how it is treated.
2. **Look after Adrian.** Sanity is not a bar. It changes what you see, hear and read. Certain objects (the mirror, the pill bottle, the security feeds, the photographs, the pool at night) hurt if you keep looking at them: turn away, leave the room, or do something grounding. Answer the phone. Play music. Sit on the bench. Go back to the birds.
3. **Sleep.** Days advance when you sleep. There are seven of them.

## Systems

- **Parrots**: procedurally animated from body parts each frame (springs for head-bob, squash on landing, puff, crest, head tilt, wing flap, tail spread) with flight, gliding, hopping, climbing, walking, preening, sleeping, eating, drinking, playing, arguing, fleeing, mimicking, stealing, landing on the player. A utility-based AI weighs needs, personality, relationships, time of day and trust each decision.
- **Sanity / perception**: exposure accumulators per hazard, grounding actions with diminishing returns, tiered hallucinations (props transform, dead plants bloom, clocks lie, a figure in the doorway, lights out, wrong reflections, blood, ghost text messages, time skips, rooms that stretch, an aviary where there should not be one), audio filtering, whispers and heartbeat, UI jitter and glitching that never becomes unusable.
- **Phone**: seven contacts with day-gated, condition-gated, branching conversations. Replying steadies Adrian and changes later events. Ignoring people makes the isolation worse. Some contacts should not be able to reply.
- **Story**: fractured across newspaper clippings, security footage, corrupted business records, damaged photographs, old tapes, dreams and phrases the parrots learn from things nobody remembers saying.
- **Input**: keyboard, mouse and touch share one path. On-screen buttons drive a
  virtual key state, and everything drawn registers its own tap area, so hit
  targets can never drift from the pixels.
- **Endings**: Connection, The Aviary, Collapse. Decided by how the birds were treated, how many people you reached out to, what you were willing to look at, and how far things fell.

Progress saves to `localStorage` when you sleep.

## Content note

Psychological horror, depression, suicidal ideation (non-instructional, off-screen), blood and surreal imagery. If any of it is close to home, please talk to someone.
