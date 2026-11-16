import Link from "next/link";

import { Predictor } from "@/components/predictor";
import { percent } from "@/lib/format";
import { scatter, summary } from "@/lib/model";

export default function HomePage() {
  const accuracy = summary.best.test.accuracy;

  return (
    <div className="shell page">
      <header className="page-head">
        <p className="eyebrow">Multiclass classification · scikit-learn</p>
        <h1 className="display">Measure the specimen.</h1>
        <p className="lede">
          Enter four measurements from an Iris flower. The tuned model returns
          the most likely species and a probability for each of the three
          classes.
        </p>
      </header>

      <div className="stats" aria-label="System summary">
        <div className="stat">
          <div className="stat-value">500</div>
          <div className="stat-label">Documented rows</div>
        </div>
        <div className="stat">
          <div className="stat-value">150 / 350</div>
          <div className="stat-label">Real / synthetic</div>
        </div>
        <div className="stat">
          <div className="stat-value">7</div>
          <div className="stat-label">Algorithms compared</div>
        </div>
        <div className="stat">
          <div className="stat-value">{percent(accuracy)}</div>
          <div className="stat-label">Holdout accuracy · 30 real</div>
        </div>
      </div>

      <div className="workbench">
        <Predictor
          modelName={summary.model.display}
          ranges={summary.dataset.feature_ranges}
          points={scatter.points}
        />
      </div>

      <section className="section" aria-labelledby="method-title">
        <div className="section-head">
          <h2 className="section-title" id="method-title">
            How the result is produced
          </h2>
          <Link className="quiet-link" href="/models">
            Full evaluation
          </Link>
        </div>
        <div className="grid-3">
          <article className="method-card">
            <p className="eyebrow">01 · Data</p>
            <p>
              150 real observations from scikit-learn and 350 synthetic rows.
              Every synthetic row is labelled, seeded and documented.
            </p>
            <Link className="quiet-link" href="/dataset">
              Dataset provenance
            </Link>
          </article>
          <article className="method-card">
            <p className="eyebrow">02 · Model</p>
            <p>
              Seven classifiers tuned with stratified five-fold
              cross-validation. The selected model is exported and runs on the
              server.
            </p>
            <Link className="quiet-link" href="/models">
              Model comparison
            </Link>
          </article>
          <article className="method-card">
            <p className="eyebrow">03 · Evaluation</p>
            <p>
              Accuracy, precision, recall and F1 are measured on 30 real
              observations withheld before generation and tuning.
            </p>
            <Link className="quiet-link" href="/models">
              Confusion matrix
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
}
