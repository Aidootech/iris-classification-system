import { SPECIES_COLORS, SPECIES_LABELS, SPECIES_ORDER } from "@/lib/format";
import type { Species } from "@/lib/model/types";

type Point = [number, number, number, number];

const WIDTH = 660;
const HEIGHT = 360;
const MARGIN = { top: 14, right: 14, bottom: 40, left: 46 };
const DOMAIN = { xMin: 0.5, xMax: 7.5, yMin: 0, yMax: 3 };
const X_TICKS = [1, 2, 3, 4, 5, 6, 7];
const Y_TICKS = [0, 0.5, 1, 1.5, 2, 2.5, 3];

function clamp(value: number, low: number, high: number) {
  return Math.min(Math.max(value, low), high);
}

export function ObservationPlot({
  points,
  measurement,
  predicted,
}: {
  points: Point[];
  measurement: { petalLength: number; petalWidth: number } | null;
  predicted: Species | null;
}) {
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const x = (value: number) =>
    MARGIN.left +
    ((clamp(value, DOMAIN.xMin, DOMAIN.xMax) - DOMAIN.xMin) /
      (DOMAIN.xMax - DOMAIN.xMin)) *
      plotWidth;
  const y = (value: number) =>
    MARGIN.top +
    plotHeight -
    ((clamp(value, DOMAIN.yMin, DOMAIN.yMax) - DOMAIN.yMin) /
      (DOMAIN.yMax - DOMAIN.yMin)) *
      plotHeight;

  const userX = measurement ? x(measurement.petalLength) : 0;
  const userY = measurement ? y(measurement.petalWidth) : 0;
  const labelX = Math.min(userX + 9, WIDTH - MARGIN.right - 64);
  const labelY = Math.max(userY - 9, MARGIN.top + 8);

  return (
    <section className="panel" aria-labelledby="observation-space-title">
      <div className="panel-head">
        <h2 className="panel-title" id="observation-space-title">
          Observation space
        </h2>
        <span className="mono" style={{ fontSize: 9.5, color: "var(--color-faint)" }}>
          petal length × petal width
        </span>
      </div>
      <div className="panel-body">
        <svg
          className="scatter"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Scatter plot of petal length against petal width for 500 observations, with the current specimen marked"
        >
          {X_TICKS.map((tick) => (
            <line
              key={`x-grid-${tick}`}
              className="grid-line"
              x1={x(tick)}
              x2={x(tick)}
              y1={MARGIN.top}
              y2={MARGIN.top + plotHeight}
            />
          ))}
          {Y_TICKS.map((tick) => (
            <line
              key={`y-grid-${tick}`}
              className="grid-line"
              x1={MARGIN.left}
              x2={MARGIN.left + plotWidth}
              y1={y(tick)}
              y2={y(tick)}
            />
          ))}

          <line
            className="axis-line"
            x1={MARGIN.left}
            x2={MARGIN.left + plotWidth}
            y1={MARGIN.top + plotHeight}
            y2={MARGIN.top + plotHeight}
          />
          <line
            className="axis-line"
            x1={MARGIN.left}
            x2={MARGIN.left}
            y1={MARGIN.top}
            y2={MARGIN.top + plotHeight}
          />

          {X_TICKS.map((tick) => (
            <text
              key={`x-label-${tick}`}
              x={x(tick)}
              y={HEIGHT - 22}
              textAnchor="middle"
            >
              {tick}
            </text>
          ))}
          {Y_TICKS.map((tick) => (
            <text
              key={`y-label-${tick}`}
              x={MARGIN.left - 9}
              y={y(tick) + 3}
              textAnchor="end"
            >
              {tick.toFixed(1)}
            </text>
          ))}

          <text
            x={MARGIN.left + plotWidth / 2}
            y={HEIGHT - 4}
            textAnchor="middle"
          >
            Petal length (cm)
          </text>
          <text
            transform={`rotate(-90 12 ${MARGIN.top + plotHeight / 2})`}
            x={12}
            y={MARGIN.top + plotHeight / 2}
            textAnchor="middle"
          >
            Petal width (cm)
          </text>

          {points.map(([petalLength, petalWidth, classIndex, synthetic], index) => {
            const species = SPECIES_ORDER[classIndex];
            const colour = SPECIES_COLORS[species];
            if (synthetic === 1) {
              return (
                <circle
                  key={`synthetic-${index}`}
                  className="point-synthetic"
                  cx={x(petalLength)}
                  cy={y(petalWidth)}
                  r={2.4}
                  fill="none"
                  stroke={colour}
                  strokeWidth={0.9}
                />
              );
            }
            return (
              <circle
                key={`real-${index}`}
                className="point-real"
                cx={x(petalLength)}
                cy={y(petalWidth)}
                r={3}
                fill={colour}
              />
            );
          })}

          {measurement ? (
            <g className="rise">
              <line
                className="user-cross"
                x1={MARGIN.left}
                x2={userX}
                y1={userY}
                y2={userY}
              />
              <line
                className="user-cross"
                x1={userX}
                x2={userX}
                y1={MARGIN.top + plotHeight}
                y2={userY}
              />
              <circle className="user-ring" cx={userX} cy={userY} r={6} />
              {predicted ? (
                <circle
                  cx={userX}
                  cy={userY}
                  r={2}
                  fill={SPECIES_COLORS[predicted]}
                />
              ) : null}
              <text x={labelX} y={labelY} style={{ fill: "var(--color-ink)" }}>
                This specimen
              </text>
            </g>
          ) : null}
        </svg>

        <div className="chart-legend" style={{ marginTop: 10 }}>
          {SPECIES_ORDER.map((species) => (
            <span className="legend-item" key={species}>
              <span
                className="legend-mark"
                style={{ backgroundColor: SPECIES_COLORS[species] }}
              />
              {SPECIES_LABELS[species]}
            </span>
          ))}
          <span className="legend-item">
            <span
              className="legend-mark"
              style={{
                border: "1px solid var(--color-faint)",
                backgroundColor: "transparent",
              }}
            />
            Synthetic
          </span>
          <span className="legend-item">
            <span
              className="legend-mark"
              style={{ border: "1px solid var(--color-ink)", backgroundColor: "#fff" }}
            />
            Current specimen
          </span>
        </div>
      </div>
    </section>
  );
}
