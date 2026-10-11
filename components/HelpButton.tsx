import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { driver, type DriveStep, type Driver } from 'driver.js';
import AccountDialog from './AccountDialog';
import styles from './AccountDialog.module.css';

const STORAGE_KEY = 'patchman:figur:introduction:1';
const artwork = (src: string) => `<img class="figur-tour-art" src="${src}" alt="" />`;

export default function HelpButton() {
  const [open, setOpen] = useState(false);
  const tour = useRef<Driver | null>(null);
  const steps = useMemo<DriveStep[]>(
    () => [
      {
        element: '[data-tour="app-header"]',
        popover: {
          align: 'start',
          description: `${artwork('/tour-shape.svg')}<strong>FIGUR gives artists direct, private control over portrait shape.</strong> Adjust a silhouette, compare against the original, and export without sending the photo away.`,
          side: 'bottom',
          title: 'Shape the portrait you pictured',
        },
      },
      {
        element: '#open-file',
        popover: {
          align: 'start',
          description: `${artwork('/tour-upload.svg')}Choose a JPG, PNG, or WEBP. You can also drop a photo onto the centre canvas for the same action.`,
          side: 'left',
          title: 'Begin with your photograph',
        },
      },
      {
        element: '.shared-projects',
        popover: {
          align: 'end',
          description:
            'Open Projects in the header to create a named project or return to a previous edit. Your work then opens at its own project address.',
          side: 'bottom',
          title: 'Keep every portrait session organized',
        },
      },
      {
        element: '[data-figur-projects-tab]',
        popover: {
          align: 'center',
          description:
            'The Projects tab opens the same project chooser from the editing panel, so either route gets you back to your work.',
          side: 'right',
          title: 'Projects are always within reach',
        },
      },
      {
        element: '#stage',
        popover: {
          align: 'center',
          description: `${artwork('/tour-compare.svg')}The canvas keeps the portrait large while body detection, shaping points, zoom, and before-and-after comparison stay interactive.`,
          side: 'right',
          title: 'See every adjustment in context',
        },
      },
      {
        element: '#panel',
        popover: {
          align: 'center',
          description: `${artwork('/tour-shape.svg')}Waist, hips, bust, and curve controls work with manual shaping points. Advanced controls reveal overlays and detection details when you need precision.`,
          side: 'left',
          title: 'Direct the silhouette',
        },
      },
      {
        element: '#download',
        popover: {
          align: 'end',
          description: `${artwork('/tour-compare.svg')}Download at the best safe resolution after comparing the result with the original.`,
          side: 'left',
          title: 'Keep the finished portrait',
        },
      },
      {
        element: '[data-tour="help"]',
        popover: {
          align: 'end',
          description: 'Help brings back the tour, opens FIGUR FAQs, and connects you to support@patchman.io.',
          doneBtnText: 'EDIT A PHOTO',
          side: 'bottom',
          title: 'Replay this guide anytime',
        },
      },
    ],
    [],
  );
  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);
  const launch = useCallback(() => {
    tour.current?.destroy();
    window.dispatchEvent(new Event('patchman:walkthrough-start'));
    const instance = driver({
      allowClose: true,
      allowKeyboardControl: true,
      animate: true,
      closeBtnLabel: 'Close introduction',
      doneBtnText: 'EDIT A PHOTO',
      nextBtnText: 'NEXT',
      onCloseClick: (_element, _step, options) => {
        options.driver.destroy();
        window.setTimeout(() => window.dispatchEvent(new Event('patchman:walkthrough-end')), 0);
      },
      onDestroyed: () => {
        localStorage.setItem(STORAGE_KEY, 'complete');
        tour.current = null;
        window.setTimeout(() => window.dispatchEvent(new Event('patchman:walkthrough-end')), 0);
      },
      onPopoverRender: (popover, options) => {
        popover.closeButton.textContent = '×';
        const skip = document.createElement('button');
        skip.type = 'button';
        skip.className = 'figur-tour-skip';
        skip.textContent = 'SKIP';
        skip.addEventListener('click', () => options.driver.destroy());
        popover.footerButtons.append(skip);
      },
      overlayColor: '#321020',
      overlayOpacity: 0.74,
      popoverClass: 'figur-tour',
      prevBtnText: 'BACK',
      showButtons: ['next', 'previous', 'close'],
      showProgress: true,
      steps,
    });
    tour.current = instance;
    instance.drive();
  }, [steps]);

  useEffect(() => {
    window.addEventListener('patchman:launch-introduction', launch);
    let timer: number | undefined;
    if (localStorage.getItem(STORAGE_KEY) !== 'complete') {
      timer = window.setTimeout(launch, 0);
    }
    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
      window.removeEventListener('patchman:launch-introduction', launch);
      tour.current?.destroy();
    };
  }, [launch]);

  return (
    <>
      <button className={styles.help} type="button" onClick={onOpen} aria-label="Open Help" data-tour="help">
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="9.25" />
          <path d="M9.7 9.2a2.5 2.5 0 0 1 4.8.9c0 2.1-2.5 2.2-2.5 4.1" />
          <circle cx="12" cy="17.4" r=".7" fill="currentColor" stroke="none" />
        </svg>
      </button>

      <AccountDialog isOpen={open} onClose={onClose} kind="help" />
    </>
  );
}
