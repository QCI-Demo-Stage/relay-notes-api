/**
 * @fileoverview Contract for note persistence.
 *
 * Defines TypeScript-like JSDoc typedefs for notes and the `NoteRepository`
 * interface consumed by the service layer. Concrete stores (e.g.
 * {@link InMemoryNoteRepository}) implement this contract.
 */

/**
 * A persisted note entity.
 *
 * @typedef {Object} Note
 * @property {string} id Deterministic identifier (UUIDv4-style).
 * @property {string} title Short note title.
 * @property {string} body Note body text.
 * @property {string[]} tags Zero or more tags associated with the note.
 * @property {string} createdAt ISO-8601 creation timestamp.
 * @property {string} updatedAt ISO-8601 last-update timestamp.
 *
 * @example
 * const note = {
 *   id: '00000000-0000-4000-8000-000000000001',
 *   title: 'Ship checklist',
 *   body: 'Verify tests and docs before release.',
 *   tags: ['release', 'qa'],
 *   createdAt: '2026-01-15T10:00:00.000Z',
 *   updatedAt: '2026-01-15T10:00:00.000Z',
 * };
 */

/**
 * Input payload used to create a note. The repository assigns `id`,
 * `createdAt`, and `updatedAt`.
 *
 * @typedef {Object} NoteCreateInput
 * @property {string} title Short note title.
 * @property {string} body Note body text.
 * @property {string[]} [tags] Optional tags; defaults to an empty array.
 *
 * @example
 * const input = {
 *   title: 'Meeting notes',
 *   body: 'Discussed roadmap priorities.',
 *   tags: ['meeting'],
 * };
 */

/**
 * Partial payload used to update an existing note. Omitted fields are left
 * unchanged. The repository refreshes `updatedAt`.
 *
 * @typedef {Object} NoteUpdateInput
 * @property {string} [title] Updated title.
 * @property {string} [body] Updated body.
 * @property {string[]} [tags] Replaced tag list.
 *
 * @example
 * const patch = { title: 'Updated title', tags: ['meeting', 'follow-up'] };
 */

/**
 * Optional filter criteria for listing notes.
 *
 * @typedef {Object} NoteFilter
 * @property {string} [tag] When set, only notes that include this tag are returned.
 *
 * @example
 * const filter = { tag: 'release' };
 */

/**
 * Repository contract for note CRUD and filtered listing.
 *
 * All methods return Promises so callers can treat in-memory and future
 * persistent stores uniformly.
 *
 * @interface NoteRepository
 *
 * @example
 * // Typical service-layer usage
 * const created = await noteRepository.create({
 *   title: 'Idea',
 *   body: 'Capture a new product idea.',
 *   tags: ['product'],
 * });
 * const found = await noteRepository.read(created.id);
 * const updated = await noteRepository.update(created.id, { title: 'Product idea' });
 * const tagged = await noteRepository.list({ tag: 'product' });
 * const removed = await noteRepository.delete(created.id);
 */
/**
 * Persist a new note and return the stored entity (including generated `id`).
 *
 * @function
 * @name NoteRepository#create
 * @param {NoteCreateInput} note Note fields without an id.
 * @returns {Promise<Note>} The persisted note with assigned id and timestamps.
 *
 * @example
 * const note = await repository.create({
 *   title: 'Draft',
 *   body: 'First version',
 *   tags: ['wip'],
 * });
 * // note.id === '00000000-0000-4000-8000-000000000001'
 */

/**
 * Load a single note by id.
 *
 * @function
 * @name NoteRepository#read
 * @param {string} id Note identifier.
 * @returns {Promise<Note|null>} The note when found; otherwise `null`.
 *
 * @example
 * const note = await repository.read('00000000-0000-4000-8000-000000000001');
 * if (!note) {
 *   // handle missing note
 * }
 */

/**
 * Apply a partial update to an existing note.
 *
 * @function
 * @name NoteRepository#update
 * @param {string} id Note identifier.
 * @param {NoteUpdateInput} note Fields to update.
 * @returns {Promise<Note|null>} The updated note, or `null` if the id is unknown.
 *
 * @example
 * const updated = await repository.update(id, { body: 'Revised body' });
 */

/**
 * Remove a note by id.
 *
 * @function
 * @name NoteRepository#delete
 * @param {string} id Note identifier.
 * @returns {Promise<boolean>} `true` when a note was deleted; `false` when missing.
 *
 * @example
 * const deleted = await repository.delete(id);
 */

/**
 * List notes, optionally filtered by tag.
 *
 * @function
 * @name NoteRepository#list
 * @param {NoteFilter} [filter] Optional filter; omit or pass `{}` for all notes.
 * @returns {Promise<Note[]>} Matching notes in insertion order.
 *
 * @example
 * const all = await repository.list();
 * const releaseNotes = await repository.list({ tag: 'release' });
 */

export {};
