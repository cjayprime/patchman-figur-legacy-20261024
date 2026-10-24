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
  {
    color: '#0b080f',
    href: '/products/visualizer/',
    key: 'visualizer',
    name: 'Visualizer',
    summary: 'Music visuals, lyric timing, and social clips.',
  },
  {
    color: '#006b96',
    href: '/products/hookboy/',
    key: 'hookboy',
    name: 'HookBoy',
    summary: 'Create branded video continuations from a proven opening.',
  },
  {
    color: '#c72f75',
    href: '/products/figur/',
    key: 'figur',
    name: 'FIGUR',
    summary: 'Shape and compare portraits with private controls.',
  },
  {
    color: '#2337c6',
    href: '/products/fold/',
    key: 'fold',
    name: 'FOLD',
    summary: 'Merge, edit, convert, and organise documents.',
  },
  {
    color: '#a83b2b',
    href: '/products/dowe/',
    key: 'dowe',
    name: 'dọwe',
    summary: 'Store, share, sell, and arrange creative files.',
  },
  {
    color: '#d71943',
    href: '/products/flux/',
    key: 'flux',
    name: 'Flux',
    summary: 'Capture and organise direct and cloud downloads.',
  },
  {
    color: '#8628b3',
    href: '/products/repaint/',
    key: 'repaint',
    name: 'Repaint',
    summary: 'Select, recolor, move, and repair image objects.',
  },
  {
    color: '#d94438',
    href: '/products/outpaint/',
    key: 'outpaint',
    name: 'Outpaint',
    summary: 'Extend image edges and blend a larger canvas.',
  },
  {
    color: '#075968',
    href: '/products/veil/',
    key: 'veil',
    name: 'Veil',
    summary: 'Read mail, follow up, design messages, and act on deadlines.',
  },
  {
    color: '#3158C9',
    href: '/products/harness/',
    key: 'harness',
    name: 'Harness',
    summary: 'Plan campaigns and review your video production.',
  },
];

const LANDING = process.env.NEXT_PUBLIC_PATCHMAN_LANDING_URL || 'https://patchman.io';

import SuiteMark from '../components/SuiteMark';

function appKey(name: string) {
  if (name.endsWith('we')) {
    return 'dowe';
  }
  return name.toLocaleLowerCase();
}

function wordmarkStyle(name: string): React.CSSProperties {
  const key = appKey(name);
  const colors: Record<string, string> = {
    account: '#7045FF',
    dowe: '#a83b2b',
    figur: '#c72f75',
    flux: '#d71943',
    fold: '#2337c6',
    harness: '#3158C9',
    hookboy: '#006b96',
    outpaint: '#d94438',
    patchman: '#7045FF',
    repaint: '#8628b3',
    veil: '#075968',
    visualizer: '#0b080f',
  };
  return {
    color: colors[key],
    fontFamily:
      key === 'hookboy'
        ? '"Lobster Two", cursive'
        : key === 'patchman' || key === 'account'
          ? 'Jakarta, Arial, sans-serif'
          : key === 'veil'
            ? '"Arial Black", Arial, sans-serif'
            : ['figur', 'fold'].includes(key)
              ? 'Georgia, serif'
              : 'Arial, sans-serif',
    fontStyle: key === 'hookboy' ? 'italic' : undefined,
  };
}

const APP: NotFoundApp = {
  color: '#E83E8C',
  description: 'A private portrait workspace where artists can shape, inspect, compare, and export with control.',
  features: [
    'Body-Aware Portrait Shaping',
    'Waist, Hip, Bust, And Curve Controls',
    'Manual Local Warp Points',
    'Original And Edit Comparison',
    'Detection And Mesh Overlays',
    'Private High-Resolution Export',
  ],
  homeLabel: 'RETURN TO FIGUR',
  logo: '/figur-mark.svg',
  name: 'FIGUR',
  tagline: 'This portrait path ends here. Return to the canvas to open a photo and continue shaping it.',
};

export default function NotFound() {
  const { app } = { app: APP } as { app: NotFoundApp };
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
        <link rel="stylesheet" href="/patchman-404.css" />
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
        <span>404 · WRONG TURN, RIGHT SUITE</span>
      </header>

      <main>
        <section className="nf-hero">
          <div>
            <p className="nf-kicker">LOST INSIDE {app.name.toLocaleUpperCase()}</p>
            <h1>This Page Doesn&apos;t Exist In {app.name}.</h1>
            <p className="nf-deck">{app.tagline}</p>
            <Link href="/" className="nf-primary">
              {app.homeLabel} <span aria-hidden="true">›</span>
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
    </div>
  );
}
