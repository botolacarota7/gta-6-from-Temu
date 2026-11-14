// ===== Motore di dialogo: nomi, personalità, argomenti, risposte =====
const PED_NAMES = [
  'Gennaro', 'Maria', 'Carmine', 'Lucia', 'Salvatore', 'Rosa', 'Franco', 'Giulia',
  'Pasquale', 'Assunta', 'Ciro', 'Nunzia', 'Totò', 'Pippo', 'Marina', 'Saro',
  'Bruna', 'Otello', 'Imma', 'Tore', 'Violetta', 'Sante',
];

const Dialogue = {
  // ---------- aperture di conversazione ----------
  openings: {
    friendly: [
      'Ehi, ciao! Che piacere vederti!', 'Bella giornata per una chiacchierata, no?',
      'Oh, finalmente qualcuno con cui parlare!', 'Ciao! Dimmi tutto, ascolto sempre.',
    ],
    neutral: [
      'Eh... ciao. Volevi qualcosa?', 'Sì? Sto andando di fretta, però dimmi.',
      'Buongiorno... suppongo.', 'Mmh? Ti serve qualcosa?',
    ],
    grumpy: [
      'Che c\'è? Sono occupato a non fare nulla.', 'Se vieni a chiedere soldi, hai sbagliato persona.',
      'Oggi non ho voglia di gente. Parla e scappa.', 'Ancora tu? Che palle.',
    ],
    gangster: [
      'Yo. Zitto che stiamo contando.', 'Tu di che banda sei? ...Nessuna? Peccato.',
      'Qui si parla poco e si paga molto. Cosa vuoi?', 'Il territorio è nostro, amico. Ma sei il benvenuto.',
    ],
    scared: [
      'A-approccio lento... non farmi niente!', 'Vuoi i miei soldi? Prendili, prendili tutti!',
      'Io non ho visto niente a nessuno, giuro!', 'Perché mi parli?! Cosa vuoi da me?!',
    ],
    antonio: [
      'Ehilà! Antonio per i amici, leggenda per i turisti. Come va?',
      'Oh, guarda chi si vede! Ti stavo proprio aspettando, sai?',
      'Sai che c\'è? Oggi mi sento chiacchierone. Seguimi col pensiero.',
      'Ciao! Io sono Antonio: informatore, filosofo e cliente abituale da Gino.',
    ],
  },

  // ---------- argomenti ----------
  topics: [
    {
      id: 'greet', kw: ['ciao', 'salve', 'ehi', 'hey', 'buongiorno', 'buonasera', 'buonanotte', 'salut', 'come va', 'come stai'],
      replies: {
        friendly: ['Ciao ciao! Che bello sentirsi salutare!', 'Tutto bene! Oggi la città è quasi simpatica.', 'Ciao! Tu sì che sei un gentiluomo.'],
        neutral: ['Ciao.', 'Salve. Il mondo va avanti, eh.', 'Ciao, ciao.'],
        grumpy: ['Eh, saluto pure io. Contento?', 'Ciao... se proprio dobbiamo.', 'Sì sì, ciao. Andiamo avanti.'],
        gangster: ['Yo. Rispetto.', 'Salute, fratello.', 'Ciao. Occhio dove metti i piedi.'],
        antonio: ['Ciao ciao! Lo sai che sei il mio cliente preferito? Unico, ma preferito.', 'Salve salve! Antonio è sempre contento di vederti vivo.'],
      },
    },
    {
      id: 'insult', kw: ['stupido', 'scemo', 'idiota', 'brutto', 'deficiente', 'muori', 'odio te', 'zoccolo', 'cretino', 'imbecille', 'bugiardo', 'ladrone'],
      replies: {
        friendly: ['Oh... spero fosse uno scherzo, eh!', 'Uffa! Ma io che ti ho fatto?'],
        neutral: ['Ma sei educato, almeno?', 'Bel modo di parlare. Complimenti sinceri.'],
        grumpy: ['Guarda che ti rispondo a suon di ombrello, eh.', 'Anche tu, caro mio. Anche tu.', 'Ripeti pure, tanto non mi tocca nulla.'],
        gangster: ['Attento a chi chiami scemo, ragazzino.', 'Ah sì? Ripetilo davanti ai miei amici.'],
        antonio: ['Ehi! Io sono Antonio! Insultami pure, ma con più fantasia.', 'Permettimi di non essere d\'accordo. Con enfasi.'],
      },
    },
    {
      id: 'work', kw: ['lavoro', 'lavorare', 'assumi', 'offerta', 'paga', 'stipendio', 'mestiere', 'impiego', 'cv'],
      replies: {
        all: [
          'Da Gino cercano pizzaioli. Pagano in pizza e monete.', 'Il lavoro onesto? Prova dal pizzaiolo o dallo chef di Bella Napoli.',
          'Io una volta lavoravo... poi ho scoperto il divano.', 'Se trovi un lavoro che paga in soldi veri, avvisami.',
          'Il capo dei Los Pepes assume... ma la pensione è sospetta.', 'Lavorare? All\'età mia? Io faccio il filosofo urbano.',
        ],
        gangster: ['Il lavoro sporco paga il doppio. Chiedi al boss.', 'Noi assumiamo. Il colloquio è... intenso.'],
        antonio: ['Lavori? Ho una lista: pizzeria per soldi puliti, gang per soldi veloci, concessionaria per spenderli male.'],
      },
    },
    {
      id: 'money', kw: ['soldi', 'denaro', 'euro', 'dollari', 'prestito', 'spicci', 'cash', 'ricco', 'povero', 'budget'],
      replies: {
        all: [
          'I soldi? Se li avessi, non starei a piedi.', 'Chiedi in banca. Ah no, qui le banche non esistono. Chiedi alla gang.',
          'Ti presto 5 euro... psicologici.', 'Il denaro non compra la felicità, ma la pizza sì, e la pizza costa.',
        ],
        friendly: ['Tieni, prendi qualche spicciolo. Ma niente a nessuno!', 'Ho il portafoglio buco, ma per te trovo qualcosa.'],
        grumpy: ['I miei soldi sono miei. I tuoi sono... beh, vediamo.', 'Prestiti? Io sono una famiglia, non una banca.'],
        gangster: ['Soldi si ottengono. Come, non lo chiedi mica a me.', 'Il pizzo si paga, non si chiede.'],
        antonio: ['Ti do un consiglio da finanziere: consegna pizze. La mancia è matematica, il riposo è garantito.'],
      },
    },
    {
      id: 'gang', kw: ['gang', 'pepes', 'banda', 'clan', 'territorio', 'pizzo', 'boss', 'mafia', 'rispetto'],
      replies: {
        all: [
          'I Los Pepes? Qui si fa schermo pieno quando passano.', 'Il boss non ama i turisti. E nemmeno i locali, in fondo.',
          'La gang protegge il quartiere. E anche il portafoglio altrui.', 'Se entri in gang, esci in pensione o in prima pagina.',
        ],
        gangster: ['Il rispetto si guadagna. O si compra. Noi accettiamo entrambi.', 'Se il boss ti vuole, io ti rispetto. Se no... corsa libera.'],
        antonio: ['Il boss dei Pepes mi deve ancora 10 euro e una scusa. Se vai alla base, salutami... con sarcasmo.'],
      },
    },
    {
      id: 'pizza', kw: ['pizza', 'pizzeria', 'margherita', 'napoli', 'gino', 'pizzaiolo'],
      replies: {
        all: [
          'Da Gino la pizza è ottima. Gli ananas sono vietati per legge.', 'Pizza a portata? Solo se corri. Gino non aspetta nessuno.',
          'Io la voglio senza mozzarella. Sì, lo so. Non dirlo a Gino.', 'La migliore della città. L\'unica, ma anche la migliore.',
        ],
        antonio: ['Gino è il mio fornitore di felicità a fette. Digli che Antonio ha ordinato la solita: sorpresa.'],
      },
    },
    {
      id: 'love', kw: ['amore', 'bella', 'bello', 'appuntamento', 'uscire insieme', 'cuore', 'sposa', 'fidanzata', 'fidanzato', 'bacio'],
      replies: {
        friendly: ['Oh... sei un dolcino, lo sai?', 'Eh, con me serve prima un caffè. Poi vediamo.'],
        neutral: ['Guarda che ci siamo visti due volte in vita mia.', 'Preferisco i cani. Niente di personale.'],
        grumpy: ['Ma sei scemo? Io ho l\'età del tuo... no, di più.', 'Passa dal notaio, non da me.'],
        gangster: ['Il cuore è territorio privato. Zona vietata.', 'Romantico. Il boss ride. Io no.'],
        antonio: ['L\'amore è come il traffico: arriva sempre quando non lo aspetti e blocca tutto.'],
      },
    },
    {
      id: 'police', kw: ['polizia', 'poliziotto', 'crimine', 'arresto', 'mandato', 'giustizia', 'carcere', 'legge'],
      replies: {
        all: [
          'La polizia qui arriva sempre... un\'ora dopo.', 'Se hai stelle, muoviti. Io non ti ho visto.',
          'La giustizia è cieca, ma anche un po\' lenta.', 'Io sono un cittadino perbene. Ripeto: perbene.',
        ],
        antonio: ['La centrale è nel blocco a nord. Paga la cauzione e torni libero come un autobus in ritardo.'],
      },
    },
    {
      id: 'weather', kw: ['pioggia', 'sole', 'caldo', 'freddo', 'tempo', 'meteo', 'notte', 'giornata', 'stanotte'],
      replies: {
        all: [
          'Fa un caldo che fondono i semafori.', 'Piove? Qui non ha mai piovuto. Il budget grafico è quello.',
          'Di notte la città è un\'altra. Più pericolosa, più bella.', 'Il meteo qui è decorativo, come le mie ambizioni.',
        ],
        antonio: ['Il ciclo giorno/notte dura 12 minuti. Io l\'ho cronometrato tre volte, per scienza.'],
      },
    },
    {
      id: 'food', kw: ['cibo', 'mangiare', 'fame', 'ristorante', 'panino', 'pasta', 'kebab', 'pranzo', 'cena'],
      replies: {
        all: [
          'Bella Napoli ti riempie e ti svuota il portafoglio insieme.', 'Io mi mangerei un kebab. Ma qui ci sono solo pizzerie. Vita dura.',
          'La fame è cattiva consigliera. La pizza è ottima alleata.', 'Mangia bene, vivi meglio. Firmo io le citazioni.'],
        antonio: ['Consiglio dello chef Antonio: ordina la specialità dello chef. Non sai cosa è? Nemmeno lui.'],
      },
    },
    {
      id: 'car', kw: ['auto', 'macchina', 'guida', 'velocit', 'fulmine', 'rattoppo', 'motor', 'concessionaria', 'gommato'],
      replies: {
        all: [
          'La Fulmine GT? Un razzo. Il prezzo? Un rapino.', 'Qui si guida veloce e si frena per caso.',
          'Il furgoncino è lento ma non ti abbandona mai. Come un vecchio amico.', 'Se ti rubano l\'auto, ruba anche tu. È il circolo della vita.',
        ],
        antonio: ['La concessionaria è a sud-est. Auto "originali" a prezzi da sospetto. Io ho la Rattoppo: va a 250 e non l\'ho mai lavata.'],
      },
    },
    {
      id: 'weapon', kw: ['arma', 'pistola', 'fucile', 'mitraglia', 'sparare', 'munizioni', 'ammu', 'mazza', 'coltello'],
      replies: {
        all: [
          'All\'Ammu-Nazione vendono tutto. Anche la tranquillità, a rate.', 'Armi? Io ho solo una lingua affilata.',
          'La pistola è per i deboli. La mazza è per gli stilisti.', 'Se la tiri fuori, il quartiere si svuota. Nota per te.',
        ],
        gangster: ['Le armi parlano poco ma chiaro.', 'Nella gang le armi sono di casa. Le munizioni pure.'],
        antonio: ['Ammu-Nazione, blocco a sud. Dimmi ciao al commesso: mi deve ancora un favore e tre scuse.'],
      },
    },
    {
      id: 'joke', kw: ['battuta', 'scherzo', 'ridere', 'barzelletta', 'ridi', 'comico'],
      replies: {
        all: [
          'Hahaha! Bravo, mi hai strappato un sorriso.', 'Rido, ma solo per educazione.',
          'Sei più divertente del traffico di venerdì.', 'Ahahah! Questa la rifaccio io, senza citarti.',
        ],
        grumpy: ['Pfff. Ridere costa energia.', 'Era quasi divertente. Quasi.'],
        antonio: ['Ahahah! Sei forte! Ma non più di me: sapevo che GTA 6 sarebbe uscito... e infatti non è uscito.'],
      },
    },
    {
      id: 'name', kw: ['nome', 'chiam', 'chi sei', 'present', 'di chi sei'],
      replies: {
        all: [
          'Sono uno della folla. Ma dei migliori.', 'Chiamami pure "quello lì", ci rispondo.',
          'Il nome è sulla tessera. La tessera l\'ho persa.', 'Un cittadino qualunque. Con sogni qualunqui.',
        ],
        antonio: ['Antonio! Il tuo informatore di fiducia. Se cerchi qualcosa in città, io la so. O la invento bene.'],
      },
    },
    {
      id: 'directions', kw: ['dove', 'indirizzo', 'direzioni', 'mappa', 'luogo', 'trovo', 'raggiungere', 'vado a'],
      replies: {
        all: [
          'Segui il punto giallo sulla mappa, fidati.', 'Qui si va tutti in tondo. Ma la minimappa aiuta.',
          'Cerchi qualcosa? Io vedo solo palazzi e pizzerie.', 'Prendi a destra, poi a sinistra, poi chiedi a un altro.',
        ],
        antonio: ['Ti segno io la strada: guarda il marcatore verde sulla mappa. Antonio GPS, servizio incluso nell\'amicizia.'],
      },
    },
    {
      id: 'game', kw: ['gta', 'gioco', 'temu', 'videogiochi', 'console', 'playstation'],
      replies: {
        all: [
          'GTA 6 da Temu? Io l\'ho preordinata due volte. Non è mai arrivata.', 'Questo gioco è meglio del vero GTA. Costa 4 euro in meno.',
          'Hanno promesso GTA 6 per il 2025. Poi per il 2026. Poi Temu.', 'Io gioco a "Guarda il traffico". Grafica fenomenale.',
        ],
        antonio: ['GTA 6 da Temu? Amico mio, noi SIAMO GTA 6 da Temu. Metaconsapevolezza al massimo livello.'],
      },
    },
    {
      id: 'time', kw: ['ore', 'ora è', 'orario', 'tardi', 'presto'],
      replies: {
        all: ['Guarda l\'orologio in alto a destra: è sempre l\'ora di qualcosa.', 'In questa città il tempo vola: un\'ora ogni 30 secondi.'],
        antonio: ['Sono le ' + '{TIME}' + '. Il mio orologio è sincronizzato con il sole del canvas.'],
      },
    },
    {
      id: 'bye', kw: ['addio', 'arrivederci', 'ci vediamo', 'vado via', 'devo andare', 'a dopo', 'ci si vede'],
      replies: {
        all: ['Arrivederci! E occhio alla polizia.', 'Ci vediamo in giro. Magari con la macchina nuova.', 'Vai con Dio. E con l\'assicurazione.'],
        grumpy: ['Finalmente. Salute.', 'Vai, vai. Non ti trattenere.'],
        antonio: ['Ci si vede! E ricordati: la vita è breve, la pizza si fredda.'],
      },
    },
    {
      id: 'threat', kw: ['ammazzo', 'uccido', 'coltello', 'minaccia', 'o ti', 'dammi i soldi o', 'sparo in testa'],
      replies: {
        friendly: ['No no no! Prendo tutto, tieni!', 'Per favore! Non ho niente! Prendi il portafoglio!'],
        neutral: ['Va bene, va bene! Non serve esagerare!', 'Ecco, prendi! Ma non mi cercare più!'],
        grumpy: ['Ah sì? E io che ti faccio? ...Vabbè, prendi e vattene.', 'Minacce? Io sono nato sotto una minaccia. Tieni i soldi.'],
        gangster: ['Prova pure. Vedi come finisce.', 'Tu minacci me? Il boss ride. Io preparo la mazza.'],
        antonio: ['Io? Ma io sono Antonio! Ti do pure 20 euro, mettiti con la violenza.'],
      },
    },
  ],

  // ---------- battute generiche quando non capisci ----------
  fallbacks: [
    'Interessante. Io intanto devo andare... o no, aspetta, non ho niente da fare.',
    'Mmh. Profondo. Io però ho capito solo la metà, e va bene così.',
    'Guarda, io dico sempre: meglio un silenzio pieno di senso che un discorso senza.',
    'Sei un tipo strano. Simpatico, ma strano.',
    'Non ho capito niente, ma annuisco con convinzione.',
    'Questa città è strana, e tu ci stai dentro perfettamente.',
    'Ripetilo più piano, che io penso più piano.',
    'Bello. Io invece ho visto un gatto. Fine del mio racconto.',
    'Io tengo le opinioni in frigorifero: si conservano meglio.',
    'Se lo dici tu. Io mi fido, poi mi lamento.',
  ],

  reflectTemplates: [
    '«{w}»? Parola pesante. Ci pensiamo su.',
    'Non ho capito bene «{w}», ma sono d\'accordo in linea di principio.',
    'Ah, «{w}»... argomento del momento in città.',
    '«{w}». Hai fatto il punto della situazione, complimenti.',
    'Io su «{w}» non mi esprimo. Ho già problemi con la tesi sulla pioggia.',
  ],

  // ---------- battute ambientali contestuali ----------
  ambient: {
    wanted: [
      'Ma quello non è il ricercato?!', 'Ha le stelle! Non guardarlo negli occhi!',
      'Chiamateli, chiamate la polizia!', 'Io mi sposto di quartiere, grazie.',
    ],
    night: [
      'A quest\'ora fuori? Coraggio.', 'La notte è giovane. Io no.',
      'Buio tosto stasera, eh?', 'Di notte qui non si fa domande.',
    ],
    rich: [
      'Ma quello è pieno di soldi!', 'Chico, guarda il portafoglio a quel signore!',
      'Con tutti quei soldi... e quell\'auto.', 'Sei tu il nouveau riche di Temu?',
    ],
    gun: [
      'Ma quell\'arma è vera?!', 'Ha una pistola! Io non ho visto niente!',
      'Meglio attraversare la strada, adesso.', 'Che sia della polizia? No, ha la faccia di un giocatore.',
    ],
    idle: [
      'Che caldo oggi...', 'Devo prendere il pane.', 'Il tram è in ritardo, come sempre.',
      'Si dice che GTA 6 costi 100 euro.', 'Io l\'ho comprata da Temu, 4 euro.', 'Bella giornata, eh?',
      'Questo quartiere era meglio prima. E anche dopo.', 'Ho visto un poliziotto sorridere. Non ci credo nemmeno io.',
      'La mia dieta è a base di pizza e rimpianti.', 'Se trovi 5 euro per terra, è mio. Restituiscilo.',
      'Il sindaco ha promesso il mare. Nel parcheggio.', 'Oggi mi sento fortunato. Poi è passato il traffico.',
    ],
  },

  // ---------- chiacchiere tra pedoni ----------
  pairChatter: [
    ['Hai sentito l\'ultima sul boss?', 'Non dico niente. Io non dico mai niente.'],
    ['Il traffico oggi è impossibile.', 'Impossibile? È artistico.'],
    ['Comprami una pizza.', 'Compratela tu, hai il portafoglio nuovo.'],
    ['Ho visto un ufo.', 'Era la Fulmine GT di qualcuno.'],
    ['Dove andiamo stasera?', 'Da Gino. Come sempre. Come tutti.'],
  ],

  // ---------- battute d'apertura dei negozi ----------
  shopGreetings: {
    pizzeria: ['Gino: "Benvenuto! Il forno è acceso e i clienti sono affamati."'],
    restaurant: ['Il capocuoco: "Oggi la cucina ha bisogno di eroi."'],
    gunshop: ['Il commesso: "Benvenuto. Legale, quasi. Funzionale, sicuro."'],
    dealer: ['Il venditore: "Auto splendide, chilometraggio... creativo."'],
    gang: ['Una sentinella: "Il boss ti aspetta. Non farlo aspettare."'],
    police: ['Il sergente: "Benvenuto in centrale. Speriamo per una visita cortese."'],
    hospital: ['L\'infermiera: "Dottore! Ah no, sei tu. Paziente o cliente?"'],
  },

  // ---------- utilità anti-ripetizione ----------
  _bags: {},

  pickBag(key, pool) {
    if (!this._bags[key] || this._bags[key].length === 0) {
      this._bags[key] = pool.map((_, i) => i).sort(() => Math.random() - 0.5);
    }
    const idx = this._bags[key].pop();
    return pool[idx];
  },

  poolFor(npc, topic) {
    if (npc.isAntonio && topic.replies.antonio) {
      return topic.replies.antonio.concat(topic.replies.all || []);
    }
    const p = npc.mood === 'scared' ? 'scared' : npc.mood;
    const own = topic.replies[p] || [];
    const pool = own.concat(topic.replies.all || []);
    if (pool.length) return pool;
    return topic.replies.neutral || topic.replies.all || this.fallbacks;
  },

  matchTopic(text) {
    let best = null, bestLen = 0;
    for (const t of this.topics) {
      for (const kw of t.kw) {
        if (text.includes(kw) && kw.length > bestLen) { best = t; bestLen = kw.length; }
      }
    }
    return best;
  },

  meaningfulWord(text) {
    const stop = new Set(['che', 'come', 'perche', 'perché', 'non', 'sono', 'questo', 'questa', 'quella', 'molto', 'anche', 'però', 'pero', 'ciao', 'sono', 'una', 'uno', 'del', 'della', 'nel', 'nella', 'con', 'sul', 'sulla', 'the', 'and', 'you']);
    const words = text.replace(/[^a-zàèéìòù0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !stop.has(w));
    if (!words.length) return null;
    return words.sort((a, b) => b.length - a.length)[0];
  },

  fill(line, npc) {
    return line.replace('{TIME}', fmtTime(Game.timeMin));
  },

  // ---------- risposta del NPC a testo libero ----------
  reply(npc, raw) {
    const text = (raw || '').toLowerCase().trim();
    if (!text) return this.pickBag('empty', ['...', 'Parla più forte, il traffico copre tutto.']);

    if (npc.state === 'flee') {
      return this.pickBag('flee', this.openings.scared);
    }

    const topic = this.matchTopic(text);
    if (topic) {
      const eff = this.sideEffects(npc, topic.id);
      let line = this.pickBag(npc.name + ':' + topic.id, this.poolFor(npc, topic));
      line = this.fill(line, npc);
      if (eff) return { text: line, effect: eff };
      return { text: line };
    }

    const w = this.meaningfulWord(text);
    if (w && Math.random() < 0.5) {
      return { text: this.pickBag('reflect', this.reflectTemplates).replace('{w}', w) };
    }
    return { text: this.pickBag('generic', this.fallbacks) };
  },

  sideEffects(npc, topicId) {
    const pl = Game.player;
    if (topicId === 'money') {
      if (npc.mood === 'friendly' && !npc.gaveMoney && Math.random() < 0.6) {
        npc.gaveMoney = true;
        const amount = randInt(5, 30);
        pl.money += amount;
        UI.toast('+' + fmtMoney(amount) + ' da ' + npc.name, 'money');
        UI.updateHUD();
        return 'money';
      }
      if (npc.mood === 'grumpy' && Math.random() < 0.3) { npc.scare(pl, 4); return 'flee'; }
    }
    if (topicId === 'insult') {
      npc.mood = 'grumpy';
      if (Math.random() < 0.35) { npc.scare(pl, 4); return 'flee'; }
    }
    if (topicId === 'threat') {
      if (npc.mood !== 'gangster' && Math.random() < 0.5) {
        Entities.pickups.push({ x: npc.x + rand(-16, 16), y: npc.y + rand(-16, 16), amount: npc.dropMoney || randInt(10, 50), t: 30 });
        npc.scare(pl, 10);
        if (Math.random() < 0.5) Systems.crime(1, 'minaccia in pubblico');
        return 'rob';
      }
      npc.mood = 'grumpy';
      return 'defiant';
    }
    if (topicId === 'joke' || topicId === 'greet') {
      if (npc.mood !== 'gangster') npc.mood = 'friendly';
    }
    if (topicId === 'love') {
      if (npc.mood === 'friendly' && Math.random() < 0.4) { npc.mood = 'friendly'; return 'flirt'; }
      if (npc.mood === 'grumpy') return 'rebuff';
    }
    if (topicId === 'directions') {
      const door = choice(World.doors);
      Systems.tempObjective = { x: door.x, y: door.y, label: door.label, t: 12 };
      return 'marker';
    }
    return null;
  },

  // ---------- opzioni di risposta suggerite ----------
  options(npc) {
    const pl = Game.player;
    const all = [
      { id: 'greet', label: 'Saluta', line: 'Ciao! Come va?' },
      { id: 'city', label: 'Chiedi della città', line: 'Com\'è la vita in questa città?' },
      { id: 'money', label: 'Chiedi un favore', line: 'Mi faresti un favore? Servono soldi.' },
      { id: 'joke', label: 'Fai una battuta', line: 'Sai perché il poliziotto non gioca a nascondino? Perché le stelle si vedono sempre.' },
      { id: 'directions', label: 'Chiedi indicazioni', line: 'Dove trovo un posto interessante?' },
      { id: 'game', label: 'Parla di GTA 6', line: 'Hai sentito? GTA 6 costa 100 euro. Io l\'ho presa da Temu.' },
      { id: 'pizza', label: 'Parla di pizza', line: 'Tu che pizza ordini da Gino?' },
      { id: 'work', label: 'Chiedi di lavoro', line: 'Conosci lavori onesti in zona?' },
      { id: 'time', label: 'Chiedi l\'ora', line: 'Scusa, che ore sono?' },
      { id: 'love', label: 'Fai un complimento', line: 'Devo dire... oggi hai un aria fantastica.' },
    ];
    if (pl.gangRep >= 1) {
      all.push({ id: 'gang', label: 'Fatti riconoscere', line: 'Sai con chi parli? Io sono dei Los Pepes.' });
    }
    all.push({ id: 'threat', label: 'Minaccia', line: 'Dammi i soldi o faccio un male.', danger: true });
    all.push({ id: 'insult', label: 'Insulta', line: 'Sei proprio un idiota.', danger: true });
    all.push({ id: 'bye', label: 'Congedati', line: 'Va bene, ti lascio. Ciao!', exit: true });

    const normal = all.filter((o) => !o.danger && !o.exit && o.id !== 'greet');
    const picked = [all[0]];
    while (picked.length < 4 && normal.length) {
      picked.push(normal.splice(Math.floor(Math.random() * normal.length), 1)[0]);
    }
    if (pl.gangRep >= 1 && Math.random() < 0.5) picked.splice(randInt(1, picked.length - 1), 0, all.find((o) => o.id === 'gang'));
    picked.push(all.find((o) => o.id === 'threat'));
    picked.push(all.find((o) => o.id === 'bye'));
    return picked;
  },
};
