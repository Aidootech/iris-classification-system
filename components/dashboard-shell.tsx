"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  ArrowRightIcon,
  CloseIcon,
  DatasetIcon,
  HistoryIcon,
  IrisMark,
  LogoutIcon,
  MenuIcon,
  ModelsIcon,
  OverviewIcon,
  PredictIcon,
  ProfileIcon,
} from "@/components/icons";
import {
  clearSession,
  initials,
  readSession,
  subscribeSession,
  type Session,
} from "@/lib/session";

const WORKSPACE_NAV = [
  { href: "/dashboard", label: "Overview", icon: OverviewIcon, exact: true },
  { href: "/dashboard/predict", label: "Predict", icon: PredictIcon },
  { href: "/dashboard/models", label: "Models", icon: ModelsIcon },
  { href: "/dashboard/dataset", label: "Dataset", icon: DatasetIcon },
];

const ACCOUNT_NAV = [
  { href: "/dashboard/history", label: "History", icon: HistoryIcon },
  { href: "/dashboard/profile", label: "Profile", icon: ProfileIcon },
];

const TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/predict": "Predict",
  "/dashboard/models": "Models",
  "/dashboard/dataset": "Dataset",
  "/dashboard/history": "History",
  "/dashboard/profile": "Profile",
};

function pageTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  const match = Object.keys(TITLES)
    .filter((key) => key !== "/dashboard")
    .find((key) => pathname.startsWith(key));
  return match ? TITLES[match] : "Workspace";
}

export function DashboardShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => {
    const sync = () => {
      const current = readSession();
      setSession(current);
      if (!current) router.replace("/login");
    };
    sync();
    setReady(true);
    setToday(
      new Intl.DateTimeFormat("en", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date()),
    );
    return subscribeSession(sync);
  }, [router]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  if (!ready || !session) {
    return (
      <div className="dash-loading">
        <span className="dash-loading-mark">
          <IrisMark size={26} />
        </span>
        <span>Opening workspace…</span>
      </div>
    );
  }

  const title = pageTitle(pathname);
  const avatar = initials(session.name);

  const renderItem = (item: (typeof WORKSPACE_NAV)[number]) => {
    const active = item.exact
      ? pathname === item.href
      : pathname.startsWith(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className="dash-nav-link"
        data-active={active ? "true" : undefined}
        aria-current={active ? "page" : undefined}
      >
        <Icon size={18} />
        <span>{item.label}</span>
        {active ? <span className="dash-nav-active-dot" aria-hidden="true" /> : null}
      </Link>
    );
  };

  return (
    <div className="dash">
      <aside className={`dash-sidebar${open ? " is-open" : ""}`}>
        <div className="dash-sidebar-head">
          <Link href="/" className="dash-brand" aria-label="Iris Classifier home">
            <span className="dash-brand-mark">
              <IrisMark size={20} />
            </span>
            <span className="dash-brand-text">
              Iris <span>Classifier</span>
            </span>
          </Link>
          <button
            type="button"
            className="dash-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <nav className="dash-nav" aria-label="Dashboard">
          <span className="dash-nav-label">Workspace</span>
          {WORKSPACE_NAV.map(renderItem)}
          <span className="dash-nav-label">Account</span>
          {ACCOUNT_NAV.map(renderItem)}
        </nav>

        <div className="dash-sidebar-foot">
          <div className="dash-model-note">
            <span className="live-dot" aria-hidden="true" />
            RBF SVC · model v1.0.0
          </div>
          <Link href="/dashboard/profile" className="dash-user">
            <span className="dash-avatar">{avatar}</span>
            <span className="dash-user-text">
              <strong>{session.name}</strong>
              <small>{session.email}</small>
            </span>
          </Link>
          <button type="button" className="dash-signout" onClick={signOut}>
            <LogoutIcon size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          className="dash-scrim"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <div className="dash-main">
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <button
              type="button"
              className="dash-menu"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <MenuIcon size={19} />
            </button>
            <span className="dash-crumb">
              <span className="dash-crumb-root">Workspace</span>
              <span className="dash-crumb-sep" aria-hidden="true">
                /
              </span>
              <strong>{title}</strong>
            </span>
          </div>
          <div className="dash-topbar-right">
            <span className="dash-date">{today}</span>
            {pathname === "/dashboard/predict" ? null : (
              <Link href="/dashboard/predict" className="btn btn-primary btn-sm">
                New prediction
                <ArrowRightIcon size={15} />
              </Link>
            )}
            <Link
              href="/dashboard/profile"
              className="dash-topbar-avatar"
              aria-label="Open profile"
            >
              {avatar}
            </Link>
          </div>
        </header>

        <div className="dash-content">{children}</div>
      </div>
    </div>
  );
}
