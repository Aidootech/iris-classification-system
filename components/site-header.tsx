import Link from "next/link";

import { Nav } from "./nav";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="wordmark" aria-label="Iris Classifier home">
          <span className="wordmark-square" aria-hidden="true" />
          Iris Classifier
          <span className="wordmark-version">v1.0</span>
        </Link>
        <Nav />
      </div>
    </header>
  );
}
