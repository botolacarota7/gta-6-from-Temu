// ===== Input: tastiera e mouse =====
const Input = {
  keys: new Set(),
  pressed: new Set(),
  mouse: { x: 0, y: 0, down: false },
  wheel: 0,

  init(canvas) {
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab'].includes(e.key)) e.preventDefault();
      const k = e.key.toLowerCase();
      if (!this.keys.has(k)) this.pressed.add(k);
      this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => { this.keys.clear(); this.mouse.down = false; });

    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', (e) => { if (e.button === 0) this.mouse.down = true; });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) this.mouse.down = false; });
    canvas.addEventListener('wheel', (e) => { this.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  },

  down(...ks) { return ks.some((k) => this.keys.has(k)); },
  hit(...ks) {
    for (const k of ks) { if (this.pressed.has(k)) { this.pressed.delete(k); return true; } }
    return false;
  },
  endFrame() { this.pressed.clear(); this.wheel = 0; },
};
