import Link from "next/link";
import type { Metadata } from "next";

import { ConfusionMatrixView } from "@/components/confusion-matrix";
import { Leaderboard } from "@/components/leaderboard";
import {
  ArrowRightIcon,
  CheckIcon,
  ShieldIcon,
} from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { decimal, SPECIES_LABELS, SPECIES_ORDER } from "@/lib/format";
import { summary } from "@/lib/model";

export const metadata: Metadata = {
  title: "Models",
};

export default function DashboardModelsPage() {
  const best = summary.best;
  const params = Object.entries(best.params)
    .map(([key, value]) => `${key} = ${value === null ? "auto" : value}`)
    .join(" · ");

  return (
    <div className="dash-page">
      <PageHeader
        eyebrow="Evaluation"
        title="Models & evaluation"
        description="Seven candidate classifiers tuned with stratified five-fold cross-validation, then reported once on 30 real holdout observations."
        actions={
          <Link href="/models" className="btn btn-ghost btn-sm">
            Full report
            <ArrowRightIcon size={15} />
          </Link>
        }
      />

      <div className="dash-stats">
        <article className="dash-stat">
          <span className="dash-stat-label">Holdout accuracy</span>
          <strong className="dash-stat-value">
            {decimal(best.test.accuracy, 3)}
          </strong>
          <span className="dash-stat-note">n = {best.test.n_test} real rows</span>
        </article>
        <article className="dash-stat">
          <span className="dash-stat-label">Macro F1</span>
          <strong className="dash-stat-value">
            {decimal(best.test.macro.f1, 3)}
          </strong>
          <span className="dash-stat-note">Equal weight per species</span>
        </article>
        <article className="dash-stat">
          <span className="dash-stat-label">CV macro F1</span>
          <strong className="dash-stat-value">
            {decimal(best.cv.macro_f1_mean, 3)}
          </strong>
          <span className="dash-stat-note">
            ± {decimal(best.cv.macro_f1_std, 3)} over 5 folds
          </span>
        </article>
        <article className="dash-stat">
          <span className="dash-stat-label">Training rows</span>
          <strong className="dash-stat-value">{summary.protocol.train_rows}</strong>
          <span className="dash-stat-note">120 real + 350 synthetic</span>
        </article>
      </div>

      <section className="panel dash-selected">
        <div className="panel-head">
          <div>
            <span className="panel-sub">Selected model</span>
            <h2 className="panel-title dash-panel-title">{best.display}</h2>
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
            <div className="metric">
              <span className="metric-value">
                {best.test.roc_auc_ovr_macro === null
                  ? "—"
                  : decimal(best.test.roc_auc_ovr_macro, 3)}
              </span>
              <span className="metric-label">ROC-AUC</span>
            </div>
          </div>
          <p className="param-line">{params}</p>
          <p className="field-hint" style={{ marginTop: 8 }}>
            Selected by the highest mean cross-validated macro F1; ties are
            broken by lower fold variance.
          </p>
        </div>
      </section>

      <div className="dash-grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Confusion matrix</h2>
            <span className="badge">Holdout · counts</span>
          </div>
          <div className="panel-body">
            <ConfusionMatrixView matrix={best.test.confusion_matrix} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Per-class metrics</h2>
            <span className="badge">Holdout</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">
                Precision, recall and F1 by species
              </caption>
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
                      <td className="num">{decimal(metrics.precision, 3)}</td>
                      <td className="num">{decimal(metrics.recall, 3)}</td>
                      <td className="num">{decimal(metrics.f1, 3)}</td>
                      <td className="num">{metrics.support}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="panel-foot">
            <ShieldIcon size={15} />
            No holdout row participates in tuning or synthetic generation.
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">All candidate models</h2>
          <span className="badge">Ordered by CV macro F1</span>
        </div>
        <Leaderboard models={summary.models} />
      </section>

      <div className="dash-note-row">
        <span>
          <CheckIcon size={15} /> 30 real holdout observations
        </span>
        <span>
          <CheckIcon size={15} /> 5-fold stratified cross-validation
        </span>
        <span>
          <CheckIcon size={15} /> Synthetic rows excluded from the holdout
        </span>
      </div>
    </div>
  );
}
