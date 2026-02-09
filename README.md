# Potentia Ludi — Conversational Web3 Wallet Hub

A conversational Web3 wallet hub that translates natural language into typed intents (balances, swaps, bridges, claims) and safely executes them through a Planner → Executor pipeline:
Parse → Preflight (balances/allowances, quote, simulate) → Preview (human-readable risk checks) → Build (Permit2/approve + action) → Wallet.

This project focuses on non-custodial UX, SIWE authentication, and opt-in telemetry for analytics.

Status
------
- Backend skeleton implemented: SIWE routes, intent parsing, pipeline executor (preflight + preview), PostgreSQL schema, telemetry, and unit tests for intent parsing.
- Provider integrations (Alchemy, 0x, Tenderly, LI.FI) are scaffolded or mocked; provide API keys in .env for full E2E behavior.

Quickstart (local)
------------------
1. Clone

```bash
git clone https://github.com/elove333/https-github.com-elove333-potentia-ludi.git
cd https-github.com-elove333-potentia-ludi
```

2. Create a branch (optional)

```bash
git checkout -b my-dev-branch
```

3. Install

```bash
npm install
```

4. Configure

```bash
cp .env.example .env
# Edit .env and set DATABASE_URL and any external API keys you plan to use.
```

5. Database

```bash
createdb potentia_ludi
psql -d potentia_ludi -f database/schema.sql
# Or run the npm helper script:
# npm run db:setup
```

6. Run API

```bash
npm run api:dev
```

- Health: http://localhost:3001/health
- SIWE endpoints: /api/siwe/*
- Intent endpoints: /api/intents/*

7. Run tests

```bash
npm test
```

Environment variables
---------------------
Minimum for local testing (see .env.example):

- DATABASE_URL — Postgres connection string
- PORT — API port (default 3001)
- FRONTEND_URL — Frontend origin for CORS
- SESSION_SECRET — cookie signing secret

Optional (for full features):

- ALCHEMY_API_KEY, MORALIS_API_KEY — read layer (balances, NFTs)
- OX_API_KEY — 0x swap quotes and permit2 flow
- TENDERLY_ACCESS_KEY — transaction simulation
- BLOCKNATIVE_API_KEY — gas advisories
- NEXT_PUBLIC_WC_PROJECT_ID — WalletConnect v2 (frontend)

Project layout
--------------
- api/: Backend TypeScript code (routes, services, lib)
  - api/lib: DB helpers and auth utilities (SIWE)
  - api/services: intentParser, pipelineExecutor (preflight/preview/build)
  - api/routes: HTTP route handlers
- database/: schema.sql and DB docs
- src/types/: TypeScript intent and pipeline type definitions
- tests/: unit tests (intent parser)
- PLANNER_EXECUTOR_GUIDE.md, IMPLEMENTATION_SUMMARY.md: architecture and implementation documentation

Key features
------------
- SIWE (EIP-4361) authentication and session management
- NL → Intent parser (balances.get, trade.swap, bridge.transfer, rewards.claim)
- Preflight checks: balances, allowances, quotes, simulation
- Preview: decoded calls, token deltas, gas estimates, slippage, revert reasons
- Build: Permit2 preferred; bounded allowance fallback
- Telemetry and funnel events (opt-in)
- Safety: spend limits, allowlists, stale-quote protection, gas advisories

Development notes
-----------------
- TypeScript projects: API builds with `tsc -p tsconfig.api.json`.
- Start the API during development with `npm run api:dev`.
- For formatting, use Prettier if configured: `npx prettier --write "api/**/*.ts" "src/**/*.ts" "tests/**/*.ts"`.

Testing
-------
- Unit tests: `npm test`
- Type check: `npx tsc -p tsconfig.api.json`

Security &amp; privacy
------------------
- Non-custodial: no private keys are stored server-side. All signing is client-side.
- Analytics opt-in: telemetry is stored only for users who opt-in; only pseudonymous IDs are retained.
- Redaction: raw signatures and private wallet data are not persisted.
- Data retention: telemetry rows are pruned (90 days); keep aggregated rollups as needed.

Troubleshooting
---------------
- DB connection issues: ensure `DATABASE_URL` is correct and Postgres is running.
- Port conflicts: change `PORT` in .env if necessary.
- Missing API keys: many integrations are mocked without keys; add keys to enable full functionality.

Contributing
------------
- Follow TypeScript strict mode, add tests for new features, and update PLANNER_EXECUTOR_GUIDE.md when making architectural changes.
- Open pull requests against `main` or the feature branch you are working on. Include a clear description and tests when applicable.

License
-------
MIT
