import Link from "next/link";
import type { Metadata } from "next";

import {
  ArrowRightIcon,
  CheckIcon,
  DownloadIcon,
  LayersIcon,
  ShieldIcon,
} from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { decimal, SPECIES_LABELS, SPECIES_ORDER } from "@/lib/format";
import { summary } from "@/lib/model";
import type { FeatureKey } from "@/lib/model/types";

export const metadata: Metadata = {
  title: "Dataset",
};

const FEATURES: FeatureKey[] = [
  "sepal_length_cm",
  "sepal_width_cm",
  "petal_length_cm",
  "petal_width_cm",
];

const FEATURE_LABELS: Record<FeatureKey, string> = {
  sepal_length_cm: "Sepal length",
  sepal_width_cm: "Sepal width",
  petal_length_cm: "Petal length",
  petal_width_cm: "Petal width",
};

export default function DashboardDatasetPage() {
  const dataset = summary.dataset;
  const realShare = (dataset.real / dataset.rows) * 100;

  return (
    <div className="dash-page">
      <PageHeader
        eyebrow="Dataset"
        title="Dataset provenance"
        description="500 observations: 150 real rows from scikit-learn and 350 synthetic rows generated only from the training split."
        actions={
          <>
            <a
              className="btn btn-ghost btn-sm"
              href="/data/iris_500.csv"
              download
            >
              <DownloadIcon size={15} />
              Download CSV
            </a>
            <Link href="/dataset" className="btn btn-primary btn-sm">
              Full provenance
              <ArrowRightIcon size={15} />
            </Link>
          </>
        }
      />

      <div className="dash-stats">
        <article className="dash-stat">
          <span className="dash-stat-label">Total rows</span>
          <strong className="dash-stat-value">{dataset.rows}</strong>
          <span className="dash-stat-note">10 columns per row</span>
        </article>
        <article className="dash-stat">
          <span className="dash-stat-label">Real observations</span>
          <strong className="dash-stat-value">{dataset.real}</strong>
          <span className="dash-stat-note">From scikit-learn</span>
        </article>
        <article className="dash-stat">
          <span className="dash-stat-label">Synthetic rows</span>
          <strong className="dash-stat-value">{dataset.synthetic}</strong>
          <span className="dash-stat-note">Seeded · labelled</span>
        </article>
        <article className="dash-stat">
          <span className="dash-stat-label">Duplicate vectors</span>
          <strong className="dash-stat-value">{dataset.duplicates}</strong>
          <span className="dash-stat-note">Exact duplicate feature rows</span>
        </article>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="panel-sub">Composition</span>
            <h2 className="panel-title dash-panel-title">
              {dataset.real} real, {dataset.synthetic} synthetic
            </h2>
          </div>
          <span className="badge">{dataset.synthetic_method}</span>
        </div>
        <div className="panel-body">
          <div
            className="composition"
            role="img"
            aria-label={`${dataset.real} real rows and ${dataset.synthetic} synthetic rows`}
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
          <div className="split-legend">
            <span>
              <span
                className="legend-mark"
                style={{ backgroundColor: "var(--ink)" }}
              />
              Real · {dataset.real}
            </span>
            <span>
              <span
                className="legend-mark"
                style={{ backgroundColor: "#c9cec3" }}
              />
              Synthetic · {dataset.synthetic}
            </span>
            <span className="muted">seed {dataset.seed}</span>
          </div>

          <div className="split-grid" style={{ marginTop: 22 }}>
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">
                  Real and synthetic counts by species
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Species</th>
                    <th scope="col" className="num">
                      Real
                    </th>
                    <th scope="col" className="num">
                      Synthetic
                    </th>
                    <th scope="col" className="num">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SPECIES_ORDER.map((species) => {
                    const counts = dataset.class_counts[species];
                    return (
                      <tr key={species}>
                        <td>{SPECIES_LABELS[species]}</td>
                        <td className="num">{counts.real}</td>
                        <td className="num">{counts.synthetic}</td>
                        <td className="num">{counts.total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">
                  Train and holdout composition
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Split</th>
                    <th scope="col" className="num">
                      Rows
                    </th>
                    <th scope="col">Composition</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Training</td>
                    <td className="num">{dataset.train}</td>
                    <td>120 real + 350 synthetic</td>
                  </tr>
                  <tr>
                    <td>Holdout</td>
                    <td className="num">{dataset.test}</td>
                    <td>30 real, 10 per species</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <div className="dash-grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Observed feature ranges</h2>
            <span className="badge">Real rows</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">
                Observed minimum, mean and maximum for each feature
              </caption>
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  <th scope="col" className="num">
                    Min
                  </th>
                  <th scope="col" className="num">
                    Mean
                  </th>
                  <th scope="col" className="num">
                    Max
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature) => {
                  const range = dataset.feature_ranges[feature];
                  return (
                    <tr key={feature}>
                      <td>{FEATURE_LABELS[feature]}</td>
                      <td className="num">{decimal(range.min, 1)}</td>
                      <td className="num">{decimal(range.mean, 1)}</td>
                      <td className="num">{decimal(range.max, 1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="panel-foot">
            All measurements in centimetres, rounded to 0.1 cm.
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Generation method</h2>
            <span className="badge">No holdout rows used</span>
          </div>
          <div className="panel-body">
            <ol className="dash-steps">
              <li>
                <span className="step-number">01</span>
                <div>
                  <h3>Withhold the test rows first</h3>
                  <p>
                    120 real training rows and 30 real holdout rows are fixed
                    before any synthetic data exists.
                  </p>
                </div>
              </li>
              <li>
                <span className="step-number">02</span>
                <div>
                  <h3>Fit one Gaussian per species</h3>
                  <p>
                    Mean vectors and covariance matrices use the 40 real
                    training rows per species and a small ridge term.
                  </p>
                </div>
              </li>
              <li>
                <span className="step-number">03</span>
                <div>
                  <h3>Draw, clip and label</h3>
                  <p>
                    350 seeded draws are clipped to observed ranges, rounded to
                    0.1 cm and marked with a SYN- identifier.
                  </p>
                </div>
              </li>
            </ol>
          </div>
          <div className="panel-foot">
            <LayersIcon size={15} />
            {dataset.synthetic_method}
          </div>
        </section>
      </div>

      <div className="dash-note-row">
        <span>
          <CheckIcon size={15} /> 500 rows · SHA-256 {summary.model.dataset_sha256.slice(0, 12)}…
        </span>
        <span>
          <CheckIcon size={15} /> Holdout excluded from generation
        </span>
        <span>
          <ShieldIcon size={15} /> Not for botanical decisions
        </span>
      </div>
    </div>
  );
}
