# Relay Notes API

Lightweight, deterministic Node.js 22 REST service for internal platform validation.

## Architecture

Layered layout (routes → service → store). This branch introduces the store foundation:

| Path | Role |
|------|------|
| `src/store/noteRepository.js` | JSDoc `NoteRepository` contract (`create`, `read`, `update`, `delete`, `list`) |
| `src/store/inMemoryNoteRepository.js` | Map-backed implementation with deterministic UUIDv4-style IDs |

Notes are keyed by deterministic IDs of the form `00000000-0000-4000-8000-<hex sequence>`. `list` supports optional `{ tag }` filtering.

## Scripts

```bash
npm test   # node:test unit suite
```

## Requirements

- Node.js >= 22
