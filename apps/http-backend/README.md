# http-backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

### http-backend API Design
```text
- /api/v1/auth/register
- /api/v1/auth/login
- /api/v1/auth/me
    - ratings
    - games
- /api/v1/game/:gameId (get)
```