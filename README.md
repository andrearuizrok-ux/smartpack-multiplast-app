# Smart Pack · Multiplast — Piattaforma Operativa Integrata V11.3

Repository pulito e definitivo per:
- app Android nativa WebView;
- backend Supabase;
- sito Cloudflare Pages;
- build APK automatica con GitHub Actions.

## Struttura
- `app/src/main/assets/index.html` — applicazione
- `app/src/main/assets/smartpack-v11.js` — logica cumulativa V10.5–V11 consolidata in un solo file
- `app/src/main/assets/access-v11.3.js` — accessi separati cliente, dipendenti e NOMYRA
- `app/src/main/assets/service-worker.js` — cache web V11 network-first per HTML/JS
- `.github/workflows/main.yml` — build APK V11.3
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


## V11.3 — Accessi separati e PIN personale

- Account NOMYRA autorizzato: `info.nomyra@gmail.com`.
- Account cliente autorizzato: `info@smartpack.srl`.
- Andrea resta amministratore NOMYRA di emergenza e non compare nell’interfaccia cliente.
- Il cliente vede soltanto il login e-mail/password e la scelta Smart Pack o Multiplast.
- Ogni dipendente usa esclusivamente USER e PIN personale di 6 cifre, senza e-mail.
- Solo NOMYRA crea, sospende e riattiva gli USER e assegna il primo PIN.
- Il primo PIN deve essere cambiato dal dipendente al primo accesso.
- Le richieste di recupero USER/PIN arrivano all’account base del cliente.
- L’account cliente può risolvere un recupero, ma non può creare o sospendere USER.
- Blocco temporaneo dopo cinque PIN errati e audit degli accessi.
- Recupero password per gli account e-mail.

V11.3 include tutte le funzioni operative e Scadenze & Compliance delle versioni precedenti.
