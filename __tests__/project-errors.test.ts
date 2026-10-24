import assert from 'node:assert/strict';
import { test } from 'node:test';
import { projectStore } from '../lib/project-store';

test('project errors identify the failed action and retain edits after an expired session', async () => {
  const originalFetch = globalThis.fetch;
  const signIn = 'Click the profile icon at the top right to sign in, then try again.';
  let status = 401;
  let message = 'Old server message';
  const project = {
    active_tool: 'photo',
    id: '9007199254740993',
    name: 'Portrait',
    revision: 1,
    state: { version: 1 },
    updated_at: '2026-10-24T00:00:00Z',
  };
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ data: { project }, message, status: status === 200 }), {
      headers: { 'Content-Type': 'application/json' },
      status,
    });
  try {
    await projectStore.load();
    assert.equal(projectStore.getSnapshot().error, signIn);
    assert.equal(projectStore.getSnapshot().errorAction, 'load');
    await projectStore.create('New portrait');
    assert.equal(projectStore.getSnapshot().errorAction, 'create');
    assert.equal(projectStore.getSnapshot().error, signIn);

    status = 403;
    message = 'You do not have access to this project.';
    await projectStore.load();
    assert.equal(projectStore.getSnapshot().error, message);
    assert.equal(projectStore.getSnapshot().errorAction, 'load');

    status = 200;
    await projectStore.open(project.id);
    projectStore.selectTool('shape');
    status = 401;
    assert.equal(await projectStore.flush(), false);
    assert.equal(projectStore.getSnapshot().project?.id, project.id);
    assert.equal(projectStore.getSnapshot().project?.active_tool, 'shape');
    assert.equal(projectStore.getSnapshot().dirty, true);
    assert.equal(projectStore.getSnapshot().errorAction, 'save');
    assert.equal(projectStore.getSnapshot().error, signIn);
  } finally {
    globalThis.fetch = originalFetch;
    projectStore.clearError();
  }
});
