// ===== Smartphone: chiamate, SMS, fotocamera, Instagrim, browser =====
const Phone = {
  open: false,
  app: 'home',
  thread: null,
  site: null,
  photo: null,
  calling: null,
  aiNews: { items: [], loading: false, stamp: -9999, error: null },

  contacts: [
    { id: 'antonio', name: 'Antonio', icon: '🕴️', persona: 'Sei ANTONIO, informatore chiacchierone e filosofo urbano di GTA VI: Temu Edition. Adori la pizza di Gino e fai battute su GTA 6 e Temu. Il giocatore è tuo amico.' },
    { id: 'gino', name: 'Gino (Pizzeria)', icon: '🍕', persona: 'Sei GINO, pizzaiolo napoletano di Da Gino. Parli con calore, offri sempre lavoro a chi consegna pizze, e ti scandalizza l\'ananas sulla pizza.' },
    { id: 'boss', name: 'Boss Los Pepes', icon: '🕶️', persona: 'Sei il BOSS dei Los Pepes: gangster freddo, parli poco ma pesante, di rispetto e affari. Non fare mai domande dirette.' },
    { id: 'taxi', name: 'Taxi Temu', icon: '🚕', persona: 'Sei il centralinista dei TAXI TEMU: veloce, cordiale, sempre in promozione.' },
    { id: 'polizia', name: '112 Emergenze', icon: '🚓', persona: 'Sei un operatore del 112: professionale ma stanco, abituato a chiamate assurde.' },
    { id: 'ospedale', name: 'Ospedale', icon: '🏥', persona: 'Sei la reception dell\'ospedale: gentile ma sempre pronta a ricordare che le cure costano.' },
    { id: 'dealer', name: 'Concessionaria', icon: '🚗', persona: 'Sei il venditore della Concessionaria Temu: esagerato, da pubblicità, prometti miracoli.' },
  ],

  spamPool: [
    '🎉 TEMU PROMO: 90% DI SCONTO su tutto! Offerta valida da 3 anni.',
    '📱 Il tuo pacchetto è in consegna... in un altro continente.',
    '💎 Sei il 1.000.000º visitatore di Temu Città! (non vero)',
    '🔥 GTA 6 da Temu: solo oggi a 4,99€. Ieri era 3,99€. Domani 5,99€.',
  ],
  antonioTips: [
    'Sst... l\'Ammu-Nazione ha le munizioni in offerta il martedì. Che è sempre martedì qui.',
    'Se la polizia ti insegue, passa dall\'ospedale: non lo sospettano mai.',
    'Il boss dei Pepes paga meglio se sali di reputazione. E io prendo la percentuale, ovviamente.',
    'Consiglio da taxi: se hai troppe stelle, il tassista scappa. Fatti il giro a piedi.',
    'Da Gino la margherita cura anche il cuore. Metaforicamente. Quasi.',
  ],

  // ---------- persistenza ----------
  load() {
    this.smsThreads = {};
    this.posts = [];
    this.followers = 12;
    try {
      const sms = localStorage.getItem('gta-temu-sms');
      if (sms) this.smsThreads = JSON.parse(sms) || {};
      const inst = localStorage.getItem('gta-temu-insta');
      if (inst) {
        const d = JSON.parse(inst);
        this.posts = d.posts || [];
        this.followers = d.followers || 12;
      }
    } catch (e) { /* storage non disponibile */ }
  },
  saveSms() {
    try { localStorage.setItem('gta-temu-sms', JSON.stringify(this.smsThreads)); } catch (e) { /* noop */ }
  },
  saveInsta() {
    try { localStorage.setItem('gta-temu-insta', JSON.stringify({ posts: this.posts.slice(0, 6), followers: this.followers })); } catch (e) { /* noop */ }
  },

  // ---------- interfaccia ----------
  toggle() {
    this.open = !this.open;
    const el = document.getElementById('phone');
    el.classList.toggle('hidden', !this.open);
    const btn = document.getElementById('hud-phone');
    if (btn) btn.classList.toggle('hidden-btn', this.open);
    sfx('click');
    if (this.open) { this.app = 'home'; this.render(); }
  },

  close() {
    this.open = false;
    document.getElementById('phone').classList.add('hidden');
    const btn = document.getElementById('hud-phone');
    if (btn) btn.classList.remove('hidden-btn');
    this.calling = null;
  },

  render() {
    const screen = document.getElementById('phone-screen');
    if (!screen) return;
    const clock = fmtTime(Game.timeMin);
    document.getElementById('phone-clock').textContent = clock;
    document.getElementById('phone-money').textContent = fmtMoney(Game.player ? Game.player.money : 0);
    screen.classList.toggle('on-home', !this.calling && this.app === 'home');

    if (this.calling) { this.renderCall(screen); return; }
    switch (this.app) {
      case 'calls': this.renderCalls(screen); break;
      case 'sms': this.thread ? this.renderThread(screen) : this.renderSmsList(screen); break;
      case 'camera': this.renderCamera(screen); break;
      case 'insta': this.photo ? this.renderComposer(screen) : this.renderInsta(screen); break;
      case 'browser': this.site ? this.renderSite(screen) : this.renderBrowserHome(screen); break;
      default: this.renderHome(screen);
    }
  },

  bar(title, back) {
    return '<div class="ph-head">' + (back ? '<button class="ph-back" data-action="back">←</button>' : '<span class="ph-back-spacer"></span>') +
      '<span class="ph-title">' + title + '</span><span class="ph-back-spacer"></span></div>';
  },

  renderHome(screen) {
    const day = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'][new Date().getDay()];
    const apps = [
      ['calls', '📞', 'Telefono', 'ic-green'], ['sms', '💬', 'Messaggi', 'ic-blue'],
      ['camera', '📷', 'Fotocamera', 'ic-slate'], ['insta', '🖼️', 'Instagrim', 'ic-pink'],
      ['browser', '🌐', 'Browser', 'ic-cyan'], ['site', '📰', 'Cronache', 'ic-red', 'cronache'],
      ['site', '🛒', 'temU', 'ic-orange', 'temu'], ['more', '⚙️', 'Extra', 'ic-gray'],
    ];
    const dock = [
      ['calls', '📞', 'ic-green'], ['sms', '💬', 'ic-blue'],
      ['browser', '🌐', 'ic-cyan'], ['insta', '🖼️', 'ic-pink'],
    ];
    const tile = (a) => a[0] === 'site'
      ? '<button class="ph-app ' + a[3] + '" data-action="appsite" data-site="' + a[4] + '"><span>' + a[1] + '</span><label>' + a[2] + '</label></button>'
      : '<button class="ph-app ' + a[3] + '" data-action="app" data-app="' + a[0] + '"><span>' + a[1] + '</span><label>' + a[2] + '</label></button>';
    screen.innerHTML = '<div class="ph-home">' +
      '<div class="ph-clockw"><div class="ph-clock-big">' + fmtTime(Game.timeMin) + '</div>' +
      '<div class="ph-clock-sub">' + day + ' · Città Temu</div></div>' +
      '<div class="ph-grid">' + apps.map(tile).join('') + '</div>' +
      '<div class="ph-dock">' + dock.map((a) =>
        '<button class="ph-app ' + a[2] + ' docked" data-action="app" data-app="' + a[0] + '"><span>' + a[1] + '</span></button>'
      ).join('') + '</div>' +
      '<div class="ph-widget">' + escHtml(Game.player.custom.name) + ' · ' + this.followers + ' follower · ' + this.posts.length + ' post</div>' +
      '</div>';
  },

  renderCalls(screen) {
    screen.innerHTML = this.bar('Chiamate', true) + '<div class="ph-list">' +
      this.contacts.map((c) =>
        '<button class="ph-row" data-action="call" data-id="' + c.id + '"><span class="ph-ic">' + c.icon + '</span><span class="ph-name">' + c.name + '</span><span class="ph-sub">chiama</span></button>'
      ).join('') + '</div>';
  },

  call(id) {
    const c = this.contacts.find((x) => x.id === id);
    if (!c) return;
    this.calling = { contact: c, t: 0, stage: 'ring' };
    sfx('door');
    this.render();
    const self = this;
    setTimeout(() => { if (!self.open || !self.calling) return; self.calling.stage = 'live'; self.callOutcome(c); }, 1500);
  },

  callOutcome(c) {
    const pl = Game.player;
    const self = this;
    const say = (lines, done) => {
      self.calling.lines = lines;
      self.render();
      if (done) setTimeout(() => { if (self.calling && self.calling.contact.id === c.id) { self.calling = null; if (done === true) self.render(); else done(); } }, 2600);
    };
    switch (c.id) {
      case 'antonio': {
        const tip = choice(this.antonioTips);
        const door = choice(World.doors);
        Systems.tempObjective = { x: door.x, y: door.y, label: door.label, t: 15 };
        say(['Pronto? Antonio parla, ascolta il mondo.', tip, 'Ti ho segnato un posto sulla mappa. Gratis. Questa volta.'], true);
        break;
      }
      case 'gino':
        if (Systems.activeJob) { say(['Gino: "Adesso sei già impegnato! Prima quello, poi le pizze!"'], true); break; }
        say(['Gino: "Pronto! Ho una margherita che chiede aiuto. Muoviti!"'], () => { Systems.startPizzaJob(); self.calling = null; self.render(); });
        break;
      case 'boss':
        say(['Boss: "Vieni alla base. Si parla a voce."'], () => { self.calling = null; self.close(); Systems.openGang(); });
        break;
      case 'taxi':
        if (pl.wanted >= 3) { say(['Taxi: "Con tutte quelle stelle? Il tassista ha paura. Trovati un alibi."'], true); break; }
        self.calling = null;
        self.render();
        self.taxiMenu();
        break;
      case 'polizia':
        if (pl.wanted > 0) {
          say(['112: "Ah, sei TU. Siamo già in strada. Corri."'], () => {
            for (let i = 0; i < 2; i++) Systems.spawnCop(pl);
            self.calling = null; self.render();
          });
        } else if (Math.random() < 0.5) {
          say(['112: "Scherzi telefonici sono reato. Multa simbolica: ' + fmtMoney(50) + '."'], () => {
            pl.money = Math.max(0, pl.money - 50);
            UI.toast('-' + fmtMoney(50) + ' di multa', 'bad');
            UI.updateHUD();
            self.calling = null; self.render();
          });
        } else {
          say(['112: "Pronto? Se è per il gatto sull\'albero... mandiamo il pompiere."'], true);
        }
        break;
      case 'ospedale':
        if (pl.health >= pl.maxHealth) { say(['Ospedale: "Lei è integra! Risparmi pure ' + fmtMoney(150) + '."'], true); break; }
        if (pl.money < 150) { say(['Ospedale: "Le cure costano ' + fmtMoney(150) + '. Torni quando ha soldi. O quando è peggio."'], true); break; }
        say(['Ospedale: "Curato a distanza! Medicina moderna. Sono ' + fmtMoney(150) + '."'], () => {
          pl.money -= 150; pl.health = pl.maxHealth;
          UI.toast('Curato via telefono! +' + fmtMoney(0) + ' salute piena', 'good');
          UI.updateHUD();
          self.calling = null; self.render();
        });
        break;
      case 'dealer': {
        const owned = pl.ownedCars;
        if (!owned.length) { say(['Concessionaria: "Prima comprati una macchina, poi la consegniamo!"'], true); break; }
        if (pl.money < 200) { say(['Concessionaria: "Consegna a domicilio: ' + fmtMoney(200) + '. Senza soldi, niente camion."'], true); break; }
        say(['Concessionaria: "Il camion parte subito! Le tue auto arrivano qui."'], () => {
          pl.money -= 200;
          for (const car of owned) {
            if (car.state === 'wreck') { car.state = 'parked'; car.hp = 100; car.color = car.spec.color; }
            car.x = pl.x + rand(-120, 120); car.y = pl.y + rand(60, 140);
          }
          UI.toast('-' + fmtMoney(200) + ': le tue auto sono qui!', 'money');
          UI.updateHUD();
          self.calling = null; self.render();
        });
        break;
      }
      default: say(['...'], true);
    }
  },

  renderCall(screen) {
    const c = this.calling.contact;
    const stage = this.calling.stage === 'ring' ? 'Squilla...' : 'In conversazione...';
    const lines = (this.calling.lines || []).map((l) => '<div class="ph-call-line">' + escHtml(l) + '</div>').join('');
    screen.innerHTML = this.bar('Chiamata', false) +
      '<div class="ph-call"><div class="ph-call-ic">' + c.icon + '</div><div class="ph-call-name">' + escHtml(c.name) + '</div>' +
      '<div class="ph-call-status">' + stage + '</div><div class="ph-call-lines">' + lines + '</div>' +
      '<button class="btn btn-danger ph-hangup" data-action="hangup">Riattacca</button></div>';
  },

  taxiMenu() {
    UI.dialog('Taxi Temu', 'Dove ti porto? Il tassista accetta solo contanti e complimenti.', [
      ...World.doors.map((d) => ({
        label: d.label,
        sub: fmtMoney(Math.max(50, Math.round(dist(Game.player.x, Game.player.y, d.x, d.y) / 10 / 10) * 10)),
        action: () => {
          const price = Math.max(50, Math.round(dist(Game.player.x, Game.player.y, d.x, d.y) / 10 / 10) * 10);
          if (Game.player.money < price) { UI.toast('Il tassista ti guarda e riparte.', 'bad'); return; }
          Game.player.money -= price;
          UI.fadeFlash();
          setTimeout(() => {
            Game.player.x = d.x + rand(-40, 40); Game.player.y = d.y + rand(40, 80);
            Game.player.collide();
            UI.toast('Corso concluso: -' + fmtMoney(price), 'money');
            UI.updateHUD();
          }, 500);
          UI.closeDialog();
        },
      })),
      { label: 'Annulla', action: () => UI.closeDialog() },
    ]);
  },

  // ---------- SMS ----------
  renderSmsList(screen) {
    const threads = ['antonio', 'gino', 'boss', 'spam'].filter((id) => (this.smsThreads[id] || []).length);
    const names = { antonio: '🕴️ Antonio', gino: '🍕 Gino', boss: '🕶️ Boss', spam: '📢 TEMU PROMO' };
    screen.innerHTML = this.bar('Messaggi', true) + '<div class="ph-list">' +
      (threads.length ? threads.map((id) =>
        '<button class="ph-row" data-action="thread" data-id="' + id + '"><span class="ph-name">' + names[id] + '</span><span class="ph-sub">' + (this.smsThreads[id].length) + '</span></button>'
      ).join('') : '<div class="ph-empty">Nessuna conversazione.<br>Scrivi a qualcuno!</div>') +
      '<div class="ph-newrow">' + ['antonio', 'gino', 'boss'].map((id) =>
        '<button class="ph-mini" data-action="thread" data-id="' + id + '">Nuovo: ' + names[id].split(' ')[1] + '</button>').join('') + '</div></div>';
  },

  renderThread(screen) {
    const c = this.contacts.find((x) => x.id === this.thread);
    const msgs = this.smsThreads[this.thread] || [];
    const bubbles = msgs.map((m) =>
      '<div class="ph-msg ' + (m.from === 'me' ? 'me' : '') + '">' + escHtml(m.text) + '</div>'
    ).join('');
    screen.innerHTML = this.bar(c ? c.name : 'Chat', true) +
      '<div class="ph-chat" id="ph-chat">' + bubbles + '</div>' +
      '<div class="ph-sendrow"><input id="ph-sms-input" type="text" maxlength="140" placeholder="Scrivi un messaggio..."><button class="ph-send" data-action="sendsms">➤</button></div>';
    const box = document.getElementById('ph-chat');
    if (box) box.scrollTop = box.scrollHeight;
    const input = document.getElementById('ph-sms-input');
    if (input) input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); this.sendSMS(this.thread, input.value); }
    });
  },

  openThread(id) {
    this.thread = id;
    if (!this.smsThreads[id]) this.smsThreads[id] = [];
    this.render();
  },

  sendSMS(id, text) {
    text = String(text || '').trim();
    if (!text) return;
    const input = document.getElementById('ph-sms-input');
    if (input) input.value = '';
    if (!this.smsThreads[id]) this.smsThreads[id] = [];
    this.smsThreads[id].push({ from: 'me', text });
    this.saveSms();
    this.render();
    sfx('click');

    const self = this;
    if (id === 'spam') {
      setTimeout(() => self.receiveSMS(id, choice(this.spamPool)), 900);
      return;
    }
    const c = this.contacts.find((x) => x.id === id);
    const npcLike = {
      name: c.name.split(' ')[0],
      mood: id === 'boss' ? 'gangster' : 'friendly',
      isAntonio: id === 'antonio',
      persona: c.persona,
      state: 'walk',
    };
    const history = (this.smsThreads[id] || []).slice(-8).map((m) => ({ who: m.from === 'me' ? 'Tu' : npcLike.name, text: m.text }));

    const respond = (replyText) => {
      self.smsThreads[id].push({ from: 'them', text: replyText });
      self.saveSms();
      if (self.open && self.thread === id) self.render();
      UI.toast('📱 ' + npcLike.name + ': ' + replyText.slice(0, 40) + (replyText.length > 40 ? '...' : ''), '');
    };

    if (AIChat.configured()) {
      AIChat.reply(npcLike, text, history).then(respond).catch(() => respond(Dialogue.reply(npcLike, text).text));
    } else {
      setTimeout(() => respond(Dialogue.reply(npcLike, text).text), randInt(800, 1800));
    }
  },

  receiveSMS(id, text) {
    if (!this.smsThreads[id]) this.smsThreads[id] = [];
    this.smsThreads[id].push({ from: 'them', text });
    this.saveSms();
    if (this.open && this.thread === id) this.render();
    const names = { antonio: 'Antonio', spam: 'TEMU PROMO' };
    UI.toast('📱 Nuovo messaggio da ' + (names[id] || id), '');
  },

  // ---------- fotocamera ----------
  renderCamera(screen) {
    screen.innerHTML = this.bar('Fotocamera', true) +
      '<div class="ph-cam"><div class="ph-cam-view">📸 Il mirino è tutta la città dietro il telefono</div>' +
      '<button class="btn btn-big" data-action="snap">SCATTA</button>' +
      '<p class="ph-tip">Consiglio: le foto con poliziotti, esplosioni o inseguimenti fanno più like.</p></div>';
  },

  snap() {
    const src = Game.canvas;
    const w = 480, h = Math.round(480 * src.height / src.width);
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const g = off.getContext('2d');
    g.drawImage(src, 0, 0, w, h);
    const pl = Game.player;
    let quality = randInt(5, 25);
    if (pl.wanted > 0) quality += pl.wanted * 15;
    quality += Entities.cops.length * 10;
    quality += Math.min(20, Entities.bullets.length * 4);
    if (pl.inCar) quality += 8;
    if (nightAmount() > 0.3) quality += 10;
    this.photo = { img: off.toDataURL('image/jpeg', 0.55), quality: Math.min(100, quality) };
    this.app = 'insta';
    sfx('shot');
    this.render();
  },

  renderComposer(screen) {
    screen.innerHTML = this.bar('Nuovo post', false) +
      '<div class="ph-composer"><img class="ph-photo" src="' + this.photo.img + '" alt="foto">' +
      '<input id="ph-caption" type="text" maxlength="100" placeholder="Scrivi una didascalia..." style="width:100%;padding:8px;background:#101018;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:6px;">' +
      '<div class="ph-btnrow"><button class="btn" data-action="publish">Pubblica</button>' +
      '<button class="btn" data-action="discard">Butta la foto</button></div></div>';
    const cap = document.getElementById('ph-caption');
    cap.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') this.publishPost(cap.value); });
  },

  publishPost(caption) {
    caption = String(caption || '').trim() || 'Un giorno qualsiasi a Città Temu';
    const likes = Math.max(3, Math.round(this.photo.quality * rand(0.5, 1.5)));
    this.posts.unshift({ img: this.photo.img, caption, likes, liked: false, ts: Date.now(), quality: this.photo.quality });
    if (this.posts.length > 6) this.posts.length = 6;
    this.followers += Math.max(0, Math.round(this.photo.quality / 10));
    this.photo = null;
    this.saveInsta();
    UI.toast('📸 Post pubblicato! +' + likes + ' like', 'good');
    sfx('cash');
    this.render();
  },

  renderInsta(screen) {
    const posts = this.posts.map((p, i) =>
      '<div class="ph-post"><img src="' + p.img + '" alt=""><div class="ph-post-cap">' + escHtml(p.caption) + '</div>' +
      '<div class="ph-post-foot"><button class="ph-like' + (p.liked ? ' on' : '') + '" data-action="like" data-i="' + i + '">' + (p.liked ? '❤️' : '🤍') + ' ' + p.likes + '</button></div></div>'
    ).join('');
    screen.innerHTML = this.bar('Instagrim', true) +
      '<div class="ph-insta"><div class="ph-istats">' + escHtml(Game.player.custom.name) + ' · ' + this.followers + ' follower · ' + this.posts.length + ' post</div>' +
      (posts || '<div class="ph-empty">Nessun post.<br>Scatta la prima foto!</div>') + '</div>';
  },

  likePost(i) {
    const p = this.posts[i];
    if (!p || p.liked) return;
    p.liked = true; p.likes++;
    this.followers += 1;
    this.saveInsta();
    this.render();
  },

  // ---------- browser ----------
  sites: {
    temu: {
      title: 'temucitta.it — OFFERTE',
      render() {
        return '<h2>🔥 TEMU CITTÀ 🔥</h2><p>Spedizione in 3-6 settimane garantita*</p>' +
          [['Pacco misterioso', 50, 'mystery'], ['Coperta con maniche', 15, 'gag'], ['Calzini fantasma (1 pezzo)', 5, 'gag'], ['Figurine GTA 6 ( bustina vuota)', 20, 'gag']]
            .map((it) => '<div class="ph-item"><span>' + it[0] + ' — ' + fmtMoney(it[1]) + '</span><button class="ph-mini" data-action="buy" data-item="' + it[2] + '" data-price="' + it[1] + '">Compra</button></div>').join('') +
          '<p class="ph-tip">*o mai, dipende dal vento.</p>';
      },
    },
    gta6: {
      title: 'gta6-countdown.com',
      render() {
        return '<h2>GTA 6 USCIRÀ TRA:</h2><div class="ph-big">DOMANI™</div><p>(domani™ è un marchio registrato dal 2013)</p>' +
          '<p class="ph-tip">Nel frattempo c\'è GTA 6 da Temu. Costa 4 euro. Hai già il controller in mano, in un certo senso.</p>';
      },
    },
    cronache: {
      title: 'cronache-temu.local',
      render() {
        const pl = Game.player;
        const items = [];
        if (pl.wanted > 0) items.push(['🚨 RICERCATO', '"' + escHtml(pl.custom.name) + '" visto con ' + pl.wanted + ' stelle. La polizia "ci sta lavorando" (sta pranzando).']);
        else items.push(['✅ Città tranquilla', 'Nessun ricercato al momento. I cronisti si annoiano e parlano di meteo.']);
        if (pl.gangRep >= 3) items.push(['🕶️ Los Pepes in ascesa', 'Il boss annuisce: "Il nostro ' + escHtml(pl.custom.name) + ' è legenda". Il pizzo, dice, è un abbonamento.']);
        if (pl.money > 8000) items.push(['💰 Record di liquidità', 'Un cittadino è stato visto con ' + fmtMoney(pl.money) + '. Le banche negano tutto, il portafoglio non commenta.']);
        if (pl.money < 100) items.push(['📉 Crisi personale', 'Un residente ha meno di ' + fmtMoney(100) + ': "Ho comprato troppa pizza", dichiara in lacrime.']);
        items.push(['🍕 Da Gino file record', '"La margherita è un diritto umano", dice un cliente in coda da tre ore. Gino: "Il forno non negozia."']);
        items.push(['🚗 Concessionaria Temu', 'Nuovo modello "Ferrari ma no" in arrivo: 0–100 in un tempo non specificato.']);
        return '<h2>📰 Cronache di Temu</h2>' + items.map((it) => '<div class="ph-article"><h3>' + it[0] + '</h3><p>' + it[1] + '</p></div>').join('');
      },
    },
    gino: {
      title: 'pizzeriadagino.it',
      render() {
        return '<h2>🍕 Da Gino</h2>' +
          '<div class="ph-item">Margherita — $8</div><div class="ph-item">Diavola — $10</div>' +
          '<div class="ph-item">Gino Speciale (sorpresa, con sorpresa) — $12</div>' +
          '<button class="ph-mini" data-action="order">🍕 Ordina a domicilio ($40, cura 30)</button>' +
          '<p class="ph-tip">"L\'ananas è un crimine. Firmo io la denuncia." — Gino</p>';
      },
    },
    pepes: {
      title: 'lospepes.blog',
      render() {
        return '<h2>🕶️ Il Blog dei Los Pepes</h2>' +
          '<div class="ph-item">Come entrare nella gang: passo 1, vai alla base. Passo 2: non fare domande. Passo 3: rispetto.</div>' +
          '<div class="ph-item">Il pizzo è un abbonamento: include protezione e sorrisi.</div>' +
          '<button class="ph-mini" data-action="goto-base">📍 Segna la base sulla mappa</button>';
      },
    },
    temupedia: {
      title: 'temupedia.org — enciclopedia libera (dubbia)',
      render() {
        return '<h2>🗜️ Temupedia</h2>' +
          '<div class="ph-article"><h3>Città Temu</h3><p>Metropoli dal budget discutibile: strade ogni 14 isolati, edifici tutti uguali e un profumo di sconto che si sente da satellite. Popolazione: tanti, più o meno gli stessi che girano in tondo.</p></div>' +
          '<div class="ph-article"><h3>Antonio (personaggio)</h3><p>Informatore, filosofo urbano e probabilmente il NPC più amato della storia dei videogiochi. Non despawna mai: la leggenda dice che il motore di gioco abbia paura di lui. Ama la pizza di Gino e odia il silenzio.</p></div>' +
          '<div class="ph-article"><h3>Los Pepes (organizzazione)</h3><p>Gang locale attiva nel settore immobiliare, nel pizzo e nei sorrisi. Il loro blog è sorprendentemente ben scritto. Requisiti d\'ingresso: rispetto. E basta.</p></div>' +
          '<div class="ph-article"><h3>Pizza di Gino</h3><p>Bene di consumo e culturalmente protetto. L\'ananas è classificato come reato dalla locale cronaca. La margherita cura il cuore: metaforicamente. Quasi.</p></div>' +
          '<div class="ph-article"><h3>GTA 6 (attesa)</h3><p>Fenomeno per il quale la popolazione attende dal 2013 un videogioco che, secondo fonti concorrenti, uscirà "domani™". Vedi anche: speranza, marketing.</p></div>';
      },
    },
    forum: {
      title: 'temu-forum.net — il buco nero dei dubbi',
      render() {
        const pl = Game.player;
        const threads = [
          ['😵 Come si ferma la polizia in questa città?', pl.wanted > 0 ? 'OP: chiedo per un amico. L\'amico ha ' + pl.wanted + ' stelle e sta correndo mentre scrivo.' : 'OP: chiedo per un amico. L\'amico ora è pulito, dicono.', '1,2k risposte'],
          ['🍕 Meglio la margherita o la diavola? [THREAD SERIO]', 'Gino ha bannato chi vota ananas. Il mod dice: "È una questione di legge".', '890 risposte'],
          ['💰 Si vive con ' + fmtMoney(pl.money) + ' a Città Temu?', '"Con meno di 100 euro si mangia solo sorpresa", risponde un utente bannato subito dopo.', '412 risposte'],
          ['🕶️ Antonio esiste davvero o è un algoritmo?', '"Gli ho chiesto il senso della vita e mi ha segnato la pizzeria sulla mappa. 10/10".', '7,3k risposte'],
          ['🚗 La mia auto è esplosa per la terza volta oggi', '"Normale. Qui le garanzie durano finché lo sguardo del venditore."', '256 risposte'],
        ];
        return '<h2>💬 temu-forum.net</h2>' + threads.map((t) =>
          '<div class="ph-article"><h3>' + t[0] + '</h3><p>' + t[1] + '</p><p class="ph-tip">' + t[2] + '</p></div>'
        ).join('');
      },
    },
    sport: {
      title: 'temusport.it',
      render() {
        const pl = Game.player;
        const goals = randInt(0, 4);
        return '<h2>⚽ Temu Sport</h2>' +
          '<div class="ph-article"><h3>Real Temu ' + goals + ' — ' + randInt(0, 4) + ' Atletico Sconto</h3><p>Il rigore decisivo è stato assegnato "per errore del VAR, che è un ferro da stiro".</p></div>' +
          '<div class="ph-article"><h3>Mercato: colpo da Temu</h3><p>Il Real Temu ingaggia un attaccante a ' + fmtMoney(4) + '. Spedizione in 6 settimane, debutto previsto tra due stagioni.</p></div>' +
          (pl.ownedCars.length ? '<div class="ph-article"><h3>Motori</h3><p>' + escHtml(pl.custom.name) + ' possiede ' + pl.ownedCars.length + ' auto. Il meccanico locale ha chiesto il trasferimento.</p></div>' : '') +
          '<div class="ph-article"><h3>Tennis</h3><p>Nessuno gioca a tennis a Città Temu, ma il sito ha una sezione e la sezione deve esistere.</p></div>';
      },
    },
    astro: {
      title: 'orroscopo-temu mystic',
      render() {
        const pl = Game.player;
        const seed = pl.custom.name.length + new Date().getDate();
        const segni = ['Ariete', 'Toro', 'Gemelli', 'Cancro', 'Leone', 'Vergine'];
        const frasi = [
          'Oggi evita l\'ananas: ti conviene, e Gino ti ringrazia.',
          'Le stelle dicono: controlla i retrovisori. E il parcheggio. E tutto.',
          'Fortuna in arrivo da un pacco consegnato in orario (evento rarissimo).',
          'Amicizia in crescita: qualcuno ti deve un favore. Antonio, probabilmente.',
          'Giornata perfetta per una pizza. Le stelle sono chiare, non fare la vittima.',
          'Attenzione alle stelle di polizia: anche l\'astrologia le vede.',
        ];
        return '<h2>🔮 Orroscopo di Temu</h2><p class="ph-tip">Orologio astrale di ' + escHtml(pl.custom.name) + ' — affidabilità garantita al ' + (40 + (seed % 55)) + '%</p>' +
          segni.map((s, i) => '<div class="ph-article"><h3>' + s + '</h3><p>' + frasi[(seed + i) % frasi.length] + '</p></div>').join('');
      },
    },
    musica: {
      title: 'Temu Music — Top 5',
      render() {
        return '<h2>🎵 Temu Music — Top 5</h2>' +
          [
            ['1', '"Margherita (feat. Gino)" — DJ Forno', '▲ 3 posizioni'],
            ['2', '"Stelle (Wanted Mix)" — MC Sirena', '– invariato'],
            ['3', '"Spedizione in 6 settimane" — temU Boys', '▲ 7 posizioni'],
            ['4', '"Base dei Pepes (Slowed + Rispettato)" — Boss L.', '▼ 1 posizione'],
            ['5', '"Domani™" — GTA6 & The Delays', '▲ 99 posizioni'],
          ].map((r) => '<div class="ph-item"><span>' + r[0] + '. ' + r[1] + '</span><span class="ph-sub">' + r[2] + '</span></div>').join('') +
          '<p class="ph-tip">Classifica basata su streaming, fischi e ordini di pizza.</p>';
      },
    },
    ainews: {
      title: 'cronache-ai.live — edizione generata in tempo reale',
      render() { return ''; },
    },
  },

  renderBrowserHome(screen) {
    const groups = [
      ['📰 Notizie', ['cronache', 'ainews', 'sport']],
      ['📚 Cultura e community', ['temupedia', 'forum', 'astro', 'musica']],
      ['🛍️ Affari', ['temu', 'gino', 'pepes']],
      ['🎮 Intrattenimento', ['gta6']],
    ];
    const rows = groups.map((g) => '<div class="ph-group">' + g[0] + '</div>' + g[1].map((id) => {
      const s = this.sites[id];
      if (!s) return '';
      const badge = id === 'ainews' && AIChat.configured() ? '<span class="ph-badge-ai">LIVE AI</span>' : '';
      return '<button class="ph-row" data-action="visit" data-id="' + id + '"><span class="ph-name">🌐 ' + s.title + ' ' + badge + '</span></button>';
    }).join('')).join('');
    screen.innerHTML = this.bar('Temu Explorer', true) + '<div class="ph-list">' + rows + '</div>';
  },

  renderSite(screen) {
    if (this.site === 'ainews') { this.renderAiNews(screen); return; }
    const s = this.sites[this.site];
    screen.innerHTML = this.bar(s.title, true) + '<div class="ph-page">' + s.render() + '</div>';
  },

  renderAiNews(screen) {
    const st = this.aiNews;
    let body;
    if (st.loading) body = '<div class="ph-empty">🖊️ I giornalisti AI stanno scrivendo la edizione di oggi...</div>';
    else if (!st.items.length) body = '<div class="ph-empty">Nessun articolo in edicola.<br>Premi il bottone qui sotto!</div>';
    else body = st.items.map((a) => '<div class="ph-article"><h3>' + escHtml(a.title) + '</h3><p>' + escHtml(a.body) + '</p></div>').join('');
    screen.innerHTML = this.bar('Cronache AI — live', true) + '<div class="ph-page">' +
      (st.error ? '<p class="ph-tip">' + escHtml(st.error) + '</p>' : '') + body +
      '<button class="ph-mini ph-gen" data-action="gennews">🔄 Genera articoli freschi</button>' +
      (AIChat.configured() ? '' : '<p class="ph-tip">Collega una AI dal menu Impostazioni AI per articoli scritti in tempo reale. Senza AI esce l\'edizione locale.</p>') +
      '</div>';
  },

  localNews() {
    const pl = Game.player;
    const pool = [
      ['Esclusiva: ' + escHtml(pl.custom.name) + ' avvistato/a in centro', 'I testimoni parlano di una "presenza decisa". Le autorità consigliano di non farsi domande.'],
      ['Meteo: cielo a pezzi di pizza', 'Le previsioni annunciano parmigiano sparso e vento di forno. Affidabilità: totale.'],
      ['La polizia sperimenta il "correre più veloce"', 'Il nuovo piano anti-inseguimento consiste nel correre più veloce. I risultati sono in attesa da 5 anni.'],
      ['temU lancia il pacco che si consegna da solo', 'Purtroppo si consegna solo a se stesso, in un altro continente.'],
      ['Antonio vince il premio "cittadino dell\'anno"', 'Per il dodicesimo anno consecutivo. Il discorso di ringraziamento è durato 4 ore ed era una sola battuta.'],
      ['Gino apre la seconda pizzeria', 'Si chiama "Da Gino 2" ed è identica. "Se funziona, non si tocca", dichiara.'],
      ['Borsa di Temu: il pacco vale più dell\'oro', 'Gli analisti consigliano di investire in calzini fantasma, in forte crescita.'],
      ['Il boss dei Pepes lancia il podcast', 'Puntata 1: "Silenzio" (42 minuti di silenzio). Recensioni: 5 stelle.'],
    ];
    const used = new Set(this.aiNews.items.map((a) => a.title));
    const fresh = pool.filter((a) => !used.has(a[0]));
    const pick = (fresh.length >= 3 ? fresh : pool).slice();
    const out = [];
    while (out.length < 3 && pick.length) out.push(pick.splice(randInt(0, pick.length - 1), 1)[0]);
    return out.map((a) => ({ title: a[0], body: a[1] }));
  },

  async genNews(force) {
    const st = this.aiNews;
    if (st.loading) return;
    if (!force && st.items.length && Game.elapsed - st.stamp < 90) { this.render(); return; }
    st.loading = true;
    st.error = null;
    if (this.open && this.app === 'browser' && this.site === 'ainews') this.render();
    const pl = Game.player;
    const prev = st.items.map((a) => '- ' + a.title).join('\n');
    const sys = 'Sei la redazione di "Cronache AI", giornale satirico della città di "GTA VI: Temu Edition", videogioco open world comico. Scrivi articoli brevi, assurdi ma plausibili dentro il mondo di gioco, in italiano. Rispondi SOLO con JSON valido: [{"title": "...", "body": "..."}] con 3 articoli, titolo massimo 60 caratteri, corpo massimo 45 parole. Niente markdown, niente testo fuori dal JSON.';
    const user = 'Ora in gioco: ' + fmtTime(Game.timeMin) + '. Giocatore: ' + pl.custom.name + ', ' + fmtMoney(pl.money) +
      ', ricercato: ' + (pl.wanted > 0 ? pl.wanted + ' stelle' : 'no') + ', reputazione Los Pepes: ' + pl.gangRep +
      ', follower Instagrim: ' + this.followers + '.\n' +
      (prev ? 'Titoli GIÀ pubblicati, generarne di DIVERSI:\n' + prev : 'Nessun titolo precedente.');
    try {
      if (!AIChat.configured()) throw new Error('AI non configurata');
      const raw = await AIChat.complete(sys, user, 600);
      const m = raw.match(/\[[\s\S]*\]/);
      if (!m) throw new Error('nessun JSON');
      const arr = JSON.parse(m[0]);
      const items = (Array.isArray(arr) ? arr : []).filter((a) => a && typeof a.title === 'string' && typeof a.body === 'string').slice(0, 4);
      if (!items.length) throw new Error('JSON senza articoli');
      st.items = items;
      st.stamp = Game.elapsed;
    } catch (e) {
      st.items = this.localNews();
      st.stamp = Game.elapsed;
      st.error = AIChat.configured() ? 'AI non riuscita (' + (e && e.message ? e.message : 'errore') + '): edizione locale.' : null;
    }
    st.loading = false;
    if (this.open && this.app === 'browser' && this.site === 'ainews') this.render();
  },

  visit(id) {
    this.site = id;
    this.render();
    if (id === 'ainews') this.genNews(false);
  },

  buyItem(item, price) {
    const pl = Game.player;
    if (pl.money < price) { UI.toast('Soldi insufficienti.', 'bad'); return; }
    pl.money -= price;
    UI.updateHUD();
    this.pendingDelivery = { item, arriveAt: Game.elapsed + 120 };
    UI.toast('Ordinato! Consegna stimata: 2 minuti (record Temu).', 'good');
    sfx('cash');
  },

  orderPizza() {
    const pl = Game.player;
    if (pl.money < 40) { UI.toast('Gino non fa credito. Nemmeno ai clienti storici.', 'bad'); return; }
    pl.money -= 40;
    pl.health = Math.min(pl.maxHealth, pl.health + 30);
    UI.toast('🍕 Pizza a domicilio! +30 salute, -' + fmtMoney(40), 'good');
    sfx('cash');
    UI.updateHUD();
  },

  handleAction(action, el) {
    switch (action) {
      case 'app': this.app = el.dataset.app; this.thread = null; this.site = null; this.photo = null; this.render(); break;
      case 'back':
        if (this.app === 'sms' && this.thread) { this.thread = null; }
        else if (this.app === 'browser' && this.site) { this.site = null; }
        else if (this.app === 'insta' && this.photo) { this.photo = null; }
        else { this.app = 'home'; this.calling = null; }
        this.render(); break;
      case 'call': this.call(el.dataset.id); break;
      case 'hangup': this.calling = null; this.render(); break;
      case 'thread': this.openThread(el.dataset.id); break;
      case 'sendsms': {
        const input = document.getElementById('ph-sms-input');
        if (input) this.sendSMS(this.thread, input.value);
        break;
      }
      case 'snap': this.snap(); break;
      case 'publish': {
        const cap = document.getElementById('ph-caption');
        this.publishPost(cap ? cap.value : '');
        break;
      }
      case 'discard': this.photo = null; this.render(); break;
      case 'like': this.likePost(parseInt(el.dataset.i, 10)); break;
      case 'visit': this.visit(el.dataset.id); break;
      case 'appsite': this.app = 'browser'; this.thread = null; this.photo = null; this.visit(el.dataset.site); break;
      case 'gennews': this.genNews(true); break;
      case 'buy': this.buyItem(el.dataset.item, parseInt(el.dataset.price, 10)); break;
      case 'order': this.orderPizza(); break;
      case 'goto-base': {
        const d = World.doors.find((x) => x.type === 'gang');
        if (d) { Systems.tempObjective = { x: d.x, y: d.y, label: d.label, t: 20 }; UI.toast('Base segnata sulla mappa.', 'good'); }
        break;
      }
      case 'save': Systems.save(); break;
      case 'ai-settings': this.close(); UI.openAISettings(); break;
      case 'extra-save': Systems.save(); this.render(); break;
    }
  },

  updateDelivery() {
    if (!this.pendingDelivery) return;
    if (Game.elapsed >= this.pendingDelivery.arriveAt) {
      const pl = Game.player;
      const item = this.pendingDelivery.item;
      this.pendingDelivery = null;
      if (item === 'mystery') {
        const roll = Math.random();
        if (roll < 0.4) { const m = randInt(30, 120); pl.money += m; UI.toast('📦 Il pacco Temu è arrivato! Dentro: ' + fmtMoney(m) + '!', 'money'); }
        else if (roll < 0.7 && Object.keys(pl.weapons).some((w) => WEAPONS[w].bullet)) {
          const gun = Object.keys(pl.weapons).find((w) => WEAPONS[w].bullet);
          pl.ammo[gun] += 10;
          UI.toast('📦 Pacco Temu! +10 munizioni per ' + WEAPONS[gun].name, 'good');
        } else { pl.armor = Math.min(100, pl.armor + 25); UI.toast('📦 Pacco Temu! Giubbotto flessibile (+25 armatura)', 'good'); }
      } else {
        UI.toast('📦 Consegna Temu: dentro c\'era... non è chiaro cosa. Bello comunque.', '');
      }
      UI.updateHUD();
    }
  },
};

Phone.load();
