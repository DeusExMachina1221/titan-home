# HANDOFF — Titan Home

## 2026-10-22 — progetto spostato + GitHub Pages

- Progetto in `C:\Users\tuono\Claude\Projects\titan-tv`, file dell'app nella radice (prima in `titan-home/`). La cronologia git della prima versione è andata persa nello spostamento: il repo è ripartito da zero, contenuto invariato.
- Repo pubblico `DeusExMachina1221/titan-home`, GitHub Pages da `main` / root → https://deusexmachina1221.github.io/titan-home/
- Aggiunti `.gitignore` (esclude `.claude/`) e `.claude/launch.json` (server locale sulla porta 8765, dalla radice).
- Richiesta di accesso a DevView inviata dall'utente. Il portale è pensato per i partner aziendali, quindi l'approvazione non è garantita.

## 2026-10-19 — v0.1 prima versione

**Cosa**: web app HTML5 per TV Philips Titan OS (da lanciare via DevView). Home stile Apple TV + Meteo, Orologio, Calendario, Timer, Impostazioni.
Contesto: la TV dell'utente è Philips con Titan OS (firmware TPN246E, chip Novatek), quindi niente ADB/launcher come in cleanyourtv. Si resta su DevView, il percorso ufficiale.

**File**: `index.html`, `styles.css`, `app.js` (IIFE ES2017), `README.md`.

**Architettura**
- Un solo focus manager con navigazione spaziale (getBoundingClientRect), usato da tutte le schermate.
- Un solo stato meteo `W` + `getWeather()` (Open-Meteo), usato da shelf home, pannello Meteo e Orologio. Giorno/notte da sunrise/sunset tramite l'helper condiviso `isDayAt`.
- Impostazioni in localStorage `titanHome.settings`, sempre dentro try/catch.

**Verificato** (browser pane, 1920x1080 e 1280x720, tasti freccia/Invio/Esc):
- home, focus e glow; ritorno con focus ripristinato;
- meteo reale (Roma e Milano), icone giorno/notte corrette dopo il tramonto;
- calendario ottobre 2026, settimana da lunedì, cambio mese;
- timer da 1 min che continua in home, banner a zero, dopo il dismiss la shelf torna "Pronto";
- città preimpostata e ricerca (Pescara), con focus valido dopo la scelta;
- nome salvato con messaggio nella colonna giusta;
- persistenza dopo reload;
- nessun overflow (scrollWidth = viewport) e nessun errore in console;
- `node --check app.js` ok.

**Review**: 2 MAJOR (focus perso dopo la ricerca città; `gap` su flex non supportato da Chromium < 84) + MINOR, tutti corretti. Dopo la review ho corretto io un overflow di 24px: le schermate nascoste avevano scale(1.025), che allargava l'area scorrevole di #app e faceva scorrere il focus sull'input. Ora usano scale(.975) e `focus({preventScroll:true})`.

**NON verificato**
- Sulla TV reale: keyCode del telecomando (usare `?debug=1`), tastiera virtuale, prestazioni, versione di Chromium.
- Suono del timer (Web Audio).
- Salvaschermo automatico dopo 10 minuti e spostamento anti burn-in nell'arco di 60 s.
- Fallback senza localStorage o senza rete.

**Aperti / prossimi passi**
- L'utente deve ottenere l'accesso a DevView su partners.titanos.tv.
- Hosting: GitHub Pages (consigliato) oppure server sul PC di casa.
- Non può lanciare le altre app della TV.
