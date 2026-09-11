# Smart Pack · Multiplast — Piattaforma Operativa Integrata V11.0

Repository pulito e definitivo per:
- app Android nativa WebView;
- backend Supabase;
- sito Cloudflare Pages;
- build APK automatica con GitHub Actions.

## Struttura
- `app/src/main/assets/index.html` — applicazione
- `app/src/main/assets/smartpack-v11.js` — logica cumulativa V10.5–V11 consolidata in un solo file
- `app/src/main/assets/service-worker.js` — cache web V11 network-first per HTML/JS
- `.github/workflows/main.yml` — build APK V11.0
- `docs/` — setup e schema Supabase di riferimento

## Cloudflare Pages
- Production branch: `main`
- Framework preset: `None`
- Build command: vuoto
- Root directory: vuota
- Build output directory: `app/src/main/assets`
- Automatic deployments: Enabled

## Nota dati
La sostituzione del repository NON richiede la cancellazione di Supabase. I dati operativi restano nel database cloud.
