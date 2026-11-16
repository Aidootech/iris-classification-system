import type { Metadata } from "next";

import { decimal, SPECIES_LABELS, SPECIES_ORDER } from "@/lib/format";
import { summary } from "@/lib/model";
import type { FeatureKey } from "@/lib/model/types";

export const metadata: Metadata = {
  title: "Dataset",
  description:
    "Composition, synthetic generation method and distribution checks for the 500-row Iris dataset.",
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

export default function DatasetPage() {
  const dataset = summary.dataset;
  const realShare = (dataset.real / dataset.rows) * 100;
  const syntheticShare = (dataset.synthetic / dataset.rows) * 100;

  return (
    <div className="shell page">
      <header className="page-head">
        <p className="eyebrow">Dataset · 500 rows</p>
        <h1 className="display">150 real, 350 synthetic.</h1>
        <p className="lede">
          The real observations come directly from scikit-learn. The synthetic
          rows are generated from the training split only, labelled
          individually, and excluded from the test set.
        </p>
      </header>

      <div className="stats" aria-label="Dataset summary">
        <div className="stat">
          <div className="stat-value">500</div>
          <div className="stat-label">Total rows</div>
        </div>
        <div className="stat">
          <div className="stat-value">150</div>
          <div className="stat-label">Real observations</div>
        </div>
        <div className="stat">
          <div className="stat-value">350</div>
          <div className="stat-label">Synthetic rows</div>
        </div>
        <div className="stat">
          <div className="stat-value">{dataset.duplicates}</div>
          <div className="stat-label">Exact duplicate vectors</div>
        </div>
      </div>

      <section className="panel" style={{ marginTop: 30 }}>
        <div className="panel-head">
          <h2 className="panel-title">Composition</h2>
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
              style={{ width: `${syntheticShare}%` }}
            />
          </div>
          <div className="split-legend">
            <span>
              <span
                className="legend-mark"
                style={{ backgroundColor: "var(--color-ink)" }}
              />
              Real · {dataset.real}
            </span>
            <span>
              <span
                className="legend-mark"
                style={{ backgroundColor: "#c3c3ca" }}
              />
              Synthetic · {dataset.synthetic}
            </span>
            <span className="muted">
              seed {dataset.seed} · {dataset.duplicates} duplicate feature
              vectors
            </span>
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
                  Train and test split composition
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

      <section className="section" aria-labelledby="generation-title">
        <div className="section-head">
          <h2 className="section-title" id="generation-title">
            Generation method
          </h2>
          <span className="mono" style={{ fontSize: 9.5, color: "var(--color-faint)" }}>
            no holdout rows used
          </span>
        </div>
        <ol className="method-list">
          <li>
            <span className="step-number">01</span>
            <div>
              <h3>Load the real data</h3>
              <p>
                All 150 observations are loaded from{" "}
                <code>sklearn.datasets.load_iris</code>; feature names and
                species labels are preserved.
              </p>
            </div>
          </li>
          <li>
            <span className="step-number">02</span>
            <div>
              <h3>Withhold the test rows first</h3>
              <p>
                A stratified split creates 120 real training rows and 30 real
                holdout rows, ten per species. The holdout is fixed before any
                synthetic data exists.
              </p>
            </div>
          </li>
          <li>
            <span className="step-number">03</span>
            <div>
              <h3>Fit one Gaussian per species</h3>
              <p>
                For each species, a four-dimensional mean vector and covariance
                matrix are estimated from its 40 real training rows only, with a
                small ridge term for numerical stability.
              </p>
            </div>
          </li>
          <li>
            <span className="step-number">04</span>
            <div>
              <h3>Draw and constrain</h3>
              <p>
                A seeded generator draws 117 setosa, 117 versicolor and 116
                virginica rows. Values are clipped to the observed per-feature
                range and rounded to 0.1 cm, matching the measurement precision
                of the original data.
              </p>
            </div>
          </li>
          <li>
            <span className="step-number">05</span>
            <div>
              <h3>Label every row</h3>
              <p>
                Synthetic records receive a <code>SYN-</code> identifier,{" "}
                <code>source = synthetic</code> and{" "}
                <code>synthetic_method = {dataset.synthetic_method}</code>. Real
                rows are marked <code>source = real</code>.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section className="section" aria-labelledby="ranges-title">
        <div className="section-head">
          <h2 className="section-title" id="ranges-title">
            Observed feature ranges
          </h2>
        </div>
        <div className="panel">
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">
                Observed feature ranges for the real observations
              </caption>
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  <th scope="col" className="num">
                    Minimum (cm)
                  </th>
                  <th scope="col" className="num">
                    Mean (cm)
                  </th>
                  <th scope="col" className="num">
                    Maximum (cm)
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
        </div>
      </section>

      <section className="section" aria-labelledby="fidelity-title">
        <div className="section-head">
          <h2 className="section-title" id="fidelity-title">
            Real versus synthetic distributions
          </h2>
        </div>
        <div className="panel">
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">
                Means and two-sample Kolmogorov-Smirnov tests comparing real
                training rows with synthetic rows
              </caption>
              <thead>
                <tr>
                  <th scope="col">Species</th>
                  <th scope="col">Feature</th>
                  <th scope="col" className="num">
                    Real mean
                  </th>
                  <th scope="col" className="num">
                    Synthetic mean
                  </th>
                  <th scope="col" className="num">
                    KS p-value
                  </th>
                </tr>
              </thead>
              <tbody>
                {SPECIES_ORDER.flatMap((species) =>
                  FEATURES.map((feature) => {
                    const stats = dataset.fidelity[species][feature];
                    return (
                      <tr key={`${species}-${feature}`}>
                        <td>{SPECIES_LABELS[species]}</td>
                        <td>{FEATURE_LABELS[feature]}</td>
                        <td className="num">{decimal(stats.real_mean, 2)}</td>
                        <td className="num">
                          {decimal(stats.synthetic_mean, 2)}
                        </td>
                        <td className="num">{decimal(stats.ks_pvalue, 2)}</td>
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className="table-note">
          The two-sample Kolmogorov-Smirnov test compares the 40 real training
          rows for each species with its synthetic rows. A p-value above 0.05
          indicates no detected difference at this sample size; it is not proof
          that the distributions are identical.
        </p>
      </section>

      <section className="section" aria-labelledby="distribution-figure-title">
        <div className="section-head">
          <h2 className="section-title" id="distribution-figure-title">
            Distribution check
          </h2>
        </div>
        <figure className="figure-card">
          <img
            src="/model/figures/feature_distributions.png"
            alt="Histograms comparing real observations, shown as outlines, with synthetic draws, shown as filled areas, for each of the four features"
          />
          <figcaption>
            Real observations are drawn as outlines; synthetic draws are the
            filled areas. Colours denote species.
          </figcaption>
        </figure>
      </section>

      <section className="section" aria-labelledby="download-title">
        <div className="section-head">
          <h2 className="section-title" id="download-title">
            Download and provenance
          </h2>
        </div>
        <div className="panel">
          <div className="panel-body download-row">
            <div>
              <p className="panel-title">iris_500.csv</p>
              <p className="field-hint" style={{ marginTop: 4 }}>
                SHA-256 {summary.model.dataset_sha256.slice(0, 16)}… · 500 rows
                · 10 columns
              </p>
            </div>
            <div className="download-actions">
              <a className="btn btn-ghost" href="/data/iris_500.csv" download>
                Download CSV
              </a>
              <a
                className="btn btn-ghost"
                href="/model/figures/dataset_overview.png"
                download
              >
                Download plot
              </a>
            </div>
          </div>
        </div>
        <div className="prose" style={{ marginTop: 20 }}>
          <p className="note">
            Synthetic observations are useful for demonstrating augmentation and
            class-conditional sampling, but they do not add independent
            biological evidence. All headline metrics come from the 30 real
            holdout observations. The full dataset card, model card and
            methodology are in <code>docs/</code> in the repository.
          </p>
        </div>
      </section>
    </div>
  );
}
