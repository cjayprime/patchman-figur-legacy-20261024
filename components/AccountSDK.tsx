import ErrorNotice from './ErrorNotice';
import { useCallback, useState } from 'react';
import Script from 'next/script';
import { parseAccountOrigin } from '../lib/account/url';
export default function AccountSDK() {
  const [failed, setFailed] = useState(false);
  const base = parseAccountOrigin(process.env.NEXT_PUBLIC_ACCOUNT_URL);
  const onError = useCallback(() => setFailed(true), []);
  const onReady = useCallback(() => setFailed(false), []);
  const onReload = useCallback(() => window.location.reload(), []);
  return (
    <>
      {base && (
        <Script
          id="patchman-account"
          src={`${base}/sdk/v1/patchman-account.js`}
          data-app="figur"
          strategy="afterInteractive"
          onError={onError}
          onReady={onReady}
        />
      )}
      {(!base || failed) && (
        <ErrorNotice
          message="Patchman Account could not load. Please reload this page or contact support."
          onRetry={onReload}
          retryLabel="RELOAD"
        />
      )}
    </>
  );
}
