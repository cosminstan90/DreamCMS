# Pre-Launch Checklist (Multisite)

## Automat
Ruleaza validatorul end-to-end pentru domeniile publice:

```bash
npm run prelaunch:check
```

### Variabile utile
- `PRELAUNCH_TARGETS` - lista domeniilor separate prin virgula.
- `PRELAUNCH_REQUEST_BASE` - optional, pentru validare pe staging/local cu host override.
- `PRELAUNCH_TIMEOUT_MS` - timeout per request.

Exemplu local cu host mapping:

```bash
PRELAUNCH_TARGETS="https://pagani.ro,https://numarangelic.ro" PRELAUNCH_REQUEST_BASE="http://127.0.0.1:3001" npm run prelaunch:check
```

## Verificari acoperite
- Site resolver (`/api/sites/current`)
- Homepage route (`/`)
- Dictionary route (din `dictionaryPath`)
- Auth guard (`/admin/dashboard` -> redirect `/login`)
- `robots.txt`
- `sitemap.xml`
- `feed.xml`
- Sample article din sitemap: canonical + JSON-LD + H1
- Sample symbol din sitemap: breadcrumb context + H1
- `/api/health`

## Checklist manual (obligatoriu)
- Search Console pentru ambele domenii + submit sitemap
- Confirmare analytics/ads doar in productie
- Confirmare affiliate tracking + disclosure
- Backup manual + restore test pe staging
- Verificare secrete productie (`NEXTAUTH_SECRET`, `CMS_PUBLISHER_TOKEN`, `BREVO_API_KEY`)
- Lighthouse homepage/article/symbol pentru ambele domenii

