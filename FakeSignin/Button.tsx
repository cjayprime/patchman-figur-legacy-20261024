import { useSyncExternalStore, useCallback, useEffect } from 'react';
import { fakeSigninStore } from './store';
import styles from './styles.module.css';

export default function FakeSigninButton() {
  const state = useSyncExternalStore(
    fakeSigninStore.subscribe,
    fakeSigninStore.getSnapshot,
    fakeSigninStore.getServerSnapshot,
  );
  const onToggle = useCallback(() => {
    void fakeSigninStore.toggle();
  }, []);
  useEffect(() => {
    void fakeSigninStore.load();
  }, []);
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  return (
    <aside className={styles.preview} aria-label="Development sign-in">
      {state.error && <p role="alert">{state.error}</p>}

      <button
        type="button"
        onClick={onToggle}
        disabled={state.isLoading || state.isSubmitting}
        aria-pressed={state.active}
      >
        <span className={styles.badge}>DEV ONLY</span>

        <span>{state.isSubmitting ? 'Switching…' : state.active ? 'Leave fake sign-in' : 'Fake sign in'}</span>
      </button>
    </aside>
  );
}
