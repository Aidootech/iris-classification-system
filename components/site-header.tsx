"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ArrowRightIcon, IrisMark } from "@/components/icons";
import { initials, readSession, subscribeSession, type Session } from "@/lib/session";

const LINKS = [
  { href: "/#method", label: "Method" },
  { href: "/models", label: "Models" },
  { href: "/dataset", label: "Dataset" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const dark = pathname === "/";
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const update = () => setSession(readSession());
    update();
    return subscribeSession(update);
  }, []);

  return (
    <header className={`site-header${dark ? " site-header-dark" : ""}`}>
      <div className="shell header-inner">
        <Link href="/" className="wordmark" aria-label="Iris Classifier home">
          <span className="wordmark-mark">
            <IrisMark size={21} />
          </span>
          <span className="wordmark-text">
            Iris <span>Classifier</span>
          </span>
        </Link>

        <nav className="main-nav" aria-label="Primary">
          {LINKS.map((link) => {
            const active =
              link.href !== "/#method" && pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="main-nav-link"
                data-active={active ? "true" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="header-actions">
          {session ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              <span className="header-avatar" aria-hidden="true">
                {initials(session.name)}
              </span>
              Dashboard
              <ArrowRightIcon size={15} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="header-signin">
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
