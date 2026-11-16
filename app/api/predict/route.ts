import type { MeasurementKey, PredictionResponse, Species } from "@/lib/model/types";
import { predictionRequestSchema, fieldErrors, MEASUREMENT_FEATURES } from "@/lib/schema";
import { modelSpec, summary } from "@/lib/model";
import { predict } from "@/lib/model/inference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPECIES_DISPLAY: Record<Species, string> = {
  setosa: "Iris setosa",
  versicolor: "Iris versicolor",
  virginica: "Iris virginica",
};

const FIELD_LABELS: Record<MeasurementKey, string> = {
  sepal_length: "Sepal length",
  sepal_width: "Sepal width",
  petal_length: "Petal length",
  petal_width: "Petal width",
};

function errorResponse(
  status: number,
  error: string,
  message: string,
  issues?: { field: string; message: string }[],
): Response {
  return Response.json(
    { error, message, ...(issues ? { issues } : {}) },
    { status },
  );
}

export async function GET(): Promise<Response> {
  return Response.json({
    status: "ok",
    model: {
      key: summary.model.key,
      display: summary.model.display,
      version: summary.model.version,
      trained_at: summary.model.trained_at,
      sklearn_version: summary.model.sklearn_version,
      input: modelSpec.feature_order,
    },
    dataset: {
      rows: summary.dataset.rows,
      real: summary.dataset.real,
      synthetic: summary.dataset.synthetic,
      train: summary.dataset.train,
      test: summary.dataset.test,
    },
    holdout: {
      accuracy: summary.best.test.accuracy,
      macro_f1: summary.best.test.macro.f1,
      n: summary.best.test.n_test,
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = predictionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "One or more measurements are missing or outside the accepted range.",
      fieldErrors(parsed.error.issues),
    );
  }

  const values: number[] = [
    parsed.data.sepal_length,
    parsed.data.sepal_width,
    parsed.data.petal_length,
    parsed.data.petal_width,
  ];

  const warnings: string[] = [];
  for (const key of Object.keys(MEASUREMENT_FEATURES) as MeasurementKey[]) {
    const feature = MEASUREMENT_FEATURES[key];
    const range = summary.dataset.feature_ranges[feature];
    const value = parsed.data[key];
    if (value < range.min || value > range.max) {
      warnings.push(
        `${FIELD_LABELS[key]} ${value} cm is outside the observed range of ${range.min}–${range.max} cm.`,
      );
    }
  }

  try {
    const prediction = predict(modelSpec, values);
    const probabilities = Object.fromEntries(
      prediction.probabilities.map((probability, index) => [
        modelSpec.classes[index],
        probability,
      ]),
    ) as Record<Species, number>;

    const payload: PredictionResponse = {
      species: prediction.species,
      species_display: SPECIES_DISPLAY[prediction.species],
      confidence: prediction.confidence,
      probabilities,
      warnings,
      model: {
        key: summary.model.key,
        display: summary.model.display,
        version: summary.model.version,
        trained_at: summary.model.trained_at,
        sklearn_version: summary.model.sklearn_version,
      },
    };
    return Response.json(payload, { status: 200 });
  } catch {
    return errorResponse(
      500,
      "PREDICTION_FAILED",
      "The model could not produce a prediction for these measurements.",
    );
  }
}
