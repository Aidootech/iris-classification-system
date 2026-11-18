import type { Metadata } from "next";

import { ConfusionMatrixView } from "@/components/confusion-matrix";
import { Leaderboard } from "@/components/leaderboard";
import { Reveal } from "@/components/reveal";
import { ScoreBars } from "@/components/score-bars";
import { decimal, SPECIES_LABELS, SPECIES_ORDER } from "@/lib/format";
import { summary } from "@/lib/model";

export const metadata: Metadata = {
  title: "Models",
  description:
    "Cross-validated comparison, holdout metrics and confusion matrices for seven Iris classification algorithms.",
};

export default function ModelsPage() {
  const best = summary.best;
  const parameterLine = Object.entries(best.params)
    .map(([key, value]) => `${key} = ${value === null ? "auto" : value}`)
    .join(" · ");

  return (
    <div className="shell page">
      <header className="page-head">
        <p className="eyebrow">Evaluation</p>
        <h1 className="display">Seven algorithms, one holdout.</h1>
        <p className="lede">
          Candidate models were tuned with stratified five-fold
          cross-validation on 470 training rows. The 30 real holdout
          observations were used once, for reporting.
        </p>
      </header>

      <Reveal>
        <div className="stats" aria-label="Selected model summary">
          <div className="stat">
            <div className="stat-value">{decimal(best.test.accuracy, 3)}</div>
            <div className="stat-label">Holdout accuracy</div>
          </div>
          <div className="stat">
            <div className="stat-value">{decimal(best.test.macro.f1, 3)}</div>
            <div className="stat-label">Holdout macro F1</div>
          </div>
          <div className="stat">
            <div className="stat-value">
              {decimal(best.cv.macro_f1_mean, 3)}
            </div>
            <div className="stat-label">CV macro F1</div>
          </div>
          <div className="stat">
            <div className="stat-value">{best.test.n_test}</div>
            <div className="stat-label">Real test observations</div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <section className="panel selected-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Selected model</p>
              <h2 className="section-title">{best.display}</h2>
            </div>
            <span className="badge badge-accent">
              <span className="badge-dot" aria-hidden="true" />
              Tuned · 5-fold CV
            </span>
          </div>
          <div className="panel-body">
            <div className="metric-grid">
              <div className="metric">
                <span className="metric-value">
                  {decimal(best.test.accuracy, 3)}
                </span>
                <span className="metric-label">Accuracy</span>
              </div>
              <div className="metric">
                <span className="metric-value">
                  {decimal(best.test.macro.precision, 3)}
                </span>
                <span className="metric-label">Macro precision</span>
              </div>
              <div className="metric">
                <span className="metric-value">
                  {decimal(best.test.macro.recall, 3)}
                </span>
                <span className="metric-label">Macro recall</span>
              </div>
              <div className="metric">
                <span className="metric-value">
                  {decimal(best.test.macro.f1, 3)}
                </span>
                <span className="metric-label">Macro F1</span>
              </div>
            </div>
            <p className="param-line">{parameterLine}</p>
            <p className="panel-note">
              Selected by the highest mean cross-validated macro F1 among
              eligible models; ties are broken by lower fold variance.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="section" aria-labelledby="scores-title">
          <div className="section-head">
            <h2 className="section-title" id="scores-title">
              Score comparison
            </h2>
            <span className="section-meta">
              holdout n = {summary.protocol.test_rows}
            </span>
          </div>
          <div className="panel">
            <div className="panel-body">
              <ScoreBars models={summary.models} />
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="section" aria-labelledby="leaderboard-title">
          <div className="section-head">
            <h2 className="section-title" id="leaderboard-title">
              Leaderboard
            </h2>
            <span className="section-meta">
              Ordered by CV macro F1
            </span>
          </div>
          <div className="panel table-panel">
            <Leaderboard models={summary.models} />
          </div>
          <p className="table-note">
            Accuracy, precision, recall and F1 are holdout figures; precision,
            recall and F1 are macro averages. The baseline is shown for context
            and was not eligible for selection. Scroll the table sideways if
            your screen is narrow.
          </p>
        </section>
      </Reveal>

      <Reveal>
        <section className="section" aria-labelledby="confusion-title">
          <div className="section-head">
            <h2 className="section-title" id="confusion-title">
              Confusion matrix and per-class results
            </h2>
            <span className="section-meta">30 real observations</span>
          </div>
          <div className="split-grid">
            <div className="panel">
              <div className="panel-head">
                <h3 className="panel-title">Best model · counts</h3>
                <span className="badge">{best.display}</span>
              </div>
              <div className="panel-body">
                <ConfusionMatrixView matrix={best.test.confusion_matrix} />
              </div>
            </div>
            <div className="panel">
              <div className="panel-head">
                <h3 className="panel-title">Per-class metrics</h3>
                <span className="badge">Holdout</span>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Species</th>
                      <th scope="col" className="num">
                        Precision
                      </th>
                      <th scope="col" className="num">
                        Recall
                      </th>
                      <th scope="col" className="num">
                        F1
                      </th>
                      <th scope="col" className="num">
                        Support
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {SPECIES_ORDER.map((species) => {
                      const metrics = best.test.per_class[species];
                      return (
                        <tr key={species}>
                          <td>{SPECIES_LABELS[species]}</td>
                          <td className="num">
                            {decimal(metrics.precision, 3)}
                          </td>
                          <td className="num">{decimal(metrics.recall, 3)}</td>
                          <td className="num">{decimal(metrics.f1, 3)}</td>
                          <td className="num">{metrics.support}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="section" aria-labelledby="figures-title">
          <div className="section-head">
            <h2 className="section-title" id="figures-title">
              Report figures
            </h2>
            <span className="section-meta">Generated by the training pipeline</span>
          </div>
          <div className="figure-stack">
            <figure className="figure-card">
              <img
                src="/model/figures/model_comparison.png"
                alt="Horizontal bar chart comparing cross-validated and holdout macro F1 for each candidate model"
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                <span>
                  Cross-validated macro F1 on 470 training rows against holdout
                  macro F1 on 30 real observations.
                </span>
                <a
                  href="/model/figures/model_comparison.png"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open full size
                </a>
              </figcaption>
            </figure>
            <figure className="figure-card">
              <img
                src="/model/figures/confusion_matrices_all.png"
                alt="Grid of holdout confusion matrices for each eligible model"
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                <span>
                  Holdout confusion matrices for all seven eligible models. Rows
                  are true species; columns are predicted species.
                </span>
                <a
                  href="/model/figures/confusion_matrices_all.png"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open full size
                </a>
              </figcaption>
            </figure>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="section" aria-labelledby="protocol-title">
          <div className="section-head">
            <h2 className="section-title" id="protocol-title">
              Protocol
            </h2>
          </div>
          <div className="prose">
            <p>
              Each candidate is a scikit-learn pipeline with the preprocessing
              appropriate to its family: standardisation for the linear,
              instance-based and kernel models, and raw features for the
              probabilistic and tree-based models. Hyperparameters are chosen by
              grid search with {summary.protocol.cv_folds}-fold stratified
              cross-validation, scored by macro F1 so each species carries equal
              weight.
            </p>
            <p>
              The reported accuracy, precision, recall, F1 and confusion matrix
              come from a single pass over the 30 real observations in the
              holdout. No holdout row participates in synthetic generation,
              hyperparameter selection or model fitting.
            </p>
            <p className="note">
              The synthetic rows make the training set larger and more regular,
              but they are not independent biological observations. See the{" "}
              <a href="/dataset">dataset page</a> for the generation method and
              for the real-versus-synthetic distribution checks.
            </p>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
