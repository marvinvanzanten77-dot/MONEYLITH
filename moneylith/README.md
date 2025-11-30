# Moneylith

Moneylith is your personal finance command center: React/Tailwind on the frontend, Express + better-sqlite3 on the backend, and GPT-powered automation to analyse, categorise and surface patterns from your data. This README explains how to run and deploy the stack in both local and production setups.

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the API (Express + SQLite + GPT/OpenAI integration):

   ```bash
   npm start
   ```

3. In another terminal, start the Vite devserver for the React UI:

   ```bash
   npm run dev
   ```

4. Visit `http://localhost:5173` to interact with the latest dashboard, uploads, debts, settings and automation features. The React app talks to the API on `http://localhost:3001`, so keep both processes running during development.

## Building for production

1. Generate the TypeScript + Vite production bundle:

   ```bash
   npm run build
   ```

2. The Express server now automatically serves the `dist/` output if it exists; otherwise it falls back to the legacy `public/` directory.
3. To simulate the production experience locally:

   ```bash
   NODE_ENV=production npm start
   ```

4. The Vite build files live in `dist/` (hashed assets + `index.html`). Deploy that directory with the API so both UI and backend share the same port/host.

## Environment variables

Create a `.env` file (already tracked locally but ignored) with your OpenAI credentials:

```
OPENAI_API_KEY=JE_NIEUWE_SECRET_HIER
OPENAI_PROJECT_ID=proj_…
```

Never commit actual secrets; keep the file local on each host or use your deployment platform's secret storage.

## Backend highlights

- `server.mjs` exposes CSV/PDF upload endpoints, debt ingestion, GPT-powered pattern detection, automation toggles, budget checks and summary endpoints for the dashboard.
- New tables include `regels`, `vaste_lasten_groepen`, `schulden`, `uitgavepatronen` and `instellingen`. The automation flag `regels_automatisch_toepassen` determines whether new transactions get processed through the rule engine.
- Static serving now prefers the production `dist/` bundle but falls back to the legacy `public/` assets when `dist/` is absent.
- All upload routes respond with JSON even on error so the UI can show precise messages instead of hanging.

## Deployment checklist

1. Run `npm run build` to produce the frontend bundle.
2. Ensure `.env` on the host contains valid OpenAI credentials.
3. Start the server via `npm start` (it will serve both API and frontend).
4. Optionally add HTTPS, monitoring/alerting and a database backup strategy for SQLite.

## Suggested CI/CD (GitHub Actions)

Create a GitHub workflow that runs on push/pull request to build and lint the project, so you can catch regressions before deploying:

```yaml
name: CI

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v1
        with:
          version: 9
      - name: Install dependencies
        run: npm install
      - name: TypeScript build
        run: npm run build
      - name: Lint
        run: npm run lint
```

You can extend this workflow later with deployment steps that copy `dist/` to your host or invoke a container build.

## Monitoring & alerts

- Log upload failures, GPT errors or DB write issues in the backend (console is sufficient locally, but consider a log sink like Papertrail, Datadog or Sentry in production).  
- Track environment variables and key usage (OpenAI charges apply).  
- Notify via email/Slack when `/api/upload-transacties/csv` or `/api/upload-transacties/pdf` return errors so you can contact affected users.

## Future multi-user improvements

1. Add an `users` table and associate `transacties`, `schulden`, etc. with `user_id` so each person sees only their own data.  
2. Introduce authentication (session cookies/JWT) before serving protected API routes.  
3. Enforce per-user rate limits for GPT calls and uploads to avoid abuse.  
4. Provide role-based dashboards (admin vs personal dashboards) via extra columns or policies.

## Linting & tooling

- `npm run lint` runs ESLint across both JS/TS and React files.
- TypeScript configuration is defined in `tsconfig.app.json`, `tsconfig.node.json` and `tsconfig.json`.
- Tailwind lives in `tailwind.config.ts` and `postcss.config.cjs`.

Adjust the configuration as needed if you want stricter lint rules or additional plugins.
