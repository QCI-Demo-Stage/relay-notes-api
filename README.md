# Relay Notes API

Lightweight, deterministic Node.js 22 REST service for internal platform validation.

## Architecture

Layered layout (routes → service → store) with central error middleware:

| Path | Role |
|------|------|
| `src/app.js` | Express app factory; mounts middleware after routes |
| `src/middleware/errorHandler.js` | Maps domain `err.status` to JSON `{ error, message }` |
| `src/service/noteService.js` | Validation, CRUD orchestration, `ValidationError` / `NotFoundError` |
| `src/store/noteRepository.js` | JSDoc `NoteRepository` contract (`create`, `read`, `update`, `delete`, `list`) |
| `src/store/inMemoryNoteRepository.js` | Map-backed implementation with deterministic UUIDv4-style IDs |

### Service validation

- **Create**: `title` and note content (`body` or `content`) required non-empty strings; `tags` optional array of strings.
- **Update**: same field rules for any provided fields; unknown ids → `NotFoundError` (404).
- **Get / delete**: missing ids → `NotFoundError` (404).

Notes are keyed by deterministic IDs of the form `00000000-0000-4000-8000-<hex sequence>`.

## Scripts

```bash
npm install
npm test   # node:test unit suite (repository + service)
```

## Requirements

- Node.js >= 22
- Express 4
