import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

export interface NotFoundApp {
  color: string;
  description: string;
  features: string[];
  homeLabel: string;
  logo?: string;
  name: string;
  tagline: string;
}

const SUITE = [
  { href: '/products/visualizer/', name: 'Visualizer', summary: 'Music visuals, lyric timing, and social clips.' },
  { href: '/products/hookboy/', name: 'HookBoy', summary: 'Turn a proven opening into a branded video continuation.' },
  { href: '/products/figur/', name: 'FIGUR', summary: 'Shape and compare portraits with private controls.' },
  { href: '/products/inpaint/', name: 'InPaint', summary: 'Remove distractions and repair photographs.' },
  { href: '/products/fold/', name: 'FOLD', summary: 'Merge, edit, convert, and organise documents.' },
  { href: '/products/dowe/', name: 'd\u1ecdwe', summary: 'Store, share, sell, and arrange creative files.' },
  { href: '/products/flux/', name: 'Flux', summary: 'Capture and organise direct and cloud downloads.' },
];

const LANDING = process.env.NEXT_PUBLIC_PATCHMAN_LANDING_URL || 'https://patchman.io';

function SuiteMark({ name }: { name: string }) {
  if (name === 'Visualizer') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#0b080f" />
        <rect x="6" y="6" width="9" height="9" rx="2" fill="#d4ff3a" />
        <rect x="17" y="17" width="9" height="9" rx="2" fill="#d4ff3a" />
        <rect x="17" y="6" width="9" height="9" rx="2" fill="#fff" opacity=".85" />
        <rect x="7" y="18" width="7" height="7" rx="2" fill="#d4ff3a" opacity=".45" />
      </svg>
    );
  }
  if (name === 'HookBoy') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="6" fill="#01b6fe" />
        <path
          d="M18 15v3a3 3 0 0 1-6 0V6a3 3 0 0 0-6 0v3M16 12h4"
          transform="translate(4 4)"
          fill="none"
          stroke="#172b36"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === 'FIGUR') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M46 6C26 6 12 20 12 36c20 0 34-14 34-30Z" fill="#ff82bb" />
        <path d="M18 58c20 0 34-14 34-30-20 0-34 14-34 30Z" fill="#c72f75" />
      </svg>
    );
  }
  if (name === 'InPaint') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="2" y="2" width="12" height="12" rx="3" fill="#d94438" />
        <rect x="18" y="2" width="12" height="12" rx="3" fill="#18191a" />
        <rect x="2" y="18" width="12" height="12" rx="3" fill="#18191a" />
        <rect x="18" y="18" width="12" height="12" rx="3" fill="#18191a" />
      </svg>
    );
  }
  if (name === 'FOLD') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="8" fill="#faf8f1" />
        <rect x="19" y="8" width="37" height="42" rx="5" fill="#5668c7" opacity=".24" />
        <rect x="13" y="14" width="37" height="43" rx="5" fill="#485cc2" opacity=".38" />
        <rect x="7" y="21" width="37" height="37" rx="5" fill="#394fb8" opacity=".52" />
        <path d="M16 30v15m0-15h18m-18 8h11" fill="none" stroke="#243ba7" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'd\u1ecdwe') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#f5f3ed" />
        <text
          x="16"
          y="21"
          textAnchor="middle"
          fill="#a83b2b"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="15"
          fontWeight="700"
          letterSpacing="-1"
        >
          dọ
        </text>
      </svg>
    );
  }
  if (name === 'Account') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#ff1744" />
        <circle cx="16" cy="12" r="5" fill="#fff" />
        <path d="M7 27c1-6 4-9 9-9s8 3 9 9" fill="#fff" />
      </svg>
    );
  }
  if (name === 'Patchman') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="M4 2h13c8 0 13 5 13 13S24 26 16 26h-3V15H7c-3 0-5-2-5-5V6c0-2 1-4 2-4Zm3 18h5v11H2v-6c0-3 2-5 5-5Z"
          fill="#7045ff"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#ff1744" />
      <path d="M8.5 8A1 1 0 0 1 9.5 7H23l-3 5.2h-7v2.6h6l-3 4.85h-3v5.55H8.5Z" fill="#fff" />
      <circle cx="21" cy="20.5" r="2.2" fill="#fff" />
    </svg>
  );
}

function appKey(name: string) {
  if (name.endsWith('we')) {
    return 'dowe';
  }
  return name.toLocaleLowerCase();
}

function wordmarkStyle(name: string): React.CSSProperties {
  const key = appKey(name);
  const colors: Record<string, string> = {
    account: '#ff1744',
    dowe: '#a83b2b',
    figur: '#c72f75',
    flux: '#d71943',
    fold: '#2337c6',
    hookboy: '#006b96',
    inpaint: '#d94438',
    patchman: '#7045ff',
    visualizer: '#0b080f',
  };
  return {
    color: colors[key],
    fontFamily:
      key === 'hookboy'
        ? '"Lobster Two", "Brush Script MT", cursive'
        : ['dowe', 'figur', 'fold'].includes(key)
          ? 'Georgia, serif'
          : 'Arial, sans-serif',
    fontStyle: key === 'hookboy' ? 'italic' : undefined,
  };
}

export function NotFoundPage({ app }: { app: NotFoundApp }) {
  const [query, setQuery] = useState('');
  const onSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value), []);
  const apps = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return SUITE.filter(
      (item) =>
        item.name.toLocaleLowerCase() !== app.name.toLocaleLowerCase() &&
        (!normalized || `${item.name} ${item.summary}`.toLocaleLowerCase().includes(normalized)),
    );
  }, [app.name, query]);

  return (
    <div className="not-found" style={{ '--app-color': app.color } as React.CSSProperties}>
      <Head>
        <title>{`Page Not Found | ${app.name}`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <header className="nf-header">
        <Link href="/" className="nf-brand">
          <span className="nf-mark">
            {app.logo ? <Image src={app.logo} alt="" width={38} height={38} /> : <SuiteMark name={app.name} />}
          </span>
          <span>
            <strong className={`nf-wordmark nf-wordmark-${appKey(app.name)}`} style={wordmarkStyle(app.name)}>
              {app.name}
            </strong>
            <small>BY PATCHMAN</small>
          </span>
        </Link>
        <span>404 Â· WRONG TURN, RIGHT SUITE</span>
      </header>

      <main>
        <section className="nf-hero">
          <div>
            <p className="nf-kicker">LOST INSIDE {app.name.toLocaleUpperCase()}</p>
            <h1>This Page Doesn&apos;t Exist In {app.name}.</h1>
            <p className="nf-deck">{app.tagline}</p>
            <Link href="/" className="nf-primary">
              {app.homeLabel} <span aria-hidden="true">â†’</span>
            </Link>
          </div>
          <div className="nf-art" aria-hidden="true">
            <span>4</span>
            <i>PATCH</i>
            <span>4</span>
          </div>
        </section>

        <section className="nf-features" aria-labelledby="features-title">
          <div className="nf-section-heading">
            <p>STILL IN THE RIGHT STUDIO</p>
            <h2 id="features-title">Here&apos;s What You Can Make In {app.name}.</h2>
            <span>{app.description}</span>
          </div>
          <div className="nf-feature-grid">
            {app.features.map((feature, index) => (
              <article key={feature}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{feature}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="nf-finder" aria-labelledby="finder-title">
          <div>
            <p>PATCHMAN APP FINDER</p>
            <h2 id="finder-title">Maybe Your Work Belongs Somewhere Else.</h2>
          </div>
          <label>
            <span>Search By App Or Task</span>
            <input
              value={query}
              onChange={onSearch}
              type="search"
              placeholder="Try photos, music, storage, documentsâ€¦"
            />
          </label>
          <div className="nf-app-grid">
            {apps.map((item) => (
              <a className={`nf-app nf-app-${appKey(item.name)}`} key={item.name} href={`${LANDING}${item.href}`}>
                <span>
                  <SuiteMark name={item.name} />
                </span>
                <strong style={wordmarkStyle(item.name)}>{item.name}</strong>
                <small>{item.summary}</small>
                <b aria-hidden="true">â†—</b>
              </a>
            ))}
            {!apps.length && (
              <p>No app matched that search. Try a task such as photos, music, storage, or documents.</p>
            )}
          </div>
        </section>
      </main>

      <footer className="nf-footer">
        <div className="nf-footer-intro">
          <strong>PATCHMAN</strong>
          <p>Digital problems, patched.</p>
          <span>Create visuals. Edit photos. Handle documents. Keep your work.</span>
        </div>
        <nav aria-label="Patchman products">
          <h2>Products</h2>
          {SUITE.map((item) => (
            <a key={item.name} href={`${LANDING}${item.href}`}>
              {item.name}
            </a>
          ))}
          <a href={`${LANDING}/products/`}>Explore The Suite</a>
        </nav>
        <nav aria-label="Patchman resources">
          <h2>Resources</h2>
          <a href={`${LANDING}/guides/`}>Help Docs</a>
          <a href={`${LANDING}/blog/`}>Blog</a>
          <a href={`${LANDING}/showcase/`}>Showcase</a>
          <a href={`${LANDING}/workflows/`}>Workflows</a>
          <a href={`${LANDING}/comparisons/`}>Comparisons</a>
          <a href={`${LANDING}/faq/`}>Frequently Asked Questions</a>
        </nav>
        <nav aria-label="Patchman company information">
          <h2>Company</h2>
          <a href={`${LANDING}/about/`}>About Patchman</a>
          <a href={`${LANDING}/support/`}>Support</a>
          <a href={`${LANDING}/security/`}>Security & Data Handling</a>
          <a href={`${LANDING}/privacy/`}>Privacy Policy</a>
          <a href={`${LANDING}/terms/`}>Terms Of Service</a>
          <a href={`${LANDING}/changelog/`}>Changelog</a>
        </nav>
        <div className="nf-footer-bottom">
          <span>Â© 2026 Patchman</span>
          <a href={`${LANDING}/topics/`}>Explore Every Resource</a>
          <span>Make. Fix. Keep.</span>
        </div>
      </footer>

      <style suppressHydrationWarning>{`
        .not-found {
          width: 100%;
          height: 100vh;
          min-height: 100vh;
          overflow-x: hidden;
          overflow-y: auto;
          background: #f5f3ec;
          color: #111827;
          font-family: Arial, sans-serif;
        }
        .nf-header {
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 5vw;
          border-bottom: 1px solid #c9c6bb;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }
        .nf-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: inherit;
          text-decoration: none;
        }
        .nf-brand > span:last-child {
          display: grid;
        }
        .nf-brand strong {
          font-size: 18px;
          letter-spacing: -0.03em;
        }
        .nf-brand .nf-wordmark-hookboy,
        .nf-app-hookboy strong { color: #006b96; font-family: "Lobster Two", "Brush Script MT", cursive; font-style: italic; }
        .nf-brand .nf-wordmark-figur,
        .nf-app-figur strong { color: #c72f75; font-family: Georgia, serif; letter-spacing: .04em; }
        .nf-brand .nf-wordmark-fold,
        .nf-app-fold strong { color: #2337c6; font-family: Georgia, serif; letter-spacing: .04em; }
        .nf-brand .nf-wordmark-dowe,
        .nf-app-dowe strong { color: #a83b2b; font-family: Georgia, serif; }
        .nf-brand .nf-wordmark-inpaint,
        .nf-app-inpaint strong { color: #d94438; font-family: Arial, sans-serif; }
        .nf-brand .nf-wordmark-flux,
        .nf-app-flux strong { color: #d71943; font-family: Arial, sans-serif; }
        .nf-brand .nf-wordmark-visualizer,
        .nf-app-visualizer strong { color: #0b080f; font-family: Arial, sans-serif; }
        .nf-brand .nf-wordmark-account { color: #ff1744; font-family: Arial, sans-serif; }
        .nf-brand .nf-wordmark-patchman { color: #7045ff; font-family: Jakarta, Arial, sans-serif; }
        .nf-brand small {
          font-size: 8px;
          letter-spacing: 0.14em;
        }
        .nf-mark {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: transparent;
        }
        .nf-mark img,
        .nf-app-grid a > span svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        .nf-hero {
          min-height: 560px;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(350px, 0.95fr);
          align-items: center;
          gap: 7vw;
          padding: 70px 6vw;
          overflow: hidden;
        }
        .nf-kicker,
        .nf-section-heading > p,
        .nf-finder > div > p {
          margin: 0 0 18px;
          color: var(--app-color);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }
        h1 {
          max-width: 780px;
          margin: 0;
          font:
            700 clamp(52px, 6.5vw, 104px)/0.96 Georgia,
            serif;
          letter-spacing: -0.06em;
        }
        .nf-deck {
          max-width: 610px;
          margin: 28px 0 32px;
          color: #555b68;
          font-size: 20px;
          line-height: 1.55;
        }
        .nf-primary {
          display: inline-flex;
          align-items: center;
          gap: 28px;
          min-height: 50px;
          padding: 0 20px;
          background: var(--app-color);
          color: white;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-decoration: none;
        }
        .nf-art {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 390px;
          background: color-mix(in srgb, var(--app-color) 13%, white);
          border: 1px solid color-mix(in srgb, var(--app-color) 45%, white);
          transform: rotate(2deg);
        }
        .nf-art::before,
        .nf-art::after {
          content: '';
          position: absolute;
          width: 62%;
          height: 72%;
          border: 2px solid var(--app-color);
          transform: rotate(-8deg);
          opacity: 0.35;
        }
        .nf-art::after {
          transform: rotate(9deg);
        }
        .nf-art span {
          position: relative;
          z-index: 1;
          font:
            800 clamp(100px, 12vw, 210px)/1 Georgia,
            serif;
        }
        .nf-art i {
          position: relative;
          z-index: 2;
          padding: 10px 13px;
          background: var(--app-color);
          color: white;
          font-size: 10px;
          font-style: normal;
          letter-spacing: 0.14em;
          transform: rotate(-8deg);
        }
        .nf-features,
        .nf-finder {
          padding: 80px 6vw;
          border-top: 1px solid #c9c6bb;
        }
        .nf-section-heading {
          display: grid;
          grid-template-columns: 1.3fr 0.7fr;
          gap: 20px 8vw;
          align-items: end;
        }
        .nf-section-heading > p {
          grid-column: 1 / -1;
        }
        .nf-section-heading h2,
        .nf-finder h2 {
          margin: 0;
          font:
            700 clamp(38px, 4.8vw, 72px)/1 Georgia,
            serif;
          letter-spacing: -0.05em;
        }
        .nf-section-heading > span {
          color: #60636b;
          font-size: 17px;
          line-height: 1.6;
        }
        .nf-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          margin-top: 55px;
          border-top: 1px solid #aaa69b;
        }
        .nf-feature-grid article {
          min-height: 180px;
          padding: 22px;
          border-right: 1px solid #aaa69b;
          border-bottom: 1px solid #aaa69b;
        }
        .nf-feature-grid article:nth-child(3n + 1) {
          border-left: 1px solid #aaa69b;
        }
        .nf-feature-grid span {
          color: var(--app-color);
          font:
            800 11px ui-monospace,
            monospace;
        }
        .nf-feature-grid h3 {
          max-width: 260px;
          margin: 62px 0 0;
          font:
            600 22px/1.2 Georgia,
            serif;
        }
        .nf-finder {
          background: #e7e5de;
        }
        .nf-finder > div:first-child {
          display: grid;
          grid-template-columns: 0.55fr 1.45fr;
          align-items: end;
        }
        .nf-finder label {
          display: grid;
          grid-template-columns: 180px 1fr;
          align-items: center;
          margin: 50px 0 25px;
          border-top: 2px solid #111827;
          border-bottom: 1px solid #aaa69b;
        }
        .nf-finder label span {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.11em;
        }
        .nf-finder input {
          width: 100%;
          min-height: 66px;
          border: 0;
          outline: 0;
          background: transparent;
          color: inherit;
          font-size: 20px;
        }
        .nf-finder input:focus {
          box-shadow: inset 0 -3px var(--app-color);
        }
        .nf-app-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .nf-app-grid a {
          position: relative;
          display: grid;
          grid-template-columns: auto 1fr auto;
          grid-template-rows: auto auto;
          align-content: start;
          align-items: start;
          gap: 5px 13px;
          min-height: 145px;
          padding: 20px;
          border: 1px solid #b8b5aa;
          background: #f5f3ec;
          color: inherit;
          text-decoration: none;
        }
        .nf-app-grid a > span {
          grid-row: 1 / 3;
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: transparent;
        }
        .nf-app-grid strong {
          font:
            700 21px Georgia,
            serif;
        }
        .nf-app-grid small {
          grid-column: 2;
          grid-row: 2;
          max-width: 230px;
          color: #62656d;
          font-size: 13px;
          line-height: 1.45;
        }
        .nf-app-grid b {
          grid-column: 3;
          grid-row: 1;
        }
        .nf-footer {
          display: grid;
          grid-template-columns: 1.35fr repeat(3, 1fr);
          gap: 42px;
          padding: 70px 6vw 26px;
          background: #151719;
          color: #f4f2eb;
        }
        .nf-footer-intro strong {
          font:
            800 28px Georgia,
            serif;
        }
        .nf-footer-intro p {
          font-size: 17px;
        }
        .nf-footer-intro span {
          display: block;
          max-width: 230px;
          color: #aaa9a4;
          line-height: 1.6;
        }
        .nf-footer nav {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .nf-footer h2 {
          margin: 0 0 8px;
          font-size: 15px;
        }
        .nf-footer a {
          color: inherit;
          font-size: 14px;
          text-decoration: none;
        }
        .nf-footer a:hover {
          text-decoration: underline;
          text-underline-offset: 4px;
        }
        .nf-footer-bottom {
          grid-column: 1 / -1;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-top: 18px;
          padding-top: 24px;
          border-top: 1px solid #3c3e40;
          color: #aaa9a4;
          font-size: 12px;
        }
        @media (max-width: 900px) {
          .nf-hero {
            grid-template-columns: 1fr;
          }
          .nf-art {
            min-height: 300px;
          }
          .nf-section-heading,
          .nf-finder > div:first-child {
            grid-template-columns: 1fr;
          }
          .nf-feature-grid,
          .nf-app-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .nf-feature-grid article:nth-child(3n + 1) {
            border-left: 0;
          }
          .nf-feature-grid article:nth-child(2n + 1) {
            border-left: 1px solid #aaa69b;
          }
          .nf-footer {
            grid-template-columns: 1fr 1fr;
          }
          .nf-footer-intro,
          .nf-footer-bottom {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 600px) {
          .nf-header > span {
            display: none;
          }
          .nf-hero,
          .nf-features,
          .nf-finder {
            padding: 46px 20px;
          }
          h1 {
            font-size: 54px;
          }
          .nf-art {
            min-height: 230px;
          }
          .nf-feature-grid,
          .nf-app-grid {
            grid-template-columns: 1fr;
          }
          .nf-feature-grid article {
            border-left: 1px solid #aaa69b;
          }
          .nf-finder label {
            grid-template-columns: 1fr;
            padding-top: 15px;
          }
          .nf-footer {
            grid-template-columns: 1fr;
            padding: 55px 20px 24px;
          }
          .nf-footer-intro,
          .nf-footer-bottom {
            grid-column: auto;
          }
          .nf-footer-bottom {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
