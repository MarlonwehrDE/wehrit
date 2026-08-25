# Wehrit

Komplett neu gebautes Astro-Projekt (kein WordPress). Statisch, schnell, ohne Datenbank.

## Befehle

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Deployment

Siehe `.github/workflows/deploy.yml` (automatisch bei Push auf main) und
`scripts/deploy-manual.sh` (manuell per rsync).

Ziel auf dem Server: `/srv/websites/wehrit/dist/`

GitHub Secrets fuer den Workflow: VPS_HOST, VPS_USER, VPS_SSH_KEY
