import { useState, useEffect } from 'react';
interface BalanceState {
  signedIn: boolean;
  creditBalance: number | null;
}
export default function CreditBalance() {
  const [value, setValue] = useState<BalanceState>({ creditBalance: null, signedIn: false });
  useEffect(() => {
    const onState = (event: Event) => setValue((event as CustomEvent).detail);
    const sdk = (window as Window & { PatchmanAccount?: { getState: () => BalanceState } }).PatchmanAccount;
    if (sdk) {
      setValue(sdk.getState());
    }
    window.addEventListener('patchman:account-state', onState);
    return () => window.removeEventListener('patchman:account-state', onState);
  }, []);
  return (
    <button
      type="button"
      className="credit-balance"
      data-patchman-modal="profile"
      aria-label="View your credit balance"
      title={value.signedIn ? 'Available credits' : 'Sign in to view your credits'}
    >
      <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="#DCC273" stroke="#80632B" />
        <path d="M7 7h6M10 5v10M7 13h6" stroke="#80632B" />
      </svg>
      <span>
        {value.creditBalance === null
          ? '—'
          : value.creditBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
      </span>
    </button>
  );
}
