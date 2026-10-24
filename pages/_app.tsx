import AccountSDK from '../components/AccountSDK';
import type { AppProps } from 'next/app';
import 'driver.js/dist/driver.css';
import '../src/style.css';
import '../styles/globals.css';
import '../styles/globals-tablet.css';
import '../styles/globals-mobile.css';
import '../styles/error-notice.css';

export default function FigurApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <AccountSDK />
      <Component {...pageProps} />
    </>
  );
}
