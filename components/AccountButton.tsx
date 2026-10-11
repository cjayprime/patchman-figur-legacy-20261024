import Image from 'next/image';
import { useState, useCallback, useEffect, useSyncExternalStore } from 'react';
import { accountStore } from '../lib/account/store';
import AccountDialog from './AccountDialog';
import styles from './AccountDialog.module.css';
export default function AccountButton() {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const state = useSyncExternalStore(accountStore.subscribe, accountStore.getSnapshot, accountStore.getServerSnapshot);
  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);
  const onError = useCallback(() => setFailed(true), []);
  useEffect(() => {
    void accountStore.load();
  }, []);
  useEffect(() => {
    setFailed(false);
  }, [state.status?.user.avatar_url]);
  return (
    <>
      <button type="button" className={styles.avatar} onClick={onOpen} aria-label="Open Patchman account">
        {state.status?.user.avatar_url && !failed ? (
          <Image src={state.status.user.avatar_url} alt="" width={32} height={32} onError={onError} unoptimized />
        ) : (
          <span>{state.status?.user.full_name?.charAt(0).toUpperCase() || 'P'}</span>
        )}
      </button>

      <AccountDialog isOpen={open} onClose={onClose} />
    </>
  );
}
