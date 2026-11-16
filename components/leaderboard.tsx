import { decimal } from "@/lib/format";
import type { ModelSummary } from "@/lib/model/types";

export function Leaderboard({ models }: { models: ModelSummary[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr-only">
          Model comparison, ordered by cross-validated macro F1. The holdout
          contains 30 real observations.
        </caption>
        <thead>
          <tr>
            <th scope="col">Model</th>
            <th scope="col" className="num">
              CV macro F1
            </th>
            <th scope="col" className="num">
              Real-only CV
            </th>
            <th scope="col" className="num">
              Accuracy
            </th>
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
              ROC-AUC
            </th>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr key={model.key} className={model.is_best ? "is-best" : undefined}>
              <td>
                <span className="model-cell">
                  <span className="model-name">{model.display}</span>
                  {model.is_best ? (
                    <span className="badge badge-accent">Selected</span>
                  ) : null}
                  {!model.eligible ? <span className="badge">Baseline</span> : null}
                </span>
              </td>
              <td className="num">
                {decimal(model.cv.macro_f1_mean, 3)}
                <span className="muted"> ± {decimal(model.cv.macro_f1_std, 3)}</span>
              </td>
              <td className="num">{decimal(model.real_cv.macro_f1_mean, 3)}</td>
              <td className="num">{decimal(model.test.accuracy, 3)}</td>
              <td className="num">{decimal(model.test.macro.precision, 3)}</td>
              <td className="num">{decimal(model.test.macro.recall, 3)}</td>
              <td className="num">{decimal(model.test.macro.f1, 3)}</td>
              <td className="num">
                {model.test.roc_auc_ovr_macro === null
                  ? "—"
                  : decimal(model.test.roc_auc_ovr_macro, 3)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
