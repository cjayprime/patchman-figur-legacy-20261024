import Head from 'next/head';
import Link from 'next/link';

export default function FaqPage() {
  const { title, children } = { children: undefined, title: 'Frequently Asked Questions' } as {
    title: string;
    children: React.ReactNode;
  };

  return (
    <>
      <Head>
        <title>{title} | Figur</title>
      </Head>
      <main className="figur-static-page">
        <Link href="/" className="figur-static-back">
          ← BACK TO FIGUR
        </Link>
        <h1>{title}</h1>
        {children}
      </main>
    </>
  );
}
