import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const SIGN_IN_MESSAGE = 'Click the profile icon at the top right to sign in, then try again.';
const AUTH_MESSAGE = /sign in|session (?:has )?(?:ended|expired)/i;

export default function ErrorNotice({
  message,
  onDismiss,
  onRetry,
  retryLabel = 'Try again',
  signIn,
}: {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
  signIn?: boolean;
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const authenticationRequired = signIn ?? AUTH_MESSAGE.test(message);

  useEffect(() => {
    const node = document.querySelector<HTMLElement>('[data-patchman-error-host]') || document.createElement('div');
    const slot = document.createElement('div');
    node.dataset.patchmanErrorHost = '';
    node.append(slot);
    const placeNotice = () => {
      const dialogs = Array.from(
        document.querySelectorAll<HTMLElement>('dialog[open], [role="dialog"][aria-modal="true"]'),
      ).filter((dialog) => dialog.getClientRects().length && getComputedStyle(dialog).visibility !== 'hidden');
      const parent = dialogs[dialogs.length - 1] || document.body;
      const className = parent === document.body ? 'app-error-host' : 'app-error-host in-dialog';
      if (node.className !== className) {
        node.className = className;
      }
      if (node.parentElement !== parent) {
        if (parent === document.body) {
          parent.append(node);
        } else {
          parent.prepend(node);
        }
      }
    };
    placeNotice();
    setContainer(slot);
    const observer = new MutationObserver(placeNotice);
    observer.observe(document.body, {
      attributeFilter: ['open', 'hidden', 'aria-hidden', 'class', 'style'],
      attributes: true,
      childList: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
      slot.remove();
      if (!node.childElementCount) {
        node.remove();
      }
    };
  }, []);

  if (!container) {
    return null;
  }

  return createPortal(
    <div className="app-error-notice" role="alert" aria-atomic="true">
      <p>{authenticationRequired ? SIGN_IN_MESSAGE : message}</p>
      <div className="app-error-actions">
        {authenticationRequired ? (
          <button type="button" data-patchman-modal="profile">
            Sign in
          </button>
        ) : onRetry ? (
          <button type="button" onClick={onRetry}>
            {retryLabel}
          </button>
        ) : null}
        {onDismiss && (
          <button type="button" onClick={onDismiss} aria-label="Dismiss error">
            Dismiss
          </button>
        )}
      </div>
    </div>,
    container,
  );
}
