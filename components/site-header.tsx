import Link from "next/link";

import { Nav } from "./nav";

function Mark() {
  return (
    <svg
      className="wordmark-mark"
      viewBox="0 0 20 20"
      width="19"
      height="19"
      aria-hidden="true"
    >
      <g fill="currentColor">
        <ellipse cx="10" cy="5.7" rx="2.6" ry="4" />
        <ellipse cx="10" cy="14.3" rx="2.6" ry="4" />
        <ellipse cx="5.7" cy="10" rx="4" ry="2.6" />
        <ellipse cx="14.3" cy="10" rx="4" ry="2.6" />
      </g>
      <circle cx="10" cy="10" r="1.25" fill="var(--color-clay)" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="wordmark" aria-label="Iris Classifier home">
          <Mark />
          Iris Classifier
          <span className="wordmark-version">v1.0</span>
        </Link>
        <Nav />
      </div>
    </header>
  );
}
