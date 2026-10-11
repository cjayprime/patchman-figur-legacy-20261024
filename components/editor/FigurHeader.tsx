import Image from 'next/image';

export function FigurHeader() {
  return (
    <>
      <header id="topbar" className="patchman-header-bar" data-tour="app-header">
        <button
          id="figur-menu-toggle"
          className="figur-menu-toggle"
          type="button"
          aria-label="Open editing controls"
          aria-controls="panel"
          aria-expanded="false"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M4 6h16v2H4V6m0 5h16v2H4v-2m0 5h16v2H4v-2Z" />
          </svg>
        </button>
        <div className="lockup">
          <Image src="/figur-mark.svg" alt="" className="lockup-mark" width={32} height={32} />
          <span className="lockup-words">
            <strong>FIGUR</strong>
            <small>BY PATCHMAN</small>
          </span>
        </div>
        <button id="figur-status-pill" className="header-center-pill" type="button">
          <span className="pill-dot-pulse" aria-hidden="true"></span>
          <span className="pill-copy">
            <strong>PRIVATE BROWSER EDITOR</strong>
            <small>CHOOSE A PHOTO TO BEGIN</small>
          </span>
        </button>
        <div id="figur-header-actions" className="header-shortcuts-section" aria-label="Application actions"></div>
      </header>
    </>
  );
}
