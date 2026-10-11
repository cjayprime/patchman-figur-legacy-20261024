interface ProjectSummary {
  id: string;
  name: string;
  updated_at: string;
}

interface ProjectState {
  projects: ProjectSummary[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const INITIAL: ProjectState = { error: null, isLoading: false, isSubmitting: false, projects: [] };

async function readResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text) as {
      data?: { project?: ProjectSummary; projects?: ProjectSummary[] };
      message?: string;
      status?: boolean;
    };
  } catch {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Your session has ended. Sign in through Patchman Account to continue.');
    }
    throw new Error('Figur received an invalid response from the app server. Try again shortly.');
  }
}

class ProjectStore {
  private state = INITIAL;
  private listeners = new Set<() => void>();
  readonly getSnapshot = () => this.state;
  readonly getServerSnapshot = () => INITIAL;
  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private set(patch: Partial<ProjectState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  readonly load = async () => {
    this.set({ error: null, isLoading: true });
    try {
      const response = await fetch('/api/projects');
      const body = await readResponse(response);
      if (!response.ok || !body.status) {
        throw new Error(
          response.status === 401 || response.status === 403
            ? 'Your session has ended. Sign in through Patchman Account to continue.'
            : body.message || 'Projects could not be loaded.',
        );
      }
      this.set({ projects: body.data?.projects || [] });
    } catch (error) {
      this.set({ error: error instanceof Error ? error.message : 'Projects could not be loaded.' });
    } finally {
      this.set({ isLoading: false });
    }
  };
  readonly create = async (name: string) => {
    this.set({ error: null, isSubmitting: true });
    try {
      const response = await fetch('/api/projects', {
        body: JSON.stringify({ name }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const body = await readResponse(response);
      if (!response.ok || !body.status) {
        throw new Error(
          response.status === 401 || response.status === 403
            ? 'Your session has ended. Sign in through Patchman Account to continue.'
            : body.message || 'Project could not be created.',
        );
      }
      return body.data?.project || null;
    } catch (error) {
      this.set({ error: error instanceof Error ? error.message : 'Project could not be created.' });
      return null;
    } finally {
      this.set({ isSubmitting: false });
    }
  };
}

export const projectStore = new ProjectStore();
