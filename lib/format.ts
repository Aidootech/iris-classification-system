import type { Species } from "./model/types";

export const SPECIES_ORDER: Species[] = ["setosa", "versicolor", "virginica"];

export const SPECIES_LABELS: Record<Species, string> = {
  setosa: "Setosa",
  versicolor: "Versicolor",
  virginica: "Virginica",
};

export const SPECIES_DISPLAY: Record<Species, string> = {
  setosa: "Iris setosa",
  versicolor: "Iris versicolor",
  virginica: "Iris virginica",
};

export const SPECIES_COLORS: Record<Species, string> = {
  setosa: "var(--color-setosa)",
  versicolor: "var(--color-versicolor)",
  virginica: "var(--color-virginica)",
};

export function percent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function decimal(value: number, digits = 3): string {
  return value.toFixed(digits);
}

export function signedDecimal(value: number, digits = 3): string {
  return `${value >= 0 ? "" : "−"}${Math.abs(value).toFixed(digits)}`;
}
