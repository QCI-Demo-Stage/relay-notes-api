# Relay Notes API

Lightweight Node.js 22 REST service for internal platform validation. Provides a sandbox notes API with a fast, deterministic install and test cycle.

> This is a sandbox project intended for internal platform validation and is not production-ready.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check stub — returns `{ "status": "ok" }` |

Additional endpoints will be documented here as they are added.

## Installation

Requires **Node.js 22+**.

```bash
npm install
```

For a deterministic CI-style install from the lockfile:

```bash
npm ci
```

## Testing

```bash
npm test
```

Runs the Node.js built-in `node:test` suite, including a smoke test that boots the app and verifies `/health` returns HTTP 200.

## Start

```bash
npm start
```

Starts the server on `PORT` (default `3000`).
