// ===== Collegamento API AI per i dialoghi (opzionale) =====
// La chiave vive solo nel localStorage del browser: mai nel codice, mai su GitHub.
const AIChat = {
  presets: {
    mistral: {
      label: 'Mistral AI (consigliato)',
      url: 'https://api.mistral.ai/v1/chat/completions',
      model: 'mistral-small-latest',
      keyHint: 'Chiave da console.mistral.ai (formato: ...)',
    },
    openai: {
      label: 'OpenAI',
      url: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      keyHint: 'Chiave da platform.openai.com',
    },
    groq: {
      label: 'Groq (veloce e gratis)',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.1-8b-instant',
      keyHint: 'Chiave da console.groq.com',
    },
    openrouter: {
      label: 'OpenRouter (tutti i modelli)',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'mistralai/mistral-small-24b-instruct:free',
      keyHint: 'Chiave da openrouter.ai',
    },
    custom: {
      label: 'Personalizzato (URL OpenAI-compatibile)',
      url: '',
      model: '',
      keyHint: 'Chiave del tuo provider',
    },
  },

  settings: { enabled: false, provider: 'mistral', apiKey: '', model: '', baseUrl: '' },

  load() {
    try {
      const raw = localStorage.getItem('gta-temu-ai');
      if (raw) Object.assign(this.settings, JSON.parse(raw));
    } catch (e) { /* storage non disponibile */ }
    return this.settings;
  },

  save() {
    try { localStorage.setItem('gta-temu-ai', JSON.stringify(this.settings)); } catch (e) { /* noop */ }
  },

  configured() {
    const s = this.settings;
    if (!s.enabled || !s.apiKey) return false;
    if (s.provider === 'custom') return !!s.baseUrl && !!s.model;
    return true;
  },

  endpoint() {
    const s = this.settings;
    return s.provider === 'custom' ? s.baseUrl : this.presets[s.provider].url;
  },

  model() {
    const s = this.settings;
    return s.model || (this.presets[s.provider] && this.presets[s.provider].model) || '';
  },

  moodText(npc) {
    if (npc.state === 'flee') return 'terrorizzato: ha paura del giocatore e vuole scappare';
    switch (npc.mood) {
      case 'friendly': return 'amichevole e chiacchierone';
      case 'grumpy': return 'scortese e stanco della gente';
      case 'gangster': return 'da gangster: duro, parlando di rispetto e territorio';
      default: return 'neutrale, un po\' distratto';
    }
  },

  systemPrompt(npc) {
    const pl = Game.player;
    const hour = fmtTime(Game.timeMin);
    const stato = [];
    if (pl.wanted > 0) stato.push('il giocatore è RICERCATO dalla polizia (' + pl.wanted + ' stelle): i civili hanno paura');
    if (pl.money > 8000) stato.push('il giocatore è visibilmente ricco (' + fmtMoney(pl.money) + ')');
    if (WEAPONS[pl.curWeapon].bullet) stato.push('il giocatore ha un\'arma in mano');
    if (pl.gangRep >= 3 && !npc.isAntonio) stato.push('il giocatore è rispettato nei Los Pepes: i gangster lo salutano');
    return [
      'Sei ' + npc.name + ', un cittadino della città di "GTA VI: Temu Edition", un videogioco open world comico e satirico.',
      'Sei un NPC con vita propria, NON un assistente virtuale: non offrire aiuto generico, vivi la tua giornata.',
      npc.persona ? npc.persona : '',
      npc.isAntonio
        ? 'Tu sei ANTONIO: il personaggio più amato della città, informatore chiacchierone e filosofo urbano. Conosci ogni angolo, adori la pizza di Gino, e fai continue battute su GTA 6 e su Temu. Consideri il giocatore un amico.'
        : 'La tua personalità è: ' + this.moodText(npc) + '.',
      'Rispondi SEMPRE in italiano, massimo 2 frasi brevi, tono comico da GTA. Niente emoji, niente virgolette attorno alla risposta, niente descrizioni di azioni tra asterischi.',
      'Sono le ' + hour + '. Il giocatore si chiama ' + pl.custom.name + ' e ha ' + fmtMoney(pl.money) + '.' +
      (stato.length ? ' Contesto: ' + stato.join('; ') + '.' : ''),
      npc.isAntonio ? 'Non ripetere mai due volte la stessa battuta.' : '',
      Memories.summaryForAI(npc),
    ].filter(Boolean).join(' ');
  },

  async complete(system, user, maxTokens) {
    const s = this.settings;
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 20000) : null;
    try {
      const res = await fetch(this.endpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + s.apiKey,
        },
        body: JSON.stringify({
          model: this.model(),
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          max_tokens: maxTokens || 400,
          temperature: 1.0,
        }),
        signal: ctrl ? ctrl.signal : undefined,
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!text) throw new Error('risposta vuota');
      return String(text);
    } finally {
      if (timer) clearTimeout(timer);
    }
  },

  async reply(npc, userText, history) {
    const s = this.settings;
    const messages = [{ role: 'system', content: this.systemPrompt(npc) }];
    const past = (history || []).slice(-10);
    for (const h of past) {
      if (h.who === 'Tu') messages.push({ role: 'user', content: h.text });
      else messages.push({ role: 'assistant', content: h.who + ': ' + h.text });
    }
    messages.push({ role: 'user', content: userText });

    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 12000) : null;
    try {
      const res = await fetch(this.endpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + s.apiKey,
        },
        body: JSON.stringify({
          model: this.model(),
          messages,
          max_tokens: 90,
          temperature: 1.0,
        }),
        signal: ctrl ? ctrl.signal : undefined,
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      let text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!text) throw new Error('risposta vuota');
      text = String(text).trim().replace(/^["'«]+|["'»]+$/g, '').slice(0, 220);
      return text;
    } finally {
      if (timer) clearTimeout(timer);
    }
  },
};

AIChat.load();
