import { SPECIES_COLORS, SPECIES_LABELS, SPECIES_ORDER } from "@/lib/format";
import type { Species } from "@/lib/model/types";

type Counts = { real: number; synthetic: number; total: number };

/**
 * Per-species balance bars. Each bar is scaled against the largest class so
 * the three totals can be compared at a glance.
 */
export function ClassDistribution({
  counts,
}: {
  counts: Record<Species, Counts>;
}) {
  const largest = Math.max(...SPECIES_ORDER.map((species) => counts[species].total));

  return (
    <div className="classbars">
      <div className="classbars-legend">
        <span>
          <i className="classbars-key classbars-key-real" /> Real
        </span>
        <span>
          <i className="classbars-key classbars-key-synthetic" /> Synthetic
        </span>
      </div>

      <ul className="classbars-list">
        {SPECIES_ORDER.map((species) => {
          const entry = counts[species];
          const width = (entry.total / largest) * 100;
          return (
            <li key={species}>
              <span className="classbars-name">
                <i style={{ backgroundColor: SPECIES_COLORS[species] }} />
                {SPECIES_LABELS[species]}
              </span>
              <span className="classbars-track">
                <span
                  className="classbars-bar"
                  style={{ width: `${width}%` }}
                >
                  <span
                    className="classbars-real"
                    style={{ width: `${(entry.real / entry.total) * 100}%` }}
                  />
                  <span className="classbars-synthetic" />
                </span>
              </span>
              <span className="classbars-value">
                {entry.total}
                <small>
                  {entry.real} real · {entry.synthetic} syn.
                </small>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
