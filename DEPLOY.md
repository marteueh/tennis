# Deploy in produzione — Ace Chronicle

Guida operativa per portare Ace Chronicle online sul tuo server (VPS con accesso SSH) e gestire gli aggiornamenti periodici.

**Stack di produzione:**

- **GitHub** — repository con codice + foto giocatori
- **VPS proprio** — Node.js + PM2 (process manager) + Nginx (reverse proxy/SSL)
- **PostgreSQL locale sul VPS** — il server ha solo MariaDB di default; Postgres si installa a fianco (porta 5432, non confligge con MariaDB su 3306)
- **SMTP del tuo hosting** — invio magic link Auth.js
- **acechronicle.it** — dominio (da puntare al VPS)

> **Nota Postgres vs MariaDB:** l'app usa PostgreSQL in modo specifico (estensione `uuid-ossp`, tipi e query Postgres-only). Migrare a MariaDB richiederebbe riscrivere schema e query — non conviene. Installare Postgres accanto a MariaDB sullo stesso VPS è la strada più semplice: sono processi indipendenti su porte diverse.

---

## Fase 1 — Prerequisiti (una tantum)

- [ ] **GitHub**: repository creato (vuoto va bene)
- [ ] **VPS**: accesso SSH con utente sudo, IP pubblico noto
- [ ] **hCaptcha**: account su [hcaptcha.com](https://hcaptcha.com) (serve per la registrazione/commenti)
- [ ] **SMTP del provider hosting**: credenziali della casella `noreply@acechronicle.it` o simile
- [ ] **Dominio**: `acechronicle.it` con accesso al pannello DNS

---

## Fase 2 — Setup repo GitHub (una tantum, dal tuo PC)

```bash
git remote add origin https://github.com/TUO-UTENTE/ace-chronicle.git
git branch -M master
git push -u origin master
```

> **Nota foto:** `public/players/` (~51MB, 335 foto) è committata nel repo — nessun bisogno di Git LFS.
> **Nota segreti:** `.env.local` è in `.gitignore`, non viene mai pushato. Le credenziali di produzione vivono solo sul VPS in `.env.local` di produzione (mai committato).

---

## Fase 3 — Preparazione del VPS (una tantum)

Connettiti via SSH e installa lo stack.

### 3.1 Node.js (LTS 20)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # verifica v20.x
```

### 3.2 PostgreSQL (accanto a MariaDB, nessun conflitto)

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql

# Crea utente e database dedicati
sudo -u postgres psql -c "CREATE USER ace_chronicle WITH PASSWORD 'SCEGLI_UNA_PASSWORD_FORTE';"
sudo -u postgres psql -c "CREATE DATABASE ace_chronicle OWNER ace_chronicle;"
sudo -u postgres psql -d ace_chronicle -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
```

La connection string risultante:
```
postgresql://ace_chronicle:SCEGLI_UNA_PASSWORD_FORTE@localhost:5432/ace_chronicle
```

### 3.3 PM2 (mantiene l'app viva, restart automatico)

```bash
sudo npm install -g pm2
pm2 startup   # segui l'istruzione stampata (abilita l'avvio al boot)
```

### 3.4 Nginx + SSL (reverse proxy + certificato)

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Crea `/etc/nginx/sites-available/acechronicle`:

```nginx
server {
    listen 80;
    server_name acechronicle.it www.acechronicle.it;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/acechronicle /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Certificato SSL gratuito (richiede il DNS del dominio già puntato al VPS — vedi Fase 5)
sudo certbot --nginx -d acechronicle.it -d www.acechronicle.it
```

### 3.5 Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Fase 4 — Deploy iniziale dell'app

### 4.1 Clona il repo sul VPS

```bash
cd /var/www   # o cartella a tua scelta
sudo git clone https://github.com/TUO-UTENTE/ace-chronicle.git
sudo chown -R $USER:$USER ace-chronicle
cd ace-chronicle
```

### 4.2 Crea `.env.local` di produzione

```bash
cp .env.local.example .env.local
nano .env.local
```

Compila con i valori di produzione:

| Variabile | Valore per produzione |
|---|---|
| `DATABASE_URL` | `postgresql://ace_chronicle:PASSWORD@localhost:5432/ace_chronicle` (Postgres locale, niente `sslmode=require`) |
| `AUTH_SECRET` | Genera con `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_URL` | `https://acechronicle.it` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | Del tuo provider email |
| `EMAIL_FROM` | `Ace Chronicle <noreply@acechronicle.it>` |
| `YOUTUBE_API_KEY` | Chiave Google Cloud |
| `GOOGLE_CSE_ID` | Custom Search Engine ID |
| `CRON_SECRET` | Genera con `openssl rand -base64 32` (serve per il cron di Fase 6) |
| `NEXT_PUBLIC_GTM_ID` | `GTM-XXXXXXX` |
| `NEXT_PUBLIC_BEEHIIV_PUBLICATION_ID` | Da Beehiiv dashboard |
| `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` / `HCAPTCHA_SECRET` | Da hCaptcha |

### 4.3 Installa, builda, applica schema

```bash
npm ci
node database/migrate.mjs           # crea tutte le tabelle
node database/import_sackmann.mjs   # importa giocatori + partite (opzionale, se vuoi i dati storici)
npm run build
```

### 4.4 Avvia con PM2

```bash
pm2 start npm --name ace-chronicle -- start
pm2 save   # persiste la lista dei processi per il riavvio automatico
```

L'app ora gira su `http://127.0.0.1:3000`, proxata da Nginx su `https://acechronicle.it`.

---

## Fase 5 — Dominio personalizzato

Sul pannello DNS del registrar, punta il dominio all'IP del VPS:

| Tipo | Nome | Valore |
|---|---|---|
| A | `@` | IP pubblico del VPS |
| A | `www` | IP pubblico del VPS |

Propagazione: 5 minuti–24 ore. Una volta propagato, esegui `sudo certbot --nginx -d acechronicle.it -d www.acechronicle.it` (Fase 3.4) se non l'hai già fatto.

---

## Fase 6 — Cron settimanale (sostituisce `vercel.json`)

`vercel.json` è specifico di Vercel e ora è inerte — il cron va ricreato come `crontab` di sistema, che chiama l'endpoint protetto da `CRON_SECRET`:

```bash
crontab -e
```

Aggiungi (lunedì alle 03:00, stesso orario del cron originale):

```cron
0 3 * * 1 curl -s -H "Authorization: Bearer IL_TUO_CRON_SECRET" https://acechronicle.it/api/cron/youtube-match >> /var/log/ace-chronicle-cron.log 2>&1
```

---

## Fase 7 — Workflow giornaliero (aggiornamenti periodici)

### Sviluppo

```bash
# In locale, come sempre
npm run dev
# → http://localhost:3000
```

### Deploy di modifiche

```bash
# Sul PC locale
git add .
git commit -m "descrizione modifica"
git push

# Sul VPS
ssh utente@acechronicle.it
cd /var/www/ace-chronicle
git pull
npm ci
npm run build
pm2 restart ace-chronicle
```

### Migrazioni DB

```bash
# Sul VPS, dopo git pull
node database/migrate.mjs
```

Il runner traccia cosa è già applicato — rilanciarlo non duplica nulla.

### Aggiornamenti dati periodici

```bash
# Sul VPS
node database/fetch_youtube.mjs --limit 45
```

---

## Fase 8 — Promuovere utente admin

Dopo il primo accesso con magic link:

```bash
# Sul VPS, nella cartella del progetto (usa .env.local di produzione)
node --input-type=module -e "import 'dotenv/config'; import postgres from 'postgres'; const db = postgres(process.env.DATABASE_URL, { max: 1 }); await db\`UPDATE users SET role = 'admin' WHERE email = 'testamario75@gmail.com'\`; console.log('Admin promosso'); await db.end()"
```

Da quel momento `/admin` è accessibile dal menu utente.

---

## Troubleshooting

### L'app non risponde / Nginx dà 502

- Controlla che PM2 stia girando: `pm2 status` / `pm2 logs ace-chronicle`
- Verifica che l'app ascolti su `127.0.0.1:3000`: `curl http://127.0.0.1:3000`

### Build fallisce

- Errori TypeScript comuni: type mismatch dopo aggiornamenti schema. Rilancia `npx tsc --noEmit` in locale e correggi prima del push.

### "Could not connect to database" in produzione

- Verifica `DATABASE_URL` in `.env.local` sul VPS
- Verifica che PostgreSQL sia attivo: `sudo systemctl status postgresql`

### Email magic link non arriva

- Controlla che `SMTP_*` siano impostate correttamente
- Verifica reputazione SPF/DKIM/DMARC del dominio (chiedi al provider hosting)
- Test in locale con [Mailtrap.io](https://mailtrap.io) prima del passaggio produzione

### Foto non si vedono

- Foto locali (`/players/...`): verifica che `public/players/` sia stato pushato/pullato correttamente sul VPS
- Foto remote (Wikimedia, LOC, YouTube thumbnails): controlla che `next.config.ts` abbia il dominio in `remotePatterns`

### Certificato SSL non si rinnova

Certbot installa un cron/systemd timer automatico. Verifica con:
```bash
sudo certbot renew --dry-run
```

---

## Riepilogo file di deploy

| File | Cosa fa |
|---|---|
| `.gitignore` | Esclude `.env.local`, `node_modules`, build artifacts |
| `.env.local.example` | Template variabili (committato) |
| `.env.local` | Credenziali locali/produzione (NON committato) |
| `vercel.json` | Inerte in questo setup (era la config cron di Vercel) |
| `next.config.ts` | Domini immagini remote |
| `database/migrate.mjs` | Runner migrazioni idempotente |
| `DEPLOY.md` | Questo file |

**Costo mensile stimato:** dipende dal piano del tuo VPS + ~10€/anno di dominio. Nessun costo aggiuntivo per DB (Postgres locale) o hosting (già tuo).
