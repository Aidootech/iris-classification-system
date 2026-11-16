import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { predict } from "@/lib/model/inference";
import type { ModelSpec, Species } from "@/lib/model/types";

const spec = JSON.parse(
  readFileSync(path.join(process.cwd(), "lib/model/model.json"), "utf8"),
) as ModelSpec;

interface ParityCase {
  input: number[];
  label: Species;
  probabilities: number[];
}

interface ParityFixture {
  model_key: string;
  classes: Species[];
  tolerance: number;
  case_count: number;
  cases: ParityCase[];
}

const fixture = JSON.parse(
  readFileSync(
    path.join(process.cwd(), "ml/tests/fixtures/parity_cases.json"),
    "utf8",
  ),
) as ParityFixture;

describe("exported model inference", () => {
  it("uses the same model that was evaluated", () => {
    expect(fixture.model_key).toBe(spec.model_key);
    expect(fixture.classes).toEqual(spec.classes);
    expect(fixture.case_count).toBe(fixture.cases.length);
  });

  it("reproduces every frozen scikit-learn prediction", () => {
    let maxDifference = 0;
    const labelMismatches: number[] = [];

    fixture.cases.forEach((testCase, index) => {
      const prediction = predict(spec, testCase.input);
      if (prediction.species !== testCase.label) {
        labelMismatches.push(index);
      }
      prediction.probabilities.forEach((probability, classIndex) => {
        maxDifference = Math.max(
          maxDifference,
          Math.abs(probability - testCase.probabilities[classIndex]),
        );
      });
    });

    expect(labelMismatches).toEqual([]);
    expect(maxDifference).toBeLessThan(fixture.tolerance);
  });

  it("returns normalised, finite probabilities", () => {
    const prediction = predict(spec, [5.1, 3.5, 1.4, 0.2]);
    const total = prediction.probabilities.reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(1, 10);
    expect(prediction.probabilities.every(Number.isFinite)).toBe(true);
    expect(prediction.confidence).toBe(
      prediction.probabilities[prediction.index],
    );
  });

  it.each([
    { input: [5.1, 3.5, 1.4, 0.2], expected: "setosa" },
    { input: [6.0, 2.9, 4.5, 1.5], expected: "versicolor" },
    { input: [6.7, 3.0, 5.2, 2.3], expected: "virginica" },
  ])("classifies $expected specimens", ({ input, expected }) => {
    const prediction = predict(spec, input);
    expect(prediction.species).toBe(expected);
    expect(prediction.confidence).toBeGreaterThan(0.5);
  });

  it("rejects the wrong number of measurements", () => {
    expect(() => predict(spec, [5.1, 3.5, 1.4])).toThrow();
  });
});
