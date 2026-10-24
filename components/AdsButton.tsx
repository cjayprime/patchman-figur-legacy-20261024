export default function AdsButton() {
  return (
    <button
      type="button"
      className="patchman-ads-control"
      aria-label="Watch ads to earn credits"
      title="Earn credits"
      data-patchman-modal="ads"
    >
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="2" y="5" width="23" height="18" rx="2" fill="#E3DEF5" stroke="#7045FF" strokeWidth="1.6" />
        <path d="m10 9 8 5-8 5z" fill="#7045FF" />
        <path d="M8 27h12" stroke="#7045FF" strokeWidth="1.6" />
        <circle cx="25" cy="23" r="6" fill="#DCC273" stroke="#80632B" strokeWidth="1.4" />
        <path d="M23 21h4m-2-1v6m-2-2h4" stroke="#80632B" strokeWidth="1.3" />
      </svg>
    </button>
  );
}
