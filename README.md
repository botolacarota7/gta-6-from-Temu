# GTA VI: Temu Edition

Open world 2D top-down in puro HTML5/Canvas — zero dipendenze, zero build. La copia sospetta che arriva in busta rosa, ma funziona.

## Come si gioca

Basta aprire `index.html` nel browser (doppio click), oppure pubblicare il repo su GitHub Pages.

### Comandi

| Tasto | Azione |
|---|---|
| W A S D / Frecce | Muoviti / Guida |
| Shift | Corri |
| Mouse | Mira |
| Click sinistro | Attacca / Spara |
| E | Interagisci (porte, obiettivi) |
| T | Parla con il passante più vicino |
| F | Entra / Esci dal veicolo |
| 1-5 / Rotellina | Cambia arma |
| Esc | Pausa |

## Città in cui puoi fare tutto

- **Città aperta** generata proceduralmente: isolati, strade a doppia corsia, strisce pedonali, parchi, ciclo giorno/notte con fari delle auto.
- **Avatar personalizzabile**: nome, carnagione, maglia, pantaloni, capelli, cappello (cappellino, cilindro da boss, bandana) e auto iniziale.
- **Macchine**: traffico con IA (corsie, incroci, frenate), auto parcheggiate da rubare, concessionaria dove comprare la Rattoppo, il Furgoncino o la Fulmine GT. Puoi anche sequestrare auto al volo (con relative conseguenze legali).
- **NPC con reazioni**: i pedoni chiacchierano, si spaventano agli spari, fuggono, ti insultano se li investiti quasi, chiamano la polizia se sono testimoni, e salutano il boss se sali di grado nella gang.
- **Armi**: pugni, mazza, pistola, mitraglietta, fucile — comprabili all'**Ammu-Nazione**, con munizioni e giubbotto antiproiettile.
- **Lavori onesti**:
  - *Pizzaiolo* da Gino: consegne a tempo con mancia.
  - *Chef* da Bella Napoli: minigioco di cottura a tempismo.
  - *Cameriere*: servi 3 clienti in giro per l'isolato.
- **Lavori sporchi** alla base **Los Pepes**: estorsioni, spaccio e guerra di territorio contro la gang rivale. Il rispetto (reputazione) aumenta i pagamenti.
- **Polizia e stelle ricercato**: spari in pubblico, omicidi, furti d'auto ed esplosioni attirano la polizia. Evadi nascondendoti o paga la cauzione in centrale.
- **Economia**: budget in euro (dollari di Temu), soldi a terra dai malcapitati, ospedale a pagamento, salvataggio automatico in `localStorage`.

## Struttura

```
index.html        markup, HUD, menu, dialoghi
style.css         stile completo
js/config.js      costanti, armi, auto, frasi dei NPC
js/utils.js       helper matematici
js/input.js       tastiera e mouse
js/world.js       generazione città e terreno pre-renderizzato
js/entities.js    giocatore, pedoni, poliziotti, auto, proiettili
js/dialogue.js    motore di dialogo: personalità, argomenti, anti-ripetizione
js/ai.js          collegamento API AI (Mistral/OpenAI/Groq/OpenRouter/custom), chiave solo in localStorage
js/systems.js     traffico, folla, polizia, lavori, negozi, salvataggio
js/main.js        loop, rendering, UI, personalizzazione
test/smoke.js     smoke test headless (node test/smoke.js)
```

## Test

```bash
node test/smoke.js
```

Simula DOM e canvas, avvia una partita, guida, lavora, combatte, muore e salva: se stampa `SMOKE TEST PASSATO` il gioco respira.
