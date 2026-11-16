import "server-only";

import rawModel from "./model.json";
import rawPoints from "./points.json";
import rawSummary from "./summary.json";
import type { ModelSpec, ScatterData, Summary } from "./types";

/**
 * Server-only access to the trained artifacts.  Importing this module from a
 * client component fails the build, which keeps the model parameters out of
 * the browser bundle.
 */
export const modelSpec = rawModel as unknown as ModelSpec;
export const summary = rawSummary as unknown as Summary;
export const scatter = rawPoints as unknown as ScatterData;
