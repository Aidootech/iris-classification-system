#!/usr/bin/env node
/**
 * Post-deployment smoke test.
 *
 * Usage:
 *   npm run smoke -- https://your-project.vercel.app
 *   BASE_URL=http://localhost:3000 npm run smoke
 */

const base = (process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000")
  .replace(/\/+$/, "");

let failures = 0;

function pass(label, detail = "") {
  console.log(`PASS  ${label}${detail ? `  ${detail}` : ""}`);
}

function fail(label, detail) {
  failures += 1;
  console.error(`FAIL  ${label}  ${detail}`);
}

async function request(path, init) {
  return fetch(`${base}${path}`, {
    ...init,
    signal: AbortSignal.timeout(20000),
  });
}

async function checkPage(path, marker) {
  try {
    const response = await request(path);
    const body = await response.text();
    if (response.status !== 200) {
      fail(path, `expected 200, received ${response.status}`);
      return;
    }
    if (!body.includes(marker)) {
      fail(path, `missing marker "${marker}"`);
      return;
    }
    pass(path, `200, ${body.length} bytes`);
  } catch (error) {
    fail(path, error instanceof Error ? error.message : String(error));
  }
}

async function predict(label, payload, expectedSpecies) {
  try {
    const response = await request("/api/predict", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (response.status !== 200) {
      fail(label, `expected 200, received ${response.status}`);
      return;
    }
    if (data.species !== expectedSpecies) {
      fail(label, `expected ${expectedSpecies}, received ${data.species}`);
      return;
    }
    if (!(data.confidence > 0.9)) {
      fail(label, `confidence ${data.confidence} is not above 0.9`);
      return;
    }
    pass(
      label,
      `${data.species_display} at ${(data.confidence * 100).toFixed(1)}%`,
    );
  } catch (error) {
    fail(label, error instanceof Error ? error.message : String(error));
  }
}

async function checkValidation() {
  try {
    const response = await request("/api/predict", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sepal_length: "wide",
        sepal_width: 3.0,
        petal_length: 5.0,
        petal_width: 2.0,
      }),
    });
    if (response.status !== 400) {
      fail("invalid input", `expected 400, received ${response.status}`);
      return;
    }
    pass("invalid input", "400 as expected");
  } catch (error) {
    fail("invalid input", error instanceof Error ? error.message : String(error));
  }
}

async function checkMetadata() {
  try {
    const response = await request("/api/metadata");
    if (response.status !== 200) {
      fail("/api/metadata", `expected 200, received ${response.status}`);
      return;
    }
    const data = await response.json();
    if (data.dataset?.rows !== 500) {
      fail("/api/metadata", `expected 500 rows, received ${data.dataset?.rows}`);
      return;
    }
    pass("/api/metadata", `${data.best?.display ?? "model"}, 500 rows`);
  } catch (error) {
    fail("/api/metadata", error instanceof Error ? error.message : String(error));
  }
}

console.log(`Smoke testing ${base}\n`);

await checkPage("/", "Measure the");
await checkPage("/models", "Seven algorithms");
await checkPage("/dataset", "150 real, 350 synthetic");
await checkMetadata();
await predict(
  "setosa example",
  {
    sepal_length: 5.1,
    sepal_width: 3.5,
    petal_length: 1.4,
    petal_width: 0.2,
  },
  "setosa",
);
await predict(
  "versicolor example",
  {
    sepal_length: 6.0,
    sepal_width: 2.9,
    petal_length: 4.5,
    petal_width: 1.5,
  },
  "versicolor",
);
await predict(
  "virginica example",
  {
    sepal_length: 6.7,
    sepal_width: 3.0,
    petal_length: 5.2,
    petal_width: 2.3,
  },
  "virginica",
);
await checkValidation();

if (failures > 0) {
  console.error(`\n${failures} smoke check(s) failed.`);
  process.exit(1);
}

console.log("\nAll smoke checks passed.");
