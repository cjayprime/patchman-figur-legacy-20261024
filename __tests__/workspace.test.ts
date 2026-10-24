import assert from 'node:assert/strict';
import { test } from 'node:test';
import { portraitDocument } from '../lib/editor-document';
import type { PortraitDocument } from '../lib/editor-document';
import { ControlPointStore } from '../src/controlPoints';
import { projectStore } from '../lib/project-store';

const DOCUMENT: PortraitDocument = {
  camera: { centerX: 0.5, centerY: 0.5, zoom: 1 },
  debug: { segModel: 'multiclass', showContour: false, showMatte: false, showPose: false },
  options: {
    alpha: 1.2,
    localize: true,
    radius: 0,
    showControlPoints: true,
    showOriginal: false,
    showWireframe: false,
  },
  points: [],
  selectedPoint: null,
  sliders: { bbl: 0, bust: 0, ceiling: 100, hips: 0, waist: 0 },
  source: null,
  version: 1,
  view: { split: false, splitRatio: 0.5 },
};
test('portrait snapshots validate source bounds, controls, point identity and camera', () => {
  assert.deepEqual(portraitDocument(DOCUMENT), DOCUMENT);
  for (const patch of [
    { version: 2 },
    { source: { data: 'https://outside.example/private.png', width: 10, height: 10, testPattern: false } },
    { source: { data: 'data:image/png;base64,AAAA', width: 4096, height: 4096, testPattern: false } },
    { points: [{ anchor: false, id: 1, ox: 1, oy: 1, tx: 1, ty: 1 }] },
    { sliders: { ...DOCUMENT.sliders, waist: 101 } },
    { camera: { centerX: Infinity, centerY: 0, zoom: 1 } },
  ]) {
    assert.throws(() => portraitDocument({ ...DOCUMENT, ...patch }));
  }
  const points = new ControlPointStore();
  points.replace([{ anchor: false, id: 8, ox: 1, oy: 2, tx: 4, ty: 5 }], 8);
  assert.equal(points.add(10, 20, false)?.id, 9);
});

test('autosave serializes concurrent edits, preserves conflicts, and pages without duplicate IDs', async () => {
  const original = globalThis.fetch;
  let stored = {
    active_tool: 'photo',
    id: '9007199254740993',
    name: 'Portrait',
    revision: 0,
    state: { version: 1, portrait: DOCUMENT },
    updated_at: '2026-10-21T00:00:00Z',
  };
  let release: (() => void) | undefined;
  let inFlight: Promise<void> | undefined;
  let fail = false;
  let saves = 0;
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith('/api/projects?')) {
      return Response.json({
        status: true,
        data: {
          projects: [
            { id: stored.id, name: stored.name },
            { id: '9007199254740992', name: 'Earlier' },
          ],
          nextCursor: null,
        },
      });
    }
    if (String(url) === '/api/projects') {
      return Response.json({
        status: true,
        data: { projects: [{ id: stored.id, name: stored.name }], nextCursor: stored.id },
      });
    }
    if (init?.method === 'PATCH') {
      saves++;
      const input = JSON.parse(String(init.body));
      if (inFlight) {
        await inFlight;
      }
      if (fail) {
        return Response.json({ status: false, message: 'This project changed in another window.' }, { status: 409 });
      }
      assert.equal(input.expectedRevision, stored.revision);
      stored = { ...stored, ...input, revision: stored.revision + 1 };
    }
    return Response.json({ status: true, data: { project: structuredClone(stored) } });
  };
  try {
    await projectStore.open(stored.id);
    projectStore.change({ ...DOCUMENT, sliders: { ...DOCUMENT.sliders, waist: 12 } });
    inFlight = new Promise<void>((resolve) => {
      release = resolve;
    });
    const saving = projectStore.flush();
    projectStore.change({ ...DOCUMENT, sliders: { ...DOCUMENT.sliders, waist: 24 } });
    release!();
    inFlight = undefined;
    assert(await saving);
    assert.equal(saves, 2);
    assert.equal(projectStore.getSnapshot().project?.revision, 2);
    assert.equal(projectStore.getSnapshot().project?.state.portrait?.sliders.waist, 24);
    assert.equal(projectStore.getSnapshot().dirty, false);
    fail = true;
    projectStore.selectTool('compare');
    assert.equal(await projectStore.flush(), false);
    assert.equal(projectStore.getSnapshot().dirty, true);
    assert.match(projectStore.getSnapshot().error || '', /another window/);
    fail = false;
    assert(await projectStore.flush());
    await projectStore.load();
    await projectStore.loadMore();
    assert.equal(projectStore.getSnapshot().projects.length, 2);
    assert.equal(projectStore.getSnapshot().nextCursor, null);
    await projectStore.open();
  } finally {
    globalThis.fetch = original;
  }
});
