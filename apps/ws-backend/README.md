# ws-backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

The websocket backend requires `JWT_SECRET` to be set to the same value used by
the HTTP backend. It will fail at startup if the variable is missing.

### WS backend endpoints
```text
- Join
- Online_Users
- Start_Game
- Submit_Answer
- Accept_Game
```