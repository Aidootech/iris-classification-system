# Iris Flower Classification System — Architecture & Implementation Plan

Status: **APPROVED AND IMPLEMENTED** — 16 November 2026.
Date: 2026-11-16
Working directory: `C:\Xampp1\htdocs\IRIS CLASSIFICATION SYSTEM`

---

## 1. Requirements traceability

| # | Requirement | How it is satisfied | Evidence produced |
|---|---|---|---|
| R1 | Use the Iris dataset from scikit-learn | `load_iris()` loaded directly, never a third-party copy; identities verified against the bundled dataset | `docs/DATASET_CARD.md`, `ml/tests/test_dataset.py` |
| R2 | Exactly 500 observations | 150 real + 350 synthetic = 500 data rows (header excluded) | Dataset validator test + SHA-256 of committed CSV |
| R3 | Synthetic rows clearly identified and documented | `source` column (`real`/`synthetic`), `synthetic_method` column, generation algorithm, seed, per-class counts, distribution-fidelity tests | `docs/DATASET_CARD.md`, `data/iris_500.csv` |
| R4 | Train and compare multiple algorithms | 7 classifiers + a majority-class baseline, each tuned with stratified 5-fold grid search | `artifacts/model_comparison.csv`, `/models` page |
| R5 | Accuracy, precision, recall, F1, confusion matrix | Macro + weighted + per-class metrics, CV mean/std, count and row-normalised confusion matrices | `artifacts/metrics.json`, PNG figures, `/models` page |
| R6 | Save the best model for the web app | Best pipeline saved as `artifacts/best_model.joblib` and exported to `lib/model/model.json` | Parity test proving identical predictions |
| R7 | Web interface for 4 measurements | Next.js form + validated `POST /api/predict` | `/` page, `tests/api.test.ts` |
| R8 | Pushed to GitHub | Git repo, meaningful commit history, `.gitignore`, CI workflow | Remote URL |
| R9 | Deployed on Vercel | Next.js at repo root, zero Python runtime, no secrets required | Production URL + smoke-test log |

---

## 2. Environment findings

- Project folder is **empty** and **not** a Git repository.
- `npm` is blocked by the PowerShell execution policy; `npm.cmd` works and will be used in all scripts.
- `pytest` is missing and will be installed into a project-local virtual environment (`ml/.venv`).
- Python 3.15 is unusually new; CI will use Python 3.13 for wheel stability. Local training uses 3.15 with the versions above, recorded in the model metadata.
- GitHub CLI and Vercel CLI are absent. They will be installed locally, but authentication must be completed by the account owner.

---

## 3. Architecture

```
                        OFFLINE (Python, reproducible)
┌──────────────────────────────────────────────────────────────────────┐
│  scikit-learn load_iris (150 real rows)                              │
│        │                                                             │
│        ├── stratified real split ──► real_train (120) ──┐            │
│        │                                   │             │            │
│        │                                   ▼             │            │
│        │                    class-conditional Gaussian   │            │
│        │                    generator (seed 42)          │            │
│        │                                   │             │            │
│        │                                   ▼             ▼            │
│        │                          synthetic (350)   real_holdout (30)│
│        │                                   │             │            │
│        └───────────────────────────────────┴──── data/iris_500.csv ───┤
│                                                                       │
│  train 470 rows ──► pipelines + 5-fold GridSearchCV ──► 7 models      │
│        │                                                              │
│        ├──► metrics.json / model_comparison.csv / PNG figures         │
│        ├──► best_model.joblib  (archive / reproducibility)            │
│        └──► model.json  (portable inference spec, JSON-safe numbers)  │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │ committed artifact
                                    ▼
                        ONLINE (Next.js on Vercel)
┌──────────────────────────────────────────────────────────────────────┐
│  Browser  ──POST /api/predict──►  Route Handler (Zod validation)      │
│     │                                   │                            │
│     │                                   ▼                            │
│     │                        TypeScript inference engine             │
│     │                        (scaler + exported model params)        │
│     │                                   │                            │
│     ◄── species, probabilities, confidence, model version ───────────┘
│                                                                      │
│  Pages: / (predictor)   /models (leaderboard + confusion matrices)   │
│         /dataset (500-row provenance, downloads, methodology)        │
└──────────────────────────────────────────────────────────────────────┘
```

**Why no Python on Vercel:** a Python serverless function adds a second runtime, cold starts, dependency pinning and an upload-size risk. Exporting the trained model to a transparent JSON spec and running it in a tested TypeScript engine gives a fully static-capable deployment, millisecond inference, and a model that can be inspected in the report. The original `.joblib` is still saved, satisfying R6 literally.

---

## 4. Technology stack

| Layer | Choice | Version | Rationale |
|---|---|---|---|
| Data / ML | Python, scikit-learn, pandas, numpy, scipy | 3.15 / 1.9.1 / 3.1.0 | Required by the brief; scikit-learn is the source of the dataset |
| Tuning / eval | `GridSearchCV`, `StratifiedKFold`, `classification_report` | — | Standard, defensible protocol |
| Figures | matplotlib + seaborn | 3.11.2 / 0.13.2 | Report-quality confusion matrices and comparison charts |
| Persistence | joblib + custom JSON exporter | — | `.joblib` archive plus runtime-portable spec |
| Web framework | Next.js App Router + React 19 + TypeScript | 16.4.6 / 19.3.1 / 5.x | First-class Vercel support, server route for the model, typed contract |
| Styling | Tailwind CSS v4 + CSS variables | 4.x | Fast, consistent, no runtime CSS-in-JS |
| Validation | Zod (shared client/server schema) | 4.x | One source of truth for the API contract |
| Testing | pytest, Vitest, Python→TS parity fixtures | — | Proves the deployed model matches the trained model |
| CI | GitHub Actions | — | Tests + production build on every push |
| Hosting | Vercel | — | Required by the brief |

No charting library: probability bars and the scatter plot are hand-built SVG, which keeps the bundle small and the visual language consistent.

---

## 5. Dataset design — exactly 500 observations

### 5.1 Composition

| Source | Rows | Purpose |
|---|---|---|
| Real, from `sklearn.datasets.load_iris` | 150 | Ground truth |
| Synthetic, class-conditional Gaussian | 350 | Training augmentation only |
| **Total** | **500** | Committed as `data/iris_500.csv` |

Per-class synthetic counts: Setosa 117, Versicolor 117, Virginica 116.

### 5.2 Split strategy (leakage-free)

1. Stratified split of the **real** 150 rows → `real_train` 120 (40/class), `real_holdout` 30 (10/class), `random_state=42`.
2. Fit one 4-dimensional Gaussian per class **using only `real_train`**: mean vector, sample covariance with a small ridge (1e-6) for positive-definiteness.
3. Draw 350 samples, one class at a time (`rng = np.random.default_rng(42)`), round each feature to 1 decimal (matching the measurement precision of the real data), then clip per feature to that class's observed min/max in `real_train`.
4. Training set = 120 real + 350 synthetic = **470 rows**. Test set = the 30 withheld real rows.

This means no synthetic row is derived from, or statistically fitted to, a test observation. A naive "80/20 split of all 500" would leak the test-set distribution into training through the generator; that alternative is available if you prefer the simpler grading convention (see Decision D2).

### 5.3 Columns

`record_id, sepal_length_cm, sepal_width_cm, petal_length_cm, petal_width_cm, species, species_id, source, synthetic_method, split`

- `source`: `real` or `synthetic`
- `synthetic_method`: `class_conditional_gaussian_v1` for synthetic rows, `not_applicable` for real rows
- `split`: `train` / `test`
- Synthetic rows are also grouped contiguously and given a `SYN-####` id prefix so they cannot be mistaken for real observations.

### 5.4 Documentation and verification

- `docs/DATASET_CARD.md`: provenance, exact generator, seed, per-class counts, feature min/mean/std for real vs synthetic, two-sample KS test p-values, duplicate count, limitations, and intended use.
- Tests assert: 500 rows; 150 real / 350 synthetic; 4 features in cm; 3 balanced-ish classes; no synthetic row in `test`; regeneration with seed 42 reproduces the identical SHA-256; generator function accepts no test rows.
- `public/data/iris_500.csv` offers a download from the web app.

---

## 6. Modelling and evaluation protocol

### 6.1 Candidate models (all tuned, all exportable)

| Model | Pipeline | Grid (compact) |
|---|---|---|
| Logistic Regression | StandardScaler → multinomial LR | `C`: 0.01–100 (log), `solver=lbfgs` |
| K-Nearest Neighbours | StandardScaler → KNN | `n_neighbors`: 3, 5, 7, 9, 11, 15, 21; `weights`: uniform/distance |
| Gaussian Naive Bayes | GNB | `var_smoothing`: 1e-12–1e-1 |
| Decision Tree | DT | `max_depth`: 2–8/None, `min_samples_leaf`: 1–5, `criterion`: gini/entropy |
| Random Forest | RF | `n_estimators`: 200/400, `max_depth`: None/6/10, `min_samples_leaf`: 1/2, `max_features=sqrt` |
| Extra Trees | ET | same grid as RF |
| SVM (RBF) | StandardScaler → SVC | `C`: 0.1–100, `gamma`: scale/0.01/0.1/1, `probability=True` |
| Baseline | DummyClassifier (most frequent) | context only, not eligible to win |

Selection metric: **macro F1** (equal weight per species). Highest mean CV macro F1 wins; ties break on lower fold standard deviation, then display name. Hyperparameters are chosen by 5-fold stratified CV on the 470-row training set only; the 30-row real holdout is touched once, for final reporting.

### 6.2 Metrics

- Accuracy
- Precision, recall, F1 — **macro** (headline) and **weighted**
- Per-class precision / recall / F1 / support
- Confusion matrix: raw counts and row-normalised, per model plus a combined figure
- CV macro-F1 mean ± std on the augmented training set, and a diagnostic CV on the 120 real rows only
- Supplementary (appendix, clearly labelled optimistic): stratified 80/20 split over the full 500 rows

No results will be hand-written or estimated; every number is emitted by the training run.

### 6.3 Artifacts

```
artifacts/
  best_model.joblib          # full sklearn Pipeline + metadata
  model.json                 # runtime inference spec (committed copy in lib/model/)
  metrics.json               # all models, all metrics, schema_version, seed, versions, dataset hash
  model_comparison.csv       # leaderboard
  best_model_summary.txt     # chosen hyperparameters and rationale
  figures/
    confusion_matrix_best.png
    confusion_matrices_all.png
    model_comparison.png
    dataset_overview.png
```

---

## 7. Portable model export (the main technical risk)

The exporter writes a JSON spec containing exactly what the inference engine needs:

- `feature_order`, `classes`, `scaler` (`mean`, `scale`), `model_type`, `params`
- Linear: `coef`, `intercept`
- Trees: flat node arrays (`children_left`, `children_right`, `feature`, `threshold`, `value`)
- Forests: list of trees; probability = mean of tree probabilities
- KNN: scaled training vectors + labels, `k`, distance weighting
- Gaussian NB: `theta`, `var`, `class_prior`
- SVC: support vectors, dual coefficients, intercept, gamma, `probA/probB` plus the pairwise-coupling routine for calibrated probabilities

**Parity gate:** a Python test evaluates a reference implementation of the JSON spec against `joblib` on 500 random in-range points (label equality, max absolute probability difference < 1e-6). Those points and expected outputs are frozen as fixtures; the Vitest suite then proves the TypeScript engine matches. If any model family fails parity, it is excluded from the "eligible to be best" set and the failure is reported — the exported model is never allowed to disagree with the evaluated model.

---

## 8. Web application specification

### 8.1 Pages

| Route | Content |
|---|---|
| `/` | Hero with model badge; 4 measurement inputs (cm) with units, valid ranges and example presets; predict button; result card with species, confidence, probability bars; scatter plot (petal length vs petal width) showing the user's point against the 500 observations; reset |
| `/models` | Best-model card; full leaderboard table (CV + holdout metrics); holdout confusion matrix and per-class metrics for the best model; a figure grid of all seven confusion matrices; methodology note |
| `/dataset` | What the Iris dataset is; the 150 + 350 composition explained; synthetic-generation method and seed; split diagram; distribution comparison table; CSV download; link to the dataset card |
| `/api/predict` | `POST` JSON → prediction; `GET` → model metadata and health |
| `/api/metadata` | Model version, training date, dataset hash, headline metrics for the UI badge |

### 8.2 API contract

```ts
// request
{ sepal_length: number, sepal_width: number, petal_length: number, petal_width: number }

// 200
{
  species: "setosa" | "versicolor" | "virginica",
  display_name: string,
  confidence: number,                 // 0..1
  probabilities: { setosa: number, versicolor: number, virginica: number },
  model: { name: string, version: string, trained_at: string },
  warnings: string[]                   // e.g. "outside observed range"
}

// 400
{ error: "VALIDATION_ERROR", issues: [{ field, message }] }
```

Validation: finite positive numbers, hard bounds 0.1–20 cm, advisory warning outside the real-data observed range. Server-side validation is authoritative; the client mirrors it for fast feedback.

### 8.3 UX and quality bar

- Responsive from 360 px to desktop; keyboard accessible; labelled inputs; `aria-live` result announcement; visible focus states.
- Design language: restrained and instrument-like. White and light-neutral surfaces, hairline borders, near-black text, one deep green accent, muted species colours. Inter for text with IBM Plex Mono for labels and numeric data. Small corner radii, no shadows beyond a 1 px hairline, generous whitespace.
- **Explicitly excluded:** gradients of any kind, glassmorphism, glowing orbs, oversized marketing heroes, emoji, decorative illustrations, floating cards, pill-shaped buttons, and animated gradient text.
- Result reveals probability bars with a short opacity/position transition and the scatter point lands on the plot.
- Empty, loading, error and out-of-range states all designed.
- Prefers-reduced-motion respected; colour contrast checked.

### 8.4 Front-end tests

- Vitest: schema validation, inference parity against Python fixtures, API handler happy path + 400 cases.
- `npm run build` must pass with zero TypeScript errors; a post-build smoke script hits `/api/predict` on `next start`.

---

## 9. Repository layout

```
IRIS CLASSIFICATION SYSTEM/
├─ README.md                     # overview, results summary, run/reproduce/deploy
├─ .gitignore  .editorconfig  .gitattributes
├─ .github/workflows/ci.yml      # pytest + vitest + next build
├─ docs/
│  ├─ PLAN.md                    # this document
│  ├─ DATASET_CARD.md
│  ├─ MODEL_CARD.md
│  ├─ REPORT.md                  # academic report
│  └─ VIVA_NOTES.md              # demo script + likely questions
├─ data/iris_500.csv
├─ ml/
│  ├─ requirements.txt
│  ├─ pyproject.toml
│  ├─ run_pipeline.py            # one command: data → train → evaluate → export
│  ├─ src/iris_ml/{config,data,synthetic,train,evaluate,export,plots}.py
│  └─ tests/{test_dataset,test_training,test_export_parity}.py
├─ artifacts/                    # metrics, figures, joblib
├─ app/                          # Next.js App Router
│  ├─ layout.tsx  page.tsx  globals.css
│  ├─ models/page.tsx  dataset/page.tsx
│  └─ api/predict/route.ts  api/metadata/route.ts
├─ components/                   # form, result, probability bars, scatter, tables, nav
├─ lib/                          # inference engine, zod schemas, formatting, model.json
├─ public/                       # figures, dataset CSV, favicon
├─ tests/                        # Vitest
├─ scripts/                      # smoke test, data sync
├─ package.json  tsconfig.json  next.config.ts  postcss.config.mjs
```

The Next.js app sits at the repository root so Vercel needs no Root Directory configuration. Python lives in `ml/` and is never part of the Vercel build.

---

## 10. Implementation phases

| Phase | Work | Exit criteria |
|---|---|---|
| P0 | Plan approval, decisions on D1–D4 | You approve |
| P1 | Repo scaffold, virtualenv, Next.js + Tailwind + TS, lint/test config, CI, `.gitignore` | `npm run dev` serves a placeholder; `pytest` and `vitest` run; first commit |
| P2 | Data pipeline: load Iris, audit, split, synthetic generator, CSV, dataset card, EDA figure | Dataset tests green; exactly 500 rows; regenerated hash matches |
| P3 | Training + tuning + evaluation + figures + joblib + JSON export | Leaderboard and confusion matrices produced; parity tests green |
| P4 | Inference engine, API routes, three pages, responsive/a11y pass | `/api/predict` correct; all pages render; build passes |
| P5 | README, dataset card finalisation, model card, academic report, viva notes | Documents consistent with emitted metrics |
| P6 | Git history, GitHub push, Vercel deploy, production smoke test | Live URL predicts correctly; CI green |
| P7 | Handover: run/reproduce/deploy commands, demo walkthrough, known limitations | You can reproduce the pipeline unaided |

Estimated effort: 2–3 focused sessions; P3 and P4 are the bulk.

---

## 11. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Synthetic data inflates scores | Misleading conclusions | Generate from train only; headline = 30 real holdout; label the optimistic full-500 split as supplementary; state it in report and UI |
| Deployed engine diverges from sklearn | Wrong predictions in production | 1e-6 parity gate on 500 frozen cases, in both Python and TypeScript |
| Best model family is hard to export | Rework late | All 7 families exportable by design; failure removes a model from eligibility |
| 30-row test set is noisy | Wide confidence intervals | Report CV mean ± std and per-class support; discuss in limitations |
| Model JSON bundle size | Slow cold start | Trees stored as compact arrays, tree count capped, size budget < 8 MB, measured |
| Python 3.15 is very new | Odd wheel/behaviour issues | Project-local venv, pinned versions, CI on Python 3.13 |
| Vercel/GitHub auth unavailable to the agent | Cannot finish R8/R9 | You complete browser login once; I automate the rest (D4) |
| Academic-integrity concerns | Grade penalty | Full provenance, seeds, hashes, no fabricated numbers, methodology documented |

---

## 12. Deployment plan

1. `git init`, initial commit, topic branches for phases (optional), final `main`.
2. Create the GitHub repository, push `main`, verify Actions pass.
3. Install Vercel CLI, `vercel login`, `vercel link`, `vercel --prod`.
4. Smoke test: GET `/` 200, GET `/api/metadata` 200, POST a known Setosa and a known Virginica → expected labels, confidence > 0.9.
5. Record the production URL in `README.md`, tag `v1.0.0`.

---

## 13. Decisions requiring your approval

- **D1 — Plan as a whole.** Approve, or request changes.
- **D2 — Dataset split.** Recommended leakage-free design (470 train / 30 real test, synthetic from training only). Alternative: conventional stratified 80/20 over all 500 rows (400/100), simpler to explain, mildly optimistic and disclosed as such. A third option: do both, with the conventional split in an appendix.
- **D3 — Runtime model.** Recommended JSON export + TypeScript engine. Alternative: Python serverless function on Vercel (keeps `.joblib` as the runtime artifact, adds a second runtime and cold starts).
- **D4 — GitHub/Vercel ownership.** Recommended: you complete `gh auth login` and `vercel login` once in your terminal; I install the CLIs and handle repo creation, push, and deploy. Alternatives: you deploy manually from prepared instructions, or you supply tokens (not recommended).

Also assumed unless you say otherwise: the academic report, dataset card, model card and viva notes are in scope; the UI covers the three pages described; no user accounts, database, or prediction history are required.
