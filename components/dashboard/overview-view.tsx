"use client";

import Link from "next/link";

import {
  ActivityIcon,
  ArrowRightIcon,
  DatasetIcon,
  HistoryIcon,
  LayersIcon,
  ModelsIcon,
  PredictIcon,
  TargetIcon,
} from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import {
  decimal,
  formatWhen,
  percent,
  SPECIES_COLORS,
  SPECIES_LABELS,
  SPECIES_ORDER,
} from "@/lib/format";
import { useHistory } from "@/lib/use-history";
import { useSession } from "@/lib/use-session";

export function OverviewView({
  modelName,
  accuracy,
  macroF1,
  cvF1,
  datasetRows,
  trainRows,
  testRows,
  realRows,
  syntheticRows,
}: {
  modelName: string;
  accuracy: number;
  macroF1: number;
  cvF1: number;
  datasetRows: number;
  trainRows: number;
  testRows: number;
  realRows: number;
  syntheticRows: number;
}) {
  const { session } = useSession();
  const { entries, ready } = useHistory();

  const firstName = session?.name.split(" ")[0];
  const meanConfidence =
    entries.length > 0
      ? entries.reduce((sum, entry) => sum + entry.confidence, 0) /
        entries.length
      : null;
  const speciesSeen = new Set(entries.map((entry) => entry.species)).size;
  const recent = entries.slice(0, 5);
  const realShare = (realRows / datasetRows) * 100;

  return (
    <div className="dash-page">
      <PageHeader
        eyebrow="Overview"
        title={firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
        description="A snapshot of your workspace, the production model and the observations behind it."
      />

      <div className="dash-stats">
        <article className="dash-stat">
          <span className="dash-stat-icon">
            <ActivityIcon size={18} />
          </span>
          <span className="dash-stat-label">Predictions run</span>
          <strong className="dash-stat-value">
            {ready ? entries.length : "—"}
          </strong>
          <span className="dash-stat-note">Kept in this browser</span>
        </article>
        <article className="dash-stat">
          <span className="dash-stat-icon">
            <TargetIcon size={18} />
          </span>
          <span className="dash-stat-label">Mean confidence</span>
          <strong className="dash-stat-value">
            {ready
              ? meanConfidence === null
                ? "—"
                : percent(meanConfidence)
              : "—"}
          </strong>
          <span className="dash-stat-note">Across stored predictions</span>
        </article>
        <article className="dash-stat">
          <span className="dash-stat-icon">
            <LayersIcon size={18} />
          </span>
          <span className="dash-stat-label">Species seen</span>
          <strong className="dash-stat-value">
            {ready ? `${speciesSeen}/3` : "—"}
          </strong>
          <span className="dash-stat-note">Setosa · versicolor · virginica</span>
        </article>
        <article className="dash-stat">
          <span className="dash-stat-icon">
            <ModelsIcon size={18} />
          </span>
          <span className="dash-stat-label">Holdout accuracy</span>
          <strong className="dash-stat-value">{decimal(accuracy, 3)}</strong>
          <span className="dash-stat-note">30 real observations</span>
        </article>
      </div>

      <div className="overview-grid">
        <section className="panel overview-recent">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Recent predictions</h2>
              <span className="panel-sub">
                Your five most recent classifications
              </span>
            </div>
            <Link href="/dashboard/history" className="text-link">
              View all
              <ArrowRightIcon size={14} />
            </Link>
          </div>

          {!ready ? (
            <div className="overview-skeleton" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          ) : recent.length === 0 ? (
            <div className="overview-empty">
              <span className="overview-empty-icon">
                <PredictIcon size={22} />
              </span>
              <h3>No predictions yet</h3>
              <p>
                Enter four measurements and the result will appear here, with
                its confidence and timestamp.
              </p>
              <Link href="/dashboard/predict" className="btn btn-primary btn-sm">
                Classify a specimen
              </Link>
            </div>
          ) : (
            <ul className="recent-list">
              {recent.map((entry) => (
                <li key={entry.id}>
                  <span
                    className="recent-dot"
                    style={{ backgroundColor: SPECIES_COLORS[entry.species] }}
                    aria-hidden="true"
                  />
                  <div className="recent-main">
                    <strong>{SPECIES_LABELS[entry.species]}</strong>
                    <span>
                      Petal {entry.measurements.petal_length.toFixed(1)} ×{" "}
                      {entry.measurements.petal_width.toFixed(1)} cm ·{" "}
                      {formatWhen(entry.at)}
                    </span>
                  </div>
                  <span className="recent-confidence">
                    {percent(entry.confidence)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="overview-side">
          <div className="overview-model">
            <div className="overview-model-top">
              <span className="live-badge live-badge-light">
                <span className="live-dot" aria-hidden="true" />
                In production
              </span>
              <span className="overview-model-version">v1.0.0</span>
            </div>
            <h2>{modelName}</h2>
            <p>RBF kernel · 470 training rows · 30 real holdout rows</p>
            <dl className="overview-model-metrics">
              <div>
                <dt>CV macro F1</dt>
                <dd>{decimal(cvF1, 3)}</dd>
              </div>
              <div>
                <dt>Holdout F1</dt>
                <dd>{decimal(macroF1, 3)}</dd>
              </div>
            </dl>
            <Link href="/dashboard/models" className="overview-model-link">
              Inspect the model
              <ArrowRightIcon size={15} />
            </Link>
          </div>

          <section className="panel overview-quick">
            <div className="panel-head">
              <h2 className="panel-title">Quick actions</h2>
            </div>
            <div className="quick-list">
              <Link href="/dashboard/predict">
                <span className="quick-icon">
                  <PredictIcon size={17} />
                </span>
                <span>
                  <strong>Classify a specimen</strong>
                  <small>Four measurements, three probabilities</small>
                </span>
                <ArrowRightIcon size={15} />
              </Link>
              <Link href="/dashboard/dataset">
                <span className="quick-icon">
                  <DatasetIcon size={17} />
                </span>
                <span>
                  <strong>Review the dataset</strong>
                  <small>
                    {datasetRows} rows · {realRows} real · {syntheticRows}{" "}
                    synthetic
                  </small>
                </span>
                <ArrowRightIcon size={15} />
              </Link>
              <Link href="/dashboard/history">
                <span className="quick-icon">
                  <HistoryIcon size={17} />
                </span>
                <span>
                  <strong>Open the history</strong>
                  <small>Export or clear stored predictions</small>
                </span>
                <ArrowRightIcon size={15} />
              </Link>
            </div>
          </section>

          <section className="panel overview-balance">
            <div className="panel-head">
              <h2 className="panel-title">Dataset balance</h2>
              <span className="badge">{trainRows + testRows} rows</span>
            </div>
            <div className="balance-body">
              <div
                className="composition"
                role="img"
                aria-label={`${realRows} real and ${syntheticRows} synthetic rows`}
              >
                <div
                  className="composition-real"
                  style={{ width: `${realShare}%` }}
                />
                <div
                  className="composition-synthetic"
                  style={{ width: `${100 - realShare}%` }}
                />
              </div>
              <div className="balance-legend">
                <span>
                  <i style={{ background: "var(--ink)" }} /> Real · {realRows}
                </span>
                <span>
                  <i style={{ background: "#c9cec3" }} /> Synthetic ·{" "}
                  {syntheticRows}
                </span>
              </div>
              <div className="balance-classes">
                {SPECIES_ORDER.map((species) => (
                  <span key={species}>
                    <i style={{ background: SPECIES_COLORS[species] }} />
                    {SPECIES_LABELS[species]}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
