"use client";

import Link from "next/link";
import { useState } from "react";

import {
  ArrowRightIcon,
  DownloadIcon,
  HistoryIcon,
  PredictIcon,
  TrashIcon,
} from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import {
  formatWhen,
  percent,
  SPECIES_COLORS,
  SPECIES_LABELS,
} from "@/lib/format";
import {
  clearHistory,
  historyToCsv,
  type HistoryEntry,
} from "@/lib/history";
import { useHistory } from "@/lib/use-history";

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

export function HistoryView() {
  const { entries, ready } = useHistory();
  const [confirming, setConfirming] = useState(false);

  const mean =
    entries.length > 0
      ? entries.reduce((sum, entry) => sum + entry.confidence, 0) /
        entries.length
      : null;
  const distinct = new Set(entries.map((entry) => entry.species)).size;

  function handleClear() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    clearHistory();
    setConfirming(false);
  }

  return (
    <div className="dash-page">
      <PageHeader
        eyebrow="History"
        title="Your prediction log"
        description="Every classification you run is kept locally with its measurements, confidence and model version."
        actions={
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => downloadCsv(entries)}
              disabled={entries.length === 0}
            >
              <DownloadIcon size={15} />
              Export CSV
            </button>
            <button
              type="button"
              className={`btn btn-sm ${
                confirming ? "btn-danger" : "btn-ghost"
              }`}
              onClick={handleClear}
              disabled={entries.length === 0}
              onBlur={() => setConfirming(false)}
            >
              <TrashIcon size={15} />
              {confirming ? "Confirm clear" : "Clear history"}
            </button>
          </>
        }
      />

      <div className="dash-stats dash-stats-three">
        <article className="dash-stat">
          <span className="dash-stat-icon">
            <HistoryIcon size={18} />
          </span>
          <span className="dash-stat-label">Stored predictions</span>
          <strong className="dash-stat-value">
            {ready ? entries.length : "—"}
          </strong>
          <span className="dash-stat-note">Maximum of 100 entries</span>
        </article>
        <article className="dash-stat">
          <span className="dash-stat-icon">
            <PredictIcon size={18} />
          </span>
          <span className="dash-stat-label">Mean confidence</span>
          <strong className="dash-stat-value">
            {ready ? (mean === null ? "—" : percent(mean)) : "—"}
          </strong>
          <span className="dash-stat-note">Across all stored results</span>
        </article>
        <article className="dash-stat">
          <span className="dash-stat-icon">
            <HistoryIcon size={18} />
          </span>
          <span className="dash-stat-label">Distinct species</span>
          <strong className="dash-stat-value">
            {ready ? `${distinct}/3` : "—"}
          </strong>
          <span className="dash-stat-note">Setosa · versicolor · virginica</span>
        </article>
      </div>

      <section className="panel history-panel">
        <div className="panel-head">
          <h2 className="panel-title">All predictions</h2>
          <span className="badge">Newest first</span>
        </div>

        {!ready ? (
          <div className="overview-skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        ) : entries.length === 0 ? (
          <div className="history-empty">
            <span className="overview-empty-icon">
              <HistoryIcon size={22} />
            </span>
            <h3>Your log is empty</h3>
            <p>
              Classify your first specimen and the result, measurements and
              confidence will be stored here.
            </p>
            <Link href="/dashboard/predict" className="btn btn-primary btn-sm">
              Run a prediction
              <ArrowRightIcon size={15} />
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table history-table">
              <caption className="sr-only">
                Stored predictions, newest first
              </caption>
              <thead>
                <tr>
                  <th scope="col">Species</th>
                  <th scope="col" className="num">
                    Confidence
                  </th>
                  <th scope="col" className="num">
                    Sepal (cm)
                  </th>
                  <th scope="col" className="num">
                    Petal (cm)
                  </th>
                  <th scope="col">Model</th>
                  <th scope="col">When</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <span className="history-species">
                        <i
                          style={{
                            backgroundColor: SPECIES_COLORS[entry.species],
                          }}
                        />
                        {SPECIES_LABELS[entry.species]}
                      </span>
                    </td>
                    <td className="num">{percent(entry.confidence)}</td>
                    <td className="num">
                      {entry.measurements.sepal_length.toFixed(1)} ×{" "}
                      {entry.measurements.sepal_width.toFixed(1)}
                    </td>
                    <td className="num">
                      {entry.measurements.petal_length.toFixed(1)} ×{" "}
                      {entry.measurements.petal_width.toFixed(1)}
                    </td>
                    <td className="history-model">{entry.model}</td>
                    <td className="history-when">{formatWhen(entry.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
