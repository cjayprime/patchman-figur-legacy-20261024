import Image from 'next/image';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState, useRef, useSyncExternalStore } from 'react';
import { projectStore } from '../lib/project-store';

export function ProjectsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const dialog = useRef<HTMLDialogElement>(null);
  const state = useSyncExternalStore(projectStore.subscribe, projectStore.getSnapshot, projectStore.getServerSnapshot);
  const router = useRouter();
  const onSelect = useCallback(
    async (id: string) => {
      if (!(await projectStore.flush())) {
        return;
      }
      onClose();
      await router.push(`/project/${encodeURIComponent(id)}`);
    },
    [onClose, router],
  );
  const onProjectClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => void onSelect(event.currentTarget.dataset.projectId || ''),
    [onSelect],
  );
  const onName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value), []);
  const onCreateMode = useCallback(() => setMode('create'), []);
  const onListMode = useCallback(() => setMode('list'), []);
  const onCreate = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const project = await projectStore.create(name);
      if (project) {
        onClose();
        await router.push(`/project/${encodeURIComponent(project.id)}`);
      }
    },
    [name, onClose, router],
  );
  const projects = useMemo(
    () =>
      state.projects.map((project) => (
        <button
          className="project-option"
          data-project-id={project.id}
          key={project.id}
          type="button"
          onClick={onProjectClick}
        >
          <span className="project-option-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M3 5h7l2 2h9v12H3V5m2 4v8h14V9H5Z" />
            </svg>
          </span>
          <span className="project-option-copy">
            <strong>{project.name}</strong>
            <small>UPDATED {new Date(project.updated_at).toLocaleDateString()}</small>
          </span>
          <span className="project-option-arrow" aria-hidden="true">
            ›
          </span>
        </button>
      )),
    [onProjectClick, state.projects],
  );

  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      setMode('list');
      setName('');
      void projectStore.load();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <dialog ref={dialog} className="project-dialog" onCancel={onClose} aria-labelledby="projects-title">
      <header className="project-dialog-heading">
        <div className="project-dialog-title">
          <Image src="/figur-mark.svg" alt="" width={44} height={44} />
          <div>
            <p className="project-eyebrow">YOUR CREATIVE WORK</p>
            <h2 id="projects-title">{mode === 'create' ? 'Create A Project' : 'Your Figur Projects'}</h2>
          </div>
        </div>
        <button className="project-close" type="button" onClick={onClose} aria-label="Close projects">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z"
            />
          </svg>
        </button>
      </header>

      {mode === 'create' ? (
        <form className="project-form" onSubmit={onCreate}>
          <div className="project-visual">
            <Image src="/figur-mark.svg" alt="" width={38} height={38} />
            <div>
              <strong>Give this portrait session a home.</strong>
              <p>Your edits stay organized and ready for the next creative pass.</p>
            </div>
          </div>
          <label htmlFor="project-name">Project Name</label>
          <input
            id="project-name"
            value={name}
            onChange={onName}
            placeholder="e.g. Midnight cover portrait"
            maxLength={255}
            autoFocus
          />
          {state.error && <p role="alert">{state.error}</p>}
          <div className="project-dialog-actions">
            <button className="project-secondary" type="button" onClick={onListMode}>
              BACK TO PROJECTS
            </button>
            <button className="project-create" type="submit" disabled={!name.trim() || state.isSubmitting}>
              {state.isSubmitting ? 'CREATING…' : 'CREATE & OPEN'}
            </button>
          </div>
        </form>
      ) : (
        <div className="project-browser">
          <div className="project-visual">
            <Image src="/figur-mark.svg" alt="" width={38} height={38} />
            <div>
              <strong>Return to a look or begin something new.</strong>
              <p>Each project keeps one portrait workflow focused and easy to find.</p>
            </div>
          </div>
          <button className="project-create" type="button" onClick={onCreateMode}>
            NEW PROJECT
          </button>
          {state.isLoading && <p role="status">Loading projects…</p>}
          {state.error && <p role="alert">{state.error}</p>}
          <div className="project-list">
            {projects.length ? projects : <p className="project-empty">No projects yet. Create your first look.</p>}
          </div>
          {state.nextCursor && (
            <button
              className="project-secondary"
              type="button"
              disabled={state.isLoadingMore}
              onClick={projectStore.loadMore}
            >
              {state.isLoadingMore ? 'LOADING PROJECTS...' : 'LOAD MORE PROJECTS'}
            </button>
          )}
        </div>
      )}
    </dialog>
  );
}
