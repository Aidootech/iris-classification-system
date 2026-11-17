"use client";

import { useId, useState, type FormEvent } from "react";

import { ObservationPlot } from "@/components/observation-plot";
import { ProbabilityBars } from "@/components/probability-bars";
import {
  percent,
  SPECIES_COLORS,
  SPECIES_LABELS,
  SPECIES_ORDER,
} from "@/lib/format";
import type {
  FeatureKey,
  MeasurementKey,
  PredictionResponse,
  Species,
} from "@/lib/model/types";
import {
  MEASUREMENT_KEYS,
  MEASUREMENT_LABELS,
  predictionRequestSchema,
  type PredictionRequest,
} from "@/lib/schema";

type Values = Record<MeasurementKey, string>;
type FieldErrors = Partial<Record<MeasurementKey, string>>;
type Status = "idle" | "loading";

const EMPTY: Values = {
  sepal_length: "",
  sepal_width: "",
  petal_length: "",
  petal_width: "",
};

const FIELDS: {
  key: MeasurementKey;
  feature: FeatureKey;
  placeholder: string;
}[] = [
  { key: "sepal_length", feature: "sepal_length_cm", placeholder: "5.1" },
  { key: "sepal_width", feature: "sepal_width_cm", placeholder: "3.5" },
  { key: "petal_length", feature: "petal_length_cm", placeholder: "1.4" },
  { key: "petal_width", feature: "petal_width_cm", placeholder: "0.2" },
];

const PRESETS: { name: string; values: Values }[] = [
  {
    name: "Setosa",
    values: {
      sepal_length: "5.1",
      sepal_width: "3.5",
      petal_length: "1.4",
      petal_width: "0.2",
    },
  },
  {
    name: "Versicolor",
    values: {
      sepal_length: "6.0",
      sepal_width: "2.9",
      petal_length: "4.5",
      petal_width: "1.5",
    },
  },
  {
    name: "Virginica",
    values: {
      sepal_length: "6.7",
      sepal_width: "3.0",
      petal_length: "5.2",
      petal_width: "2.3",
    },
  },
];

function toNumber(value: string): number {
  return value.trim() === "" ? Number.NaN : Number(value.trim());
}

export function Predictor({
  modelName,
  ranges,
  points,
}: {
  modelName: string;
  ranges: Record<FeatureKey, { min: number; max: number }>;
  points: [number, number, number, number][];
}) {
  const baseId = useId();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [submitted, setSubmitted] = useState<{
    petalLength: number;
    petalWidth: number;
  } | null>(null);

  function clearOutput() {
    setResult(null);
    setSubmitted(null);
    setFormError(null);
  }

  function update(key: MeasurementKey, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
    if (result) {
      setResult(null);
      setSubmitted(null);
    }
    setFormError(null);
  }

  function applyPreset(preset: Values) {
    setValues({ ...preset });
    setErrors({});
    clearOutput();
    setStatus("idle");
  }

  function reset() {
    setValues(EMPTY);
    setErrors({});
    clearOutput();
    setStatus("idle");
  }

  function applyIssues(issues: { field: string; message: string }[]) {
    const next: FieldErrors = {};
    for (const issue of issues) {
      if ((MEASUREMENT_KEYS as string[]).includes(issue.field)) {
        next[issue.field as MeasurementKey] ??= issue.message;
      }
    }
    setErrors(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const numeric: PredictionRequest = {
      sepal_length: toNumber(values.sepal_length),
      sepal_width: toNumber(values.sepal_width),
      petal_length: toNumber(values.petal_length),
      petal_width: toNumber(values.petal_width),
    };

    const parsed = predictionRequestSchema.safeParse(numeric);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if ((MEASUREMENT_KEYS as string[]).includes(key)) {
          next[key as MeasurementKey] ??= issue.message;
        }
      }
      setErrors(next);
      setResult(null);
      setSubmitted(null);
      setFormError("Check the four measurements before classifying.");
      return;
    }

    setErrors({});
    setResult(null);
    setSubmitted(null);
    setStatus("loading");

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = await response.json();

      if (!response.ok) {
        if (payload.issues) applyIssues(payload.issues);
        setFormError(
          payload.message ??
            "The classifier could not process these measurements.",
        );
        setStatus("idle");
        return;
      }

      setResult(payload as PredictionResponse);
      setSubmitted({
        petalLength: parsed.data.petal_length,
        petalWidth: parsed.data.petal_width,
      });
      setStatus("idle");
    } catch {
      setFormError(
        "The prediction service is unreachable. Check the connection and try again.",
      );
      setStatus("idle");
    }
  }

  const predicted: Species | null = result?.species ?? null;
  const id = (key: string) => `${baseId}-${key}`;

  return (
    <>
      <section
        className="panel measurement-panel"
        aria-labelledby="measurements-title"
      >
        <div className="panel-head">
          <h2 className="panel-title" id="measurements-title">
            Measurements
          </h2>
          <span className="badge">{modelName}</span>
        </div>
        <form className="panel-body" onSubmit={submit} noValidate>
          <div className="field-grid">
            {FIELDS.map((field) => {
              const fieldId = id(field.key);
              const error = errors[field.key];
              const range = ranges[field.feature];
              return (
                <div className="field" key={field.key}>
                  <label className="field-label" htmlFor={fieldId}>
                    {MEASUREMENT_LABELS[field.key]}
                  </label>
                  <span className="input-wrap">
                    <input
                      id={fieldId}
                      className="input"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="20"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder={field.placeholder}
                      value={values[field.key]}
                      onChange={(event) => update(field.key, event.target.value)}
                      aria-invalid={error ? "true" : undefined}
                      aria-describedby={
                        error ? `${fieldId}-error` : `${fieldId}-hint`
                      }
                    />
                    <span className="unit" aria-hidden="true">
                      cm
                    </span>
                  </span>
                  {error ? (
                    <span className="field-error" id={`${fieldId}-error`}>
                      {error}
                    </span>
                  ) : (
                    <span className="field-hint" id={`${fieldId}-hint`}>
                      Observed {range.min}–{range.max} cm
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="presets" style={{ marginTop: 16 }}>
            <span className="presets-label">Examples</span>
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className="chip"
                onClick={() => applyPreset(preset.values)}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="form-actions">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Classifying…" : "Classify specimen"}
            </button>
            <button className="btn btn-ghost" type="button" onClick={reset}>
              Reset
            </button>
          </div>

          <p className="field-hint" style={{ marginTop: 12 }}>
            Measurements are accepted in centimetres. Values outside the
            observed range are flagged, not rejected.
          </p>
        </form>
      </section>

      <section
        className="panel prediction-panel"
        aria-labelledby="prediction-title"
        aria-live="polite"
        aria-busy={status === "loading"}
      >
        <div className="panel-head">
          <h2 className="panel-title" id="prediction-title">
            Prediction
          </h2>
          {result ? (
            <span className="badge badge-accent">
              <span className="badge-dot" aria-hidden="true" />
              {percent(result.confidence)} confidence
            </span>
          ) : (
            <span className="badge">3 classes</span>
          )}
        </div>
        <div className="panel-body">
          {formError ? (
            <div className="alert" role="alert">
              {formError}
            </div>
          ) : null}

          {!formError && !result && status === "loading" ? (
            <div className="result-empty">
              <div className="eyebrow">Classifying</div>
              <p className="result-placeholder">
                Evaluating the four measurements against the tuned model.
              </p>
            </div>
          ) : null}

          {!formError && !result && status === "idle" ? (
            <div className="result-empty">
              <div className="eyebrow">Awaiting measurement</div>
              <p className="result-placeholder">
                Enter the four measurements, or choose an example, to see the
                most likely species and the probability for all three classes.
              </p>
              <div className="empty-classes" aria-hidden="true">
                {SPECIES_ORDER.map((species) => (
                  <span className="empty-class" key={species}>
                    <span
                      className="empty-class-dot"
                      style={{ backgroundColor: SPECIES_COLORS[species] }}
                    />
                    {SPECIES_LABELS[species]}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {result ? (
            <div className="rise">
              <div className="species-line">
                <div>
                  <div className="eyebrow">Most likely species</div>
                  <p className="species-name" style={{ margin: "6px 0 0" }}>
                    <span
                      className="species-dot"
                      style={{ backgroundColor: SPECIES_COLORS[result.species] }}
                      aria-hidden="true"
                    />
                    {result.species_display}
                  </p>
                </div>
                <div>
                  <div className="confidence-label">Confidence</div>
                  <div className="confidence-value">
                    {percent(result.confidence)}
                  </div>
                </div>
              </div>

              <ProbabilityBars
                probabilities={result.probabilities}
                order={SPECIES_ORDER}
              />

              {result.warnings.length > 0 ? (
                <div className="notice" role="status" style={{ marginTop: 18 }}>
                  <span className="notice-title">Outside observed range</span>
                  <ul>
                    {result.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="meta-row">
                <span>Model · {result.model.display}</span>
                <span>scikit-learn {result.model.sklearn_version}</span>
                <span>v{result.model.version}</span>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="workbench-wide">
        <ObservationPlot
          points={points}
          measurement={submitted}
          predicted={predicted}
        />
      </div>
    </>
  );
}
