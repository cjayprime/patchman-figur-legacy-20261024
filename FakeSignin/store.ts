interface PreviewState {
  active: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}
const INITIAL: PreviewState = {
  active: false,
  isLoading: false,
  isSubmitting: false,
  error: null,
};
class FakeSigninStore {
  private state = INITIAL;
  private readonly listeners = new Set<() => void>();
  readonly getSnapshot = () => this.state;
  readonly getServerSnapshot = () => INITIAL;
  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private set(change: Partial<PreviewState>) {
    this.state = { ...this.state, ...change };
    this.listeners.forEach((listener) => listener());
  }
  readonly load = async () => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    this.set({ isLoading: true });
    try {
      const response = await fetch('/api/dev/fake-signin', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok || !result.status) {
        throw new Error(result.message || 'Preview unavailable.');
      }
      this.set({ active: Boolean(result.data.user), error: null });
    } catch (error) {
      this.set({
        error: error instanceof Error ? error.message : 'Preview unavailable.',
      });
    } finally {
      this.set({ isLoading: false });
    }
  };
  readonly toggle = async () => {
    if (process.env.NODE_ENV !== 'development' || this.state.isSubmitting) {
      return;
    }
    this.set({ isSubmitting: true, error: null });
    try {
      const response = await fetch('/api/dev/fake-signin', {
        method: this.state.active ? 'DELETE' : 'POST',
        credentials: 'same-origin',
      });
      const result = await response.json();
      if (!response.ok || !result.status) {
        throw new Error(result.message || 'Unable to change preview sign-in.');
      }
      window.location.assign('/');
    } catch (error) {
      this.set({
        error: error instanceof Error ? error.message : 'Unable to change preview sign-in.',
        isSubmitting: false,
      });
    }
  };
}
export const fakeSigninStore = new FakeSigninStore();
