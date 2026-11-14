// ===== Interni: stanza dedicata quando entri in un edificio =====
const Interiors = {
  active: null,

  LAYOUTS: {
    pizzeria: { floor: '#a9784a', alt: '#97683f', wall: '#2c1e14', neon: 'DA GINO', neonColor: '#ff6b35', counter: '#7c2f1f', top: '#e8d9c0', tables: true, shelves: ['\ud83c\udf55', '\ud83e\udd6a', '\ud83c\udf2b'] },
    restaurant: { floor: '#3d2c1e', alt: '#332417', wall: '#1d130c', neon: 'BELLA NAPOLI', neonColor: '#ffd23f', counter: '#5a3a22', top: '#d9c4a3', tables: true, shelves: ['\ud83c\udf7d', '\ud83c\udf74', '\ud83c\udf79'] },
    gunshop: { floor: '#2c2f36', alt: '#252830', wall: '#14161b', neon: 'AMMU-NAZIONE', neonColor: '#ff4757', counter: '#1c1e24', top: '#3a3e48', cases: true, shelves: ['\ud83d\udd2b', '\ud83c\udff9', '\ud83e\ude83'] },
    dealer: { floor: '#3a4152', alt: '#333a4a', wall: '#181c26', neon: 'TEMU MOTORS', neonColor: '#22d3ee', counter: '#232a38', top: '#8fa3c8', glossy: true, shelves: ['\ud83d\udd27', '\ud83d\ude97', '\u26fd'] },
    gang: { floor: '#2a2a31', alt: '#232329', wall: '#131318', neon: 'LOS PEPES', neonColor: '#a855f7', counter: '#1c1c22', top: '#4a3f5a', crates: true, shelves: ['\ud83d\udcb0', '\ud83d\udd76\ufe0f', '\ud83c\udf2c\ufe0f'] },
    police: { floor: '#3c4450', alt: '#343c47', wall: '#1a2029', neon: 'POLIZIA', neonColor: '#3b82f6', counter: '#252c38', top: '#7d93b5', desks: true, shelves: ['\ud83d\udcdc', '\u2696\ufe0f', '\ud83d\udcf8'] },
    hospital: { floor: '#d7e2e4', alt: '#c9d6d8', wall: '#33454a', neon: 'OSPEDALE', neonColor: '#34d399', counter: '#eef4f5', top: '#7fc4b8', crosses: true, light: true, shelves: ['\ud83d\udc89', '\ud83e\ude79', '\ud83d\udc8a'] },
  },

  STAFF: {
    pizzeria: [
      { role: 'cashier', name: 'Gino', skin: '#e0ac69', shirt: '#f5f0e6', pants: '#7c2f1f', hair: '#3a2a1a', mood: 'friendly', persona: 'Sei GINO, pizzaiolo napoletano di Da Gino: caldo, generoso, scandalizzato dall\u2019ananas.' },
      { role: 'security', name: 'Bruno', skin: '#c68642', shirt: '#17171c', pants: '#0e0e12', hair: '#0d0d0d', mood: 'grumpy', persona: 'Sei BRUNO, security della pizzeria: silenzioso, enorme, professionale.' },
      { role: 'customer', name: 'Cliente Affamato', skin: '#e0ac69', shirt: '#4a90d9', pants: '#2c3e50', hair: '#2b2b2b', mood: 'friendly' },
    ],
    restaurant: [
      { role: 'cashier', name: 'Maitre Carlo', skin: '#e0ac69', shirt: '#1c1c24', pants: '#101018', hair: '#3a3a3a', mood: 'neutral', persona: 'Sei CARLO, maitre del ristorante Bella Napoli: elegante, snob ma gentile.' },
      { role: 'security', name: 'Otto', skin: '#8d5524', shirt: '#17171c', pants: '#0e0e12', hair: '#0d0d0d', mood: 'grumpy', persona: 'Sei OTTO, security del ristorante: guardi avanti, parli poco.' },
      { role: 'customer', name: 'Signora Elegante', skin: '#f1c27d', shirt: '#b0487c', pants: '#3a2a3a', hair: '#7a4a2a', mood: 'friendly' },
    ],
    gunshop: [
      { role: 'cashier', name: 'Nino l\u2019Armaiolo', skin: '#e0ac69', shirt: '#3a3f4a', pants: '#22262e', hair: '#2b2b2b', mood: 'neutral', persona: 'Sei NINO, venditore dell\u2019Ammu-Nazione: professionale, cinico, ossessionato dalla sicurezza (altrui).' },
      { role: 'security', name: 'Franco', skin: '#e0ac69', shirt: '#17171c', pants: '#0e0e12', hair: '#0d0d0d', hat: 'cap', mood: 'grumpy', persona: 'Sei FRANCO, security dell\u2019armeria: ti piace il silenzio e le regole.' },
    ],
    dealer: [
      { role: 'cashier', name: 'Sara', skin: '#f1c27d', shirt: '#22d3ee', pants: '#1e293b', hair: '#5a3a1a', mood: 'friendly', persona: 'Sei SARA, venditrice della Concessionaria Temu: entusiasta, da pubblicit\u00e0, prometti miracoli.' },
      { role: 'security', name: 'Gigante', skin: '#c68642', shirt: '#17171c', pants: '#0e0e12', hair: '#0d0d0d', mood: 'neutral', persona: 'Sei IL GIGANTE, security della concessionaria: sei pagato a ore e ci tieni.' },
    ],
    gang: [
      { role: 'cashier', name: 'Il Boss', skin: '#e0ac69', shirt: '#1a1a22', pants: '#101016', hair: '#151515', hat: 'cap', mood: 'gangster', persona: 'Sei il BOSS dei Los Pepes: freddo, parli poco ma pesante, solo rispetto e affari.' },
      { role: 'security', name: 'Guardia del Corpo', skin: '#8d5524', shirt: '#17171c', pants: '#0e0e12', hair: '#0d0d0d', mood: 'gangster', persona: 'Sei la guardia del corpo del boss: occhi dappertutto, zero pazienza.' },
    ],
    police: [
      { role: 'cashier', name: 'Segretaria Anna', skin: '#f1c27d', shirt: '#3b82f6', pants: '#1e293b', hair: '#3a2a1a', mood: 'neutral', persona: 'Sei ANNA, segretaria del distretto: gentile ma stanchissima, montagne di moduli.' },
      { role: 'security', name: 'Agente Russo', skin: '#e0ac69', shirt: '#1f4e8c', pants: '#16283f', hair: '#2b2b2b', hat: 'cap', mood: 'grumpy', persona: 'Sei l\u2019AGENTE RUSSO: poliziotto anziano, hai visto tutto, poco ti impressiona.' },
    ],
    hospital: [
      { role: 'cashier', name: 'Infermiera Pia', skin: '#e0ac69', shirt: '#eef4f5', pants: '#7fc4b8', hair: '#5a3a1a', mood: 'friendly', persona: 'Sei PIA, infermiera alla reception: angelica ma ricordi sempre che le cure costano.' },
      { role: 'security', name: 'Inserviente Leo', skin: '#c68642', shirt: '#4a6a5a', pants: '#2c3e3a', hair: '#2b2b2b', mood: 'neutral', persona: 'Sei LEO, inserviente dell\u2019ospedale: filosofico, vedi cose strane ogni giorno.' },
    ],
  },

  CASHIER_LINES: {
    pizzeria: ['Il forno non aspetta nessuno!', 'Oggi la margherita va forte.', 'L\u2019ananas qui non entra. \u00c8 legge.'],
    restaurant: ['Il coperto si paga, il sorriso \u00e8 gratis.', 'Stasera lo chef \u00e8 ispirato.', 'Tavolo per due? Servizio veloce.'],
    gunshop: ['Legge: niente sparatorie in negozio.', 'Le munizioni si pagano in anticipo.', 'Sicurezza prima di tutto. Anche la mia.'],
    dealer: ['Oggì le offerte sono mirabolanti!', 'Consegna in 6 settimane, come sempre.', 'Questa macchina ha "carattere".'],
    gang: ['Rispetto si porta, non si compra.', 'Gli affari vanno fatti in silenzio.', 'La famiglia prima di tutto.'],
    police: ['I moduli vanno compilati in triplice copia.', 'Se \u00e8 per le stelle, non qui.', 'Il distretto ringrazia per la pazienza.'],
    hospital: ['Le cure costano, la gentilezza \u00e8 inclusa.', 'Punto 4: niente corse nei corridoi.', 'La fila \u00e8 una forma di terapia.'],
  },

  SECURITY_LINES: [
    ' occhio dove metti i piedi.',
    ' qui niente scherzi.',
    ' La sicurezza \u00e8 il mio lavoro. Il tuo \u00e8 stare tranquillo.',
    ' Ho visto roba peggio di te oggi. Forse.',
  ],

  // ---------- entrata / uscita ----------
  enter(door) {
    const pl = Game.player;
    if (!pl || pl.inCar) { if (pl) UI.toast('Prima scendi dalla macchina.', 'bad'); return; }
    const b = door.building;
    const wall = 14;
    const room = { x: b.x + wall, y: b.y + wall, w: b.w - wall * 2, h: b.h - wall * 2 };
    const it = {
      type: door.type, name: door.label, building: b, door, room,
      cx: b.x + b.w / 2, cy: b.y + b.h / 2,
      exitX: b.door.x, exitW: 80,
      npcs: [], t: 0, chatT: rand(5, 9),
    };
    it.zoom = clamp(Math.min(Game.canvas.width / (b.w + 320), Game.canvas.height / (b.h + 300)), 1.4, 2.1);
    this.active = it;
    this.spawnStaff(it);
    pl.x = b.door.x;
    pl.y = room.y + room.h - 20;
    pl.angle = -Math.PI / 2;
    sfx('door');
    UI.fadeFlash();
    UI.toast(it.name, '');
    if (pl.wanted >= 2) it.kickT = 2.5;
    else if (pl.wanted > 0) UI.toast('La sicurezza ti fissa da dietro gli occhiali...', 'bad');
  },

  exit() {
    const it = this.active;
    if (!it) return;
    const pl = Game.player;
    this.active = null;
    pl.x = it.door.x;
    pl.y = it.door.y + 16;
    pl.collide();
    sfx('door');
    UI.fadeFlash();
  },

  spawnStaff(it) {
    const L = this.LAYOUTS[it.type];
    const staff = this.STAFF[it.type] || [];
    const r = it.room;
    it.npcs = staff.map((s, i) => {
      const n = Object.assign({ x: 0, y: 0, angle: Math.PI / 2, walkPhase: 0, bubble: null, bubbleT: 0, state: 'walk', isAntonio: false, gaveMoney: false }, s);
      if (s.role === 'cashier') { n.x = it.cx; n.y = r.y + 44; n.angle = Math.PI / 2; }
      else if (s.role === 'security') { n.x = r.x + 46; n.y = r.y + r.h - 56; n.dir = 1; n.minX = r.x + 40; n.maxX = r.x + r.w - 40; }
      else { n.x = r.x + 60 + ((i * 97) % Math.max(40, r.w - 120)); n.y = r.y + r.h * 0.55; n.dir = i % 2 ? 1 : -1; n.minX = r.x + 50; n.maxX = r.x + r.w - 50; }
      return n;
    });
  },

  // ---------- collisioni ----------
  clampPlayer(p) {
    const it = this.active;
    if (!it) return;
    const r = it.room;
    const m = 16;
    const gx1 = it.exitX - it.exitW / 2, gx2 = it.exitX + it.exitW / 2;
    if (p.x < r.x + m) p.x = r.x + m;
    if (p.x > r.x + r.w - m) p.x = r.x + r.w - m;
    if (p.y < r.y + m) p.y = r.y + m;
    const inGap = p.x > gx1 + 10 && p.x < gx2 - 10;
    if (p.y > r.y + r.h - m) {
      if (inGap) {
        if (p.y > r.y + r.h + 10) this.exit();
      } else {
        p.y = r.y + r.h - m;
      }
    }
  },

  // ---------- interazioni ----------
  nearestStaff(range) {
    const it = this.active;
    if (!it) return null;
    const pl = Game.player;
    let best = null, bd = range;
    for (const n of it.npcs) {
      const d = dist(pl.x, pl.y, n.x, n.y);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  },

  nearExit(range) {
    const it = this.active;
    if (!it) return false;
    const pl = Game.player;
    return Math.abs(pl.x - it.exitX) < it.exitW / 2 + range && pl.y > it.room.y + it.room.h - 60;
  },

  talkSecurity(n) {
    const pl = Game.player;
    if (pl.wanted > 0) {
      UI.toast(n.name + ': "Fuori. Subito."', 'bad');
      this.exit();
      return;
    }
    n.bubble = n.name + ':' + choice(this.SECURITY_LINES);
    n.bubbleT = 4;
    sfx('click');
  },

  // ---------- update ----------
  update(dt) {
    const it = this.active;
    if (!it) return;
    it.t += dt;
    for (const n of it.npcs) {
      if (n.bubbleT > 0) {
        n.bubbleT -= dt;
        if (n.bubbleT <= 0) n.bubble = null;
      }
      if (n.role === 'security') {
        n.x += (n.dir || 1) * 26 * dt;
        if (n.x > n.maxX) { n.x = n.maxX; n.dir = -1; }
        if (n.x < n.minX) { n.x = n.minX; n.dir = 1; }
        n.angle = n.dir > 0 ? 0 : Math.PI;
        n.walkPhase += dt * 6;
      } else if (n.role === 'customer') {
        n.x += (n.dir || 1) * 18 * dt;
        if (n.x > n.maxX || n.x < n.minX) n.dir = -(n.dir || 1);
        n.walkPhase += dt * 5;
      }
    }
    it.chatT -= dt;
    if (it.chatT <= 0) {
      it.chatT = rand(9, 16);
      const talkers = it.npcs.filter((n) => n.role === 'cashier' || n.role === 'customer');
      if (talkers.length) {
        const n = choice(talkers);
        const pool = this.CASHIER_LINES[it.type] || ['...'];
        n.bubble = choice(pool);
        n.bubbleT = 4;
      }
    }
    if (it.kickT !== undefined) {
      it.kickT -= dt;
      if (it.kickT <= 0) {
        delete it.kickT;
        UI.toast('La sicurezza ti scaraventa fuori!', 'bad');
        this.exit();
      }
    }
  },

  // ---------- disegno ----------
  draw(ctx, camX, camY) {
    const it = this.active;
    if (!it) return;
    const L = this.LAYOUTS[it.type];
    const r = it.room;
    ctx.save();
    ctx.translate(-camX, -camY);

    // pavimento
    ctx.fillStyle = L.floor;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = 'rgba(0,0,0,.14)';
    ctx.lineWidth = 1;
    const step = 44;
    for (let x = r.x; x < r.x + r.w; x += step) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); ctx.stroke(); }
    for (let y = r.y; y < r.y + r.h; y += step) { ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); }
    if (L.glossy) {
      const gr = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      gr.addColorStop(0, 'rgba(255,255,255,.10)');
      gr.addColorStop(.5, 'rgba(255,255,255,.02)');
      gr.addColorStop(1, 'rgba(255,255,255,.08)');
      ctx.fillStyle = gr;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }

    // luci soffitto
    ctx.fillStyle = 'rgba(255,255,240,.09)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(r.x + r.w * (0.2 + i * 0.3), r.y + r.h * 0.42, 70, 46, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // insegna neon
    ctx.font = '900 22px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = L.neonColor;
    ctx.shadowBlur = 18;
    ctx.fillStyle = L.neonColor;
    ctx.fillText(L.neon, it.cx, r.y + 26);
    ctx.shadowBlur = 0;

    // scaffali lungo la parete alta
    const sh = L.shelves || [];
    for (let i = 0; i < sh.length; i++) {
      const sx = r.x + 34 + i * ((r.w - 68) / Math.max(1, sh.length - 1)) - 18;
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      roundRect(ctx, sx, r.y + 36, 36, 26, 5);
      ctx.fill();
      ctx.font = '16px Arial';
      ctx.fillText(sh[i], sx + 18, r.y + 55);
    }

    // bancone della cassa
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    roundRect(ctx, it.cx - 96, r.y + 62, 192, 50, 10);
    ctx.fill();
    ctx.fillStyle = L.counter;
    roundRect(ctx, it.cx - 92, r.y + 58, 184, 50, 10);
    ctx.fill();
    ctx.fillStyle = L.top;
    roundRect(ctx, it.cx - 92, r.y + 58, 184, 10, 5);
    ctx.fill();
    ctx.font = '18px Arial';
    ctx.fillText('\ud83d\udcb3', it.cx - 60, r.y + 92);
    ctx.fillText('\ud83d\uded2', it.cx + 58, r.y + 92);

    // decorazioni specifiche
    this.drawExtras(ctx, it, L, r);

    // piante agli angoli
    for (const [px, py] of [[r.x + 22, r.y + r.h - 26], [r.x + r.w - 22, r.y + r.h - 26]]) {
      ctx.fillStyle = '#6b4a2f';
      roundRect(ctx, px - 10, py - 6, 20, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#3f7c3a';
      ctx.beginPath();
      ctx.arc(px, py - 14, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4f9c48';
      ctx.beginPath();
      ctx.arc(px - 5, py - 18, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // tappetino uscita
    ctx.fillStyle = 'rgba(255,210,63,.25)';
    roundRect(ctx, it.exitX - it.exitW / 2, r.y + r.h - 6, it.exitW, 20, 6);
    ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('USCITA', it.exitX, r.y + r.h + 8);

    // muri
    ctx.strokeStyle = L.wall;
    ctx.lineWidth = 10;
    ctx.strokeRect(r.x - 5, r.y - 5, r.w + 10, r.h + 10);
    ctx.fillStyle = L.wall;
    ctx.fillRect(r.x - 5, r.y + r.h, it.exitX - it.exitW / 2 - r.x + 5, 10);
    ctx.fillRect(it.exitX + it.exitW / 2, r.y + r.h, r.x + r.w + 5 - it.exitX - it.exitW / 2, 10);

    // personale
    for (const n of it.npcs) {
      drawPerson(ctx, n.x, n.y, n.angle, {
        skin: n.skin, shirt: n.shirt, pants: n.pants, hair: n.hair, hat: n.hat,
        walkPhase: n.role === 'cashier' ? null : n.walkPhase,
      });
      if (n.role === 'security') {
        ctx.fillStyle = '#101018';
        ctx.fillRect(n.x - 7, n.y - 6, 14, 3.5);
      }
      if (n.role === 'cashier') {
        ctx.fillStyle = '#ffd23f';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('\ud83d\udcb0 CASSA', n.x, n.y - 26);
      }
      if (n.bubble) drawBubble(ctx, n.x, n.y - 34, n.bubble);
    }

    ctx.restore();
  },

  drawExtras(ctx, it, L, r) {
    if (L.tables) {
      for (let i = 0; i < 2; i++) {
        const tx = r.x + r.w * (0.22 + i * 0.56), ty = r.y + r.h * 0.62;
        ctx.fillStyle = 'rgba(0,0,0,.25)';
        ctx.beginPath(); ctx.ellipse(tx + 3, ty + 4, 30, 22, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = it.type === 'restaurant' ? '#5a3a4a' : '#c94f3d';
        ctx.beginPath(); ctx.ellipse(tx, ty, 28, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e8e0d0';
        ctx.beginPath(); ctx.ellipse(tx, ty, 18, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.font = '14px Arial';
        ctx.fillText(it.type === 'pizzeria' ? '\ud83c\udf55' : '\ud83c\udf72', tx, ty + 5);
      }
    }
    if (L.cases) {
      for (let i = 0; i < 2; i++) {
        const cx2 = r.x + r.w * (0.3 + i * 0.4), cy2 = r.y + r.h * 0.6;
        ctx.fillStyle = 'rgba(140,190,255,.18)';
        roundRect(ctx, cx2 - 46, cy2 - 16, 92, 32, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(160,210,255,.5)';
        ctx.lineWidth = 1.5;
        roundRect(ctx, cx2 - 46, cy2 - 16, 92, 32, 6);
        ctx.stroke();
        ctx.font = '15px Arial';
        ctx.fillText('\ud83d\udd2b', cx2 - 22, cy2 + 5);
        ctx.fillText('\ud83d\udd2b', cx2 + 10, cy2 + 5);
      }
    }
    if (L.crates) {
      for (let i = 0; i < 3; i++) {
        const cx2 = r.x + 40 + i * 46, cy2 = r.y + r.h * 0.55;
        ctx.fillStyle = i % 2 ? '#4a3a2a' : '#3a2e22';
        ctx.fillRect(cx2, cy2, 36, 30);
        ctx.strokeStyle = 'rgba(0,0,0,.4)';
        ctx.strokeRect(cx2, cy2, 36, 30);
      }
      ctx.fillStyle = 'rgba(120,180,120,.16)';
      roundRect(ctx, it.cx - 50, r.y + r.h * 0.66, 100, 34, 8);
      ctx.fill();
      ctx.font = '14px Arial';
      ctx.fillText('\ud83c\udfb1', it.cx - 30, r.y + r.h * 0.66 + 23);
    }
    if (L.desks) {
      for (let i = 0; i < 2; i++) {
        const dx = r.x + r.w * (0.26 + i * 0.48), dy = r.y + r.h * 0.6;
        ctx.fillStyle = '#4a5260';
        roundRect(ctx, dx - 44, dy - 14, 88, 30, 5);
        ctx.fill();
        ctx.font = '13px Arial';
        ctx.fillText('\ud83d\udcbb', dx, dy + 5);
      }
    }
    if (L.crosses) {
      for (let i = 0; i < 2; i++) {
        const dx = r.x + r.w * (0.3 + i * 0.4), dy = r.y + r.h * 0.62;
        ctx.fillStyle = '#e8f2f2';
        roundRect(ctx, dx - 40, dy - 14, 80, 28, 6);
        ctx.fill();
        ctx.fillStyle = '#e05555';
        ctx.fillRect(dx - 3, dy - 9, 6, 18);
        ctx.fillRect(dx - 9, dy - 3, 18, 6);
      }
    }
  },
};
