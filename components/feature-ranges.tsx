import { decimal } from "@/lib/format";
import type { FeatureKey } from "@/lib/model/types";

export const FEATURE_ORDER: FeatureKey[] = [
  "sepal_length_cm",
  "sepal_width_cm",
  "petal_length_cm",
  "petal_width_cm",
];

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  sepal_length_cm: "Sepal length",
  sepal_width_cm: "Sepal width",
  petal_length_cm: "Petal length",
  petal_width_cm: "Petal width",
};

const DOMAIN_MAX = 8;

type Range = { min: number; max: number; mean: number };

/**
 * Horizontal range plot for the observed real measurements. The shared 0–8 cm
 * axis makes the four features directly comparable.
 */
export function FeatureRanges({
  ranges,
}: {
  ranges: Record<FeatureKey, Range>;
}) {
  return (
    <div className="ranges">
      <div className="ranges-head">
        <span>Feature</span>
        <span className="ranges-head-axis">Observed range (cm)</span>
        <span className="ranges-head-values">Min · Mean · Max</span>
      </div>

      <div className="ranges-rows">
        {FEATURE_ORDER.map((feature) => {
          const range = ranges[feature];
          const left = (range.min / DOMAIN_MAX) * 100;
          const width = Math.max(
            2,
            ((range.max - range.min) / DOMAIN_MAX) * 100,
          );
          const mean = (range.mean / DOMAIN_MAX) * 100;

          return (
            <div className="range-row" key={feature}>
              <span className="range-label">{FEATURE_LABELS[feature]}</span>
              <div
                className="range-track"
                role="img"
                aria-label={`${FEATURE_LABELS[feature]} ranges from ${decimal(
                  range.min,
                  1,
                )} to ${decimal(range.max, 1)} centimetres, mean ${decimal(
                  range.mean,
                  1,
                )}`}
              >
                <span className="range-bar" style={{ left: `${left}%`, width: `${width}%` }} />
                <span
                  className="range-mean"
                  style={{ left: `${mean}%` }}
                  title={`Mean ${decimal(range.mean, 1)} cm`}
                />
              </div>
              <span className="range-values">
                <b>{decimal(range.min, 1)}</b>
                <span>{decimal(range.mean, 1)}</span>
                <b>{decimal(range.max, 1)}</b>
              </span>
            </div>
          );
        })}
      </div>

      <div className="ranges-axis" aria-hidden="true">
        {[0, 2, 4, 6, 8].map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
      <p className="ranges-note">
        Bars span the observed minimum to maximum of the 150 real rows. The dot
        marks the mean; the shared axis starts at 0 cm.
      </p>
    </div>
  );
}
