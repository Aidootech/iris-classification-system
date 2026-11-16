import { percent, SPECIES_COLORS, SPECIES_LABELS } from "@/lib/format";
import type { Species } from "@/lib/model/types";

export function ProbabilityBars({
  probabilities,
  order,
}: {
  probabilities: Record<Species, number>;
  order: Species[];
}) {
  return (
    <div className="prob-list" role="list" aria-label="Probability by species">
      {order.map((species) => {
        const value = probabilities[species] ?? 0;
        return (
          <div className="prob-row" role="listitem" key={species}>
            <span className="prob-label">{SPECIES_LABELS[species]}</span>
            <span
              className="prob-track"
              role="img"
              aria-label={`${SPECIES_LABELS[species]}: ${percent(value)}`}
            >
              <span
                className="prob-fill"
                style={{
                  width: `${Math.max(value * 100, 0)}%`,
                  backgroundColor: SPECIES_COLORS[species],
                }}
              />
            </span>
            <span className="prob-value">{percent(value)}</span>
          </div>
        );
      })}
    </div>
  );
}
