# Locker Box landing page

Read `README.md` first: it's the user guide, reference, spec, architecture notes, current status,
next steps, decisions log and latest code review. Keep its "Status and next steps", "Decisions log" and
"Code review" sections current whenever you change something.

Quick rules:

- All business content lives in `src/data/business.ts`. Never invent facts (reviews, credentials,
  numbers, insurance). Blank = hidden on the site and listed by `npm run todo`.
- Don't advertise moving until Kevin's own USDOT/TxDMV numbers are in `credentials.licenses`
  (the deploy and decal enforce this). The old DOT 9994372 is his mother's company's; never use it.
- Node lives in `~/.local/node/bin`: start shell commands with `export PATH=~/.local/node/bin:$PATH`.
- After a change: `npm test` (all must pass) and look at the screenshots in `test-shots/`.
- Deploying (`npm run deploy`): Kevin's standing yes (2026-11-17) covers deploying and pushing changes he asked
  for or liked, without asking (see ~/.claude/CLAUDE.md). Deploy only after `npm test` exits 0 (don't chain
  `npm test | grep ... && npm run deploy`: grep succeeds on FAIL lines too). Never commit tokens; Cloudflare
  credentials live only in env vars.
- Freight brand: the name lives only in `src/data/freight.ts` (a test enforces it); rates in `freight.estimate`,
  driving miles in `src/data/routes.ts`. The estimate math exists twice (routes.ts and the inline scripts in
  PriceEstimate.astro / dedicated-routes.astro); a test compares all city pairs, so change both together.
- Commit as you go on `main`; push to `origin` (github.com/kevrkid/trades-landing, public: never commit secrets or private details).
