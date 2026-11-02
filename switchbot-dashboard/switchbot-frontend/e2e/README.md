# Frontend end-to-end tests

Run `npm run test:e2e` for the deterministic mocked API suite. Run
`npm run test:e2e:smoke` to build the production bundle and make a read-only
check against `https://snakeroom.fly.dev` (or `E2E_API_URL` when overridden).
The smoke suite only performs API reads; it does not refresh meters or request
a backup.
