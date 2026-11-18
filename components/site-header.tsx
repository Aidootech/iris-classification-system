"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ArrowRightIcon } from "@/components/icons";
import { BrandMark } from "@/components/brand-mark";
import {
  initials,
  readSession,
  subscribeSession,
  type Session,
} from "@/lib/session";

const LINKS = [
  { href: "/#method", label: "Method" },
  { href: "/#species", label: "Species" },
  { href: "/models", label: "Models" },
  { href: "/dataset", label: "Dataset" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const dark = pathname === "/";
  const [session, setSession] = useState<Session | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setSession(readSession());
    update();
    return subscribeSession(update);
  }, []);

  useEffect(() => {
    if (!dark) return;

    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dark]);

  return (
    <header
      className={`site-header${dark ? " site-header-dark" : ""}${
        dark && scrolled ? " is-scrolled" : ""
      }`}
    >
      <div className="shell header-inner">
        <Link href="/" className="wordmark" aria-label="Iris Classifier home">
          <span className="wordmark-mark">
            <BrandMark size={30} />
          </span>
          <span className="wordmark-text">
            Iris <span>Classifier</span>
          </span>
        </Link>

        <nav className="main-nav" aria-label="Primary">
          {LINKS.map((link) => {
            const active =
              link.href !== "/#method" &&
              link.href !== "/#species" &&
              pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="main-nav-link"
                data-active={active ? "true" : undefined}
                aria-current={active ? "page" : undefined}
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
