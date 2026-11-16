# Dataset Card: Iris 500

## Overview

`data/iris_500.csv` contains exactly 500 rows and 10 columns. It combines the
150 observations bundled with scikit-learn's Iris dataset with 350 synthetic
rows generated for training augmentation.

| Property | Value |
|---|---|
| Task | Multiclass classification, 3 species |
| Features | 4 continuous measurements in centimetres |
| Rows | 500 |
| Real observations | 150 |
| Synthetic observations | 350 |
| Training rows | 470 (120 real + 350 synthetic) |
| Holdout rows | 30 (real only, 10 per species) |
| Seed | 42 |
| Synthetic method | `class_conditional_gaussian_v1` |
| File size | 38,407 bytes |
| SHA-256 | `622e1404d418500c335882bc3b57771a2f9f2cd8e1ce2935a4b87eaca8cb9a80` |

## Provenance

The 150 real observations are loaded directly from
`sklearn.datasets.load_iris(as_frame=True)`. No third-party copy or manually
transcribed table is used. scikit-learn distributes the data under its own
BSD-3-Clause licence; the underlying Iris data is the classic dataset published
by R. A. Fisher (1936) and distributed by the UCI Machine Learning Repository.

The original measurements are sepal length, sepal width, petal length and
petal width in centimetres, recorded to one decimal place. The three classes
are *Iris setosa*, *Iris versicolor* and *Iris virginica*, with 50 real
observations each.

## Composition

| Species | Real | Synthetic | Total |
|---|---:|---:|---:|
| Setosa | 50 | 117 | 167 |
| Versicolor | 50 | 117 | 167 |
| Virginica | 50 | 116 | 166 |
| **Total** | **150** | **350** | **500** |

## Split design

The split is created before any synthetic data exists:

1. The 150 real rows are split with
   `train_test_split(test_size=0.2, stratify=species, random_state=42)`.
2. This produces 120 real training rows (40 per species) and 30 real holdout
   rows (10 per species).
3. Only the 120 real training rows are passed to the synthetic generator.
4. The final training set is the 120 real training rows plus 350 synthetic
   rows, for 470 rows.
5. The holdout remains 30 real rows and is never used for generation, feature
   scaling, hyperparameter selection or model fitting.

This design avoids a subtle leak in the simpler alternative, where synthetic
rows are generated from all 150 real rows before an 80/20 split: in that case
the generator has already seen the holdout distribution.

## Synthetic generation

Method identifier: `class_conditional_gaussian_v1`.

For each species `c`:

1. Take the 40 real training rows belonging to `c`.
2. Estimate the four-dimensional mean vector `mu_c`.
3. Estimate the 4 x 4 sample covariance matrix `Sigma_c` with `np.cov`.
4. Add a ridge term `1e-6 * I` to `Sigma_c` for numerical stability.
5. Draw the required number of samples from `N(mu_c, Sigma_c)` using
   `numpy.random.default_rng(42)`.
6. Clip each feature to that species' observed minimum and maximum in the 40
   real training rows.
7. Round every feature to one decimal place, matching the source data, then
   clip again to the observed range.
8. Label the row `source = synthetic`,
   `synthetic_method = class_conditional_gaussian_v1`, and assign a
   `SYN-####` record ID.

The generator is deliberately simple and auditable. It preserves the
within-class correlation structure through the full covariance matrix, but it
cannot create plausible values outside the observed per-species box, and it
cannot represent multimodality or outliers that are absent from the 40
training rows.

## Columns

| Column | Type | Description |
|---|---|---|
| `record_id` | string | `REAL-####` for source rows, `SYN-####` for generated rows |
| `sepal_length_cm` | float | Sepal length in centimetres |
| `sepal_width_cm` | float | Sepal width in centimetres |
| `petal_length_cm` | float | Petal length in centimetres |
| `petal_width_cm` | float | Petal width in centimetres |
| `species` | string | `setosa`, `versicolor` or `virginica` |
| `species_id` | integer | 0, 1 or 2 in the order above |
| `source` | string | `real` or `synthetic` |
| `synthetic_method` | string | Method ID, or `not_applicable` for real rows |
| `split` | string | `train` or `test` |

The literal string `not_applicable` is used for real rows rather than an empty
cell, so the column has no missing values and does not turn into `NaN` when
read by pandas.

## Observed feature ranges

Ranges below are computed over the 150 real observations and are used for the
advisory warnings in the web interface.

| Feature | Minimum (cm) | Mean (cm) | Maximum (cm) |
|---|---:|---:|---:|
| Sepal length | 4.3 | 5.843 | 7.9 |
| Sepal width | 2.0 | 3.057 | 4.4 |
| Petal length | 1.0 | 3.758 | 6.9 |
| Petal width | 0.1 | 1.199 | 2.5 |

## Distribution fidelity

The table compares the 40 real training rows of each species with that
species' synthetic rows. The p-value is a two-sample Kolmogorov-Smirnov test.
A p-value above 0.05 means no difference was detected at this sample size; it
is not proof that the distributions are identical.

| Species | Feature | Real mean | Synthetic mean | KS p-value |
|---|---|---:|---:|---:|
| Setosa | Sepal length | 4.99 | 4.99 | 0.99 |
| Setosa | Sepal width | 3.42 | 3.44 | 1.00 |
| Setosa | Petal length | 1.48 | 1.47 | 1.00 |
| Setosa | Petal width | 0.26 | 0.26 | 0.25 |
| Versicolor | Sepal length | 5.93 | 6.00 | 0.57 |
| Versicolor | Sepal width | 2.75 | 2.77 | 1.00 |
| Versicolor | Petal length | 4.25 | 4.29 | 0.90 |
| Versicolor | Petal width | 1.32 | 1.32 | 1.00 |
| Virginica | Sepal length | 6.61 | 6.58 | 0.80 |
| Virginica | Sepal width | 2.98 | 2.98 | 1.00 |
| Virginica | Petal length | 5.58 | 5.57 | 0.99 |
| Virginica | Petal width | 2.04 | 2.07 | 1.00 |

All twelve tests fail to reject the null hypothesis at the 5% level. The
lowest p-value is 0.25 for setosa petal width, where the synthetic distribution
is slightly narrower (`std 0.099` versus `0.115`). The summary figures are in
`lib/model/summary.json`; the full precision values are in
`artifacts/metrics.json`.

## Duplicates

Five rows share an identical `(sepal_length_cm, sepal_width_cm,
petal_length_cm, petal_width_cm, species)` vector with an earlier row. They are
ten records in five duplicate groups, and all are in the training split. Some
duplication is expected after rounding continuous draws to 0.1 cm, and the
original Iris data itself contains repeated feature vectors. No holdout row is
duplicated.

Duplicate rows are not removed. Removing them would change the documented row
count and would bias the class composition; keeping them reflects the data as
generated and is recorded here instead.

## Verification

The following invariants are enforced by `ml/tests/test_dataset.py`:

- 500 total rows, 150 real, 350 synthetic.
- 470 training rows and 30 test rows.
- 10 holdout rows per species, all real.
- 40 real training rows plus the documented synthetic count per species.
- Synthetic values lie within the per-species observed range and are multiples
  of 0.1 cm.
- Synthetic rows carry the method label; real rows carry `not_applicable`.
- Regeneration with seed 42 reproduces the identical DataFrame and file hash.
- The committed CSV matches the generator output.

The dataset page in the web application presents the composition, generation
steps, ranges and fidelity table, and offers the CSV for download.

## Intended use

Suitable for:

- Teaching and demonstrating a complete classification workflow.
- Comparing standard classifiers on a small, well-understood dataset.
- Demonstrating documented synthetic augmentation and leakage-free splitting.
- Testing a Python-to-TypeScript model export and parity gate.

Not suitable for:

- Botanical research or species discovery.
- Agricultural decisions, ecological monitoring or conservation policy.
- Claims that the synthetic rows are new biological observations.
- Any use where a 30-row holdout would be treated as a reliable estimate of
  field performance.

## Maintenance

Regenerate the dataset and every dependent artifact with:

```bash
ml/.venv/Scripts/python.exe ml/run_pipeline.py
```

The pipeline rewrites the CSV, metrics, figures, joblib artifacts, exported
JSON specs and parity fixtures. If the generation code or seed changes, update
this card, the SHA-256 in `README.md`, and the hashes embedded in the model
specs and summary.
