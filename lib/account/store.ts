interface Status {
  user: { id: string; full_name: string; avatar_url?: string };
  access: boolean;
  subscription_active: boolean;
  preview: boolean;
}
interface State {
  status: Status | null;
  isLoading: boolean;
  error: string | null;
}
const INITIAL: State = { error: null, isLoading: false, status: null };
class AccountStore {
  private state = INITIAL;
  private listeners = new Set<() => void>();
  private loading: Promise<void> | null = null;
  readonly getSnapshot = () => this.state;
  readonly getServerSnapshot = () => INITIAL;
  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private set(value: Partial<State>) {
    this.state = { ...this.state, ...value };
    this.listeners.forEach((listener) => listener());
  }
  load = async () => {
    if (this.loading) {
      return this.loading;
    }
    this.set({ error: null, isLoading: true });
    this.loading = (async () => {
      try {
        const response = await fetch('/api/account/status', {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        const body = await response.json();
        if (!response.ok || !body.status) {
          throw new Error(body.message || 'Account could not verify your subscription.');
        }
        this.set({ status: body.data });
      } catch (error) {
        this.set({
          error: error instanceof Error ? error.message : 'Account is unavailable.',
          status: null,
        });
      } finally {
        this.set({ isLoading: false });
        this.loading = null;
      }
    })();
    return this.loading;
  };
}
export const accountStore = new AccountStore();
