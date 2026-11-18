"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  ActivityIcon,
  ArrowRightIcon,
  DatasetIcon,
  HistoryIcon,
  LayersIcon,
  ModelsIcon,
  PlusIcon,
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
import { confidenceTier, SPECIES_INFO } from "@/lib/species";
import { useHistory } from "@/lib/use-history";
import { useSession } from "@/lib/use-session";

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

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
  classCounts,
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
  classCounts: Record<
    (typeof SPECIES_ORDER)[number],
    { real: number; synthetic: number; total: number }
  >;
}) {
  const { session } = useSession();
  const { entries, ready } = useHistory();
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(
      hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening",
    );
  }, []);

  const firstName = session?.name.split(" ")[0];
  const meanConfidence =
    entries.length > 0
      ? entries.reduce((sum, entry) => sum + entry.confidence, 0) /
        entries.length
      : null;
  const speciesSeen = new Set(entries.map((entry) => entry.species)).size;
  const recent = entries.slice(0, 4);
  const realShare = (realRows / datasetRows) * 100;

  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(day.getDate() - (6 - index));
    return day;
  });
  const buckets = days.map((day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const dayEntries = entries.filter(
      (entry) => entry.at >= day.getTime() && entry.at < next.getTime(),
    );
    return {
      day,
      count: dayEntries.length,
      confidence:
        dayEntries.length > 0
          ? dayEntries.reduce((sum, entry) => sum + entry.confidence, 0) /
            dayEntries.length
          : null,
    };
  });
  const weekCount = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const weekConfidence =
    weekCount > 0
      ? entries
          .filter((entry) => entry.at >= days[0].getTime())
          .reduce((sum, entry) => sum + entry.confidence, 0) / weekCount
      : null;
  const peak = Math.max(1, ...buckets.map((bucket) => bucket.count));

  const previousStart = new Date(today);
  previousStart.setDate(previousStart.getDate() - 14);
  const previousCount = entries.filter(
    (entry) =>
      entry.at >= previousStart.getTime() && entry.at < days[0].getTime(),
  ).length;
  const delta =
    previousCount > 0
      ? Math.round(((weekCount - previousCount) / previousCount) * 100)
      : null;

  const weekday = new Intl.DateTimeFormat("en", { weekday: "narrow" });
  const fullDate = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="dash-page">
      <PageHeader
        eyebrow="Overview"
        title={firstName ? `${greeting}, ${firstName}.` : `${greeting}.`}
        description="Everything in one place: your classification activity, the production model and the dataset behind it."
        actions={
          <Link href="/dashboard/predict" className="btn btn-primary btn-sm">
            <PlusIcon size={15} />
            New prediction
          </Link>
        }
      />

      <div className="ov-grid">
        <div className="ov-main">
          <section className="ov-card ov-activity" aria-labelledby="activity-title">
            <div className="ov-card-top">
              <div className="ov-title-row">
                <span className="ov-title-icon">
                  <ActivityIcon size={18} />
                </span>
                <div>
                  <h2 id="activity-title">Prediction activity</h2>
                  <p>Classifications run in this browser, last seven days.</p>
                </div>
              </div>
              <span className="ov-chip">Last 7 days</span>
            </div>

            <div
              className="ov-chart"
              role="img"
              aria-label={`${weekCount} predictions in the last seven days`}
            >
              {buckets.map((bucket, index) => {
                const height =
                  bucket.count > 0
                    ? Math.max(14, (bucket.count / peak) * 100)
                    : 0;
                const isToday = index === buckets.length - 1;
                return (
                  <div
                    className="ov-col"
                    key={bucket.day.toISOString()}
                    data-today={isToday ? "true" : undefined}
                    title={`${fullDate.format(bucket.day)} · ${bucket.count} ${
                      bucket.count === 1 ? "prediction" : "predictions"
                    }`}
                  >
                    <span className="ov-col-value">
                      {bucket.count > 0 ? bucket.count : ""}
                    </span>
                    <div className="ov-col-track">
                      <span
                        className="ov-col-bar"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="ov-col-label">
                      {weekday.format(bucket.day)}
                    </span>
                  </div>
                );
              })}
            </div>

            {weekCount === 0 ? (
              <p className="ov-activity-empty">
                No predictions this week yet. Your first result will appear
                here.{" "}
                <Link href="/dashboard/predict">Classify a specimen</Link>
              </p>
            ) : null}

            <div className="ov-activity-foot">
              <div className="ov-activity-total">
                <strong>{weekCount}</strong>
                <span>
                  {weekCount === 1 ? "prediction" : "predictions"} this week
                </span>
              </div>
              <div className="ov-activity-meta">
                {delta !== null ? (
                  <span
                    className="ov-delta"
                    data-tone={delta >= 0 ? "up" : "down"}
                  >
                    {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% vs previous week
                  </span>
                ) : (
                  <span className="ov-delta" data-tone="flat">
                    {previousCount === 0 && weekCount > 0
                      ? "First active week"
                      : "No prior activity"}
                  </span>
                )}
                <span className="ov-mean">
                  <TargetIcon size={14} />
                  {weekConfidence === null
                    ? "No confidence yet"
                    : `${percent(weekConfidence)} mean confidence`}
                </span>
              </div>
            </div>
          </section>

          <div className="ov-duo">
            <section className="ov-card ov-model" aria-labelledby="model-title">
              <div className="ov-card-top">
                <div>
                  <span className="ov-kicker">Production model</span>
                  <h2 id="model-title">{modelName}</h2>
                </div>
                <span className="ov-live">
                  <span className="live-dot" aria-hidden="true" />
                  Live
                </span>
              </div>
              <p className="ov-card-sub">
                RBF kernel · model v1.0.0 · {trainRows} training rows
              </p>

              <div className="ov-meters">
                <div className="ov-meter">
                  <div className="ov-meter-head">
                    <span>Holdout accuracy</span>
                    <strong>{decimal(accuracy, 3)}</strong>
                  </div>
                  <span className="ov-meter-track">
                    <span style={{ width: `${accuracy * 100}%` }} />
                  </span>
                </div>
                <div className="ov-meter">
                  <div className="ov-meter-head">
                    <span>Holdout macro F1</span>
                    <strong>{decimal(macroF1, 3)}</strong>
                  </div>
                  <span className="ov-meter-track">
                    <span style={{ width: `${macroF1 * 100}%` }} />
                  </span>
                </div>
                <div className="ov-meter">
                  <div className="ov-meter-head">
                    <span>CV macro F1</span>
                    <strong>{decimal(cvF1, 3)}</strong>
                  </div>
                  <span className="ov-meter-track">
                    <span style={{ width: `${cvF1 * 100}%` }} />
                  </span>
                </div>
              </div>

              <Link href="/dashboard/models" className="ov-link">
                Inspect the evaluation
                <ArrowRightIcon size={14} />
              </Link>
            </section>

            <section
              className="ov-card ov-dataset"
              aria-labelledby="dataset-title"
            >
              <div className="ov-card-top">
                <div>
                  <span className="ov-kicker">Dataset</span>
                  <h2 id="dataset-title">{datasetRows} documented rows</h2>
                </div>
                <span className="ov-chip">
                  {realRows} real · {syntheticRows} synthetic
                </span>
              </div>

              <div
                className="ov-balance-bar"
                role="img"
                aria-label={`${realRows} real and ${syntheticRows} synthetic rows`}
              >
                <span
                  className="ov-balance-real"
                  style={{ width: `${realShare}%` }}
                />
                <span className="ov-balance-synthetic" />
              </div>
              <div className="ov-balance-legend">
                <span>
                  <i className="ov-dot-real" /> Real
                </span>
                <span>
                  <i className="ov-dot-synthetic" /> Synthetic
                </span>
                <span className="ov-balance-split">
                  {trainRows} train · {testRows} holdout
                </span>
              </div>

              <ul className="ov-classes">
                {SPECIES_ORDER.map((species) => {
                  const counts = classCounts[species];
                  return (
                    <li key={species}>
                      <span
                        className="ov-class-dot"
                        style={{ backgroundColor: SPECIES_COLORS[species] }}
                      />
                      <span className="ov-class-name">
                        {SPECIES_LABELS[species]}
                      </span>
                      <span className="ov-class-count">
                        {counts.total}
                        <small>/ {datasetRows}</small>
                      </span>
                    </li>
                  );
                })}
              </ul>

              <Link href="/dashboard/dataset" className="ov-link">
                Review the dataset
                <ArrowRightIcon size={14} />
              </Link>
            </section>
          </div>
        </div>

        <aside className="ov-side">
          <section
            className="ov-card ov-recent"
            aria-labelledby="recent-title"
          >
            <div className="ov-card-top">
              <div>
                <h2 id="recent-title">Recent predictions</h2>
                <p>Your latest classifications.</p>
              </div>
              <Link href="/dashboard/history" className="ov-text-link">
                View all
              </Link>
            </div>

            {!ready ? (
              <div className="ov-skeleton" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            ) : recent.length === 0 ? (
              <div className="ov-recent-empty">
                <span className="ov-empty-icon">
                  <PredictIcon size={20} />
                </span>
                <h3>No predictions yet</h3>
                <p>
                  Enter four measurements and the result will appear here with
                  its confidence and timestamp.
                </p>
                <Link
                  href="/dashboard/predict"
                  className="btn btn-primary btn-sm"
                >
                  Classify a specimen
                </Link>
              </div>
            ) : (
              <ul className="ov-recent-list">
                {recent.map((entry) => {
                  const tier = confidenceTier(entry.confidence);
                  return (
                    <li key={entry.id}>
                      <span className="ov-recent-img">
                        <Image
                          src={SPECIES_INFO[entry.species].image}
                          alt=""
                          fill
                          unoptimized
                          sizes="44px"
                        />
                      </span>
                      <div className="ov-recent-main">
                        <strong>{SPECIES_LABELS[entry.species]}</strong>
                        <span>
                          Petal {entry.measurements.petal_length.toFixed(1)} ×{" "}
                          {entry.measurements.petal_width.toFixed(1)} cm
                        </span>
                        <small>{formatWhen(entry.at)}</small>
                      </div>
                      <span className="ov-recent-conf" data-tone={tier.tone}>
                        {percent(entry.confidence)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="ov-card ov-quick" aria-labelledby="quick-title">
            <div className="ov-card-top">
              <div>
                <h2 id="quick-title">Quick actions</h2>
                <p>Jump back into the workspace.</p>
              </div>
            </div>
            <div className="ov-quick-list">
              <Link href="/dashboard/predict">
                <span className="ov-quick-icon">
                  <PredictIcon size={17} />
                </span>
                <span>
                  <strong>Classify a specimen</strong>
                  <small>Four measurements, three probabilities</small>
                </span>
                <ArrowRightIcon size={15} />
              </Link>
              <Link href="/dashboard/models">
                <span className="ov-quick-icon">
                  <ModelsIcon size={17} />
                </span>
                <span>
                  <strong>Compare the models</strong>
                  <small>Seven candidates on one holdout</small>
                </span>
                <ArrowRightIcon size={15} />
              </Link>
              <Link href="/dashboard/history">
                <span className="ov-quick-icon">
                  <HistoryIcon size={17} />
                </span>
                <span>
                  <strong>Open the history</strong>
                  <small>Export or clear stored predictions</small>
                </span>
                <ArrowRightIcon size={15} />
              </Link>
            </div>
            <div className="ov-quick-foot">
              <span>
                <LayersIcon size={14} /> 7 classifiers compared
              </span>
              <span>
                <DatasetIcon size={14} /> 500 documented rows
              </span>
            </div>
          </section>

          <section className="ov-card ov-footnote">
            <span className="ov-footnote-icon">
              <HistoryIcon size={16} />
            </span>
            <div>
              <strong>{entries.length} of 100 history slots used</strong>
              <p>History and account data stay in this browser.</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
