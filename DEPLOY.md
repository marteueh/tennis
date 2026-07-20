# Deploy in produzione — Ace Chronicle

Guida operativa per Ace Chronicle in produzione e per gli aggiornamenti periodici.

**Stack di produzione (reale, verificato in deploy):**

- **GitHub** — https://github.com/marteueh/tennis.git
- **Server**: `217.114.212.30` — macchina condivisa con pannello **KeyHelp** (Eurhosting), NON un VPS dedicato. Ospita anche altri siti clienti (funtasting, laurus, ecc.)
- **Account applicativo**: utente panel `tennis` (sandboxed, senza sudo) — home `/home/users/tennis/`
- **Accesso root**: esiste un utente `root` separato (chiave SSH già configurata su questo PC, stessa usata per il progetto Funtasting — vedi `~/.ssh/config` e `~/.ssh/id_ed25519` "funtasting-deploy"). Serve per installare pacchetti di sistema; l'account `tennis` da solo non basta.
- **Web server**: Apache (gestito da KeyHelp) — reverse proxy verso Node.js su `127.0.0.1:3000`
- **Node.js 20** + **PM2** (process manager, gira come utente `tennis`, non root)
- **PostgreSQL 16** installato a livello di sistema (root) — il pannello KeyHelp/altri siti usano MariaDB, Postgres gira a fianco senza conflitti (porta 5432)
- **Dominio attuale**: `tennis.customerserver083004.eurhosting.net` (sottodominio KeyHelp, HTTP, no SSL) — dominio definitivo `acechronicle.it` da collegare in seguito

---

## ⚠️ Cose non ovvie scoperte durante il primo deploy

1. **L'utente panel (`tennis`) non ha sudo.** Serve l'utente `root` separato per: `apt install`, systemd, config Apache, quota disco.
2. **La home dell'utente panel ha il livello root-owned.** `/home/users/tennis/` stesso è `root:root` — non si possono creare nuove cartelle lì (es. `~/.npm`, `~/.pm2` di default falliscono). Usare sempre `~/files/` (scrivibile) o reindirizzare cache/home via env var (`NPM_CONFIG_CACHE`, `PM2_HOME`).
3. **Quota disco gestita dal pannello KeyHelp, non da `setquota` diretto.** Un cronjob KeyHelp (`/etc/cron.d/keyhelp`, ogni minuto!) la ri-applica sempre al valore configurato nel pannello. Va alzata dal **pannello admin KeyHelp** (account `tennis` → quota disco/file), non da SSH. Con quota di default (~450MB / 5.000 file) `npm ci` fallisce con errori fuorvianti tipo `ENOENT`/`EEXIST` (sono in realtà `EDQUOT`, errno -122).
4. **Il file vhost Apache generato da KeyHelp** (`/etc/apache2/keyhelp/vhosts/tennis.conf`) dice esplicitamente "DO NOT CHANGE — changes will be lost". La modifica manuale che abbiamo fatto (blocco `ProxyPass`/`ProxyPassReverse` verso `127.0.0.1:3000`) **verrà persa alla prossima rigenerazione** (salvataggio impostazioni dominio dal pannello, o aggiornamento KeyHelp). Il modo permanente e ufficiale: pannello KeyHelp → dominio `tennis...` → campo **"Direttive Apache"** → incollare:
   ```
   ProxyPreserveHost On
   ProxyPass /_next/ http://127.0.0.1:3000/_next/
   ProxyPassReverse /_next/ http://127.0.0.1:3000/_next/
   ProxyPass / http://127.0.0.1:3000/
   ProxyPassReverse / http://127.0.0.1:3000/
   ```
   **Da fare appena possibile** per non perdere il proxy al primo salvataggio da pannello.
5. **Il dataset Sackmann (`raw.githubusercontent.com/JeffSackmann/tennis_atp`) non è più raggiungibile** (404 su tutti gli URL, anche la repo GitHub stessa) al momento del deploy (2026-07-20). `database/import_sackmann.mjs` non è quindi utilizzabile per popolare dati da zero. **Soluzione adottata**: dump/restore diretto dal DB locale di sviluppo (che ha già 1152 giocatori, 11269 partite, 166 voci di impatto culturale) via `pg_dump -Fc` + `pg_restore`, con tunnel SSH (`ssh -L`) per evitare il mismatch di versione tra `pg_dump` locale (v18) e i tool sul server (v16) — un dump testuale semplice si è corrotto nel trasferimento.
6. **Colonne di schema mancanti**: il DB locale aveva colonne (`players.photo_url`, `photo_credit`, `photo_checked_at`, `bio_source`, `bio_searched_at`, `matches.youtube_searched_at`) aggiunte ad-hoc in passato, mai tracciate come migrazione. Ora tracciate in `database/migrate_player_photo_meta.mjs` — se riparti da un DB vuoto, va eseguita.

---

## Fase 1 — Prerequisiti (una tantum)

- [x] **GitHub**: repo pronto — `github.com/marteueh/tennis`
- [x] **Server**: KeyHelp condiviso `217.114.212.30`, root SSH disponibile via chiave già configurata
- [ ] **hCaptcha**: account su [hcaptcha.com](https://hcaptcha.com) — serve per la registrazione/commenti (non ancora configurato)
- [ ] **SMTP**: credenziali per l'invio magic link Auth.js (non ancora configurato — login non funzionante finché manca)
- [ ] **Dominio finale** `acechronicle.it`: da registrare/collegare (per ora si usa il sottodominio KeyHelp)

---

## Fase 2 — Stato del deploy (fatto il 2026-07-20)

```
Locale (Windows)                          Server (217.114.212.30)
─────────────────                          ────────────────────────
git push → github.com/marteueh/tennis  →  git pull in /home/users/tennis/files/app
                                            (utente: tennis, NON root)

pg_dump -Fc (locale, dati reali)       →  pg_restore via tunnel SSH
                                            → Postgres locale (ace_chronicle db)
```

Comandi chiave usati (riferimento, non da rieseguire salvo necessità):

```bash
# Installazione sistema (una tantum, da root)
ssh root@217.114.212.30
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs
apt install -y postgresql postgresql-contrib
npm install -g pm2

# Utente + DB Postgres (una tantum, da root)
sudo -u postgres psql -c "CREATE USER tennis_app WITH PASSWORD '...';"
sudo -u postgres psql -c "CREATE DATABASE ace_chronicle OWNER tennis_app;"
sudo -u postgres psql -d ace_chronicle -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
```

---

## Fase 3 — Deploy di aggiornamenti (workflow ricorrente)

### 3.1 Sul PC locale

```bash
git add .
git commit -m "descrizione modifica"
git push
```

### 3.2 Sul server (come utente `tennis`, via root SSH → su - tennis)

```bash
ssh root@217.114.212.30
su - tennis
cd /home/users/tennis/files/app
git pull

# Se ci sono nuove dipendenze o migrazioni:
NPM_CONFIG_CACHE=/home/users/tennis/.cache/npm npm ci --no-audit --no-fund
set -a && source .env.local && set +a && node database/migrate.mjs

npm run build

export PM2_HOME=/home/users/tennis/.cache/pm2
pm2 restart ace-chronicle
```

> **Nota npm cache**: usa sempre `NPM_CONFIG_CACHE=/home/users/tennis/.cache/npm` con `npm ci`/`npm install` — la cache di default (`~/.npm`) non è creabile per via del root-owned home. Se `npm ci` fallisce con errori strani tipo `ENOENT`/`EEXIST` ripetuti, controlla PRIMA la quota (`quota -u tennis` da root) prima di sospettare corruzione cache.

> **Nota PM2**: usa sempre `export PM2_HOME=/home/users/tennis/.cache/pm2` prima di ogni comando `pm2` (stessa ragione — home di default non creabile).

### 3.3 Verifica

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/   # dal server
curl -s -o /dev/null -w '%{http_code}\n' http://tennis.customerserver083004.eurhosting.net/  # dall'esterno
pm2 logs ace-chronicle --lines 50   # (con PM2_HOME impostato)
```

---

## Fase 4 — Cron settimanale (match-of-the-week YouTube)

`vercel.json` è inerte (era per Vercel). Da impostare come crontab dell'utente `tennis` (non ancora fatto):

```bash
su - tennis
crontab -e
```

```cron
0 3 * * 1 curl -s -H "Authorization: Bearer <CRON_SECRET da .env.local>" http://tennis.customerserver083004.eurhosting.net/api/cron/youtube-match >> /home/users/tennis/logs/cron-youtube.log 2>&1
```

---

## Fase 5 — Da fare per completare il lancio

1. **Rendere permanente il reverse proxy Apache** dal pannello KeyHelp (vedi punto 4 di "Cose non ovvie" sopra) — altrimenti si perde al primo salvataggio dominio da pannello.
2. **SMTP**: senza queste variabili in `.env.local` sul server, il login con magic link non invia email. Compilare `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`.
3. **hCaptcha**: registrarsi su hcaptcha.com, aggiungere `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` e `HCAPTCHA_SECRET`.
4. **SSL**: il sito è solo HTTP ora. Da pannello KeyHelp, richiedere certificato Let's Encrypt per il dominio (dopo aver eventualmente collegato `acechronicle.it`).
5. **Dominio definitivo** `acechronicle.it`: puntare i DNS al server (217.114.212.30) e aggiungere il dominio nel pannello KeyHelp per l'account `tennis`, poi aggiornare `AUTH_URL` in `.env.local` e riavviare con `pm2 restart`.
6. **GTM / Beehiiv**: `NEXT_PUBLIC_GTM_ID` e `NEXT_PUBLIC_BEEHIIV_PUBLICATION_ID` ancora vuoti/placeholder.
7. **Promuovere utente admin** (dopo il primo login con magic link, quindi dopo aver sistemato SMTP):
   ```bash
   su - tennis
   cd /home/users/tennis/files/app
   set -a && source .env.local && set +a
   node --input-type=module -e "import postgres from 'postgres'; const db = postgres(process.env.DATABASE_URL, { max: 1 }); await db\`UPDATE users SET role = 'admin' WHERE email = 'testamario75@gmail.com'\`; console.log('Admin promosso'); await db.end()"
   ```
8. **Cron settimanale**: vedi Fase 4, non ancora impostato.
9. **Riavvio server**: `pm2-tennis.service` (systemd, abilitato) esegue `pm2 resurrect` al boot — non testato con un riavvio reale.

---

## Troubleshooting

### `npm ci` fallisce con errori ENOENT/EEXIST ripetuti
Quasi sempre quota disco esaurita, non corruzione. `quota -u tennis` (da root). Se piena, va alzata **dal pannello KeyHelp** (si auto-ripristina ogni minuto, `setquota` diretto non tiene).

### Il sito risponde 502/non risponde
```bash
export PM2_HOME=/home/users/tennis/.cache/pm2
pm2 status
pm2 logs ace-chronicle
curl http://127.0.0.1:3000/   # verifica che Node risponda prima di Apache
```

### Il proxy Apache è sparito dopo una modifica da pannello
Vedi Fase 5.1 — va rifatto (o meglio, reso permanente dal pannello una volta per tutte).

### "Could not connect to database"
```bash
sudo -u postgres psql -c '\l'   # verifica che ace_chronicle esista
systemctl status postgresql
```
Verifica `DATABASE_URL` in `.env.local` sul server (`postgresql://tennis_app:...@localhost:5432/ace_chronicle`, niente `sslmode` per connessione locale).

### Foto non si vedono
`public/players/` è committata nel repo — verifica che `git pull` sul server sia aggiornato.

---

## Riepilogo credenziali/percorsi

| Cosa | Valore |
|---|---|
| Server | `217.114.212.30` |
| Root SSH | chiave già in `~/.ssh/id_ed25519` (locale), nessuna password |
| Utente app | `tennis` (via `su - tennis` da root) |
| Path app | `/home/users/tennis/files/app` |
| DB produzione | `postgresql://tennis_app:***@localhost:5432/ace_chronicle` (password in `.env.local` sul server, NON qui — repo pubblico) |
| PM2_HOME | `/home/users/tennis/.cache/pm2` |
| NPM cache | `/home/users/tennis/.cache/npm` |
| URL attuale | http://tennis.customerserver083004.eurhosting.net/ |
| Repo | https://github.com/marteueh/tennis.git |
