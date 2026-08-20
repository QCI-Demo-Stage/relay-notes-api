/**
 * @fileoverview Unit tests for the note service layer.
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { InMemoryNoteRepository } from '../../../src/store/inMemoryNoteRepository.js';
import {
  NotFoundError,
  ValidationError,
  createNoteService,
} from '../../../src/service/noteService.js';

/** @type {ReturnType<typeof createNoteService>} */
let service;

beforeEach(() => {
  service = createNoteService(new InMemoryNoteRepository());
});

describe('noteService.create', () => {
  it('creates a note with a deterministic id for valid data', async () => {
    const note = await service.create({
      title: 'Ship checklist',
      body: 'Verify tests and docs.',
      tags: ['release'],
    });

    assert.equal(note.id, '00000000-0000-4000-8000-000000000001');
    assert.equal(note.title, 'Ship checklist');
    assert.equal(note.body, 'Verify tests and docs.');
    assert.deepEqual(note.tags, ['release']);
    assert.ok(note.createdAt);
    assert.equal(note.createdAt, note.updatedAt);
  });

  it('accepts content as a synonym for body', async () => {
    const note = await service.create({
      title: 'Via content',
      content: 'Payload used content field',
    });

    assert.equal(note.id, '00000000-0000-4000-8000-000000000001');
    assert.equal(note.body, 'Payload used content field');
    assert.deepEqual(note.tags, []);
  });

  it('throws ValidationError when title is missing', async () => {
    await assert.rejects(
      () => service.create({ body: 'Has body only' }),
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.equal(err.name, 'ValidationError');
        assert.equal(err.status, 400);
        assert.match(err.message, /title/i);
        return true;
      },
    );
  });

  it('throws ValidationError when content/body is missing', async () => {
    await assert.rejects(
      () => service.create({ title: 'Has title only' }),
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.equal(err.status, 400);
        assert.match(err.message, /content/i);
        return true;
      },
    );
  });

  it('throws ValidationError when tags are not an array of strings', async () => {
    await assert.rejects(
      () =>
        service.create({
          title: 'Bad tags',
          body: 'Body',
          tags: 'not-an-array',
        }),
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.equal(err.status, 400);
        assert.match(err.message, /tags/i);
        return true;
      },
    );

    await assert.rejects(
      () =>
        service.create({
          title: 'Bad tags',
          body: 'Body',
          tags: [1, 2],
        }),
      ValidationError,
    );
  });

  it('throws ValidationError for non-object payloads', async () => {
    await assert.rejects(() => service.create(null), ValidationError);
    await assert.rejects(() => service.create('note'), ValidationError);
  });
});

describe('noteService.get', () => {
  it('returns an existing note', async () => {
    const created = await service.create({
      title: 'Readable',
      body: 'Content',
    });

    const found = await service.get(created.id);
    assert.deepEqual(found, created);
  });

  it('throws NotFoundError for an unknown id', async () => {
    await assert.rejects(
      () => service.get('00000000-0000-4000-8000-000000000099'),
      (err) => {
        assert.ok(err instanceof NotFoundError);
        assert.equal(err.name, 'NotFoundError');
        assert.equal(err.status, 404);
        return true;
      },
    );
  });
});

describe('noteService.update', () => {
  it('updates an existing note', async () => {
    const created = await service.create({
      title: 'Original',
      body: 'Original body',
      tags: ['old'],
    });

    const updated = await service.update(created.id, {
      title: 'Revised',
      tags: ['new'],
    });

    assert.equal(updated.title, 'Revised');
    assert.equal(updated.body, 'Original body');
    assert.deepEqual(updated.tags, ['new']);
    assert.equal(updated.createdAt, created.createdAt);
  });

  it('throws ValidationError for invalid update input', async () => {
    const created = await service.create({
      title: 'Valid',
      body: 'Body',
    });

    await assert.rejects(
      () => service.update(created.id, { title: '' }),
      ValidationError,
    );
    await assert.rejects(
      () => service.update(created.id, { content: '' }),
      ValidationError,
    );
    await assert.rejects(
      () => service.update(created.id, { tags: [42] }),
      ValidationError,
    );
    await assert.rejects(
      () => service.update(created.id, null),
      ValidationError,
    );
  });

  it('throws NotFoundError when updating a missing id', async () => {
    await assert.rejects(
      () =>
        service.update('00000000-0000-4000-8000-000000000099', {
          title: 'Nope',
        }),
      (err) => {
        assert.ok(err instanceof NotFoundError);
        assert.equal(err.status, 404);
        return true;
      },
    );
  });
});

describe('noteService.delete', () => {
  it('deletes an existing note', async () => {
    const created = await service.create({
      title: 'Disposable',
      body: 'Remove me',
    });

    const result = await service.delete(created.id);
    assert.equal(result, true);

    await assert.rejects(() => service.get(created.id), NotFoundError);
  });

  it('throws NotFoundError when deleting a missing id', async () => {
    await assert.rejects(
      () => service.delete('00000000-0000-4000-8000-000000000099'),
      (err) => {
        assert.ok(err instanceof NotFoundError);
        assert.equal(err.status, 404);
        return true;
      },
    );
  });
});

describe('noteService.list', () => {
  it('lists notes and supports tag filtering', async () => {
    await service.create({ title: 'A', body: 'a', tags: ['work'] });
    await service.create({ title: 'B', body: 'b', tags: ['home'] });

    const all = await service.list();
    assert.equal(all.length, 2);

    const work = await service.list({ tag: 'work' });
    assert.equal(work.length, 1);
    assert.equal(work[0].title, 'A');
  });
});

describe('domain error status mapping', () => {
  it('exposes status 400 on ValidationError and 404 on NotFoundError', () => {
    const validation = new ValidationError('bad');
    const missing = new NotFoundError('gone');

    assert.equal(validation.status, 400);
    assert.equal(validation.name, 'ValidationError');
    assert.equal(missing.status, 404);
    assert.equal(missing.name, 'NotFoundError');
  });
});
