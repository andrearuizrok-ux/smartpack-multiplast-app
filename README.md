# Smart Pack · Multiplast — Piattaforma Operativa Integrata V11.5

Repository per:
- app Android WebView;
- backend e sincronizzazione Supabase;
- sito Cloudflare Pages;
- build APK automatica con GitHub Actions.

## Struttura
- `app/src/main/assets/index.html` — applicazione principale
- `app/src/main/assets/smartpack-v11.js` — logica operativa consolidata
- `app/src/main/assets/access-v11.5.js` — accesso account/ruoli
- `app/src/main/assets/planner-v11.5.js` — Coda Roberto, menu personalizzabile, assistente pianificazione e Inbox ordini e-mail
- `app/src/main/assets/service-worker.js` — cache web V11.5 network-first per HTML/JS
- `.github/workflows/main.yml` — build APK V11.5
- `docs/V11.5_PIANIFICAZIONE_E_EMAIL.md` — regole e flusso introdotto

## Cloudflare Pages
- Production branch: `main`
- Framework preset: `None`
- Build command: vuoto
- Root directory: vuota
- Build output directory: `app/src/main/assets`
- Automatic deployments: Enabled

## V11.5 — Pianificazione Roberto
- Coda produzione riordinabile e bloccabile da Roberto.
- Suggerimenti spiegati per pressa, senza modifiche automatiche.
- Cambio stampo: finestra iniziale 06:00–12:00 con Saverio.
- Coperchi: preferenza iniziale venerdì/sabato.
- Urgenza, consegna, tempo ciclo, stampo installato e disponibilità IML entrano nella valutazione.
- Menu Direzione personalizzabile.
- Inbox ordini e-mail con flusso bozza → verifica → ordine.
- Predisposizione per collegamento OAuth server-side della casella ordini.

## Dati cloud
L'aggiornamento del repository non richiede la cancellazione di Supabase. I nuovi campi di pianificazione vengono salvati nello stato condiviso esistente.
