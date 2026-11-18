// ===== UI 3D: toast, dialoghi, conversazioni AI, audio, personalizzazione =====
let audioCtx = null;
function sfx(name) {
  try {
    if (typeof window === 'undefined' || !window.AudioContext) return;
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

function escHtml(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

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
    if (this._conv) {
      Memories.endConversation(this._conv);
      const cp = this._conv.ped;
      if (cp && cp._preConv) {
        if (cp.state === 'react' && cp.stateT > 9000) {
          cp.state = cp._preConv.state === 'walk' ? 'walk' : cp._preConv.state;
          cp.stateT = 0;
          cp.dest = null;
        }
        cp._preConv = null;
      }
      this._conv = null;
    }
  },

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
      this._conv.history.push({ who: 'Antonio', text: 'Tieni: 20 euro di benvenuto. Da me non si esite a mani vuote... anzi, tu s\u00ec. Vabb\u00e8.' });
      this.toast('+ $20 di benvenuto da Antonio', 'money');
      this.updateHUD();
    }
    ped._preConv = { state: ped.state, stateT: ped.stateT };
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
    document.getElementById('dialog-title').textContent = 'Conversazione \u2014 ' + ped.name + (ped.mood === 'grumpy' ? ' (di cattivo umore)' : ped.mood === 'friendly' ? ' (di buon umore)' : ped.mood === 'gangster' ? ' (della gang)' : ped.state === 'flee' ? ' (terrorizzato)' : '') + (AIChat.configured() ? ' \ud83e\udd16' : '');
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

  openAISettings() {
    this.dialogOpen = true;
    document.getElementById('dialog').classList.remove('hidden');
    document.getElementById('dialog-title').textContent = 'Impostazioni AI \ud83e\udd16';
    const s = AIChat.settings;
    const presetOpts = Object.entries(AIChat.presets).map(([id, p]) =>
      '<option value="' + id + '"' + (s.provider === id ? ' selected' : '') + '>' + p.label + '</option>'
    ).join('');
    document.getElementById('dialog-body').innerHTML =
      '<p style="margin-bottom:10px;">Collega una API AI per far generare le risposte dei NPC a un modello linguistico. ' +
      'La chiave viene salvata <b>solo nel tuo browser</b> (localStorage): non finisce mai nel codice su GitHub.</p>' +
      '<label style="display:block;margin:8px 0 4px;font-weight:700;">Attiva AI</label>' +
      '<select id="ai-enabled"><option value="0"' + (!s.enabled ? ' selected' : '') + '>No \u2014 motore locale</option>' +
      '<option value="1"' + (s.enabled ? ' selected' : '') + '>S\u00ec \u2014 usa l\'API</option></select>' +
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

// ---------- disegno 2D blocco per l'anteprima ----------
function drawPersonFlat(ctx, x, y, angle, o) {
  const moving = o.walkPhase !== undefined && o.walkPhase !== null;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(2, 4, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(angle + Math.PI / 2);
  const ph = moving ? Math.sin(o.walkPhase) : 0;
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.ellipse(-5, 6 + ph * 5, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(5, 6 - ph * 5, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = o.pants;
  ctx.fillRect(-7, -2 + ph * 3, 5, 12);
  ctx.fillRect(2, -2 - ph * 3, 5, 12);
  ctx.fillStyle = o.shirt;
  ctx.beginPath(); ctx.ellipse(0, 0, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = o.skin;
  ctx.beginPath(); ctx.arc(-10, -2 - ph * 3, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10, -2 + ph * 3, 3.5, 0, Math.PI * 2); ctx.fill();
  if (o.weapon && o.weapon !== 'fists') {
    ctx.fillStyle = '#111';
    if (o.weapon === 'bat') ctx.fillRect(9, -14, 4, 22);
    else ctx.fillRect(8, -16, 5, 12);
  }
  ctx.fillStyle = o.skin;
  ctx.beginPath(); ctx.arc(0, -9, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = o.hair;
  ctx.beginPath(); ctx.arc(0, -10, 7, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
  if (o.hat === 'cap') {
    ctx.fillStyle = o.shirt;
    ctx.beginPath(); ctx.arc(0, -10, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-3, -18, 6, 5);
  } else if (o.hat === 'top hat') {
    ctx.fillStyle = '#111';
    ctx.fillRect(-9, -14, 18, 4);
    ctx.fillRect(-6, -24, 12, 11);
  } else if (o.hat === 'bandana') {
    ctx.fillStyle = '#c1121f';
    ctx.fillRect(-7, -13, 14, 4);
  }
  ctx.restore();
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
    drawPersonFlat(ctx, 0, 0, -Math.PI / 2 + Math.sin(performance.now() / 900) * 0.4, {
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
