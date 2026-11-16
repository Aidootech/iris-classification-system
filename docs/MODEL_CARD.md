# Model Card: Iris SVC

## Model details

| Property | Value |
|---|---|
| Model key | `svc_rbf` |
| Display name | Support Vector Machine |
| Family | Kernel, RBF |
| Version | 1.0.0 |
| Trained at | 2026-11-16T20:23:09Z |
| Training library | scikit-learn 1.9.1 |
| Runtime | Custom TypeScript inference engine |
| Artifact | `artifacts/best_model.joblib` |
| Portable spec | `lib/model/model.json` (7,909 bytes) |
| Dataset hash | `622e1404d418500c335882bc3b57771a2f9f2cd8e1ce2935a4b87eaca8cb9a80` |
| Seed | 42 |

### Pipeline

```text
StandardScaler -> SVC(kernel="rbf", C=100.0, gamma=0.01,
                      probability=True, random_state=42)
```

The four features are standardised with the mean and scale learned from the
470 training rows, then passed to an RBF support vector classifier. The
classifier uses the one-vs-one decision scheme native to libsvm. Probabilities
are produced by Platt scaling and pairwise coupling, so the three class
probabilities sum to one.

## Intended use

The model classifies an Iris flower into *setosa*, *versicolor* or *virginica*
from four measurements in centimetres. It is intended for education,
demonstration and comparison of classification algorithms.

It must not be used for botanical research, ecological monitoring,
conservation decisions or any setting where a wrong prediction has material
consequences. It has no knowledge of geography, genetics, measurement protocol
or image data.

## Training data

The model is fitted on 470 rows: 120 real observations from
`sklearn.datasets.load_iris` and 350 synthetic rows generated from those 120
rows only. The 30 real holdout rows are excluded from every fitting,
generation and tuning step.

Details of the generation method, per-class counts, distribution checks and
limitations are in [`DATASET_CARD.md`](DATASET_CARD.md).

## Selection protocol

Each candidate is a scikit-learn pipeline with the preprocessing appropriate to
its family. Hyperparameters are selected by `GridSearchCV` with stratified
five-fold cross-validation on the 470 training rows, scored by macro F1.

Selection rule: highest mean cross-validated macro F1 among eligible models.
Ties are broken by lower fold standard deviation, then by display name. The
holdout is not used for selection. The majority-class baseline is reported for
context and is not eligible.

### Candidate results

| Model | CV macro F1 | Real-only CV | Holdout accuracy | Holdout macro F1 | ROC-AUC |
|---|---:|---:|---:|---:|---:|
| **Support Vector Machine** | **0.9873 ± 0.0124** | 0.9666 | **1.000** | **1.000** | 1.000 |
| Logistic Regression | 0.9873 ± 0.0104 | 0.9665 | 1.000 | 1.000 | 1.000 |
| Extra Trees | 0.9851 ± 0.0144 | 0.9582 | 0.967 | 0.967 | 0.997 |
| K-Nearest Neighbours | 0.9808 ± 0.0282 | 0.9582 | 0.967 | 0.967 | 0.973 |
| Random Forest | 0.9767 ± 0.0216 | 0.9497 | 0.967 | 0.967 | 0.997 |
| Decision Tree | 0.9745 ± 0.0158 | 0.9414 | 0.933 | 0.933 | 0.950 |
| Gaussian Naive Bayes | 0.9597 ± 0.0338 | 0.9582 | 0.933 | 0.933 | 0.990 |
| Majority-class baseline | 0.1653 ± 0.0000 | 0.1667 | 0.333 | 0.167 | 0.500 |

"Real-only CV" repeats five-fold cross-validation on the 120 real training
rows using the already tuned pipeline. It is a diagnostic, not a selection
input; no synthetic rows are present in those folds.

The selected SVC and Logistic Regression are separated by 0.000036 in mean CV
macro F1, which is far below fold-to-fold noise. The SVC wins under the
pre-declared rule. Logistic Regression would be an entirely defensible
alternative, and its lower fold variance is noted here rather than hidden.

Selected SVC fold scores: 1.0000, 1.0000, 0.9682, 0.9788, 0.9894.

## Holdout evaluation

The holdout contains 30 real observations, 10 per species. It was scored once,
after model selection.

| Metric | Value |
|---|---:|
| Accuracy | 1.000 |
| Macro precision | 1.000 |
| Macro recall | 1.000 |
| Macro F1 | 1.000 |
| Weighted F1 | 1.000 |
| ROC-AUC (OvR, macro) | 1.000 |
| Observations | 30 |

### Confusion matrix

Rows are true species; columns are predicted species.

|  | Setosa | Versicolor | Virginica |
|---|---:|---:|---:|
| **Setosa** | 10 | 0 | 0 |
| **Versicolor** | 0 | 10 | 0 |
| **Virginica** | 0 | 0 | 10 |

### Per-class metrics

| Species | Precision | Recall | F1 | Support |
|---|---:|---:|---:|---:|
| Setosa | 1.000 | 1.000 | 1.000 | 10 |
| Versicolor | 1.000 | 1.000 | 1.000 | 10 |
| Virginica | 1.000 | 1.000 | 1.000 | 10 |

A perfect 30-row holdout is not strong evidence of perfect field performance.
With 30 observations, the 95% Wilson interval for accuracy is approximately
0.886 to 1.000. The cross-validated estimate (0.987 ± 0.012) is the more stable
summary.

Errors made by the other models are informative about the difficult boundary:
Extra Trees and Random Forest confused one true versicolor as virginica;
K-Nearest Neighbours confused one true virginica as versicolor; Decision Tree
and Gaussian Naive Bayes confused one row in each direction between versicolor
and virginica. Setosa was never misclassified by any model.

## Export and runtime contract

`ml/src/iris_ml/export.py` writes a JSON specification containing:

- feature order and class order;
- scaler mean and scale;
- support vectors and dual coefficients;
- intercept, gamma and class weights;
- Platt calibration parameters `probA` and `probB`.

The TypeScript engine in `lib/model/inference.ts` reimplements the libsvm
decision function and pairwise probability coupling. This keeps production on
a single JavaScript runtime and makes the deployed model inspectable.

### Parity evidence

- The Python reference implementation is compared with the fitted scikit-learn
  pipeline on 500 inputs: all 150 real observations plus 350 random vectors
  drawn uniformly from the observed range.
- Labels must match exactly.
- Probabilities must match within `1e-9` for most model families; the SVC
  calibration path is checked at `1e-6` in the TypeScript suite.
- The same 500 cases are frozen in `ml/tests/fixtures/parity_cases.json` and
  replayed by `tests/inference.test.ts`.
- The deployed model spec is 7,909 bytes; the whole application remains well
  below the 8 MB artifact budget enforced by the tests.

The engine rounds tree thresholds through `Math.fround` where required to match
scikit-learn's float32 traversal. That detail is irrelevant to this SVC, but
the exporter supports every candidate family, so the parity suite checks all
of them rather than only the selected model.

## Input validation and warnings

The API accepts finite numbers from 0.1 to 20 cm. Values outside the observed
real-data ranges are accepted but returned with a warning:

| Feature | Observed range (cm) |
|---|---|
| Sepal length | 4.3 to 7.9 |
| Sepal width | 2.0 to 4.4 |
| Petal length | 1.0 to 6.9 |
| Petal width | 0.1 to 2.5 |

The model will still produce a probability distribution for out-of-range
inputs, but such predictions are extrapolations and should not be trusted.

## Limitations

- **Small holdout.** Thirty observations cannot tightly bound error rates.
- **Synthetic training data.** A Gaussian fitted to 40 rows per species cannot
  capture unobserved shapes, outliers or multimodal structure.
- **Narrow domain.** The model knows four measurements from one classic
  dataset, not Iris populations in general.
- **Measurement sensitivity.** Inputs are assumed to be measured in
  centimetres with the same protocol and precision as the source data.
- **Correlated classes.** Versicolor and virginica overlap in feature space;
  setosa is linearly separable and comparatively easy.
- **Custom runtime.** The TypeScript engine is tested against scikit-learn, but
  it is not scikit-learn. Any change to the exporter, engine or dependency
  versions requires rerunning the parity suite.

## Version pin and upgrade note

The artifacts were produced with scikit-learn 1.9.1 and joblib 1.6.0. The SVC
`probability=True` option emits a FutureWarning in scikit-learn 1.9 and is
scheduled for removal in 1.11. The exporter reads the private attributes
`_probA` and `_probB`; these are not part of scikit-learn's public API.

Do not upgrade scikit-learn without:

1. rerunning `ml/run_pipeline.py`;
2. regenerating all parity fixtures;
3. rerunning the Python and Vitest parity suites;
4. confirming `lib/model/model.json` still matches the fitted pipeline.

The exact environment is pinned in `ml/requirements.txt`.

## Ethical considerations

The model uses only four morphological measurements and has no access to
sensitive personal attributes. There is no foreseeable privacy or fairness
harm in classifying flowers. The main integrity risks are academic:
overstating the meaning of synthetic data, presenting a 30-row holdout as
conclusive, or allowing the deployed engine to drift from the evaluated model.
The documentation and parity tests are designed to make each of those risks
visible.
