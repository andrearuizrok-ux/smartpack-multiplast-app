# Smart Pack · Multiplast — Piattaforma Operativa Integrata V11.2

Repository pulito e definitivo per:
- app Android nativa WebView;
- backend Supabase;
- sito Cloudflare Pages;
- build APK automatica con GitHub Actions.

## Struttura
- `app/src/main/assets/index.html` — applicazione
- `app/src/main/assets/smartpack-v11.js` — logica cumulativa V10.5–V11 consolidata in un solo file
- `app/src/main/assets/service-worker.js` — cache web V11 network-first per HTML/JS
- `.github/workflows/main.yml` — build APK V11.2
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


## V11.2 — Account aziendali e dipendenti USER+PIN

- Account NOMYRA autorizzato: `info.nomyra@gmail.com`.
- Account cliente autorizzato: `info@smartpack.srl`.
- Andrea resta amministratore di emergenza.
- Dopo l’accesso si sceglie Smart Pack o Multiplast.
- Ogni dipendente usa un USER personale e un PIN cifrato.
- NOMYRA e l’amministratore azienda possono creare, sospendere e resettare gli accessi dipendenti.
- Blocco temporaneo dopo cinque PIN errati e audit degli accessi.
- Recupero password per gli account e-mail.

V11.2 include inoltre tutte le funzioni Scadenze & Compliance della V11.1.
