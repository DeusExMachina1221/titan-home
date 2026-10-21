# Titan Home

Home in stile Apple TV per TV Philips con **Titan OS**, come web app HTML5 lanciata dall'app ufficiale **DevView**.
Nessuna modifica alla TV: è un'app web normale.

Schermate: Home (orologio, saluto, meteo, dock) · Meteo (Open-Meteo, 8 ore + 7 giorni) · Orologio/salvaschermo · Calendario · Timer · Impostazioni (città, nome).

## Provarla sul PC

Dalla cartella del progetto:

```bash
python -m http.server 8765
```

Apri `http://localhost:8765` e usa frecce, Invio ed Esc come telecomando. Con `?debug=1` vedi il codice dell'ultimo tasto premuto (utile per mappare il tasto Indietro della TV).

## Metterla sulla TV

1. Registrati su https://partners.titanos.tv/ (Sign up) e, nella sezione **DevView**, chiedi l'accesso.
2. L'app è già online su GitHub Pages: **https://deusexmachina1221.github.io/titan-home/** (si aggiorna da sola a ogni push su `main`).
   In alternativa il PC di casa: `python -m http.server 8765` e URL `http://<IP-del-PC>:8765` (il PC deve restare acceso; Windows chiederà di aprire il firewall).
3. Nel Partner Portal aggiungi l'app al **Sandbox** con quell'URL.
4. Sulla TV apri **DevView** (App → carosello Lifestyle), vai su Device Management nel portale, "Add new device" e inserisci il codice mostrato dalla TV.
5. Lancia l'app da DevView.

## Note

- Meteo: Open-Meteo, gratis e senza chiave. Aggiornamento ogni 15 minuti.
- Impostazioni salvate nel browser della TV (localStorage).
- Non può aprire Netflix o altre app della TV.
- Dopo 10 minuti di inattività in home parte l'Orologio come salvaschermo.
