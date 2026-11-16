# Iris Classification System

A complete Iris flower classification system: a reproducible scikit-learn
training pipeline, a documented 500-row dataset, an evaluation report, and a
Next.js web application that predicts the species from four measurements.

**Live application:** _pending Vercel deployment_

## Results

Seven classifiers were tuned with stratified five-fold cross-validation on 470
training rows. Selection used cross-validated macro F1 only. The 30 real
holdout observations were evaluated once, after selection.

| Model | CV macro F1 | Real-only CV | Holdout accuracy | Macro F1 |
|---|---|---|---|---|
| **Support Vector Machine (selected)** | **0.987 ± 0.012** | 0.967 | **1.000** | **1.000** |
| Logistic Regression | 0.987 ± 0.010 | 0.967 | 1.000 | 1.000 |
| Extra Trees | 0.985 ± 0.014 | 0.958 | 0.967 | 0.967 |
| K-Nearest Neighbours | 0.981 ± 0.028 | 0.958 | 0.967 | 0.967 |
| Random Forest | 0.977 ± 0.022 | 0.950 | 0.967 | 0.967 |
| Decision Tree | 0.975 ± 0.016 | 0.941 | 0.933 | 0.933 |
| Gaussian Naive Bayes | 0.960 ± 0.034 | 0.958 | 0.933 | 0.933 |
| Majority-class baseline | 0.165 | 0.167 | 0.333 | 0.167 |

The selected pipeline is an RBF support vector machine (`C = 100`,
`gamma = 0.01`) with standardised inputs and Platt-scaled probabilities. It is
stored as `artifacts/best_model.joblib` and exported to
`lib/model/model.json`, which the TypeScript inference engine runs at request
time.

The holdout is small (30 rows, 10 per species). A perfect score on it is
plausible for Iris but statistically fragile, so the cross-validated mean and
standard deviation are the more informative headline. See
[`docs/REPORT.md`](docs/REPORT.md) for the full discussion.

## The 500 observations

The dataset contains exactly 500 rows:

| Source | Rows | Role |
|---|---|---|
| Real observations from `sklearn.datasets.load_iris` | 150 | Ground truth |
| Synthetic, class-conditional Gaussian | 350 | Training augmentation only |
| **Total** | **500** | `data/iris_500.csv` |

Synthetic rows are generated only from the 120 real training rows, never from
the 30 holdout rows. They are individually labelled with `source = synthetic`,
`synthetic_method = class_conditional_gaussian_v1`, and a `SYN-####` record ID.
The generation seed is 42. Per-class synthetic counts are 117 setosa,
117 versicolor and 116 virginica.

Dataset SHA-256:
`622e1404d418500c335882bc3b57771a2f9f2cd8e1ce2935a4b87eaca8cb9a80`

See [`docs/DATASET_CARD.md`](docs/DATASET_CARD.md) for provenance, distribution
checks and limitations.

## Stack

- **Machine learning:** Python 3.15 locally, scikit-learn 1.9.1, pandas 3.1.1,
  NumPy 2.5.5, SciPy 1.18.1, matplotlib 3.11.2.
- **Web:** Next.js 16.4.6 (App Router), React 19.3.1, TypeScript 5.9.3,
  Tailwind CSS 4.3.5, Zod 4.6.7.
- **Testing:** pytest 9.2.0, Vitest 5.1.0, 500 frozen Python-to-TypeScript
  parity cases.
- **Deployment:** Vercel. No Python runtime is required in production.

## Quick start

Requirements: Node.js 20.9 or newer. Python is only needed to rebuild the
machine-learning artifacts.

### Run the web application

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. On Windows PowerShell, use `npm.cmd` if the
`npm.ps1` shim is blocked by the execution policy.

### Rebuild the dataset and model artifacts

```bash
python -m venv ml/.venv
ml/.venv/Scripts/python.exe -m pip install -r ml/requirements.txt   # Windows
ml/.venv/bin/python -m pip install -r ml/requirements.txt           # macOS/Linux

ml/.venv/Scripts/python.exe ml/run_pipeline.py                      # Windows
ml/.venv/bin/python ml/run_pipeline.py                              # macOS/Linux
```

The pipeline takes roughly two to four minutes. It rebuilds
`data/iris_500.csv`, tunes all candidates, writes `artifacts/`, regenerates the
five report figures, copies the figures to `public/model/figures/`, exports every
model spec, and rewrites the 500 parity fixtures.

### Tests

```bash
# Python: dataset invariants, metric plumbing, export parity
cd ml
.venv/Scripts/python.exe -m pytest

# Web: schema, API handlers, TypeScript inference parity
cd ..
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

## API

### `POST /api/predict`

```json
{
  "sepal_length": 5.1,
  "sepal_width": 3.5,
  "petal_length": 1.4,
  "petal_width": 0.2
}
```

Response:

```json
{
  "species": "setosa",
  "species_display": "Iris setosa",
  "confidence": 0.993,
  "probabilities": {
    "setosa": 0.993,
    "versicolor": 0.005,
    "virginica": 0.002
  },
  "warnings": [],
  "model": {
    "key": "svc_rbf",
    "display": "Support Vector Machine",
    "version": "1.0.0",
    "trained_at": "2026-11-16T20:23:09Z",
    "sklearn_version": "1.9.1"
  }
}
```

Invalid input returns HTTP 400 with a `VALIDATION_ERROR` payload and per-field
issues. Values outside the observed real-data ranges are accepted but flagged
in `warnings`.

`GET /api/metadata` returns the dataset summary, selected model and evaluation
metrics used by the interface.

## Reproducibility

- Fixed seed 42 for the real split, synthetic generation, cross-validation and
  all stochastic estimators.
- The dataset is deterministic and byte-identical when regenerated.
- The holdout split is created before synthetic data exists.
- The deployed TypeScript engine is checked against scikit-learn on 500 frozen
  cases (all 150 real rows plus 350 random in-range vectors). Labels must match
  exactly; probabilities must match within `1e-9` for most families and within
  `1e-6` for the exported SVC calibration path.
- Exact Python dependency versions are pinned in `ml/requirements.txt`.

## Repository layout

```text
app/                    Next.js pages and API route handlers
components/             Predictor, tables, charts, navigation
lib/model/              Exported model spec, summary, TypeScript engine
lib/schema.ts           Shared Zod request schema
data/iris_500.csv       Committed 500-row dataset
ml/                     Python pipeline, source and pytest suite
artifacts/              Metrics, leaderboard CSV, joblib, figures, model specs
public/                 Downloadable CSV and report figures
docs/                   Plan, dataset card, model card, report, viva notes
tests/                  Vitest schema, API and parity tests
scripts/smoke.mjs       Post-deployment smoke test
```

## Deployment

The Next.js application is at the repository root, so Vercel needs no Root
Directory override. No environment variables are required.

```bash
npx vercel --prod
```

After deployment, run the smoke test against the production URL:

```bash
npm run smoke -- https://your-project.vercel.app
```

## Limitations

- The 350 synthetic rows are not independent biological observations. They make
  the training set larger and more regular, but they do not add evidence about
  real Iris populations.
- All headline metrics come from 30 real holdout rows. Confidence intervals are
  wide; do not read 1.000 as a guarantee of field performance.
- The deployed engine reproduces the trained scikit-learn pipeline, but it is a
  custom implementation. The parity suite is the guard against drift.
- The model is for education and demonstration, not botanical or agricultural
  decision-making.

## Documentation

- [`docs/PLAN.md`](docs/PLAN.md) - approved architecture and requirements traceability
- [`docs/DATASET_CARD.md`](docs/DATASET_CARD.md) - provenance and generation method
- [`docs/MODEL_CARD.md`](docs/MODEL_CARD.md) - model details, metrics and export contract
- [`docs/REPORT.md`](docs/REPORT.md) - academic report
- [`docs/VIVA_NOTES.md`](docs/VIVA_NOTES.md) - demonstration script and likely questions
