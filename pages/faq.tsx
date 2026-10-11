import { StaticPage } from '../components/StaticPage';

export default function FaqPage() {
  return (
    <StaticPage title="Frequently Asked Questions">
      <h2>Does Figur upload my portrait?</h2>
      <p>The editor processes the portrait in your browser. Project metadata is saved to your account.</p>
      <h2>How do I compare my edit?</h2>
      <p>Open Compare and drag the divider, hold the comparison button, or press the space bar.</p>
      <h2>Can I remove the test pattern?</h2>
      <p>Select Unload Test Pattern in Advanced, or choose a portrait to replace it.</p>
      <h2>Where can I get help?</h2>
      <p>Email support@patchman.io or open Help beside your profile.</p>
    </StaticPage>
  );
}
