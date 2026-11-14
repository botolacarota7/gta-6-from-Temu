// ===== Memorie persistenti dei NPC =====
const Memories = {
  data: {},          // nome -> { affinity, talks, topics:[], robbed, gaveMoney, lastSeen }
  MAX: 60,

  load() {
    try {
      const raw = localStorage.getItem('gta-temu-mem');
      if (raw) this.data = JSON.parse(raw) || {};
    } catch (e) { this.data = {}; }
    return this.data;
  },

  save() {
    try { localStorage.setItem('gta-temu-mem', JSON.stringify(this.data)); } catch (e) { /* noop */ }
  },

  get(name) { return this.data[name] || null; },

  ensure(npc) {
    if (!this.data[npc.name]) {
      this.data[npc.name] = { affinity: 0, talks: 0, topics: [], robbed: false, lastSeen: 0 };
    }
    return this.data[npc.name];
  },

  tier(mem) {
    if (!mem || mem.talks === 0) return 'new';
    if (mem.affinity >= 50) return 'warm';
    if (mem.affinity >= 15) return 'friendly';
    if (mem.affinity > -15) return 'neutral';
    if (mem.affinity > -50) return 'cold';
    return 'enemy';
  },

  affinityDelta: {
    greet: 4, joke: 6, love: 5, directions: 3, city: 2, game: 2, pizza: 2,
    work: 1, time: 1, money: -2, gang: 0, insult: -14, threat: -28, bye: 0,
  },

  applyOption(conv, optionId) {
    if (!conv || !conv.mem) return;
    const d = this.affinityDelta[optionId];
    if (d) conv.mem.affinity = clamp((conv.mem.affinity || 0) + d, -100, 100);
    if (optionId === 'threat') conv.mem.robbed = true;
  },

  applyText(conv, text) {
    if (!conv || !conv.mem) return;
    conv.mem.affinity = clamp((conv.mem.affinity || 0) + 1, -100, 100);
    const topic = Dialogue.matchTopic(String(text || '').toLowerCase());
    if (topic && !conv.mem.topics.includes(topic.id)) conv.mem.topics.push(topic.id);
  },

  endConversation(conv) {
    if (!conv || !conv.mem) return;
    conv.mem.talks = (conv.mem.talks || 0) + 1;
    conv.mem.lastSeen = Date.now();
    if (conv.moodShift) conv.mem.affinity = clamp((conv.mem.affinity || 0) + conv.moodShift, -100, 100);
    const names = Object.keys(this.data);
    if (names.length > this.MAX) {
      names.sort((a, b) => (this.data[a].lastSeen || 0) - (this.data[b].lastSeen || 0));
      for (let i = 0; i < names.length - this.MAX; i++) delete this.data[names[i]];
    }
    this.save();
  },

  topicLabel(id) {
    const map = { pizza: 'la pizza', money: 'i soldi', gang: 'la gang', police: 'la polizia', love: 'amore', work: 'il lavoro', car: 'le macchine', weapon: 'le armi', weather: 'il tempo', food: 'il cibo', game: 'GTA 6', city: 'la città' };
    return map[id] || null;
  },

  callbackLine(npc) {
    const mem = this.get(npc.name);
    if (!mem || mem.talks === 0) return null;
    const tier = this.tier(mem);
    const n = mem.talks;
    if (mem.robbed && Math.random() < 0.5) {
      return choice(['Tu sei quello che mi ha minacciato l\'altra volta! Mi hai riconosciuto?!', 'Ah, il minacciatore di turno. Io ho la memoria lunga.']);
    }
    const pool = {
      warm: ['Di nuovo tu! È la ' + n + 'ª volta che ci parliamo: sei praticamente famiglia.', 'Ehi! ' + (this.topicLabel(choice(mem.topics)) ? 'Com\'è andata poi a proposito di ' + this.topicLabel(choice(mem.topics)) + '?' : 'Mi mancavi!')],
      friendly: ['Bentornato! ' + n + ' conversazioni e non ci siamo ancora annoiati.', 'Rivederti fa sempre piacere. Dicono tutti qui in città.'],
      neutral: ['Ah, sei di nuovo tu. ' + n + 'ª volta, se conti bene.', 'Ci rivediamo. Il mondo è piccolo e il quartiere è più piccolo.'],
      cold: ['Ancora tu? È la ' + n + 'ª volta. Mi stai seguendo?', 'Tu di nuovo... ho quasi finito di pazientare.'],
      enemy: ['Tu. Io e te abbiamo conti in sospeso.', 'Guarda chi torna. La polizia sa che ci frequenti?'],
    };
    return choice(pool[tier] || pool.neutral);
  },

  summaryForAI(npc) {
    const mem = this.get(npc.name);
    if (!mem || mem.talks === 0) return 'È la PRIMA volta che parli con il giocatore: presentati come nuovo conoscente.';
    const tier = this.tier(mem);
    const labels = mem.topics.map((t) => this.topicLabel(t)).filter(Boolean);
    return 'Vi siete già parlati ' + mem.talks + ' volte. Affinità con il giocatore: ' + mem.affinity + '/100 (' + tier + ').' +
      (labels.length ? ' Argomenti già toccati: ' + labels.join(', ') + '.' : '') +
      (mem.robbed ? ' Il giocatore ti ha MINACCIATO in passato: ricordi l\'episodio e non ti fidi.' : '') +
      ' Continua la relazione da dove era rimasta, con richiami alle volte precedenti. Non ripetere le stesse frasi.';
  },
};

Memories.load();
