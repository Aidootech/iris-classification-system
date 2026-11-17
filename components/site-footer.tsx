import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <span className="footer-title">Iris Classification System</span>
          <p>
            Seven classifiers compared on 500 documented observations, with a
            tuned support vector machine in production.
          </p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link href="/">Predict</Link>
          <Link href="/models">Models</Link>
          <Link href="/dataset">Dataset</Link>
        </nav>
        <div className="footer-meta">
          <span>150 real · 350 synthetic</span>
          <span>scikit-learn 1.9.1</span>
          <span>Model v1.0.0</span>
        </div>
      </div>
      <div className="shell footer-base">
        <span>Academic demonstration · not for botanical decisions</span>
        <span>Dataset SHA-256 622e1404…</span>
      </div>
    </footer>
  );
}
