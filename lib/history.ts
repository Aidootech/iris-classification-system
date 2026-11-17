import type { Species } from "./model/types";

export type Measurements = {
  sepal_length: number;
  sepal_width: number;
  petal_length: number;
  petal_width: number;
};

export type HistoryEntry = {
  id: string;
  at: number;
  species: Species;
  speciesDisplay: string;
  confidence: number;
  probabilities: Record<Species, number>;
  measurements: Measurements;
  model: string;
  modelVersion: string;
};

const HISTORY_KEY = "iris.history";
const HISTORY_EVENT = "iris:history";
const LIMIT = 100;

function isMeasurements(value: unknown): value is Measurements {
  if (!value || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.sepal_length === "number" &&
    typeof m.sepal_width === "number" &&
    typeof m.petal_length === "number" &&
    typeof m.petal_width === "number"
  );
}

function isEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.at === "number" &&
    typeof entry.species === "string" &&
    typeof entry.confidence === "number" &&
    isMeasurements(entry.measurements)
  );
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).sort((a, b) => b.at - a.at);
  } catch {
    return [];
  }
}

export function recordPrediction(input: {
  species: Species;
  speciesDisplay: string;
  confidence: number;
  probabilities: Record<Species, number>;
  measurements: Measurements;
  model: string;
  modelVersion: string;
}): HistoryEntry {
  const entry: HistoryEntry = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    at: Date.now(),
    ...input,
  };

  if (typeof window !== "undefined") {
    const next = [entry, ...getHistory()].slice(0, LIMIT);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(HISTORY_EVENT));
  }

  return entry;
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(HISTORY_KEY);
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

export function subscribeHistory(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === HISTORY_KEY) listener();
  };
  window.addEventListener(HISTORY_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(HISTORY_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function historyToCsv(entries: HistoryEntry[]): string {
  const header = [
    "timestamp",
    "species",
    "confidence",
    "sepal_length_cm",
    "sepal_width_cm",
    "petal_length_cm",
    "petal_width_cm",
    "model",
    "model_version",
  ];
  const rows = entries.map((entry) =>
    [
      new Date(entry.at).toISOString(),
      entry.species,
      entry.confidence.toFixed(4),
      entry.measurements.sepal_length,
      entry.measurements.sepal_width,
      entry.measurements.petal_length,
      entry.measurements.petal_width,
      `"${entry.model}"`,
      entry.modelVersion,
    ].join(","),
  );
  return [header.join(","), ...rows].join("\n");
}
