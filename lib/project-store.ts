import { portraitDocument } from './editor-document';
import type { PortraitDocument } from './editor-document';

export interface ProjectSummary {
  id: string;
  name: string;
  updated_at: string;
}
export interface EditorProject extends ProjectSummary {
  revision: number;
  active_tool: string;
  state: { version: 1; portrait?: PortraitDocument; [key: string]: unknown };
}
interface ProjectState {
  projects: ProjectSummary[];
  project: EditorProject | null;
  nextCursor: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  isSubmitting: boolean;
  isSaving: boolean;
  dirty: boolean;
  error: string | null;
  errorAction: 'load' | 'create' | 'open' | 'save' | null;
}
const INITIAL: ProjectState = {
  dirty: false,
  error: null,
  errorAction: null,
  isLoading: false,
  isLoadingMore: false,
  isSaving: false,
  isSubmitting: false,
  nextCursor: null,
  project: null,
  projects: [],
};
async function request<T>(path: string, method = 'GET', input?: unknown): Promise<T> {
  const response = await fetch(path, {
    cache: 'no-store',
    credentials: 'same-origin',
    method,
    ...(input === undefined ? {} : { body: JSON.stringify(input), headers: { 'Content-Type': 'application/json' } }),
  });
  if (response.status === 401) {
    throw new Error('Click the profile icon at the top right to sign in, then try again.');
  }
  let body: { data: T; message?: string; status: boolean };
  try {
    body = await response.json();
  } catch {
    throw new Error('Figur received an invalid response. Keep your work open and try again.');
  }
  if (!response.ok || !body.status) {
    throw new Error(body.message || 'Your project could not be saved. Keep this window open and try again.');
  }
  return body.data;
}
class ProjectStore {
  private state = INITIAL;
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private saving: Promise<boolean> | null = null;
  private changes = 0;
  private opening = 0;
  readonly getSnapshot = () => this.state;
  readonly getServerSnapshot = () => INITIAL;
  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private set(patch: Partial<ProjectState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  readonly fail = (message: string, errorAction: ProjectState['errorAction'] = null) =>
    this.set({ error: message, errorAction });
  readonly clearError = () => this.set({ error: null, errorAction: null });
  readonly load = async (more = false) => {
    if (this.state.isLoading || this.state.isLoadingMore || (more && !this.state.nextCursor)) {
      return;
    }
    this.set({ error: null, ...(more ? { isLoadingMore: true } : { isLoading: true }) });
    try {
      const data = await request<{ projects: ProjectSummary[]; nextCursor: string | null }>(
        `/api/projects${more ? `?before=${this.state.nextCursor}` : ''}`,
      );
      this.set({
        nextCursor: data.nextCursor,
        projects: more
          ? [
              ...this.state.projects,
              ...data.projects.filter((row) => !this.state.projects.some((old) => old.id === row.id)),
            ]
          : data.projects,
      });
    } catch (error) {
      this.fail(error instanceof Error ? error.message : 'Projects could not be loaded.', 'load');
    } finally {
      this.set({ isLoading: false, isLoadingMore: false });
    }
  };
  readonly loadMore = () => this.load(true);
  readonly create = async (name: string) => {
    if (!(await this.flush())) {
      return null;
    }
    this.set({ error: null, isSubmitting: true });
    try {
      const data = await request<{ project: EditorProject }>('/api/projects', 'POST', { name });
      return data.project;
    } catch (error) {
      this.fail(error instanceof Error ? error.message : 'Project could not be created.', 'create');
      return null;
    } finally {
      this.set({ isSubmitting: false });
    }
  };
  readonly open = async (id?: string) => {
    const token = ++this.opening;
    if (!(await this.flush())) {
      throw new Error('Save or resolve your current project before opening another.');
    }
    if (token !== this.opening) {
      return null;
    }
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.set({ dirty: false, error: null, isLoading: true, project: null });
    try {
      if (!id) {
        return null;
      }
      const data = await request<{ project: EditorProject }>(`/api/projects/${id}`);
      if (token !== this.opening) {
        return null;
      }
      if (data.project.state.portrait) {
        data.project.state.portrait = portraitDocument(data.project.state.portrait);
      }
      this.set({ project: data.project });
      return data.project;
    } catch (error) {
      if (token === this.opening) {
        this.fail(error instanceof Error ? error.message : 'Project could not be opened.', 'open');
      }
      return null;
    } finally {
      if (token === this.opening) {
        this.set({ isLoading: false });
      }
    }
  };
  readonly change = (portrait: PortraitDocument) => {
    const project = this.state.project;
    if (!project) {
      return;
    }
    this.changes++;
    this.set({ dirty: true, project: { ...project, state: { portrait, version: 1 } } });
    this.schedule();
  };
  readonly selectTool = (tool: string) => {
    const project = this.state.project;
    if (!project || project.active_tool === tool) {
      return;
    }
    this.changes++;
    this.set({ dirty: true, project: { ...project, active_tool: tool } });
    this.schedule();
  };
  private schedule() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      void this.flush();
    }, 900);
  }
  readonly flush = async (): Promise<boolean> => {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.saving) {
      if (!(await this.saving)) {
        return false;
      }
      return this.flush();
    }
    const project = this.state.project;
    if (!project || !this.state.dirty) {
      return true;
    }
    const version = this.changes;
    this.set({ error: null, isSaving: true });
    this.saving = (async () => {
      try {
        const data = await request<{ project: EditorProject }>(`/api/projects/${project.id}`, 'PATCH', {
          active_tool: project.active_tool,
          expectedRevision: project.revision,
          state: project.state,
        });
        const current = this.state.project;
        if (current?.id === project.id) {
          this.set({
            dirty: version !== this.changes,
            project:
              version === this.changes
                ? data.project
                : { ...current, revision: data.project.revision, updated_at: data.project.updated_at },
          });
        }
        return true;
      } catch (error) {
        this.fail(
          error instanceof Error
            ? error.message
            : 'Your edits could not be saved. Keep this window open and try again.',
          'save',
        );
        return false;
      } finally {
        this.saving = null;
        this.set({ isSaving: false });
      }
    })();
    const saved = await this.saving;
    if (saved && this.state.dirty) {
      return this.flush();
    }
    return saved;
  };
  readonly retry = () => this.flush();
}
export const projectStore = new ProjectStore();
