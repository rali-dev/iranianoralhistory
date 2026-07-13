# DEPLOYMENT.md — Iranian Oral History live schalten

Diese Anleitung führt dich als Einzelperson Schritt für Schritt zum Live-Betrieb:
Frontend auf **Vercel** (statisch), Backend auf **Render** (Free Web Service),
Datenbank + Datei-Storage auf **Supabase** (Free-Tier). Kein Docker, kein CI nötig.

Reihenfolge (bitte genau so): **GitHub → Supabase → Render → Vercel → Test**.

> **Immer wenn `<...>` steht, musst du deinen eigenen Wert einsetzen.**

---

## Wie das Ganze zusammenhängt (kurz, aber wichtig)

Das Frontend ruft das Backend NUR über den relativen Pfad `/api/...` auf derselben
Adresse auf. Damit das funktioniert, proxyt Vercel per **Rewrite** alle `/api/*`-Anfragen
an dein Render-Backend weiter. Für den Browser sieht dadurch alles wie **dieselbe Herkunft
(same-origin)** aus — nur die Vercel-Adresse.

Warum das zwingend ist: Die Auth-Cookies sind `SameSite=Strict`, `HttpOnly`, `Secure`,
ohne `Domain`. `SameSite=Strict` bedeutet, dass der Browser das Cookie NUR bei
gleicher Herkunft mitschickt. Würde das Frontend das Backend direkt unter
`onrender.com` aufrufen, wäre das eine ANDERE Herkunft — der Browser würde das Cookie
verwerfen, der Login gelänge (Status 200), aber die nächste Anfrage käme mit 401 zurück.
Der Vercel-Rewrite (kein Redirect!) hält alles auf der Vercel-Adresse, deshalb bleibt
der Login stabil. **Es muss ein Rewrite sein, niemals ein Redirect.**

---

## Schritt 0 — Voraussetzungen

- Konten (alle kostenlos): [github.com](https://github.com), [supabase.com](https://supabase.com), [render.com](https://render.com), [vercel.com](https://vercel.com), [resend.com](https://resend.com)
- Lokal installiert: **Node.js 22** und **git**
- Die Deployment-Dateien `vercel.json` und `render.yaml` liegen **bereits im Repo-Root**;
  `dotenv` ist **bereits** als devDependency deklariert. Du musst also nichts davon selbst anlegen.

### JWT-Secrets erzeugen (jetzt gleich, du brauchst sie in Schritt 3)

Führe diesen Befehl **zweimal** aus und notiere beide Ergebnisse getrennt:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

- Ergebnis 1 → `JWT_SECRET`
- Ergebnis 2 → `JWT_REFRESH_SECRET`

Sie müssen **verschieden** und jeweils **≥ 32 Zeichen** sein (base64 von 48 Bytes = 64 Zeichen, passt). Das Backend startet sonst nicht.

---

## Schritt 1 — Code auf GitHub pushen

Die Konfigurationsdateien sind schon im Repo. Du musst es nur zu GitHub hochladen.

1. Auf GitHub ein **neues, leeres Repository** anlegen (ohne README/gitignore — das Repo existiert lokal schon).
2. Lokal das Remote setzen und pushen:
   ```bash
   git remote add origin https://github.com/<dein-user>/<dein-repo>.git
   git push -u origin main
   ```
   (Falls schon ein `origin` existiert: `git remote set-url origin <url>` statt `add`.)

> `vercel.json` enthält noch den Platzhalter `YOUR-BACKEND.onrender.com`. Den echten Wert
> trägst du in Schritt 4 ein, nachdem du die Render-URL kennst.

---

## Schritt 2 — Supabase: Datenbank + Storage anlegen

1. In Supabase **New project** klicken. Namen wählen, ein **Database Password** setzen
   und **notieren** (`<DB_PASSWORD>`). Region z. B. Frankfurt (EU) — nah an Render Frankfurt.
2. Warten, bis das Projekt bereitsteht.

### 2a) DATABASE_URL kopieren (WICHTIG: Session-Pooler!)

1. Oben rechts auf **Connect** klicken.
2. Abschnitt **Connection string** → **Session pooler** wählen
   (NICHT „Direct connection", NICHT „Transaction pooler").
3. Der String sieht so aus (Host endet auf `pooler.supabase.com`, Port **5432**):
   ```
   postgresql://postgres.<project-ref>:<DB_PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```
4. `<DB_PASSWORD>` durch dein in 1. gesetztes Passwort ersetzen. **Diesen kompletten String
   kopieren** — das wird gleich `DATABASE_URL` bei Render.

> **Warum Session-Pooler?** Render hat kein ausgehendes IPv6. Der direkte Host
> `db.<ref>.supabase.co` ist IPv6-only und für Render unerreichbar (Fehler `ENETUNREACH`).
> Der Session-Pooler ist IPv4 und liefert die persistente Session, die Prisma Migrate für
> seinen Advisory-Lock braucht. Den **exakten** Host aus dem Dashboard kopieren
> (Prefix `aws-0-` oder `aws-1-` variiert je Projekt). Der Transaction-Pooler (Port 6543)
> funktioniert für Migrationen NICHT.

### 2b) Storage-Bucket anlegen

1. Links **Storage** → **New bucket**.
2. Name z. B. `documents` — das wird `SUPABASE_BUCKET`. Notieren.
3. Für den Anfang privat lassen (das Backend erzeugt Signed URLs).

### 2c) API-Keys kopieren

1. Links **Project Settings** → **API**.
2. **Project URL** kopieren (`https://<project-ref>.supabase.co`) → `SUPABASE_URL`.
3. **service_role / secret key** kopieren → `SUPABASE_SECRET_KEY`.
   (Das ist der geheime Server-Key — niemals ins Frontend oder in git!)

### 2d) Resend-Key holen

1. In [resend.com](https://resend.com) einloggen → **API Keys** → Key erzeugen.
2. Wert (`re_...`) kopieren → `RESEND_API_KEY`.

Du hast jetzt: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_BUCKET`,
`RESEND_API_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.

---

## Schritt 3 — Backend auf Render deployen

1. In Render **New +** → **Blueprint**.
2. Dein GitHub-Repo verbinden und auswählen. Render liest `render.yaml` aus dem Root und
   schlägt den Service `ioh-backend` vor. **Apply** klicken.
3. Render fragt nach den Werten aller `sync: false`-Variablen. Trage ein:

   | Variable | Wert |
   |---|---|
   | `DATABASE_URL` | den Session-Pooler-String aus Schritt 2a |
   | `JWT_SECRET` | Ergebnis 1 aus Schritt 0 |
   | `JWT_REFRESH_SECRET` | Ergebnis 2 aus Schritt 0 |
   | `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `SUPABASE_SECRET_KEY` | secret key aus 2c |
   | `SUPABASE_BUCKET` | z. B. `documents` |
   | `RESEND_API_KEY` | `re_...` |
   | `CORS_ORIGINS` | vorerst freilassen — echten Wert trägst du in Schritt 4c nach |
   | `RESEND_FROM_ADDRESS` | optional leer lassen |

   `NODE_ENV=production` und `NODE_VERSION=22` stehen in `render.yaml` bereits fest.
   **`PORT` NICHT setzen** — Render vergibt ihn selbst.

4. **Create / Deploy** klicken. Render führt automatisch aus:
   - `npm ci`
   - `prisma generate`
   - `nx build backend`
   - `prisma migrate deploy` (legt die Tabellen in Supabase an) — **letzter Build-Schritt**
   - Start: `node dist/apps/backend/main.js`
5. Warten, bis der Deploy **live** ist. Render markiert erst live, wenn der Health-Check
   `GET /api/health` mit 200 antwortet (der Endpoint prüft auch die DB).
6. Oben die **Service-URL** kopieren, Form: `https://ioh-backend-xxxx.onrender.com`.
   Das ist deine `<RENDER_URL>`.

> **Deploy schlägt fehl?** Häufigste Ursachen: falscher/fehlender `DATABASE_URL`
> (Health-Check 503) — meist der falsche Verbindungstyp (siehe Session-Pooler-Hinweis),
> zu schwaches/identisches JWT-Secret (Prozess beendet sich beim Boot), oder eine
> fehlende Pflicht-Variable. Logs im Render-Dashboard prüfen.

---

## Schritt 4 — Frontend auf Vercel deployen

### 4a) Render-URL in vercel.json eintragen

1. In `vercel.json` (Repo-Root) den Platzhalter ersetzen:
   ```
   "destination": "https://YOUR-BACKEND.onrender.com/api/:path*"
   ```
   →
   ```
   "destination": "https://ioh-backend-xxxx.onrender.com/api/:path*"
   ```
   **Den `/api`-Teil und `:path*` unbedingt behalten.** Vercel interpoliert keine
   Env-Variablen in Rewrites — die URL muss als fester Text drinstehen.
2. Committen und pushen:
   ```bash
   git add vercel.json
   git commit -m "chore: Render-Backend-URL im Vercel-Rewrite eintragen"
   git push origin main
   ```

### 4b) Projekt in Vercel importieren

1. In Vercel **Add New… → Project** → dein GitHub-Repo importieren.
2. **Root Directory**: Repo-Root (Standard lassen).
3. **Framework Preset**: **Other** (die `vercel.json` setzt `framework: null`).
4. Die übrigen Build-Felder werden aus `vercel.json` gelesen:
   - Build Command: `npx nx build frontend --configuration=production`
   - Output Directory: `dist/apps/frontend/browser`  ← **muss der `browser`-Unterordner sein**
   - Install Command: `npm install`
5. **Deploy** klicken. Ergebnis ist deine Frontend-URL, z. B. `https://your-app.vercel.app`.

### 4c) CORS_ORIGINS bei Render nachtragen

1. Zurück zu Render → Service `ioh-backend` → **Environment**.
2. `CORS_ORIGINS` auf die echte Vercel-Adresse setzen, z. B.
   `https://your-app.vercel.app` (mehrere kommasepariert, ohne Leerzeichen).
3. Speichern — Render startet den Service neu.

> Technisch ist `CORS_ORIGINS` bei der Proxy-Architektur nicht zwingend (der Browser sieht
> alles same-origin), aber setze es als zusätzliche Absicherung gegen direkte Zugriffe aufs Backend.

---

## Schritt 5 — End-to-End verifizieren

Ersetze `your-app.vercel.app` durch deine echte Vercel-Adresse.

1. **Health-Check über Vercel-Proxy:**
   ```bash
   curl -i https://your-app.vercel.app/api/health
   ```
   Erwartung: `200` und JSON `{"status":"ok",...}`.
   (Beim allerersten Aufruf nach Leerlauf kann es ~1 Minute dauern — siehe Cold-Start.)

2. **Deep-Link-Test (SPA-Fallback):** Im Browser direkt `https://your-app.vercel.app/login`
   öffnen und hart neu laden (Strg+F5). Muss die App mit **200** laden, **kein 404**.
   Ein 404 heißt: Rewrite-Reihenfolge in `vercel.json` falsch.

3. **Registrieren / Login:** In der App einen Account anlegen und einloggen.
   In den Browser-DevTools (F12) → **Application → Cookies → deine Vercel-Domain**
   muss nach dem Login ein `access_token`-Cookie mit `HttpOnly`, `Secure`, `SameSite=Strict`
   erscheinen. Danach eine geschützte Aktion ausführen (z. B. Seite wechseln) — bleibt
   eingeloggt (keine 401).

4. **Set-Cookie durch den Proxy prüfen (lasttragend):**
   ```bash
   curl -i -X POST https://your-app.vercel.app/api/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"<deine-mail>","password":"<dein-pw>"}'
   ```
   In der Antwort muss `Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Strict`
   stehen. Damit ist bewiesen, dass Vercel das Cookie vom Render-Backend an den Browser
   durchreicht.

5. **Dokument-Flow:** In der App ein Dokument/Video aufrufen bzw. (als Admin) anlegen —
   der Storage-Zugriff über Supabase Signed URLs muss funktionieren.

Wenn alle fünf Punkte grün sind, ist das Deployment vollständig.

---

## Free-Tier-Verhalten (kein Bug, gutes Wissen)

- **Render Free** fährt den Service nach **~15 Min ohne Traffic** herunter. Die erste
  Anfrage danach ist ein **Cold Start (~1 Min)**. Da Vercels Proxy nach ~30 s ein Timeout
  (504) liefern kann, kann der **erste Login nach Leerlauf fehlschlagen** — einfach erneut
  versuchen oder das Backend vorher „aufwecken":
  ```bash
  curl -i https://<RENDER_URL>/api/health
  ```
- Render Free: **750 Instanz-Stunden/Monat**, ephemeres Dateisystem (nichts lokal
  Gespeichertes bleibt — daher Storage bei Supabase).
- **Supabase Free** pausiert ein Projekt nach **~1 Woche ohne Nutzung** (im Dashboard reaktivierbar).
- Ein externer Uptime-Pinger auf `/api/health` hält den Service warm, verbraucht aber die
  750 h. Renders eigene Health-Checks halten ihn **nicht** wach.

---

## Abschnitt A — vollständige `vercel.json` (liegt bereits im Repo)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": null,
  "buildCommand": "npx nx build frontend --configuration=production",
  "outputDirectory": "dist/apps/frontend/browser",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-BACKEND.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

`YOUR-BACKEND.onrender.com` durch deine echte Render-URL ersetzen. Die `/api`-Regel MUSS
vor der `/(.*)`-Catch-all-Regel stehen (Vercel wertet von oben nach unten aus, erster
Treffer gewinnt). Bereits vorhandene statische Dateien werden vor dem Catch-all bedient,
daher überschreibt der Fallback keine echten Assets.

## Abschnitt B — vollständige `render.yaml` (liegt bereits im Repo)

```yaml
services:
  - type: web
    name: ioh-backend
    runtime: node
    plan: free
    region: frankfurt
    branch: main
    autoDeployTrigger: commit
    healthCheckPath: /api/health
    buildCommand: >-
      npm ci &&
      npx prisma generate --schema=libs/backend/shared/database/prisma/schema.prisma &&
      npx nx build backend &&
      npx prisma migrate deploy --schema=libs/backend/shared/database/prisma/schema.prisma
    startCommand: node dist/apps/backend/main.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: NODE_VERSION
        value: "22"
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: JWT_REFRESH_SECRET
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SECRET_KEY
        sync: false
      - key: SUPABASE_BUCKET
        sync: false
      - key: RESEND_API_KEY
        sync: false
      - key: CORS_ORIGINS
        sync: false
      - key: RESEND_FROM_ADDRESS
        sync: false
```

---

## Bekannte Rest-Punkte (nicht deploy-blockierend)

- **Throttler & Proxy-IPs:** Der In-Memory-Rate-Limiter sieht hinter dem Proxy die
  Render/Vercel-IPs statt der Client-IPs. Betrifft nicht die Auth, kann aber Rate-Limits
  verzerren. Fix für später: `app.set('trust proxy', 1)` im Bootstrap.
- **Resend-Absender:** `RESEND_FROM_ADDRESS` hat einen Default. Kommen Passwort-Reset-Mails
  nicht an, in Resend eine verifizierte Absenderdomain hinterlegen und die Variable setzen.
- **Storage-Policies:** Der `service_role`-Key umgeht Supabase RLS; sollte der Dokument-Zugriff
  dennoch scheitern, die Bucket-Policies prüfen (Schritt 5.5 deckt das ab).
