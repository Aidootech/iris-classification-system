"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import {
  CheckIcon,
  DownloadIcon,
  HistoryIcon,
  LogoutIcon,
  ShieldIcon,
  TrashIcon,
  UserIcon,
} from "@/components/icons";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { Toast, useToast } from "@/components/toast";
import { formatDate, percent, SPECIES_LABELS } from "@/lib/format";
import {
  clearHistory,
  historyToCsv,
  type HistoryEntry,
} from "@/lib/history";
import { clearSession, initials, writeAccount, writeSession } from "@/lib/session";
import { useHistory } from "@/lib/use-history";
import { useSession } from "@/lib/use-session";

function downloadCsv(entries: HistoryEntry[]) {
  const blob = new Blob([historyToCsv(entries)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "iris-history.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ProfileView() {
  const router = useRouter();
  const { session, ready } = useSession();
  const { entries } = useHistory();
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (session) setName(session.name);
  }, [session]);

  const mean =
    entries.length > 0
      ? entries.reduce((sum, entry) => sum + entry.confidence, 0) /
        entries.length
      : null;
  const distinct = new Set(entries.map((entry) => entry.species)).size;
  const mostSeen =
    entries.length > 0
      ? [...entries].sort(
          (a, b) =>
            entries.filter((entry) => entry.species === b.species).length -
            entries.filter((entry) => entry.species === a.species).length,
        )[0].species
      : null;

  function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || name.trim().length < 2) return;
    const nextName = name.trim();
    writeSession({ ...session, name: nextName });
    writeAccount({ name: nextName, email: session.email });
    setSaved(true);
  }

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  function handleClear() {
    clearHistory();
    setConfirmOpen(false);
    toast.show("Prediction history cleared.");
  }

  async function handleExport() {
    if (exporting || entries.length === 0) return;

    setExporting(true);
    // Give the action a visible working state before the file is written.
    await new Promise((resolve) => setTimeout(resolve, 850));
    downloadCsv(entries);
    setExporting(false);
    toast.show("CSV exported successfully!");
  }

  return (
    <div className="dash-page">
      <PageHeader
        eyebrow="Profile"
        title="Your profile"
        description="Manage the local demo account, review your prediction footprint and control the data stored in this browser."
      />

      <div className="profile-grid">
        <section className="panel profile-card">
          <div className="profile-identity">
            <span className="profile-avatar">
              {ready && session ? initials(session.name) : "IR"}
            </span>
            <div>
              <h2>{ready && session ? session.name : "Researcher"}</h2>
              <p>{ready && session ? session.email : "—"}</p>
              <span className="profile-badge">
                <ShieldIcon size={13} />
                Local demo account
              </span>
            </div>
          </div>

          <dl className="profile-facts">
            <div>
              <dt>Member since</dt>
              <dd>
                {ready && session ? formatDate(session.createdAt) : "—"}
              </dd>
            </div>
            <div>
              <dt>Account type</dt>
              <dd>Academic demo</dd>
            </div>
            <div>
              <dt>Selected model</dt>
              <dd>RBF support vector machine</dd>
            </div>
          </dl>

          <form className="profile-form" onSubmit={saveName}>
            <label className="auth-field">
              <span>Display name</span>
              <span className="auth-input-wrap">
                <UserIcon size={16} className="auth-input-icon" />
                <input
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setSaved(false);
                  }}
                  placeholder="Your name"
                  minLength={2}
                />
              </span>
            </label>
            <div className="profile-form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!session || name.trim().length < 2}
              >
                Save name
              </button>
              {saved ? (
                <span className="profile-saved">
                  <CheckIcon size={14} />
                  Saved
                </span>
              ) : null}
            </div>
          </form>
        </section>

        <div className="profile-side">
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Prediction footprint</h2>
              <span className="badge">This browser</span>
            </div>
            <div className="profile-stats">
              <div>
                <strong>{entries.length}</strong>
                <span>Predictions</span>
              </div>
              <div>
                <strong>{mean === null ? "—" : percent(mean)}</strong>
                <span>Mean confidence</span>
              </div>
              <div>
                <strong>{distinct}/3</strong>
                <span>Species seen</span>
              </div>
            </div>
            <div className="panel-foot">
              <HistoryIcon size={15} />
              {mostSeen
                ? `Most classified: ${SPECIES_LABELS[mostSeen]}`
                : "No predictions stored yet"}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Data & access</h2>
            </div>
            <div className="profile-actions">
              <button
                type="button"
                className="profile-action is-success"
                onClick={handleExport}
                disabled={entries.length === 0 || exporting}
                aria-busy={exporting}
              >
                <span className="profile-action-icon">
                  {exporting ? (
                    <span className="btn-spinner" aria-hidden="true" />
                  ) : (
                    <DownloadIcon size={17} />
                  )}
                </span>
                <span>
                  <strong>
                    {exporting
                      ? "Exporting history…"
                      : "Export prediction history"}
                  </strong>
                  <small>Download a CSV of every stored classification</small>
                </span>
              </button>
              <button
                type="button"
                className="profile-action is-danger"
                onClick={() => setConfirmOpen(true)}
                disabled={entries.length === 0}
              >
                <span className="profile-action-icon">
                  <TrashIcon size={17} />
                </span>
                <span>
                  <strong>Clear history</strong>
                  <small>Remove all locally stored predictions</small>
                </span>
              </button>
              <button
                type="button"
                className="profile-action is-signout"
                onClick={signOut}
              >
                <span className="profile-action-icon">
                  <LogoutIcon size={17} />
                </span>
                <span>
                  <strong>Sign out</strong>
                  <small>Return to the sign-in screen</small>
                </span>
              </button>
            </div>
            <div className="panel-foot">
              <ShieldIcon size={15} />
              Demo authentication only; no password is stored.
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Clear history?"
        description={`All ${entries.length} stored prediction${
          entries.length === 1 ? "" : "s"
        } will be permanently removed from this browser. This cannot be undone.`}
        confirmLabel="Clear history"
        onConfirm={handleClear}
        onCancel={() => setConfirmOpen(false)}
      />

      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </div>
  );
}
