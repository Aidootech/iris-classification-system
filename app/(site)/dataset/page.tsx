import type { Metadata } from "next";

import { ClassDistribution } from "@/components/class-distribution";
import {
  FEATURE_LABELS,
  FEATURE_ORDER,
  FeatureRanges,
} from "@/components/feature-ranges";
import { Reveal } from "@/components/reveal";
import { decimal, SPECIES_LABELS, SPECIES_ORDER } from "@/lib/format";
import { summary } from "@/lib/model";

export const metadata: Metadata = {
  title: "Dataset",
  description:
    "Composition, synthetic generation method and distribution checks for the 500-row Iris dataset.",
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

      <Reveal>
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
      </Reveal>

      <Reveal delay={60}>
        <section className="panel" aria-labelledby="composition-title">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Composition</p>
              <h2 className="panel-title" id="composition-title">
                Real observations and seeded synthetic rows
              </h2>
            </div>
            <span className="badge">{dataset.synthetic_method}</span>
          </div>
          <div className="panel-body">
            <div
              className="composition composition-lg"
              role="img"
              aria-label={`${dataset.real} real rows and ${dataset.synthetic} synthetic rows`}
            >
              <div
                className="composition-real"
                style={{ width: `${realShare}%` }}
              >
                <span>{dataset.real} real</span>
              </div>
              <div
                className="composition-synthetic"
                style={{ width: `${syntheticShare}%` }}
              >
                <span>{dataset.synthetic} synthetic</span>
              </div>
            </div>
            <div className="split-legend">
              <span>
                <span
                  className="legend-mark"
                  style={{ backgroundColor: "var(--color-accent)" }}
                />
                Real observations · {dataset.real}
              </span>
              <span>
                <span
                  className="legend-mark"
                  style={{ backgroundColor: "#c3c9c2" }}
                />
                Synthetic rows · {dataset.synthetic}
              </span>
              <span className="muted">
                seed {dataset.seed} · {dataset.duplicates} duplicate feature
                vectors
              </span>
            </div>

            <div className="dataset-columns">
              <div>
                <h3 className="dataset-subtitle">Species balance</h3>
                <ClassDistribution counts={dataset.class_counts} />
              </div>

              <div>
                <h3 className="dataset-subtitle">Split composition</h3>
                <div className="table-wrap">
                  <table className="table">
                    <caption className="sr-only">
                      Real, synthetic and total counts by species
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
                    <tfoot>
                      <tr>
                        <td>Training set</td>
                        <td className="num">120</td>
                        <td className="num">350</td>
                        <td className="num">{dataset.train}</td>
                      </tr>
                      <tr>
                        <td>Holdout</td>
                        <td className="num">30</td>
                        <td className="num">0</td>
                        <td className="num">{dataset.test}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="section" aria-labelledby="ranges-title">
          <div className="section-head">
            <h2 className="section-title" id="ranges-title">
              Observed feature ranges
            </h2>
            <span className="section-meta">150 real rows · centimetres</span>
          </div>
          <div className="panel">
            <div className="panel-body">
              <FeatureRanges ranges={dataset.feature_ranges} />
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="section" aria-labelledby="generation-title">
          <div className="section-head">
            <h2 className="section-title" id="generation-title">
              Generation method
            </h2>
            <span className="section-meta">No holdout rows used</span>
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
                  matrix are estimated from its 40 real training rows only, with
                  a small ridge term for numerical stability.
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
                  <code>synthetic_method = {dataset.synthetic_method}</code>.
                  Real rows are marked <code>source = real</code>.
                </p>
              </div>
            </li>
          </ol>
        </section>
      </Reveal>

      <Reveal>
        <section className="section" aria-labelledby="fidelity-title">
          <div className="section-head">
            <h2 className="section-title" id="fidelity-title">
              Real versus synthetic distributions
            </h2>
            <span className="section-meta">Two-sample KS test</span>
          </div>
          <div className="panel table-panel">
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
                    <th scope="col">Check</th>
                  </tr>
                </thead>
                <tbody>
                  {SPECIES_ORDER.flatMap((species) =>
                    FEATURE_ORDER.map((feature) => {
                      const stats = dataset.fidelity[species][feature];
                      const pass = stats.ks_pvalue > 0.05;
                      return (
                        <tr key={`${species}-${feature}`}>
                          <td>{SPECIES_LABELS[species]}</td>
                          <td>{FEATURE_LABELS[feature]}</td>
                          <td className="num">
                            {decimal(stats.real_mean, 2)}
                          </td>
                          <td className="num">
                            {decimal(stats.synthetic_mean, 2)}
                          </td>
                          <td className="num">
                            {decimal(stats.ks_pvalue, 2)}
                          </td>
                          <td>
                            <span
                              className={`ks-badge${
                                pass ? " is-pass" : " is-gap"
                              }`}
                            >
                              {pass ? "No gap detected" : "Check"}
                            </span>
                          </td>
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
            indicates no detected difference at this sample size; it is not
            proof that the distributions are identical.
          </p>
        </section>
      </Reveal>

      <Reveal>
        <section className="section" aria-labelledby="distribution-figure-title">
          <div className="section-head">
            <h2 className="section-title" id="distribution-figure-title">
              Distribution check
            </h2>
            <span className="section-meta">Generated by the training pipeline</span>
          </div>
          <figure className="figure-card figure-wide">
            <img
              src="/model/figures/feature_distributions.png"
              alt="Histograms comparing real observations, shown as outlines, with synthetic draws, shown as filled areas, for each of the four features"
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              <span>
                Real observations are drawn as outlines; synthetic draws are the
                filled areas. Colours denote species.
              </span>
              <a
                href="/model/figures/feature_distributions.png"
                target="_blank"
                rel="noreferrer"
              >
                Open full size
              </a>
            </figcaption>
          </figure>
        </section>
      </Reveal>

      <Reveal>
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
                <p className="panel-note">
                  500 rows · 10 columns · SHA-256{" "}
                  {summary.model.dataset_sha256.slice(0, 16)}…
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
              Synthetic observations are useful for demonstrating augmentation
              and class-conditional sampling, but they do not add independent
              biological evidence. All headline metrics come from the 30 real
              holdout observations. The full dataset card, model card and
              methodology are in <code>docs/</code> in the repository.
            </p>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
