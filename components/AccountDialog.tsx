import { useRef, useMemo, useCallback, useEffect, useSyncExternalStore, type MouseEvent } from 'react';
import { accountStore } from '../lib/account/store';
import styles from './AccountDialog.module.css';
const APP_ID = 'figur';
const APP_COLOR = '#E83E8C';
export default function AccountDialog({
  isOpen,
  onClose,
  kind = 'account',
}: {
  isOpen: boolean;
  onClose: () => void;
  kind?: 'account' | 'help';
}) {
  const state = useSyncExternalStore(accountStore.subscribe, accountStore.getSnapshot, accountStore.getServerSnapshot);
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const base =
    process.env.NEXT_PUBLIC_ACCOUNT_SERVICE_URL || process.env.NEXT_PUBLIC_ACCOUNT_URL || 'http://localhost:3001';
  const source = useMemo(() => {
    const url = new URL(kind === 'help' ? '/help' : '/modal', base);
    url.searchParams.set('app', APP_ID);
    url.searchParams.set('color', APP_COLOR);
    if (isOpen && typeof window !== 'undefined') {
      url.searchParams.set('return_to', window.location.href);
    }
    return url.href;
  }, [base, isOpen, kind]);
  const checkout = useMemo(() => {
    const url = new URL(source);
    url.pathname = '/subscriptions';
    return url.href;
  }, [source]);
  const onBackdrop = useCallback(
    (event: MouseEvent<HTMLDialogElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );
  useEffect(() => {
    if (isOpen) {
      dialog.current?.showModal();
      if (kind === 'account') {
        void accountStore.load();
      }
    } else {
      dialog.current?.close();
    }
  }, [isOpen, kind]);
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(base).origin || event.source !== frame.current?.contentWindow) {
        return;
      }
      if (event.data?.type === 'CLOSE_ACCOUNT_MODAL') {
        onClose();
        void accountStore.load();
      }
      if (event.data?.type === 'CLOSE_HELP_MODAL') {
        onClose();
      }
      if (event.data?.type === 'LAUNCH_APP_INTRODUCTION') {
        onClose();
        window.dispatchEvent(new Event('patchman:launch-introduction'));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [base, onClose]);
  useEffect(() => {
    const onRefresh = () => {
      void accountStore.load();
    };
    window.addEventListener('focus', onRefresh);
    window.addEventListener('pageshow', onRefresh);
    return () => {
      window.removeEventListener('focus', onRefresh);
      window.removeEventListener('pageshow', onRefresh);
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.modal}
      onCancel={onClose}
      onClick={onBackdrop}
      aria-label={kind === 'help' ? 'Patchman help' : 'Patchman account'}
    >
      {kind === 'account' && (
        <nav className={styles.actions}>
          <a href={checkout}>Manage subscription in Account</a>
          <button type="button" onClick={onClose}>
            Close account
          </button>
        </nav>
      )}

      {state.isLoading && <p role="status">Checking Account…</p>}

      {state.error && <p role="status">{state.error}</p>}

      {isOpen && (
        <iframe
          ref={frame}
          src={source}
          title={kind === 'help' ? 'Patchman Help' : 'Patchman Account'}
          className={styles.frame}
        />
      )}
    </dialog>
  );
}
