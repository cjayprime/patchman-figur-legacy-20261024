import { parseAccountOrigin } from '../lib/account/url';
import styles from './AccountDialog.module.css';

const account = parseAccountOrigin(process.env.NEXT_PUBLIC_ACCOUNT_URL);

export default function AccountButton() {
  return (
    <iframe
      className={styles.avatar}
      src={account ? `${account}/avatar?app=figur` : undefined}
      title="Patchman account avatar"
      data-patchman-modal="profile"
      width={32}
      height={32}
      referrerPolicy="no-referrer"
    />
  );
}
