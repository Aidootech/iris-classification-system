"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import {
  ChevronDownIcon,
  CloseIcon,
  DatasetIcon,
  HistoryIcon,
  LogoutIcon,
  MenuIcon,
  ModelsIcon,
  OverviewIcon,
  PredictIcon,
  ProfileIcon,
  SearchIcon,
} from "@/components/icons";
import {
  clearSession,
  initials,
  readSession,
  subscribeSession,
  type Session,
} from "@/lib/session";

const NAV = [
  {
    href: "/dashboard",
    label: "Overview",
    description: "Workspace summary and recent activity",
    icon: OverviewIcon,
    exact: true,
  },
  {
    href: "/dashboard/predict",
    label: "Predict",
    description: "Classify a specimen from four measurements",
    icon: PredictIcon,
  },
  {
    href: "/dashboard/models",
    label: "Models",
    description: "Leaderboard, holdout metrics and confusion matrix",
    icon: ModelsIcon,
  },
  {
    href: "/dashboard/dataset",
    label: "Dataset",
    description: "Composition, splits and feature ranges",
    icon: DatasetIcon,
  },
  {
    href: "/dashboard/history",
    label: "History",
    description: "Stored predictions and CSV export",
    icon: HistoryIcon,
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    description: "Account details and local data controls",
    icon: ProfileIcon,
  },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export function DashboardShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchWrap = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sync = () => {
      const current = readSession();
      setSession(current);
      if (!current) router.replace("/login");
    };
    sync();
    setReady(true);
    return subscribeSession(sync);
  }, [router]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (
        searchWrap.current &&
        !searchWrap.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.current?.focus();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  if (!ready || !session) {
    return (
      <div className="dash-loading">
        <span className="dash-loading-mark">
          <BrandMark height={48} />
        </span>
        <span>Opening workspace…</span>
      </div>
    );
  }

  const avatar = initials(session.name);
  const normalized = query.trim().toLowerCase();
  const results = normalized
    ? NAV.filter((item) =>
        `${item.label} ${item.description}`.toLowerCase().includes(normalized),
      )
    : NAV;

  function submitSearch() {
    if (results.length > 0) {
      router.push(results[0].href);
      setQuery("");
      setSearchOpen(false);
    }
  }

  return (
    <div className="ws">
      <div className="ws-shell">
        <aside className="ws-side" aria-label="Dashboard">
          <Link href="/" className="ws-brand" aria-label="Iris Classifier home">
            <BrandMark height={46} priority />
          </Link>

          <p className="ws-side-label">Workspace</p>
          <nav className="ws-nav">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="ws-nav-link"
                  data-active={active ? "true" : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ws-side-foot">
            <span className="ws-side-user-text">
              <strong>{session.name}</strong>
              <small>{session.email}</small>
            </span>
            <button
              type="button"
              className="ws-side-signout"
              onClick={signOut}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogoutIcon size={16} />
            </button>
          </div>
        </aside>

        <div className="ws-body">
          <header className="ws-bar">
            <button
              type="button"
              className="ws-menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <MenuIcon size={18} />
            </button>

            <div
              className="ws-search"
              ref={searchWrap}
              data-open={searchOpen ? "true" : undefined}
            >
              <SearchIcon size={15} className="ws-search-icon" />
              <input
                ref={searchInput}
                type="search"
                className="ws-search-input"
                value={query}
                placeholder="Search workspace"
                aria-label="Search workspace"
                aria-expanded={searchOpen}
                aria-controls="ws-search-results"
                autoComplete="off"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submitSearch();
                  }
                  if (event.key === "Escape") {
                    setQuery("");
                    setSearchOpen(false);
                    event.currentTarget.blur();
                  }
                }}
              />
              <kbd className="ws-kbd" aria-hidden="true">
                ⌘K
              </kbd>

              {searchOpen ? (
                <div className="ws-search-panel" id="ws-search-results">
                  <p className="ws-search-label">
                    {normalized ? "Results" : "Jump to"}
                  </p>
                  {results.length > 0 ? (
                    results.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="ws-search-item"
                          onClick={() => {
                            setQuery("");
                            setSearchOpen(false);
                          }}
                        >
                          <span className="ws-search-item-icon">
                            <Icon size={16} />
                          </span>
                          <span>
                            <strong>{item.label}</strong>
                            <small>{item.description}</small>
                          </span>
                        </Link>
                      );
                    })
                  ) : (
                    <p className="ws-search-empty">
                      No page matches “{query.trim()}”.
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="ws-tools">
              <Link
                href="/dashboard/profile"
                className="ws-avatar"
                aria-label={`Open ${session.name}'s profile`}
                title={session.name}
              >
                {avatar}
              </Link>
            </div>
          </header>

          <main className="ws-main">
            <div className="ws-content">{children}</div>
          </main>
        </div>
      </div>

      {menuOpen ? (
        <button
          type="button"
          className="ws-scrim"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <aside
        className={`ws-drawer${menuOpen ? " is-open" : ""}`}
        aria-label="Dashboard navigation"
        aria-hidden={menuOpen ? undefined : true}
        inert={menuOpen ? undefined : true}
      >
        <div className="ws-drawer-head">
          <span className="ws-brand">
            <BrandMark height={40} />
          </span>
          <button
            type="button"
            className="ws-drawer-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <p className="ws-drawer-label">Workspace</p>
        <nav className="ws-drawer-nav">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="ws-drawer-link"
                data-active={active ? "true" : undefined}
                aria-current={active ? "page" : undefined}
              >
                <span className="ws-drawer-icon">
                  <Icon size={17} />
                </span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <ChevronDownIcon size={14} className="ws-drawer-chevron" />
              </Link>
            );
          })}
        </nav>

        <div className="ws-drawer-foot">
          <div className="ws-drawer-user">
            <span className="ws-avatar">{avatar}</span>
            <span>
              <strong>{session.name}</strong>
              <small>{session.email}</small>
            </span>
          </div>
          <button type="button" className="ws-drawer-signout" onClick={signOut}>
            <LogoutIcon size={16} />
            Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}
