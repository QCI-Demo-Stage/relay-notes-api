/**
 * @fileoverview Note business-logic layer.
 *
 * Validates payloads, maps domain failures to {@link ValidationError} /
 * {@link NotFoundError}, and delegates persistence to a {@link NoteRepository}.
 */

/**
 * @typedef {import('../store/noteRepository.js').Note} Note
 * @typedef {import('../store/noteRepository.js').NoteCreateInput} NoteCreateInput
 * @typedef {import('../store/noteRepository.js').NoteUpdateInput} NoteUpdateInput
 * @typedef {import('../store/noteRepository.js').NoteFilter} NoteFilter
 * @typedef {import('../store/noteRepository.js').NoteRepository} NoteRepository
 */

import { noteRepository as defaultRepository } from '../store/inMemoryNoteRepository.js';

/**
 * Thrown when a note payload fails validation.
 * Mapped to HTTP 400 by the central error middleware.
 */
export class ValidationError extends Error {
  /**
   * @param {string} message Human-readable validation failure.
   */
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    /** @type {number} */
    this.status = 400;
  }
}

/**
 * Thrown when a requested note id does not exist.
 * Mapped to HTTP 404 by the central error middleware.
 */
export class NotFoundError extends Error {
  /**
   * @param {string} [message='Note not found'] Human-readable not-found message.
   */
  constructor(message = 'Note not found') {
    super(message);
    this.name = 'NotFoundError';
    /** @type {number} */
    this.status = 404;
  }
}

/**
 * @param {unknown} data
 * @returns {asserts data is Record<string, unknown>}
 */
function assertObjectPayload(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError('Note payload must be an object');
  }
}

/**
 * Resolve note body/content from a payload.
 * Accepts `body` (repository field) or `content` (API synonym).
 *
 * @param {Record<string, unknown>} data
 * @returns {unknown}
 */
function resolveContent(data) {
  if (data.body !== undefined) {
    return data.body;
  }
  return data.content;
}

/**
 * @param {unknown} tags
 */
function assertTags(tags) {
  if (tags === undefined) {
    return;
  }
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) {
    throw new ValidationError('tags must be an array of strings');
  }
}

/**
 * Validate a create payload: title and content/body required; tags optional.
 *
 * @param {unknown} data
 * @returns {{ title: string, body: string, tags?: string[] }}
 */
function validateCreateInput(data) {
  assertObjectPayload(data);

  const { title } = data;
  const content = resolveContent(data);

  if (typeof title !== 'string' || title.trim() === '') {
    throw new ValidationError('title is required');
  }
  if (typeof content !== 'string' || content.trim() === '') {
    throw new ValidationError('content is required');
  }

  assertTags(data.tags);

  /** @type {{ title: string, body: string, tags?: string[] }} */
  const input = { title, body: content };
  if (data.tags !== undefined) {
    input.tags = /** @type {string[]} */ (data.tags);
  }
  return input;
}

/**
 * Validate a partial update payload.
 *
 * @param {unknown} data
 * @returns {NoteUpdateInput}
 */
function validateUpdateInput(data) {
  assertObjectPayload(data);

  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim() === '') {
      throw new ValidationError('title must be a non-empty string');
    }
  }

  const hasBody = data.body !== undefined;
  const hasContent = data.content !== undefined;
  if (hasBody || hasContent) {
    const content = resolveContent(data);
    if (typeof content !== 'string' || content.trim() === '') {
      throw new ValidationError('content must be a non-empty string');
    }
  }

  assertTags(data.tags);

  /** @type {NoteUpdateInput} */
  const patch = {};
  if (data.title !== undefined) {
    patch.title = /** @type {string} */ (data.title);
  }
  if (hasBody || hasContent) {
    patch.body = /** @type {string} */ (resolveContent(data));
  }
  if (data.tags !== undefined) {
    patch.tags = /** @type {string[]} */ (data.tags);
  }
  return patch;
}

/**
 * Build a note service bound to the given repository.
 *
 * @param {NoteRepository} [repository=defaultRepository]
 * @returns {{
 *   create: (data: unknown) => Promise<Note>,
 *   get: (id: string) => Promise<Note>,
 *   update: (id: string, data: unknown) => Promise<Note>,
 *   delete: (id: string) => Promise<boolean>,
 *   list: (filter?: NoteFilter) => Promise<Note[]>,
 * }}
 */
export function createNoteService(repository = defaultRepository) {
  return {
    /**
     * Create a note after validating the payload.
     *
     * @param {unknown} data Create payload (`title`, `body`|`content`, optional `tags`).
     * @returns {Promise<Note>}
     */
    async create(data) {
      const input = validateCreateInput(data);
      return repository.create(input);
    },

    /**
     * Load a note by id or throw {@link NotFoundError}.
     *
     * @param {string} id
     * @returns {Promise<Note>}
     */
    async get(id) {
      const note = await repository.read(id);
      if (!note) {
        throw new NotFoundError(`Note not found: ${id}`);
      }
      return note;
    },

    /**
     * Update a note after validating the patch; throw when missing.
     *
     * @param {string} id
     * @param {unknown} data
     * @returns {Promise<Note>}
     */
    async update(id, data) {
      const patch = validateUpdateInput(data);
      const note = await repository.update(id, patch);
      if (!note) {
        throw new NotFoundError(`Note not found: ${id}`);
      }
      return note;
    },

    /**
     * Delete a note by id or throw {@link NotFoundError}.
     *
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async delete(id) {
      const deleted = await repository.delete(id);
      if (!deleted) {
        throw new NotFoundError(`Note not found: ${id}`);
      }
      return true;
    },

    /**
     * List notes, optionally filtered by tag.
     *
     * @param {NoteFilter} [filter]
     * @returns {Promise<Note[]>}
     */
    async list(filter) {
      return repository.list(filter);
    },
  };
}

/** Default service instance using the shared in-memory repository. */
const defaultService = createNoteService();

/** @type {typeof defaultService.create} */
export const create = (data) => defaultService.create(data);

/** @type {typeof defaultService.get} */
export const get = (id) => defaultService.get(id);

/** @type {typeof defaultService.update} */
export const update = (id, data) => defaultService.update(id, data);

/** @type {typeof defaultService.delete} */
export const remove = (id) => defaultService.delete(id);

/** @type {typeof defaultService.list} */
export const list = (filter) => defaultService.list(filter);

export default defaultService;
