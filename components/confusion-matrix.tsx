import type { ConfusionMatrix } from "@/lib/model/types";
import { percent, SPECIES_LABELS } from "@/lib/format";

export function ConfusionMatrixView({
  matrix,
}: {
  matrix: ConfusionMatrix;
}) {
  return (
    <div>
      <div className="matrix-axis">
        <span>True species ↓</span>
        <span>Predicted species →</span>
      </div>
      <table className="matrix-table">
        <caption className="sr-only">
          Confusion matrix on the held-out real observations. Rows are true
          species, columns are predicted species.
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">True species</span>
            </th>
            {matrix.labels.map((label) => (
              <th scope="col" key={label}>
                {SPECIES_LABELS[label]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.labels.map((rowLabel, rowIndex) => (
            <tr key={rowLabel}>
              <th scope="row">{SPECIES_LABELS[rowLabel]}</th>
              {matrix.counts[rowIndex].map((count, columnIndex) => (
                <td
                  key={matrix.labels[columnIndex]}
                  className={rowIndex === columnIndex ? "is-hit" : undefined}
                  aria-label={`True ${SPECIES_LABELS[rowLabel]}, predicted ${SPECIES_LABELS[matrix.labels[columnIndex]]}: ${count}`}
                >
                  <span>{count}</span>
                  <span className="matrix-sub">
                    {percent(matrix.normalized[rowIndex][columnIndex], 0)}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
