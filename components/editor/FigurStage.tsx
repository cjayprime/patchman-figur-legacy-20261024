import Image from 'next/image';

export function FigurStage() {
  return (
    <>
      <div id="stage">
        <canvas id="gl"></canvas>
        <canvas id="overlay" aria-label="Your photo. Click to add a shaping point, drag to move it."></canvas>
        <div id="hud-label" className="hud-label" role="status" aria-live="polite"></div>

        <div id="drop-hint">
          <div className="drop-hint-inner">
            <Image src="/figur-mark.svg" alt="Figur" className="restored-brand-mark" width={64} height={64} />
            <div className="hero-art-scene" aria-hidden="true">
              <span className="hero-art-orbit hero-art-orbit-one"></span>
              <span className="hero-art-orbit hero-art-orbit-two"></span>
              <svg viewBox="0 0 320 230" role="img">
                <defs>
                  <linearGradient id="figurPortrait" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#ff8abc" />
                    <stop offset="1" stopColor="#d32c7d" />
                  </linearGradient>
                  <filter id="figurShadow">
                    <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#692342" floodOpacity=".18" />
                  </filter>
                </defs>
                <rect
                  x="70"
                  y="18"
                  width="180"
                  height="194"
                  rx="22"
                  fill="#fff"
                  stroke="#f0bbd4"
                  filter="url(#figurShadow)"
                />
                <circle cx="160" cy="79" r="31" fill="url(#figurPortrait)" />
                <path d="M106 184c6-46 25-72 54-72s48 26 54 72" fill="url(#figurPortrait)" />
                <path
                  d="M134 120c-8 21-9 40-3 61M186 120c8 21 9 40 3 61"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity=".7"
                />
                <g fill="#fff" stroke="#e83e8c" strokeWidth="3">
                  <circle cx="131" cy="142" r="7" />
                  <circle cx="189" cy="142" r="7" />
                  <circle cx="136" cy="173" r="7" />
                  <circle cx="184" cy="173" r="7" />
                </g>
                <path
                  d="M40 72h54M226 72h54M42 158h55M223 158h55"
                  stroke="#e83e8c"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="5 7"
                />
                <circle cx="39" cy="72" r="7" fill="#e83e8c" />
                <circle cx="281" cy="72" r="7" fill="#e83e8c" />
                <circle cx="39" cy="158" r="7" fill="#e83e8c" />
                <circle cx="281" cy="158" r="7" fill="#e83e8c" />
              </svg>
              <span className="hero-art-badge">PRIVATE • IN YOUR BROWSER</span>
            </div>
            <h1 className="hero-title">Find Your Baddie.</h1>
            <p className="hero-sub">
              Shape a portrait with precision, compare every move, and keep the whole edit private.
            </p>
            <button id="empty-cta" type="button" className="btn btn-primary btn-lg">
              EDIT YOUR PHOTO{' '}
              <span className="arrow" aria-hidden="true">
                &rarr;
              </span>
            </button>
            <p className="hero-note">or drop a photo here. JPG, PNG or WEBP</p>
          </div>
        </div>
      </div>
    </>
  );
}
