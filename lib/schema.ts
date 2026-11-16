import { z } from "zod";

import type { MeasurementKey } from "./model/types";

const measurement = (label: string) =>
  z
    .number()
    .refine(Number.isFinite, `${label} must be a number.`)
    .min(0.1, `${label} must be at least 0.1 cm.`)
    .max(20, `${label} must be at most 20 cm.`);

export const predictionRequestSchema = z
  .object({
    sepal_length: measurement("Sepal length"),
    sepal_width: measurement("Sepal width"),
    petal_length: measurement("Petal length"),
    petal_width: measurement("Petal width"),
  })
  .strict();

export type PredictionRequest = z.infer<typeof predictionRequestSchema>;

export const MEASUREMENT_KEYS: MeasurementKey[] = [
  "sepal_length",
  "sepal_width",
  "petal_length",
  "petal_width",
];

export const MEASUREMENT_LABELS: Record<MeasurementKey, string> = {
  sepal_length: "Sepal length",
  sepal_width: "Sepal width",
  petal_length: "Petal length",
  petal_width: "Petal width",
};

export const MEASUREMENT_FEATURES = {
  sepal_length: "sepal_length_cm",
  sepal_width: "sepal_width_cm",
  petal_length: "petal_length_cm",
  petal_width: "petal_width_cm",
} as const;

export function fieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): { field: string; message: string }[] {
  return issues.map((issue) => ({
    field: String(issue.path[0] ?? "form"),
    message: issue.message,
  }));
}
