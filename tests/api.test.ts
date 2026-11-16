import { describe, expect, it } from "vitest";

import { GET, POST } from "@/app/api/predict/route";
import type { PredictionResponse } from "@/lib/model/types";

function request(body: unknown): Request {
  return new Request("http://localhost/api/predict", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const valid = {
  sepal_length: 5.1,
  sepal_width: 3.5,
  petal_length: 1.4,
  petal_width: 0.2,
};

describe("POST /api/predict", () => {
  it("classifies a setosa specimen", async () => {
    const response = await POST(request(valid));
    expect(response.status).toBe(200);

    const payload = (await response.json()) as PredictionResponse;
    expect(payload.species).toBe("setosa");
    expect(payload.species_display).toBe("Iris setosa");
    expect(payload.confidence).toBeGreaterThan(0.9);
    expect(Object.keys(payload.probabilities).sort()).toEqual([
      "setosa",
      "versicolor",
      "virginica",
    ]);
    expect(payload.model.key).toBeTruthy();
    expect(payload.model.version).toBe("1.0.0");
  });

  it("warns when a measurement is outside the observed range", async () => {
    const response = await POST(
      request({ ...valid, sepal_length: 12, petal_width: 3 }),
    );
    const payload = (await response.json()) as PredictionResponse;
    expect(response.status).toBe(200);
    expect(payload.warnings).toHaveLength(2);
    expect(payload.warnings[0]).toContain("outside the observed range");
  });

  it("rejects an incomplete payload", async () => {
    const response = await POST(request({ ...valid, petal_width: undefined }));
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe("VALIDATION_ERROR");
    expect(payload.issues.length).toBeGreaterThan(0);
  });

  it("rejects an out-of-range payload", async () => {
    const response = await POST(request({ ...valid, sepal_length: 30 }));
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.issues[0].field).toBe("sepal_length");
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(request("{not json"));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("INVALID_JSON");
  });
});

describe("GET /api/predict", () => {
  it("reports the deployed model and dataset", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.status).toBe("ok");
    expect(payload.dataset.rows).toBe(500);
    expect(payload.dataset.test).toBe(30);
    expect(payload.model.sklearn_version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
