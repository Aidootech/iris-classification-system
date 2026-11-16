import { describe, expect, it } from "vitest";

import { predictionRequestSchema } from "@/lib/schema";

const valid = {
  sepal_length: 5.1,
  sepal_width: 3.5,
  petal_length: 1.4,
  petal_width: 0.2,
};

describe("prediction request schema", () => {
  it("accepts a complete measurement set", () => {
    const result = predictionRequestSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it.each([
    ["missing field", { sepal_length: 5.1, sepal_width: 3.5, petal_length: 1.4 }],
    ["string value", { ...valid, petal_width: "0.2" }],
    ["zero value", { ...valid, petal_width: 0 }],
    ["out of range", { ...valid, sepal_length: 25 }],
    ["NaN", { ...valid, sepal_width: Number.NaN }],
    ["extra field", { ...valid, species: "setosa" }],
  ])("rejects %s", (_label, payload) => {
    expect(predictionRequestSchema.safeParse(payload).success).toBe(false);
  });
});
