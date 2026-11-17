import Image from "next/image";
import Link from "next/link";

import { Predictor } from "@/components/predictor";
import { decimal } from "@/lib/format";
import { scatter, summary } from "@/lib/model";

export default function HomePage() {
  const best = summary.best;

  return (
    <>
      <section className="hero-photo" aria-labelledby="hero-title">
        <Image
          className="hero-photo-img"
          src="/hero-meadow.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
        />
        <div className="hero-photo-wash" aria-hidden="true" />

        <div className="shell hero-photo-inner">
          <p className="hero-tag">
            <span className="hero-tag-dot" aria-hidden="true" />
            In production · Support Vector Machine
          </p>
          <h1 className="hero-title" id="hero-title">
            Measure the <em>specimen.</em>
          </h1>
          <p className="hero-lede">
            Four measurements are all it takes. The tuned support vector machine
            returns the most likely species and a calibrated probability for
            each of the three classes.
          </p>
          <div className="hero-actions">
            <a className="btn btn-light" href="#workbench">
              Classify a specimen
            </a>
            <Link className="btn btn-glass" href="/models">
              Explore the evaluation
            </Link>
          </div>
        </div>

        <div className="shell hero-strip-wrap">
          <dl className="hero-strip">
            <div>
              <dt>Training rows</dt>
              <dd>{summary.protocol.train_rows}</dd>
            </div>
            <div>
              <dt>Holdout accuracy</dt>
              <dd>{decimal(best.test.accuracy, 3)}</dd>
            </div>
            <div>
              <dt>CV macro F1</dt>
              <dd>{decimal(best.cv.macro_f1_mean, 3)}</dd>
            </div>
            <div>
              <dt>Algorithms compared</dt>
              <dd>7</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="shell home-body">
        <div className="workbench" id="workbench">
          <Predictor
            modelName={summary.model.display}
            ranges={summary.dataset.feature_ranges}
            points={scatter.points}
          />
        </div>

        <section className="section" aria-labelledby="method-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Method</p>
              <h2 className="section-title" id="method-title">
                How the result is produced
              </h2>
            </div>
            <Link className="quiet-link" href="/models">
              Full evaluation
            </Link>
          </div>
          <div className="grid-3">
            <article className="method-card">
              <span className="method-number">01</span>
              <h3>Documented data</h3>
              <p>
                150 real observations from scikit-learn and 350 synthetic rows.
                Every synthetic row is labelled, seeded and documented.
              </p>
              <Link className="quiet-link" href="/dataset">
                Dataset provenance
              </Link>
            </article>
            <article className="method-card">
              <span className="method-number">02</span>
              <h3>Tuned model</h3>
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
              <span className="method-number">03</span>
              <h3>Held-out evaluation</h3>
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
    </>
  );
}
