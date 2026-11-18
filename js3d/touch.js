// ===== Controlli touch per mobile: joystick + bottoni, invisibili su PC =====
const Touch = {
  enabled: false,
  joyKeys: [],
  joyId: null,
  camId: null,
  camLast: null,
  lastTouchT: 0,

  stamp() { this.lastTouchT = performance.now(); },

  refreshWeapon() {
    if (!this.fireBtn || !Game.player) return;
    const icons = { fists: '\u270a', bat: '\ud83c\udfcf', pistol: '\ud83d\udd2b', smg: '\u26a1', shotgun: '\ud83c\udfaf' };
    const ico = this.fireBtn.firstChild;
    if (ico && icons[Game.player.curWeapon]) ico.textContent = icons[Game.player.curWeapon];
  },

  detect() {
    const touchable = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
    const coarse = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
    return touchable && coarse;
  },

  init() {
    if (!this.detect()) return;
    this.enabled = true;
    this.build();
    Game.canvas.style.touchAction = 'none';
    Game.canvas.addEventListener('touchstart', (e) => { this.stamp(); this.onCanvasTouch(e); }, { passive: false });
    Game.canvas.addEventListener('touchmove', (e) => this.onCanvasMove(e), { passive: false });
    Game.canvas.addEventListener('touchend', (e) => this.onCanvasEnd(e));
    Game.canvas.addEventListener('touchcancel', (e) => this.onCanvasEnd(e));
  },

  build() {
    const ui = document.createElement('div');
    ui.id = 'touch-ui';

    // joystick sinistro
    const base = document.createElement('div');
    base.className = 'tc-joy';
    const knob = document.createElement('div');
    knob.className = 'tc-knob';
    base.appendChild(knob);
    ui.appendChild(base);
    base.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.stamp();
      if (this.joyId !== null) return;
      this.joyId = e.changedTouches[0].identifier;
      this.joyMove(base, knob, e);
    }, { passive: false });
    base.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.joyMove(base, knob, e);
    }, { passive: false });
    const joyEnd = () => this.joyEnd(base, knob);
    base.addEventListener('touchend', joyEnd);
    base.addEventListener('touchcancel', joyEnd);
    this.joyBase = base;
    this.joyKnob = knob;

    // cluster bottoni destro
    const cluster = document.createElement('div');
    cluster.className = 'tc-cluster';
    const mk = (icon, label, press, release, extra) => {
      const b = document.createElement('div');
      b.className = 'tc-btn' + (extra ? ' ' + extra : '');
      const ico = document.createElement('div');
      ico.className = 'tc-ico';
      ico.textContent = icon;
      const lab = document.createElement('div');
      lab.className = 'tc-lab';
      lab.textContent = label;
      b.appendChild(ico);
      b.appendChild(lab);
      b.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.stamp();
        b.classList.add('tc-active');
        if (navigator.vibrate) { try { navigator.vibrate(8); } catch (err) {} }
        press();
      }, { passive: false });
      if (release) {
        const up = (e) => { e.preventDefault(); b.classList.remove('tc-active'); release(); };
        b.addEventListener('touchend', up);
        b.addEventListener('touchcancel', up);
      }
      cluster.appendChild(b);
      return b;
    };
    this.fireBtn = mk('\ud83d\udd2b', 'Spara', () => { Input.mouse.down = true; }, () => { Input.mouse.down = false; }, 'tc-fire');
    mk('\ud83c\udfc3', 'Corri', () => { Input.keys.add('shift'); }, () => { Input.keys.delete('shift'); });
    mk('\ud83c\udfe0', 'Entra', () => { Input.keys.add('f'); Input.pressed.add('f'); }, () => { Input.keys.delete('f'); });
    mk('\ud83d\udcac', 'Parla', () => { Input.keys.add('t'); Input.pressed.add('t'); }, () => { Input.keys.delete('t'); });
    mk('\u270b', 'Usa', () => { Input.keys.add('e'); Input.pressed.add('e'); }, () => { Input.keys.delete('e'); });
    mk('\u27f2', 'Armi', () => { Input.wheel += 1; });
    ui.appendChild(cluster);

    // pausa in alto a destra
    const pause = document.createElement('div');
    pause.className = 'tc-pause';
    pause.textContent = '\u23f8';
    pause.addEventListener('touchstart', (e) => { e.preventDefault(); this.stamp(); togglePause(); }, { passive: false });
    ui.appendChild(pause);

    document.body.appendChild(ui);
    ui.classList.add('on');
    ui.addEventListener('contextmenu', (e) => e.preventDefault());
    this.uidom = ui;
  },

  brakeKeys() {
    for (const k of this.joyKeys) Input.keys.delete(k);
    this.joyKeys = [];
  },

  joyMove(base, knob, e) {
    for (const t of e.changedTouches) {
      if (this.joyId === null || t.identifier !== this.joyId) continue;
      const r = base.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = t.clientX - cx;
      let dy = t.clientY - cy;
      const max = r.width / 2 - 6;
      const len = Math.hypot(dx, dy);
      if (len > max) { dx = dx / len * max; dy = dy / len * max; }
      knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      base.classList.add('live');
      this.brakeKeys();
      const th = r.width * 0.16;
      if (dy < -th) { Input.keys.add('w'); this.joyKeys.push('w'); }
      if (dy > th) { Input.keys.add('s'); this.joyKeys.push('s'); }
      if (dx < -th) { Input.keys.add('a'); this.joyKeys.push('a'); }
      if (dx > th) { Input.keys.add('d'); this.joyKeys.push('d'); }
    }
  },

  joyEnd(base, knob) {
    if (this.joyId === null) return;
    this.joyId = null;
    knob.style.transform = 'translate(0px,0px)';
    base.classList.remove('live');
    this.brakeKeys();
  },

  onCanvasTouch(e) {
    if (this.camId !== null) return;
    for (const t of e.changedTouches) {
      const cx = window.innerWidth / 2;
      if (t.clientX >= cx) { this.camId = t.identifier; this.camLast = { x: t.clientX, y: t.clientY }; e.preventDefault(); return; }
    }
  },

  onCanvasMove(e) {
    if (this.camId === null || !this.camLast) return;
    for (const t of e.changedTouches) {
      if (t.identifier !== this.camId) continue;
      e.preventDefault();
      Game.camYaw -= (t.clientX - this.camLast.x) * 0.0052;
      Game.camPitch = clamp(Game.camPitch + (t.clientY - this.camLast.y) * 0.0035, 0.05, 1.15);
      this.camLast = { x: t.clientX, y: t.clientY };
    }
  },

  onCanvasEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === this.camId) { this.camId = null; this.camLast = null; }
    }
  },
};
