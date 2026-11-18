import Image from "next/image";
import Link from "next/link";

import {
  ArrowRightIcon,
  DatasetIcon,
  LayersIcon,
  ModelsIcon,
  ShieldIcon,
  TargetIcon,
} from "@/components/icons";
import { BrandMark } from "@/components/brand-mark";
import { Reveal } from "@/components/reveal";
import { SpeciesShowcase } from "@/components/species-showcase";
import { decimal } from "@/lib/format";
import { summary } from "@/lib/model";

export default function HomePage() {
  const best = summary.best;

  return (
    <>
      <section className="landing-hero" aria-labelledby="landing-title">
        <Image
          className="landing-hero-img"
          src="/landing-bg.jpg"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
        />
        <div className="landing-hero-shade" aria-hidden="true" />

        <div className="shell landing-hero-inner">
          <div className="landing-copy">
            <p className="hero-pill">
              <span className="hero-pill-dot" aria-hidden="true" />
              Iris classification system
            </p>
            <h1 className="landing-title" id="landing-title">
              Measure the flower.
              <br />
              <em>Know the species.</em>
            </h1>
            <p className="landing-lede">
              Four measurements, one tuned model, and a clear probability for
              every species. Built on a documented 500-row dataset and evaluated
              on observations the model has never seen.
            </p>
            <div className="landing-actions">
              <Link href="/signup" className="btn btn-light btn-lg">
                Get started
                <ArrowRightIcon size={16} />
              </Link>
              <Link href="/models" className="btn btn-glass btn-lg">
                Explore the model
              </Link>
            </div>
            <dl className="landing-proof">
              <div>
                <dt>Documented rows</dt>
                <dd>500</dd>
              </div>
              <div>
                <dt>Classifiers</dt>
                <dd>7</dd>
              </div>
              <div>
                <dt>CV macro F1</dt>
                <dd>{decimal(best.cv.macro_f1_mean, 3)}</dd>
              </div>
            </dl>
          </div>

          <aside className="model-float" aria-label="Selected model summary">
            <div className="model-float-head">
              <span className="live-badge">
                <span className="live-dot" aria-hidden="true" />
                In production
              </span>
              <span className="model-float-version">
                v{summary.model.version}
              </span>
            </div>
            <h2>{summary.model.display}</h2>
            <p>RBF kernel · standardised inputs · Platt-scaled probabilities</p>
            <dl className="model-float-list">
              <div>
                <dt>Holdout accuracy</dt>
                <dd>{decimal(best.test.accuracy, 3)}</dd>
              </div>
              <div>
                <dt>Holdout macro F1</dt>
                <dd>{decimal(best.test.macro.f1, 3)}</dd>
              </div>
              <div>
                <dt>Training rows</dt>
                <dd>{summary.protocol.train_rows}</dd>
              </div>
              <div>
                <dt>Real holdout</dt>
                <dd>{summary.protocol.test_rows}</dd>
              </div>
            </dl>
            <Link href="/models" className="model-float-link">
              Read the evaluation
              <ArrowRightIcon size={15} />
            </Link>
          </aside>
        </div>

        <div className="landing-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 130" preserveAspectRatio="none">
            <path d="M0,112 C260,112 380,20 720,20 C1040,20 1180,96 1440,96 L1440,130 L0,130 Z" />
          </svg>
        </div>
      </section>

      <section className="landing-section" id="method">
        <div className="shell">
          <Reveal className="landing-intro">
            <div>
              <p className="eyebrow">The workflow</p>
              <h2 className="landing-h2">
                From four measurements to a defensible answer.
              </h2>
            </div>
            <p className="landing-intro-body">
              The system pairs a documented dataset with a tuned classifier and
              an interface that makes the result inspectable. Nothing is hidden
              behind the prediction: the probabilities, the model and the
              evaluation are all visible.
            </p>
          </Reveal>

          <div className="landing-features">
            <Reveal delay={0}>
              <article className="feature-card">
                <span className="feature-icon">
                  <DatasetIcon size={20} />
                </span>
                <span className="feature-number">01</span>
                <h3>Documented data</h3>
                <p>
                  150 real observations from scikit-learn and 350 synthetic rows,
                  each labelled, seeded and generated only from the training
                  split.
                </p>
                <Link href="/dataset" className="text-link">
                  Dataset provenance
                  <ArrowRightIcon size={14} />
                </Link>
              </article>
            </Reveal>

            <Reveal delay={90}>
              <article className="feature-card">
                <span className="feature-icon">
                  <LayersIcon size={20} />
                </span>
                <span className="feature-number">02</span>
                <h3>Tuned model</h3>
                <p>
                  Seven classifiers compared with stratified five-fold
                  cross-validation. The selected RBF support vector machine is
                  exported and served directly.
                </p>
                <Link href="/models" className="text-link">
                  Model comparison
                  <ArrowRightIcon size={14} />
                </Link>
              </article>
            </Reveal>

            <Reveal delay={180}>
              <article className="feature-card">
                <span className="feature-icon">
                  <ShieldIcon size={20} />
                </span>
                <span className="feature-number">03</span>
                <h3>Held-out evaluation</h3>
                <p>
                  Accuracy, precision, recall and F1 are measured on 30 real
                  observations withheld before generation and tuning, with a full
                  confusion matrix.
                </p>
                <Link href="/models" className="text-link">
                  Confusion matrix
                  <ArrowRightIcon size={14} />
                </Link>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="landing-section showcase-section" aria-labelledby="species-title">
        <div className="shell">
          <Reveal className="landing-intro showcase-intro">
            <div>
              <p className="eyebrow">The genus Iris</p>
              <h2 className="landing-h2" id="species-title">
                Three species, three silhouettes.
              </h2>
            </div>
            <p className="landing-intro-body">
              Setosa is compact and unmistakable. Versicolor and virginica sit
              closer together, and their measurements overlap — which is exactly
              where a calibrated classifier earns its keep. Browse the three
              profiles, then compare them in the model report.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <SpeciesShowcase />
          </Reveal>
        </div>
      </section>

      <section className="landing-section landing-section-tight">
        <div className="shell">
          <Reveal>
            <div className="landing-banner">
              <div className="landing-banner-copy">
                <p className="eyebrow eyebrow-light">Selected model</p>
                <h2>{best.display}</h2>
                <p>
                  Chosen by the highest mean cross-validated macro F1. Every
                  prediction is a calibrated probability across the three
                  species, not a bare label.
                </p>
                <Link href="/models" className="btn btn-light btn-sm">
                  Read the evaluation
                  <ArrowRightIcon size={15} />
                </Link>
              </div>
              <dl className="banner-metrics">
                <div>
                  <dt>Holdout accuracy</dt>
                  <dd>{decimal(best.test.accuracy, 3)}</dd>
                </div>
                <div>
                  <dt>Macro F1</dt>
                  <dd>{decimal(best.test.macro.f1, 3)}</dd>
                </div>
                <div>
                  <dt>Macro precision</dt>
                  <dd>{decimal(best.test.macro.precision, 3)}</dd>
                </div>
                <div>
                  <dt>Macro recall</dt>
                  <dd>{decimal(best.test.macro.recall, 3)}</dd>
                </div>
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="landing-section">
        <div className="shell">
          <Reveal>
            <div className="landing-cta">
              <span className="cta-mark">
                <BrandMark height={50} />
              </span>
              <p className="eyebrow">Your workspace</p>
              <h2>Your specimen, classified in seconds.</h2>
              <p>
                Create an account to run predictions, keep a private history and
                watch the model&apos;s confidence on every measurement you enter.
              </p>
              <div className="landing-cta-actions">
                <Link href="/signup" className="btn btn-primary btn-lg">
                  Create an account
                  <ArrowRightIcon size={16} />
                </Link>
                <Link href="/login" className="btn btn-ghost btn-lg">
                  Sign in
                </Link>
              </div>
              <div className="landing-cta-notes">
                <span>
                  <TargetIcon size={15} /> Calibrated probabilities
                </span>
                <span>
                  <ModelsIcon size={15} /> Seven models compared
                </span>
                <span>
                  <ShieldIcon size={15} /> No data leaves your browser
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
