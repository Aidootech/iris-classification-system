import { decimal } from "@/lib/format";
import type { ModelSummary } from "@/lib/model/types";

const FLOOR = 0.9;
const SPAN = 1 - FLOOR;

function position(value: number): number {
  const clamped = Math.min(1, Math.max(FLOOR, value));
  return ((clamped - FLOOR) / SPAN) * 100;
}

/**
 * A live comparison chart. All F1 scores sit above 0.95, so the axis starts at
 * 0.90 to make the differences between candidates legible.
 */
export function ScoreBars({ models }: { models: ModelSummary[] }) {
  return (
    <div className="scorebars">
      <div className="scorebars-head">
        <h3>Macro F1 by candidate</h3>
        <div className="scorebars-legend">
          <span>
            <i className="scorebars-key scorebars-key-cv" /> Cross-validated
          </span>
          <span>
            <i className="scorebars-key scorebars-key-holdout" /> Holdout
          </span>
        </div>
      </div>

      <div className="scorebars-axis" aria-hidden="true">
        <span>0.90</span>
        <span>0.925</span>
        <span>0.95</span>
        <span>0.975</span>
        <span>1.00</span>
      </div>

      <ul className="scorebars-list">
        {models.map((model) => (
          <li
            key={model.key}
            className="scorebar"
            data-best={model.is_best ? "true" : undefined}
          >
            <div className="scorebar-label">
              <span className="scorebar-name">{model.display}</span>
              {model.is_best ? (
                <span className="badge badge-accent">Selected</span>
              ) : null}
              {model.eligible ? null : <span className="badge">Baseline</span>}
            </div>
            <div
              className="scorebar-track"
              role="img"
              aria-label={`${model.display}: cross-validated macro F1 ${decimal(
                model.cv.macro_f1_mean,
                3,
              )}, holdout macro F1 ${decimal(model.test.macro.f1, 3)}`}
            >
              <span
                className="scorebar-holdout"
                style={{ width: `${position(model.test.macro.f1)}%` }}
              />
              <span
                className="scorebar-cv"
                style={{ left: `${position(model.cv.macro_f1_mean)}%` }}
              />
            </div>
            <div className="scorebar-values">
              <span>
                CV <strong>{decimal(model.cv.macro_f1_mean, 3)}</strong>
              </span>
              <span>
                Holdout <strong>{decimal(model.test.macro.f1, 3)}</strong>
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="scorebars-note">
        The axis begins at 0.90 so that differences between the top candidates
        remain visible. Both bars use macro-averaged F1.
      </p>
    </div>
  );
}
