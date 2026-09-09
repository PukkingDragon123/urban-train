// Keyboard + mouse input with just-pressed tracking.
(function (PH) {
  'use strict';
  const I = { down: {}, pressed: {}, released: {}, mouse: { x: 0, y: 0, down: false, clicked: false }, anyKey: false, lastKey: null };
  const MAP = {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
    interact: ['KeyE', 'Enter'], use: ['KeyF', 'Space'], jump: ['Space'], phone: ['Tab', 'KeyP'], journal: ['KeyJ'],
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
    window.addEventListener('blur', () => { I.down = {}; });
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      I.mouse.x = (e.clientX - r.left) / r.width * PH.W; I.mouse.y = (e.clientY - r.top) / r.height * PH.H;
    });
    canvas.addEventListener('mousedown', (e) => { I.mouse.down = true; I.mouse.clicked = true; I.anyKey = true; });
    canvas.addEventListener('mouseup', () => { I.mouse.down = false; });
    canvas.addEventListener('wheel', (e) => { I.wheel = Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
  };
  I.is = function (action) { const keys = MAP[action]; if (!keys) return false; for (const k of keys) if (I.down[k]) return true; return false; };
  I.just = function (action) { const keys = MAP[action]; if (!keys) return false; for (const k of keys) if (I.pressed[k]) return true; return false; };
  I.justKey = function (code) { return !!I.pressed[code]; };
  I.digit = function () { for (let i = 1; i <= 9; i++) if (I.pressed['Digit' + i]) return i; return 0; };
  I.endFrame = function () { I.pressed = {}; I.released = {}; I.mouse.clicked = false; I.anyKey = false; I.wheel = 0; I.typed = null; };
  PH.input = I;
})(window.PH);
