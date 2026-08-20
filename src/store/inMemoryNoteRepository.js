/**
 * @fileoverview In-memory {@link NoteRepository} backed by a JavaScript `Map`.
 *
 * IDs are deterministic UUIDv4-style strings so higher layers and unit tests
 * observe stable, predictable behavior without external dependencies.
 */

/**
 * @typedef {import('./noteRepository.js').Note} Note
 * @typedef {import('./noteRepository.js').NoteCreateInput} NoteCreateInput
 * @typedef {import('./noteRepository.js').NoteUpdateInput} NoteUpdateInput
 * @typedef {import('./noteRepository.js').NoteFilter} NoteFilter
 */

/**
 * Builds a deterministic UUIDv4-style identifier from a monotonic counter.
 *
 * Format: `00000000-0000-4000-8000-xxxxxxxxxxxx` where the last segment is the
 * zero-padded hexadecimal representation of `sequence`.
 *
 * @param {number} sequence Positive integer sequence value (1-based).
 * @returns {string} Deterministic UUIDv4-style id.
 */
export function formatDeterministicId(sequence) {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new RangeError('sequence must be a positive integer');
  }

  const hex = sequence.toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${hex}`;
}

/**
 * @param {unknown} value
 * @param {string} field
 * @returns {string}
 */
function requireString(value, field) {
  if (typeof value !== 'string') {
    throw new TypeError(`${field} must be a string`);
  }
  return value;
}

/**
 * @param {unknown} tags
 * @returns {string[]}
 */
function normalizeTags(tags) {
  if (tags === undefined || tags === null) {
    return [];
  }
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) {
    throw new TypeError('tags must be an array of strings');
  }
  return [...tags];
}

/**
 * Concrete {@link NoteRepository} that stores notes in process memory.
 *
 * @implements {import('./noteRepository.js').NoteRepository}
 */
export class InMemoryNoteRepository {
  constructor() {
    /** @type {Map<string, Note>} */
    this._notes = new Map();
    /** @type {number} */
    this._sequence = 0;
  }

  /**
   * Persist a new note with the next deterministic id.
   *
   * @param {NoteCreateInput} note Note fields without an id.
   * @returns {Promise<Note>} The persisted note.
   */
  async create(note) {
    if (note === null || typeof note !== 'object' || Array.isArray(note)) {
      throw new TypeError('note must be an object');
    }

    const title = requireString(note.title, 'title');
    const body = requireString(note.body, 'body');
    const tags = normalizeTags(note.tags);
    const now = new Date().toISOString();

    this._sequence += 1;
    const id = formatDeterministicId(this._sequence);

    /** @type {Note} */
    const stored = {
      id,
      title,
      body,
      tags,
      createdAt: now,
      updatedAt: now,
    };

    this._notes.set(id, stored);
    return { ...stored, tags: [...stored.tags] };
  }

  /**
   * Load a single note by id.
   *
   * @param {string} id Note identifier.
   * @returns {Promise<Note|null>} The note when found; otherwise `null`.
   */
  async read(id) {
    requireString(id, 'id');
    const note = this._notes.get(id);
    if (!note) {
      return null;
    }
    return { ...note, tags: [...note.tags] };
  }

  /**
   * Apply a partial update to an existing note.
   *
   * @param {string} id Note identifier.
   * @param {NoteUpdateInput} note Fields to update.
   * @returns {Promise<Note|null>} The updated note, or `null` if missing.
   */
  async update(id, note) {
    requireString(id, 'id');
    if (note === null || typeof note !== 'object' || Array.isArray(note)) {
      throw new TypeError('note must be an object');
    }

    const existing = this._notes.get(id);
    if (!existing) {
      return null;
    }

    const title =
      note.title === undefined ? existing.title : requireString(note.title, 'title');
    const body =
      note.body === undefined ? existing.body : requireString(note.body, 'body');
    const tags =
      note.tags === undefined ? existing.tags : normalizeTags(note.tags);

    /** @type {Note} */
    const updated = {
      ...existing,
      title,
      body,
      tags,
      updatedAt: new Date().toISOString(),
    };

    this._notes.set(id, updated);
    return { ...updated, tags: [...updated.tags] };
  }

  /**
   * Remove a note by id.
   *
   * @param {string} id Note identifier.
   * @returns {Promise<boolean>} `true` when deleted; `false` when missing.
   */
  async delete(id) {
    requireString(id, 'id');
    return this._notes.delete(id);
  }

  /**
   * List notes, optionally filtered by a single tag.
   *
   * @param {NoteFilter} [filter] Optional filter; omit or `{}` for all notes.
   * @returns {Promise<Note[]>} Matching notes in insertion order.
   */
  async list(filter = {}) {
    if (filter === null || typeof filter !== 'object' || Array.isArray(filter)) {
      throw new TypeError('filter must be an object');
    }

    const tag = filter.tag;
    if (tag !== undefined) {
      requireString(tag, 'filter.tag');
    }

    /** @type {Note[]} */
    const results = [];
    for (const note of this._notes.values()) {
      if (tag === undefined || note.tags.includes(tag)) {
        results.push({ ...note, tags: [...note.tags] });
      }
    }
    return results;
  }
}

/** Shared repository instance for the service layer. */
export const noteRepository = new InMemoryNoteRepository();

export default noteRepository;
