/**
 * @fileoverview Unit tests for {@link InMemoryNoteRepository}.
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
  InMemoryNoteRepository,
  formatDeterministicId,
} from '../../../src/store/inMemoryNoteRepository.js';

/** @type {InMemoryNoteRepository} */
let repository;

beforeEach(() => {
  repository = new InMemoryNoteRepository();
});

describe('formatDeterministicId', () => {
  it('formats UUIDv4-style deterministic ids', () => {
    assert.equal(
      formatDeterministicId(1),
      '00000000-0000-4000-8000-000000000001',
    );
    assert.equal(
      formatDeterministicId(255),
      '00000000-0000-4000-8000-0000000000ff',
    );
  });

  it('rejects non-positive sequences', () => {
    assert.throws(() => formatDeterministicId(0), RangeError);
    assert.throws(() => formatDeterministicId(-1), RangeError);
  });
});

describe('InMemoryNoteRepository#create', () => {
  it('assigns deterministic UUIDv4-style ids in order', async () => {
    const first = await repository.create({
      title: 'First',
      body: 'Body one',
      tags: ['alpha'],
    });
    const second = await repository.create({
      title: 'Second',
      body: 'Body two',
    });

    assert.equal(first.id, '00000000-0000-4000-8000-000000000001');
    assert.equal(second.id, '00000000-0000-4000-8000-000000000002');
    assert.match(
      first.id,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    assert.deepEqual(first.tags, ['alpha']);
    assert.deepEqual(second.tags, []);
    assert.ok(first.createdAt);
    assert.equal(first.createdAt, first.updatedAt);
  });

  it('rejects invalid create payloads', async () => {
    await assert.rejects(() => repository.create(null), TypeError);
    await assert.rejects(
      () => repository.create({ title: 1, body: 'x' }),
      TypeError,
    );
    await assert.rejects(
      () => repository.create({ title: 't', body: 'b', tags: 'nope' }),
      TypeError,
    );
  });
});

describe('InMemoryNoteRepository#read', () => {
  it('returns an existing note', async () => {
    const created = await repository.create({
      title: 'Readable',
      body: 'Content',
      tags: ['read'],
    });

    const found = await repository.read(created.id);
    assert.deepEqual(found, created);
  });

  it('returns null for a missing id', async () => {
    const missing = await repository.read(
      '00000000-0000-4000-8000-000000000099',
    );
    assert.equal(missing, null);
  });
});

describe('InMemoryNoteRepository#update', () => {
  it('updates fields on an existing note', async () => {
    const created = await repository.create({
      title: 'Original',
      body: 'Original body',
      tags: ['old'],
    });

    const updated = await repository.update(created.id, {
      title: 'Revised',
      tags: ['new'],
    });

    assert.ok(updated);
    assert.equal(updated.title, 'Revised');
    assert.equal(updated.body, 'Original body');
    assert.deepEqual(updated.tags, ['new']);
    assert.equal(updated.createdAt, created.createdAt);
    assert.ok(updated.updatedAt >= created.updatedAt);

    const reread = await repository.read(created.id);
    assert.deepEqual(reread, updated);
  });

  it('returns null when updating a missing note', async () => {
    const result = await repository.update(
      '00000000-0000-4000-8000-000000000099',
      { title: 'Nope' },
    );
    assert.equal(result, null);
  });
});

describe('InMemoryNoteRepository#delete', () => {
  it('deletes an existing note', async () => {
    const created = await repository.create({
      title: 'Disposable',
      body: 'Remove me',
    });

    const deleted = await repository.delete(created.id);
    assert.equal(deleted, true);
    assert.equal(await repository.read(created.id), null);
  });

  it('returns false when deleting a missing note', async () => {
    const deleted = await repository.delete(
      '00000000-0000-4000-8000-000000000099',
    );
    assert.equal(deleted, false);
  });
});

describe('InMemoryNoteRepository#list', () => {
  it('returns an empty array for an empty store', async () => {
    assert.deepEqual(await repository.list(), []);
  });

  it('returns all notes in insertion order', async () => {
    const a = await repository.create({
      title: 'A',
      body: 'a',
      tags: ['shared', 'a'],
    });
    const b = await repository.create({
      title: 'B',
      body: 'b',
      tags: ['shared', 'b'],
    });

    const all = await repository.list();
    assert.deepEqual(
      all.map((note) => note.id),
      [a.id, b.id],
    );
  });

  it('filters notes by tag', async () => {
    await repository.create({ title: 'Work', body: 'w', tags: ['work'] });
    await repository.create({ title: 'Home', body: 'h', tags: ['home'] });
    const both = await repository.create({
      title: 'Both',
      body: 'bh',
      tags: ['work', 'home'],
    });

    const workNotes = await repository.list({ tag: 'work' });
    assert.equal(workNotes.length, 2);
    assert.ok(workNotes.every((note) => note.tags.includes('work')));
    assert.ok(workNotes.some((note) => note.id === both.id));

    const missingTag = await repository.list({ tag: 'missing' });
    assert.deepEqual(missingTag, []);
  });
});
