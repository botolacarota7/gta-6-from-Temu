// ===== Gioco principale: loop, rendering, UI =====
const Game = {
  canvas: null, ctx: null,
  player: null,
  camX: 0, camY: 0,
  elapsed: 0,
  timeMin: 8 * 60,
  state: 'menu',      // menu | custom | play
  paused: false,
  prevMouseDown: false,
  lastFrame: 0,
};

// ---------- Audio ----------
let audioCtx = null;
function sfx(name) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    const cfg = {
      shot:    ['square', 190, 70, 0.09, 0.08],
      copshot: ['square', 150, 60, 0.09, 0.06],
      crash:   ['sawtooth', 110, 40, 0.16, 0.1],
      boom:    ['square', 70, 25, 0.45, 0.16],
      thud:    ['sine', 130, 60, 0.08, 0.1],
      cash:    ['sine', 880, 1320, 0.14, 0.07],
      door:    ['sine', 300, 240, 0.05, 0.06],
      punch:   ['sine', 170, 90, 0.06, 0.08],
      click:   ['sine', 600, 600, 0.03, 0.04],
    }[name] || ['sine', 440, 440, 0.05, 0.05];
    o.type = cfg[0];
    o.frequency.setValueAtTime(cfg[1], t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, cfg[2]), t + cfg[3]);
    g.gain.setValueAtTime(cfg[4], t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + cfg[3]);
    o.start(t); o.stop(t + cfg[3] + 0.02);
  } catch (e) { /* audio non disponibile */ }
}

// ---------- Danno al giocatore (aggiunto alla classe Player) ----------
Player.prototype.damage = function (dmg, from) {
  if (this.dead) return;
  if (this.armor > 0) {
    const absorbed = Math.min(this.armor, dmg * 0.65);
    this.armor -= absorbed;
    dmg -= absorbed;
  }
  this.health -= dmg;
  if (from) spawnBlood(this.x, this.y, 3);
  if (this.health <= 0) {
    this.health = 0;
    Systems.playerDied();
  }
  UI.updateHUD();
};

function escHtml(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------- UI ----------
const UI = {
  dialogOpen: false,

  toast(text, cls = '') {
    const box = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + cls;
    el.textContent = text;
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; }, 2600);
    setTimeout(() => el.remove(), 3100);
    while (box.children.length > 5 && box.firstChild) box.firstChild.remove();
  },

  dialog(title, body, buttons) {
    this.dialogOpen = true;
    document.getElementById('dialog').classList.remove('hidden');
    document.getElementById('dialog-title').textContent = title;
    document.getElementById('dialog-body').innerHTML = body;
    const btnBox = document.getElementById('dialog-buttons');
    btnBox.innerHTML = '';
    for (const b of buttons) {
      const el = document.createElement('button');
      el.className = 'btn' + (b.disabled ? ' disabled' : '');
      el.innerHTML = '<span class="dlg-item"><span>' + b.label + '</span>' +
        (b.sub ? '<span class="dlg-price">' + b.sub + '</span>' : '') + '</span>';
      if (!b.disabled) el.onclick = () => { sfx('click'); b.action(); };
      btnBox.appendChild(el);
    }
  },

  closeDialog() {
    this.dialogOpen = false;
    document.getElementById('dialog').classList.add('hidden');
    if (typeof this._chefStop === 'function') this._chefStop();
    if (this._convKey) { window.removeEventListener('keydown', this._convKey); this._convKey = null; }
    if (this._conv) { Memories.endConversation(this._conv); this._conv = null; }
  },

  // ---------- conversazioni con i NPC ----------
  startConversation(ped) {
    this.dialogOpen = true;
    this._conv = { ped, history: [], mem: Memories.ensure(ped), moodShift: 0 };
    const moodKey = ped.state === 'flee' ? 'scared' : (ped.mood || 'neutral');
    const pool = ped.isAntonio ? Dialogue.openings.antonio : (Dialogue.openings[moodKey] || Dialogue.openings.neutral);
    const callback = Memories.callbackLine(ped);
    const opening = callback || Dialogue.pickBag('open:' + moodKey, pool);
    this._conv.history.push({ who: ped.name, text: opening });
    if (ped.isAntonio && !ped.gaveGift) {
      ped.gaveGift = true;
      Game.player.money += 20;
      this._conv.history.push({ who: 'Antonio', text: 'Tieni: 20 euro di benvenuto. Da me non si esite a mani vuote... anzi, tu sì. Vabbè.' });
      this.toast('+ $20 di benvenuto da Antonio', 'money');
      this.updateHUD();
    }
    if (ped.state === 'walk') { ped.state = 'react'; ped.stateT = 9999; }
    this._convKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); this.closeDialog(); }
    };
    window.addEventListener('keydown', this._convKey);
    this.renderConv();
  },

  renderConv() {
    const ped = this._conv.ped;
    this.dialogOpen = true;
    document.getElementById('dialog').classList.remove('hidden');
    document.getElementById('dialog-title').textContent = 'Conversazione — ' + ped.name + (ped.mood === 'grumpy' ? ' (di cattivo umore)' : ped.mood === 'friendly' ? ' (di buon umore)' : ped.mood === 'gangster' ? ' (della gang)' : ped.state === 'flee' ? ' (terrorizzato)' : '') + (AIChat.configured() ? ' 🤖' : '');
    let hist = this._conv.history.slice(-8).map((h) =>
      '<div class="conv-line' + (h.who === 'Tu' ? ' me' : '') + '"><b>' + escHtml(h.who) + ':</b> ' + escHtml(h.text) + '</div>'
    ).join('');
    if (this._conv.pending) hist += '<div class="conv-line"><b>' + escHtml(ped.name) + ':</b> <i>sta pensando...</i></div>';
    document.getElementById('dialog-body').innerHTML =
      '<div id="conv-history">' + hist + '</div>' +
      '<div class="conv-input-row">' +
      '<input id="conv-input" type="text" maxlength="120" placeholder="Scrivi quello che vuoi dire...">' +
      '<button id="conv-send" class="btn conv-send">Parla</button></div>';
    const btns = document.getElementById('dialog-buttons');
    btns.innerHTML = '';
    for (const o of Dialogue.options(ped)) {
      const el = document.createElement('button');
      el.className = 'btn' + (o.danger ? ' btn-danger' : '');
      el.textContent = o.label;
      el.onclick = () => { sfx('click'); this.convRespond(o.line, o); };
      btns.appendChild(el);
    }
    const input = document.getElementById('conv-input');
    document.getElementById('conv-send').onclick = () => {
      const v = input.value.trim();
      if (v) this.convRespond(v, null);
    };
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); this.closeDialog(); }
      if (e.key === 'Enter') {
        e.preventDefault();
        const v = input.value.trim();
        if (v) this.convRespond(v, null);
      }
    });
    setTimeout(() => { try { input.focus(); } catch (e) {} }, 0);
    const h = document.getElementById('conv-history');
    h.scrollTop = h.scrollHeight;
  },

  async convRespond(line, option) {
    if (!this._conv || this._conv.pending) return;
    const ped = this._conv.ped;
    this._conv.history.push({ who: 'Tu', text: line });
    if (option && option.id) Memories.applyOption(this._conv, option.id);
    else Memories.applyText(this._conv, line);
    let replyText = null, effect = null;

    if (AIChat.configured()) {
      this._conv.pending = true;
      this.renderConv();
      try {
        replyText = await AIChat.reply(ped, line, this._conv.history.slice(0, -1));
      } catch (e) {
        if (!this._aiFailToasted) {
          this._aiFailToasted = true;
          this.toast('AI non raggiungibile (' + (e.message || 'errore') + '): uso il motore locale.', 'bad');
        }
        replyText = null;
      }
      this._conv.pending = false;
      if (!this._conv) return;
    }

    if (replyText == null) {
      const r = Dialogue.reply(ped, line);
      replyText = r.text;
      effect = r.effect;
    }

    if (option && option.exit) { this.closeDialog(); return; }
    this._conv.history.push({ who: ped.name, text: replyText });
    ped.say(replyText.length > 55 ? replyText.slice(0, 52) + '...' : replyText);

    if (effect === 'flee' || effect === 'rob') {
      this.toast(ped.name + ' se ne va di corsa!', effect === 'rob' ? 'money' : 'bad');
      this.closeDialog();
      return;
    }
    if (effect === 'marker') this.toast('Indicazione ricevuta: guarda il marcatore verde.', 'good');
    this.renderConv();
  },

  // ---------- impostazioni AI ----------
  openAISettings() {
    this.dialogOpen = true;
    document.getElementById('dialog').classList.remove('hidden');
    document.getElementById('dialog-title').textContent = 'Impostazioni AI 🤖';
    const s = AIChat.settings;
    const presetOpts = Object.entries(AIChat.presets).map(([id, p]) =>
      '<option value="' + id + '"' + (s.provider === id ? ' selected' : '') + '>' + p.label + '</option>'
    ).join('');
    document.getElementById('dialog-body').innerHTML =
      '<p style="margin-bottom:10px;">Collega una API AI per far generare le risposte dei NPC a un modello linguistico. ' +
      'La chiave viene salvata <b>solo nel tuo browser</b> (localStorage): non finisce mai nel codice su GitHub.</p>' +
      '<label style="display:block;margin:8px 0 4px;font-weight:700;">Attiva AI</label>' +
      '<select id="ai-enabled"><option value="0"' + (!s.enabled ? ' selected' : '') + '>No — motore locale</option>' +
      '<option value="1"' + (s.enabled ? ' selected' : '') + '>Sì — usa l\'API</option></select>' +
      '<label style="display:block;margin:8px 0 4px;font-weight:700;">Provider</label>' +
      '<select id="ai-provider">' + presetOpts + '</select>' +
      '<label style="display:block;margin:8px 0 4px;font-weight:700;">Chiave API</label>' +
      '<input id="ai-key" type="password" style="width:100%;padding:8px;background:#101018;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:6px;" value="' + escHtml(s.apiKey) + '" placeholder="Incolla qui la tua chiave">' +
      '<label style="display:block;margin:8px 0 4px;font-weight:700;">Modello (opzionale)</label>' +
      '<input id="ai-model" type="text" style="width:100%;padding:8px;background:#101018;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:6px;" value="' + escHtml(s.model) + '" placeholder="Default del provider">' +
      '<div id="ai-custom-url" style="display:' + (s.provider === 'custom' ? 'block' : 'none') + ';">' +
      '<label style="display:block;margin:8px 0 4px;font-weight:700;">URL endpoint (OpenAI-compatibile)</label>' +
      '<input id="ai-url" type="text" style="width:100%;padding:8px;background:#101018;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:6px;" value="' + escHtml(s.baseUrl) + '" placeholder="https://.../v1/chat/completions"></div>' +
      '<p id="ai-hint" style="margin-top:10px;font-size:13px;color:#9aa;">' + escHtml((AIChat.presets[s.provider] || {}).keyHint || '') + '</p>';

    const btns = document.getElementById('dialog-buttons');
    btns.innerHTML = '';
    const prov = document.getElementById('ai-provider');
    prov.addEventListener('change', () => {
      document.getElementById('ai-custom-url').style.display = prov.value === 'custom' ? 'block' : 'none';
      document.getElementById('ai-hint').textContent = (AIChat.presets[prov.value] || {}).keyHint || '';
    });
    const save = () => {
      s.enabled = document.getElementById('ai-enabled').value === '1';
      s.provider = prov.value;
      s.apiKey = document.getElementById('ai-key').value.trim();
      s.model = document.getElementById('ai-model').value.trim();
      s.baseUrl = (document.getElementById('ai-url') || { value: '' }).value.trim();
      AIChat.save();
      this.toast(s.enabled && AIChat.configured() ? 'AI collegata! I NPC ora parlano col modello.' :
        s.enabled ? 'Chiave o endpoint mancante: resto sul motore locale.' : 'AI disattivata: motore locale.', s.enabled && AIChat.configured() ? 'good' : 'bad');
      this.closeDialog();
    };
    const test = async () => {
      const bak = JSON.parse(JSON.stringify(s));
      s.enabled = document.getElementById('ai-enabled').value === '1';
      s.provider = prov.value;
      s.apiKey = document.getElementById('ai-key').value.trim();
      s.model = document.getElementById('ai-model').value.trim();
      s.baseUrl = (document.getElementById('ai-url') || { value: '' }).value.trim();
      this.toast('Test in corso...', '');
      try {
        const fake = { name: 'Antonio', mood: 'friendly', isAntonio: true, state: 'walk' };
        const out = await AIChat.reply(fake, 'Ciao! Test di collegamento: dimmi ciao in una frase.');
        this.toast('Funziona! Risposta: ' + out.slice(0, 80), 'good');
      } catch (e) {
        this.toast('Test fallito: ' + (e.message || 'errore'), 'bad');
      }
      Object.assign(s, bak);
    };
    const mk = (label, fn) => {
      const el = document.createElement('button');
      el.className = 'btn';
      el.textContent = label;
      el.onclick = fn;
      btns.appendChild(el);
    };
    mk('Salva impostazioni', save);
    mk('Testa collegamento', test);
    mk('Chiudi', () => this.closeDialog());
  },
  setHint(text) { document.getElementById('hud-hint').textContent = text || ''; },

  fadeFlash() {
    const f = document.getElementById('fade');
    f.style.opacity = '1';
    setTimeout(() => { f.style.opacity = '0'; }, 450);
  },

  updateHUD() {
    const pl = Game.player;
    if (!pl) return;
    document.getElementById('hud-money').textContent = fmtMoney(pl.money);
    document.getElementById('hud-health').style.width = clamp(pl.health / pl.maxHealth * 100, 0, 100) + '%';
    document.getElementById('hud-armor').style.width = clamp(pl.armor, 0, 100) + '%';
    const wbox = document.getElementById('hud-wanted');
    let stars = '';
    for (let i = 0; i < 5; i++) stars += '<span class="' + (i < pl.wanted ? 'star' : 'off') + '">\u2605</span>';
    wbox.innerHTML = stars;
    const w = WEAPONS[pl.curWeapon];
    let ammoTxt = '';
    if (w.bullet) ammoTxt = ' (' + pl.ammo[pl.curWeapon] + ')';
    document.getElementById('hud-weapon').textContent = w.name + ammoTxt;
    document.getElementById('hud-clock').textContent = fmtTime(Game.timeMin);
    const job = Systems.activeJob;
    document.getElementById('hud-objective').textContent = job ? '\ud83c\udfaf ' + job.objective.label : '';
    document.getElementById('hud-timer').textContent = job && job.timer !== null ? Math.ceil(job.timer) + 's' : '';
  },

  // ---------- minigioco chef ----------
  startChefMinigame() {
    let hits = 0, pos = 0, dir = 1, speed = 0.9, raf = null, active = true;
    let zoneStart = rand(25, 60), zoneW = 16;

    const body = document.getElementById('dialog-body');
    body.innerHTML = 'Prepara 3 piatti perfetti: premi <b>SPAZIO</b> quando l\'indicatore \u00e8 nella zona verde.<br>' +
      '<div id="cookbar" style="position:relative;height:34px;background:#222;border-radius:6px;margin-top:12px;overflow:hidden;">' +
      '<div id="cookzone" style="position:absolute;top:0;height:100%;background:#2c8f2c;"></div>' +
      '<div id="cookmark" style="position:absolute;top:0;width:6px;height:100%;background:#ffd23f;"></div></div>' +
      '<div id="cookscore" style="margin-top:8px;font-weight:700;">Piatti: 0/3</div>';
    document.getElementById('dialog-buttons').innerHTML = '';
    this.dialogOpen = true;
    document.getElementById('dialog').classList.remove('hidden');
    document.getElementById('dialog-title').textContent = 'Chef \u2014 Cottura perfetta';

    const zone = document.getElementById('cookzone');
    const mark = document.getElementById('cookmark');
    const score = document.getElementById('cookscore');

    const placeZone = () => { zoneStart = rand(15, 84 - zoneW); zone.style.left = zoneStart + '%'; zone.style.width = zoneW + '%'; };
    placeZone();

    const finish = (win) => {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      const pl = Game.player;
      if (win) {
        pl.money += 90;
        UI.toast('Servizio finito! Il capo \u00e8 fiero. +' + fmtMoney(90), 'money');
        sfx('cash');
      } else {
        UI.toast('Il capo ti caccia dalla cucina!', 'bad');
      }
      UI.updateHUD();
      UI.closeDialog();
      window.removeEventListener('keydown', onKey);
    };

    const onKey = (e) => {
      if (e.key !== ' ' || !active) return;
      e.preventDefault();
      if (pos >= zoneStart && pos <= zoneStart + zoneW) {
        hits++;
        speed += 0.35;
        zoneW = Math.max(8, zoneW - 2);
        score.textContent = 'Piatti: ' + hits + '/3';
        sfx('cash');
        if (hits >= 3) finish(true);
        else placeZone();
      }
    };
    window.addEventListener('keydown', onKey);

    let last = performance.now();
    const step = (now) => {
      if (!active) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      pos += dir * speed * 60 * dt;
      if (pos > 98) { pos = 98; dir = -1; }
      if (pos < 0) { pos = 0; dir = 1; }
      mark.style.left = pos + '%';
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    this._chefStop = () => {
      if (active) { active = false; if (raf) cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); }
      this._chefStop = null;
    };
    const quit = document.createElement('button');
    quit.className = 'btn';
    quit.textContent = 'Molla la cucina';
    quit.onclick = () => finish(false);
    document.getElementById('dialog-buttons').appendChild(quit);
  },
};

// ---------- Attacchi ----------
function playerAttack() {
  const pl = Game.player;
  const w = WEAPONS[pl.curWeapon];
  const now = Game.elapsed;
  if (now - pl.lastShot < w.rate / 1000) return;
  if (w.bullet && pl.ammo[pl.curWeapon] <= 0) {
    UI.toast('Senza munizioni! Comprane all\'Ammu-Nazione.', 'bad');
    return;
  }
  pl.lastShot = now;
  const aim = angleTo(pl.x, pl.y, Game.camX + Input.mouse.x, Game.camY + Input.mouse.y);
  pl.angle = aim;
  if (w.melee) {
    sfx('punch');
    let hitAny = false;
    for (const p of Entities.peds) {
      if (p.state === 'dead') continue;
      if (dist(pl.x, pl.y, p.x, p.y) < w.range && Math.abs(normAngle(angleTo(pl.x, pl.y, p.x, p.y) - aim)) < 1.1) {
        p.hit(w.dmg, pl, true);
        hitAny = true;
      }
    }
    for (const c of [...Entities.cops]) {
      if (dist(pl.x, pl.y, c.x, c.y) < w.range && Math.abs(normAngle(angleTo(pl.x, pl.y, c.x, c.y) - aim)) < 1.1) {
        c.hit(w.dmg, pl, true);
        hitAny = true;
      }
    }
    if (hitAny) Systems.crime(1, 'aggressione');
  } else {
    const pellets = w.pellets || 1;
    for (let i = 0; i < pellets; i++) {
      fireBullet(pl, aim + rand(-w.spread, w.spread), w.speed, w.dmg, true);
    }
    pl.ammo[pl.curWeapon]--;
    sfx('shot');
    Systems.gunfire(pl.x, pl.y);
    UI.updateHUD();
  }
}

// ---------- Interazioni ----------
function updateInteractions() {
  const pl = Game.player;
  if (Input.hit('escape')) {
    if (Phone.open) { Phone.close(); return; }
    if (UI.dialogOpen) { UI.closeDialog(); return; }
    togglePause();
    return;
  }

  if (Input.hit('p') && !UI.dialogOpen && !pl.dead) Phone.toggle();
  if (UI.dialogOpen || pl.dead) return;

  if (Input.hit('f')) {
    if (pl.inCar) {
      Systems.exitCar();
    } else {
      const car = Systems.nearestCar(80);
      if (car) Systems.enterCar(car);
    }
  }

  if (Input.hit('e')) {
    const door = nearestDoor(60);
    if (door) Systems.interactDoor(door);
  }

  if (Input.hit('t')) Systems.talkToNearestPed();

  // cambio arma
  for (let i = 0; i < WEAPON_ORDER.length; i++) {
    if (Input.hit(String(i + 1))) {
      const id = WEAPON_ORDER[i];
      if (pl.weapons[id]) { pl.curWeapon = id; UI.updateHUD(); }
      else UI.toast('Non possiedi: ' + WEAPONS[id].name, 'bad');
    }
  }
  if (Input.wheel !== 0) {
    const owned = WEAPON_ORDER.filter((id) => pl.weapons[id]);
    let idx = owned.indexOf(pl.curWeapon);
    idx = (idx + Input.wheel + owned.length) % owned.length;
    pl.curWeapon = owned[idx];
    UI.updateHUD();
  }

  // sparo
  const w = WEAPONS[pl.curWeapon];
  if (Input.mouse.down && !pl.inCar) {
    if (w.auto || !Game.prevMouseDown) playerAttack();
  }
  Game.prevMouseDown = Input.mouse.down;
}

function nearestDoor(range) {
  const pl = Game.player;
  let best = null, bd = range;
  for (const d of World.doors) {
    const dd = dist(pl.x, pl.y, d.x, d.y);
    if (dd < bd) { bd = dd; best = d; }
  }
  return best;
}

function updateHint() {
  const pl = Game.player;
  if (UI.dialogOpen || pl.dead) { UI.setHint(''); return; }
  const job = Systems.activeJob;
  if (job && job.objective && dist(pl.x, pl.y, job.objective.x, job.objective.y) < 55) {
    UI.setHint('[E] ' + job.objective.action);
    return;
  }
  if (pl.inCar) { UI.setHint('[F] Scendi dall\'auto'); return; }
  const door = nearestDoor(60);
  if (door) { UI.setHint('[E] ' + door.label); return; }
  const car = Systems.nearestCar(80);
  if (car) { UI.setHint('[F] Sali su: ' + car.label()); return; }
  const ped = Systems.nearestTalkablePed();
  if (ped) { UI.setHint('[T] Parla con ' + ped.name + ' · [P] Telefono'); return; }
  UI.setHint('[P] Telefono');
}

// ---------- Rendering ----------
function nightAmount() {
  const h = Game.timeMin / 60;
  if (h < 5.5) return 0.55;
  if (h < 7) return 0.55 * (7 - h) / 1.5;
  if (h > 20.5) return 0.55;
  if (h > 19) return 0.55 * (h - 19) / 1.5;
  return 0;
}

function render() {
  const ctx = Game.ctx;
  const vw = Game.canvas.width, vh = Game.canvas.height;
  const pl = Game.player;
  const night = nightAmount() > 0.15;

  Game.camX = clamp(pl.x - vw / 2, 0, WORLD_W - vw);
  Game.camY = clamp(pl.y - vh / 2, 0, WORLD_W - vh);
  const camX = Game.camX, camY = Game.camY;

  World.drawGround(ctx, camX, camY, vw, vh);

  // cadaveri
  for (const c of Entities.corpses) {
    const x = c.x - camX, y = c.y - camY;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(1.1);
    ctx.globalAlpha = clamp(c.t / 5, 0, 1);
    ctx.fillStyle = c.shirt;
    ctx.beginPath(); ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.skin;
    ctx.beginPath(); ctx.arc(14, 2, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // raccogli soldi
  for (const p of Entities.pickups) {
    const x = p.x - camX, y = p.y - camY;
    ctx.fillStyle = '#2c8f2c';
    ctx.beginPath(); ctx.arc(x, y, 8 + Math.sin(Game.elapsed * 6) * 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b8f5b8';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('$', x, y + 4);
  }

  World.drawBuildings(ctx, camX, camY, vw, vh, night);

  // marker obiettivo
  const job = Systems.activeJob;
  if (job) {
    const x = job.objective.x - camX, y = job.objective.y - camY;
    const pulse = 14 + Math.sin(Game.elapsed * 5) * 4;
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, pulse * 0.55, 0, Math.PI * 2); ctx.stroke();
  }

  // marker verde: indicazioni ricevute in conversazione
  if (Systems.tempObjective) {
    const t = Systems.tempObjective;
    const x = t.x - camX, y = t.y - camY;
    const pulse = 14 + Math.sin(Game.elapsed * 7) * 4;
    ctx.strokeStyle = '#69f069';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#69f069';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(t.label, x, y - pulse - 8);
  }

  // auto
  for (const c of Entities.cars) drawCar(ctx, c, camX, camY, night);

  // pedoni
  for (const p of Entities.peds) {
    if (p.state === 'dead') continue;
    drawPerson(ctx, p.x - camX, p.y - camY, p.angle, {
      skin: p.skin, shirt: p.shirt, pants: p.pants, hair: p.hair, hat: p.hat,
      walkPhase: p.state === 'react' ? null : p.walkPhase,
    });
  }

  // poliziotti
  for (const c of Entities.cops) {
    drawPerson(ctx, c.x - camX, c.y - camY, c.angle, {
      skin: '#e0ac69', shirt: '#1f4e8c', pants: '#16283f', hair: '#2b2b2b', hat: 'cap',
      walkPhase: c.walkPhase,
    });
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.arc(c.x - camX, c.y - camY - 2, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  // giocatore
  if (!pl.inCar && !pl.dead) {
    const aim = angleTo(pl.x, pl.y, camX + Input.mouse.x, camY + Input.mouse.y);
    pl.angle = aim;
    drawPerson(ctx, pl.x - camX, pl.y - camY, pl.angle, {
      skin: pl.custom.skin, shirt: pl.custom.shirt, pants: pl.custom.pants,
      hair: pl.custom.hair, hat: pl.custom.hat,
      walkPhase: pl.walkPhase, weapon: pl.curWeapon,
    });
  }

  // proiettili
  ctx.strokeStyle = '#ffe08a';
  ctx.lineWidth = 2;
  for (const b of Entities.bullets) {
    ctx.beginPath();
    ctx.moveTo(b.x - camX, b.y - camY);
    ctx.lineTo(b.x - camX - b.vx * 0.015, b.y - camY - b.vy * 0.015);
    ctx.stroke();
  }

  // particelle
  for (const p of Entities.particles) {
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x - camX, p.y - camY, p.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // notte
  const dark = nightAmount();
  if (dark > 0) {
    ctx.fillStyle = 'rgba(8,10,38,' + dark + ')';
    ctx.fillRect(0, 0, vw, vh);
    ctx.globalCompositeOperation = 'lighter';
    for (const c of Entities.cars) {
      if (c.state === 'wreck') continue;
      const x = c.x - camX, y = c.y - camY;
      if (x < -200 || y < -200 || x > vw + 200 || y > vh + 200) continue;
      const fx = x + Math.cos(c.angle) * c.w / 2, fy = y + Math.sin(c.angle) * c.h / 2;
      const grad = ctx.createRadialGradient(fx, fy, 4, fx, fy, 130);
      grad.addColorStop(0, 'rgba(255,230,150,' + (0.28 * dark / 0.55) + ')');
      grad.addColorStop(1, 'rgba(255,230,150,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.arc(fx, fy, 130, c.angle - 0.35, c.angle + 0.35);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // bolle di dialogo
  for (const p of Entities.peds) if (p.bubble) drawBubble(ctx, p.x - camX, p.y - camY - 30, p.bubble);
  for (const c of Entities.cops) if (c.bubble) drawBubble(ctx, c.x - camX, c.y - camY - 30, c.bubble);

  // freccia verso l'obiettivo
  if (job) {
    const ox = job.objective.x - camX, oy = job.objective.y - camY;
    if (ox < 0 || oy < 0 || ox > vw || oy > vh) {
      const cx = vw / 2, cy = vh / 2;
      const a = angleTo(cx, cy, ox, oy);
      const ax = cx + Math.cos(a) * (Math.min(vw, vh) / 2 - 50);
      const ay = cy + Math.sin(a) * (Math.min(vw, vh) / 2 - 50);
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(a);
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(16, 0); ctx.lineTo(-10, -10); ctx.lineTo(-10, 10);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  drawMinimap();
}

function drawCar(ctx, c, camX, camY, night) {
  const x = c.x - camX, y = c.y - camY;
  if (x < -80 || y < -80 || x > Game.canvas.width + 80 || y > Game.canvas.height + 80) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(c.angle);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(-c.w / 2 + 3, -c.h / 2 + 4, c.w, c.h);
  ctx.fillStyle = c.color;
  roundRect(ctx, -c.w / 2, -c.h / 2, c.w, c.h, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.55)';
  ctx.lineWidth = 2;
  roundRect(ctx, -c.w / 2, -c.h / 2, c.w, c.h, 5);
  ctx.stroke();
  // tettuccio e parabrezza
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(-c.w * 0.18, -c.h / 2 + 3, c.w * 0.36, c.h - 6);
  ctx.fillStyle = 'rgba(180,220,255,.8)';
  ctx.fillRect(c.w * 0.14, -c.h / 2 + 3, 6, c.h - 6);
  // fari
  ctx.fillStyle = night ? '#ffe08a' : 'rgba(255,255,220,.6)';
  ctx.fillRect(c.w / 2 - 3, -c.h / 2 + 2, 3, 4);
  ctx.fillRect(c.w / 2 - 3, c.h / 2 - 6, 3, 4);
  // fanali posteriori
  ctx.fillStyle = c.speed < -10 ? '#ff5252' : '#7a1f1f';
  ctx.fillRect(-c.w / 2, -c.h / 2 + 2, 2, 4);
  ctx.fillRect(-c.w / 2, c.h / 2 - 6, 2, 4);
  if (c.state === 'wreck') {
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
  }
  ctx.restore();
  if (c.owner) {
    ctx.fillStyle = '#7dd87d';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TUA', x, y - c.h / 2 - 6);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBubble(ctx, x, y, text) {
  ctx.font = '13px Arial';
  const w = ctx.measureText(text).width + 16;
  const bx = x - w / 2, by = y - 22;
  ctx.fillStyle = 'rgba(255,255,255,.95)';
  roundRect(ctx, bx, by, w, 22, 8);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 5, by + 22); ctx.lineTo(x + 5, by + 22); ctx.lineTo(x, by + 29);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, by + 15);
}

function drawMinimap() {
  const mm = document.getElementById('minimap');
  const m = mm.getContext('2d');
  m.drawImage(World.minimapBase, 0, 0);
  const s = World.mmScale;
  const blink = Math.sin(Game.elapsed * 6) > 0;

  const job = Systems.activeJob;
  if (job && blink) {
    m.fillStyle = '#ffd23f';
    m.beginPath(); m.arc(job.objective.x * s, job.objective.y * s, 4, 0, Math.PI * 2); m.fill();
  }
  if (Systems.tempObjective && blink) {
    m.fillStyle = '#69f069';
    m.beginPath(); m.arc(Systems.tempObjective.x * s, Systems.tempObjective.y * s, 3.5, 0, Math.PI * 2); m.fill();
  }
  m.fillStyle = '#4fc3f7';
  for (const c of Entities.cops) { m.beginPath(); m.arc(c.x * s, c.y * s, 2, 0, Math.PI * 2); m.fill(); }
  m.fillStyle = '#7dd87d';
  for (const c of Game.player.ownedCars) { m.fillRect(c.x * s - 2, c.y * s - 2, 4, 4); }
  m.fillStyle = '#ff5252';
  for (const p of Entities.peds) {
    if (p.gang === 'rival' && p.state !== 'dead') { m.beginPath(); m.arc(p.x * s, p.y * s, 2.5, 0, Math.PI * 2); m.fill(); }
  }
  const pl = Game.player;
  m.fillStyle = '#fff';
  m.strokeStyle = '#000';
  m.lineWidth = 1;
  m.beginPath(); m.arc(pl.x * s, pl.y * s, 3, 0, Math.PI * 2); m.fill(); m.stroke();
}

// ---------- Avvio partita ----------
function startGame(save) {
  document.getElementById('screen-menu').classList.add('hidden');
  document.getElementById('screen-custom').classList.add('hidden');
  document.getElementById('screen-pause').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');

  if (!World.ground) World.generate();
  Entities.peds.length = 0;
  Entities.cars.length = 0;
  Entities.cops.length = 0;
  Entities.bullets.length = 0;
  Entities.particles.length = 0;
  Entities.corpses.length = 0;
  Entities.pickups.length = 0;
  Systems.activeJob = null;
  Systems.gangPedsSpawned = false;

  let custom;
  if (save) {
    custom = save.custom;
  } else {
    custom = CustomScreen.collect();
  }
  Game.player = new Player(custom);
  Game.timeMin = save ? save.timeMin : 8 * 60;
  Game.elapsed = 0;

  const pizzeria = World.doors.find((d) => d.type === 'pizzeria');
  if (save) {
    Game.player.x = save.x; Game.player.y = save.y;
    Game.player.money = save.money;
    Game.player.health = save.health;
    Game.player.armor = save.armor;
    Game.player.weapons = save.weapons;
    Game.player.ammo = save.ammo;
    Game.player.curWeapon = save.curWeapon;
    Game.player.gangRep = save.gangRep;
    Game.player.weapons.fists = true;
  } else {
    Game.player.x = pizzeria.x;
    Game.player.y = pizzeria.y + 90;
  }

  // auto iniziale / auto possedute
  const spawnOwned = (carId, nearX, nearY) => {
    const spec = SHOP_CARS.find((c) => c.id === carId);
    if (!spec) return null;
    const car = new Car(nearX + rand(-70, 70), nearY + 60, 0, { ...spec }, 'parked');
    car.owner = Game.player.custom.name;
    Entities.cars.push(car);
    Game.player.ownedCars.push(car);
    return car;
  };
  Game.player.ownedCars = [];
  if (save) {
    for (const id of save.ownedCarIds || []) spawnOwned(id, Game.player.x, Game.player.y);
  } else {
    const carChoice = document.getElementById('custom-car').value;
    if (carChoice !== 'none') spawnOwned(carChoice, Game.player.x, Game.player.y);
  }

  // popolazione iniziale
  Systems.spawnAntonio();
  for (let i = 0; i < 30; i++) Systems.spawnPedNear(Game.player);
  for (let i = 0; i < 8; i++) Systems.spawnTrafficCar(Game.player);
  for (let i = 0; i < 6; i++) Systems.spawnParkedCar(Game.player);

  Game.state = 'play';
  Game.paused = false;
  UI.updateHUD();
  UI.toast('Benvenuto a Città Temu, ' + custom.name + '!', 'good');
  UI.toast('Premi P per lo smartphone: chiamate, SMS, Instagrim e browser.', '');
  UI.toast('Premi Esc per i comandi. Cerca i punti gialli sulle porte.', '');
}

function togglePause() {
  Game.paused = !Game.paused;
  document.getElementById('screen-pause').classList.toggle('hidden', !Game.paused);
}

// ---------- Personalizzazione ----------
const CustomScreen = {
  sel: { skin: 0, shirt: 0, pants: 0, hair: 0, hat: 'none' },
  palettes: {
    skin: ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#5c3a21'],
    shirt: ['#c1121f', '#1f4e8c', '#2c8f2c', '#c9a227', '#8e44ad', '#111111', '#e0e0e0', '#ff6b35'],
    pants: ['#33475b', '#222222', '#6b4a3a', '#4a6741', '#7a7a7a'],
    hair: ['#2b2b2b', '#4a3626', '#7a5a30', '#b5651d', '#999999', '#c1121f'],
  },

  init() {
    for (const key of ['skin', 'shirt', 'pants', 'hair']) {
      const box = document.getElementById('sw-' + key);
      box.innerHTML = '';
      this.palettes[key].forEach((col, i) => {
        const s = document.createElement('div');
        s.className = 'swatch' + (this.sel[key] === i ? ' sel' : '');
        s.style.background = col;
        s.onclick = () => { this.sel[key] = i; this.init(); sfx('click'); };
        box.appendChild(s);
      });
    }
    document.getElementById('custom-hat').value = this.sel.hat;
    document.getElementById('custom-hat').onchange = (e) => { this.sel.hat = e.target.value; };
  },

  collect() {
    return {
      name: document.getElementById('custom-name').value.trim() || 'Artronio',
      skin: this.palettes.skin[this.sel.skin],
      shirt: this.palettes.shirt[this.sel.shirt],
      pants: this.palettes.pants[this.sel.pants],
      hair: this.palettes.hair[this.sel.hair],
      hat: this.sel.hat,
    };
  },

  drawPreview() {
    if (document.getElementById('screen-custom').classList.contains('hidden')) return;
    const cv = document.getElementById('preview');
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#1a1a28';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = 'rgba(255,255,255,.04)';
    for (let i = 0; i < 8; i++) ctx.fillRect(0, i * 36, cv.width, 18);
    const c = this.collect();
    ctx.save();
    ctx.translate(cv.width / 2, cv.height / 2 + 20);
    ctx.scale(3.2, 3.2);
    ctx.translate(-0, -0);
    drawPerson(ctx, 0, 0, -Math.PI / 2 + Math.sin(performance.now() / 900) * 0.4, {
      skin: c.skin, shirt: c.shirt, pants: c.pants, hair: c.hair, hat: c.hat,
      walkPhase: performance.now() / 160,
    });
    ctx.restore();
    ctx.fillStyle = '#9aa';
    ctx.font = '13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(c.name, cv.width / 2, cv.height - 12);
    requestAnimationFrame(() => this.drawPreview());
  },
};

// ---------- Loop ----------
function loop(now) {
  requestAnimationFrame(loop);
  const dt = clamp((now - Game.lastFrame) / 1000, 0, 0.05);
  Game.lastFrame = now;

  if (Game.state !== 'play') return;
  if (!Game.paused && !UI.dialogOpen && !Game.player.dead) {
    Game.elapsed += dt;
    Systems.update(dt);
    updateInteractions();
    updateHint();
  }
  if (Game.player) render();
  if (Phone.open) {
    document.getElementById('phone-clock').textContent = fmtTime(Game.timeMin);
    document.getElementById('phone-money').textContent = fmtMoney(Game.player.money);
  }
}

// ---------- Boot ----------
function boot() {
  Game.canvas = document.getElementById('game');
  Game.ctx = Game.canvas.getContext('2d');
  Input.init(Game.canvas);

  document.getElementById('btn-new').onclick = () => {
    sfx('click');
    document.getElementById('screen-menu').classList.add('hidden');
    document.getElementById('screen-custom').classList.remove('hidden');
    CustomScreen.init();
    CustomScreen.drawPreview();
  };
  document.getElementById('btn-start').onclick = () => { sfx('click'); startGame(null); };
  document.getElementById('btn-continue').onclick = () => {
    sfx('click');
    const save = Systems.loadSave();
    if (save) startGame(save);
  };
  document.getElementById('btn-help').onclick = () => document.getElementById('screen-help').classList.remove('hidden');
  document.getElementById('btn-help2').onclick = () => document.getElementById('screen-help').classList.remove('hidden');
  document.getElementById('btn-help-close').onclick = () => document.getElementById('screen-help').classList.add('hidden');
  document.getElementById('btn-ai').onclick = () => { sfx('click'); UI.openAISettings(); };
  document.getElementById('btn-ai2').onclick = () => { sfx('click'); UI.openAISettings(); };
  document.getElementById('hud-phone').onclick = () => Phone.toggle();
  document.getElementById('btn-resume').onclick = () => togglePause();
  document.getElementById('btn-save').onclick = () => Systems.save();
  document.getElementById('btn-quit').onclick = () => {
    Systems.save();
    Game.state = 'menu';
    Game.paused = false;
    document.getElementById('screen-pause').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('screen-menu').classList.remove('hidden');
    refreshContinue();
  };

  document.getElementById('phone').addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    if (el.dataset.action === 'home') {
      if (Phone.app === 'home' && !Phone.calling) Phone.close();
      else { Phone.app = 'home'; Phone.thread = null; Phone.site = null; Phone.photo = null; Phone.calling = null; Phone.render(); }
      return;
    }
    Phone.handleAction(el.dataset.action, el);
  });

  if (Systems.hasSave()) document.getElementById('btn-continue').classList.remove('hidden');

  window.addEventListener('beforeunload', () => { if (Game.state === 'play') Systems.save(); });
  setInterval(() => { if (Game.state === 'play' && !Game.paused && !Game.player.dead) Systems.save(); }, 20000);

  requestAnimationFrame((t) => { Game.lastFrame = t; loop(t); });
}

function refreshContinue() {
  document.getElementById('btn-continue').classList.toggle('hidden', !Systems.hasSave());
}

boot();
