import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-top">
        <div className="footer-brand">
          <span className="footer-wordmark">
            <BrandMark size={28} />
            Iris Classifier
          </span>
          <p>
            Seven classifiers compared on 500 documented observations, with a
            tuned support vector machine in production.
          </p>
          <span className="footer-note">Academic demonstration</span>
        </div>

        <div className="footer-cols">
          <div className="footer-col">
            <span className="footer-label">Product</span>
            <Link href="/">Home</Link>
            <Link href="/models">Models</Link>
            <Link href="/dataset">Dataset</Link>
          </div>
          <div className="footer-col">
            <span className="footer-label">Account</span>
            <Link href="/login">Sign in</Link>
            <Link href="/signup">Create account</Link>
            <Link href="/dashboard">Dashboard</Link>
          </div>
          <div className="footer-col">
            <span className="footer-label">Resources</span>
            <a href="/data/iris_500.csv" download>
              Dataset CSV
            </a>
            <a
              href="https://github.com/Aidootech/iris-classification-system"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <span>Model v1.0.0</span>
          </div>
        </div>
      </div>

      <div className="shell footer-base">
        <span>© 2026 Iris Classifier · Not for botanical decisions</span>
        <span>150 real · 350 synthetic · scikit-learn 1.9.1</span>
      </div>
    </footer>
  );
}
