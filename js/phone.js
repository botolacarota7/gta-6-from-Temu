// ===== Smartphone: chiamate, SMS, fotocamera, Instagrim, browser =====
const Phone = {
  open: false,
  app: 'home',
  thread: null,
  site: null,
  photo: null,
  calling: null,

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
    sfx('click');
    if (this.open) { this.app = 'home'; this.render(); }
  },

  close() {
    this.open = false;
    document.getElementById('phone').classList.add('hidden');
    this.calling = null;
  },

  render() {
    const screen = document.getElementById('phone-screen');
    if (!screen) return;
    const clock = fmtTime(Game.timeMin);
    document.getElementById('phone-clock').textContent = clock;
    document.getElementById('phone-money').textContent = fmtMoney(Game.player ? Game.player.money : 0);

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
    const apps = [
      ['calls', '📞', 'Chiamate'], ['sms', '💬', 'Messaggi'],
      ['camera', '📷', 'Fotocamera'], ['insta', '🖼️', 'Instagrim'],
      ['browser', '🌐', 'Browser'], ['more', '⚙️', 'Extra'],
    ];
    screen.innerHTML = '<div class="ph-home">' +
      '<div class="ph-profile">' + escHtml(Game.player.custom.name) + '<br><small>' + this.followers + ' follower · ' + this.posts.length + ' post</small></div>' +
      '<div class="ph-grid">' + apps.map((a) =>
        '<button class="ph-app" data-action="app" data-app="' + a[0] + '"><span>' + a[1] + '</span>' + a[2] + '</button>'
      ).join('') + '</div></div>';
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
    news: {
      title: 'cronache-temu.local',
      render() {
        const pl = Game.player;
        const items = [];
        if (pl.wanted > 0) items.push('🚨 RICERCATO: "' + pl.custom.name + '" con ' + pl.wanted + ' stelle. La polizia "ci sta lavorando" (sta pranzando).');
        else items.push('✅ Città tranquilla. Nessun ricercato. Per ora.');
        if (pl.gangRep >= 3) items.push('🕶️ Los Pepes: "Il nostro ' + escHtml(pl.custom.name) + ' è leggenda". Il boss annuisce.');
        if (pl.money > 8000) items.push('💰 Un cittadino è stato visto con ' + fmtMoney(pl.money) + '. Le banche negano tutto.');
        if (pl.money < 100) items.push('📉 Economia in crisi: un residente ha meno di 100 euro. "Ho comprato troppa pizza", dichiara.');
        items.push('🍕 Da Gino file d\'attesa record: "La margherita è un diritto umano", dice un cliente in lacrime.');
        return '<h2>📰 Cronache di Temu</h2>' + items.map((i) => '<div class="ph-item">' + i + '</div>').join('');
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
  },

  renderBrowserHome(screen) {
    const sites = Object.entries(this.sites).map(([id, s]) =>
      '<button class="ph-row" data-action="visit" data-id="' + id + '"><span class="ph-name">🌐 ' + s.title + '</span></button>'
    ).join('');
    screen.innerHTML = this.bar('Temu Explorer', true) + '<div class="ph-list">' + sites + '</div>';
  },

  renderSite(screen) {
    const s = this.sites[this.site];
    screen.innerHTML = this.bar(s.title, true) + '<div class="ph-page">' + s.render() + '</div>';
  },

  visit(id) { this.site = id; this.render(); },

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
