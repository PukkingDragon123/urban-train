// Keyboard + mouse input with just-pressed tracking.
(function (PH) {
  'use strict';
  const I = { down: {}, pressed: {}, released: {}, vdown: {}, vpressed: {}, mouse: { x: 0, y: 0, down: false, clicked: false }, anyKey: false, lastKey: null };
  const MAP = {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
    interact: ['KeyE', 'Enter'], use: ['KeyF', 'Space'], jump: ['Space', 'VirtualHop'], phone: ['Tab', 'KeyP'], journal: ['KeyJ'],
    breathe: ['ShiftLeft', 'ShiftRight'], cancel: ['Escape', 'Backspace'], mute: ['KeyM'], next: ['KeyE', 'KeyQ'],
    sing: ['KeyV'], look: ['KeyL'], help: ['KeyH', 'F1'],
  };
  I.init = function (canvas) {
    window.addEventListener('keydown', (e) => {
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace'].includes(e.code)) e.preventDefault();
      if (!I.down[e.code]) I.pressed[e.code] = true;
      I.down[e.code] = true; I.anyKey = true; I.lastKey = e.code;
      if (e.key && e.key.length === 1) I.typed = e.key;
    });
    window.addEventListener('keyup', (e) => { I.down[e.code] = false; I.released[e.code] = true; });
    window.addEventListener('blur', () => { I.down = {}; I.vdown = {}; });
    canvas.addEventListener('wheel', (e) => { I.wheel = Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
  };
  I.is = function (action) { const keys = MAP[action]; if (!keys) return false; for (const k of keys) if (I.down[k] || I.vdown[k]) return true; return false; };
  I.just = function (action) { const keys = MAP[action]; if (!keys) return false; for (const k of keys) if (I.pressed[k] || I.vpressed[k]) return true; return false; };
  I.justKey = function (code) { return !!(I.pressed[code] || I.vpressed[code]); };
  I.digit = function () { for (let i = 1; i <= 9; i++) if (I.pressed['Digit' + i]) return i; return 0; };
  // Virtual input, driven by the on-screen touch controls.
  I.hold = function (code, on) { if (on) I.vdown[code] = true; else delete I.vdown[code]; };
  I.tap = function (code) { I.vpressed[code] = true; I.anyKey = true; };
  I.endFrame = function () { I.pressed = {}; I.released = {}; I.vpressed = {}; I.mouse.clicked = false; I.anyKey = false; I.wheel = 0; I.typed = null; };
  PH.input = I;
})(window.PH);
