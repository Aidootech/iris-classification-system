# Viva and Demonstration Notes

## 1. Three-minute demonstration

Open the deployed URL (or `npm run dev` locally).

1. **Landing page.** State the task in one sentence: four measurements in, one
   of three Iris species out. Point out the hero strip: 500 rows, seven
   algorithms, CV macro F1, and the production model card.
2. **Sign in.** Choose `Get started`, create an account (or use the demo
   account), and land on the dashboard. Note that authentication is a
   browser-only demonstration.
3. **Overview.** Point out the workspace stats, the production model card, the
   recent predictions and the dataset balance.
4. **Setosa example.** Sidebar → Predict, click the `Setosa` chip, then
   `Classify specimen`. The species card shows the flower photograph, the
   confidence tier, the measurements and the model; below it are the probability
   bars for all three classes.
5. **Versicolor and Virginica.** Repeat with the other two chips. The scatter
   marker shows why setosa is easy and the other two are closer.
6. **History.** Sidebar → History. The three predictions are listed newest
   first with confidence, measurements and model version. Point out the CSV
   export and the clear action.
7. **Out-of-range warning.** Enter petal length `7.5` and petal width `3.0`.
   The prediction still appears, but a warning states that the values are
   outside the observed range. This demonstrates defensible input handling.
8. **Models page.** Sidebar → Models (or the public `/models` report) to show
   the leaderboard, the selected SVC card, the confusion matrix and the
   per-class table. Say that selection used cross-validated macro F1, not the
   holdout.
9. **Dataset page.** Sidebar → Dataset (or `/dataset`) to show the composition
   bar, the generation method, the feature ranges and the CSV download.
   Emphasise that synthetic rows were generated from the 120 real training rows
   only.
10. **Close.** Mention the parity suite: the TypeScript engine reproduces
    scikit-learn on 500 frozen cases, so deployment is not a different model.

If asked to prove the API directly:

```bash
curl -s -X POST http://localhost:3000/api/predict \
  -H "content-type: application/json" \
  -d '{"sepal_length":5.1,"sepal_width":3.5,"petal_length":1.4,"petal_width":0.2}'
```

## 2. Numbers to know

| Item | Value |
|---|---|
| Total rows | 500 |
| Real / synthetic | 150 / 350 |
| Training / holdout | 470 / 30 |
| Holdout composition | 10 per species, real only |
| Seed | 42 |
| Synthetic method | `class_conditional_gaussian_v1` |
| Synthetic counts | 117 / 117 / 116 |
| Selected model | RBF SVC |
| Hyperparameters | `C = 100`, `gamma = 0.01` |
| CV macro F1 | 0.9873 ± 0.0124 |
| Real-only CV macro F1 | 0.9666 ± 0.0312 |
| Holdout accuracy | 1.000 (30/30) |
| Holdout macro F1 | 1.000 |
| Baseline accuracy | 0.333 |
| Dataset SHA-256 (first 16) | `622e1404d418500c` |
| Model spec size | 7,909 bytes |
| Parity cases | 500 |
| Python tests | 29 |
| TypeScript tests | 20 |

## 3. Likely questions and answers

### Data

**Why exactly 500 rows?**

The brief requires 500. The 150 real Iris rows are kept intact and 350
synthetic rows bring the total to 500. The synthetic rows are labelled and
documented rather than passed off as real observations.

**Why synthetic data at all?**

The brief requires 500 observations, but the real dataset has only 150. Rather
than duplicate or fabricate rows silently, I generated them with a documented,
seeded method and kept every real holdout row untouched.

**How were the synthetic rows generated?**

One four-dimensional Gaussian per species, fitted on that species' 40 real
training rows. Covariance gets a `1e-6` ridge. Draws use
`numpy.random.default_rng(42)`, are clipped to the per-species observed range,
rounded to 0.1 cm, then clipped again.

**How do you prove the holdout did not leak?**

The 30 real holdout rows are split off before the generator is called. The
generator's only input is the 120 real training rows. Tests assert that no
synthetic row appears in the test split and that the generator receives only
training rows. The pipeline order is real split, then synthetic generation.

**Why not generate from all 150 and then split 80/20?**

That is the common but leaky shortcut: the generator would see the holdout
distribution before the split. The implemented design is deliberately stricter.
The cost is a smaller holdout (30 instead of 100), which I disclose.

**Why are there duplicate rows?**

Rounding continuous draws to 0.1 cm creates occasional collisions, and the
original Iris data already contains repeated feature vectors. Five extra rows
share a feature vector with an earlier row, all in training. They are
documented, not hidden.

**What do the KS tests show?**

For all 12 species-feature pairs, the two-sample KS test against the 40 real
training rows gives p > 0.05. The lowest is 0.25 for setosa petal width. This
means no clear difference was detected at this sample size; it does not prove
the distributions are identical.

### Models and evaluation

**Which models did you compare?**

Logistic Regression, K-Nearest Neighbours, Gaussian Naive Bayes, Decision Tree,
Random Forest, Extra Trees and RBF SVC, plus a majority-class baseline that was
not eligible to win.

**How did you choose the winner?**

Highest mean macro F1 in stratified five-fold cross-validation on the 470
training rows. Ties break on lower fold variance, then name. The holdout was
scored once after selection.

**Why macro F1 rather than accuracy?**

Macro F1 weights each species equally. Accuracy can hide poor performance on a
minority class. The classes are nearly balanced here, but macro F1 is still the
more informative primary metric.

**What is the difference between CV and holdout?**

CV reuses the training data in five folds to estimate performance and tune
hyperparameters. The holdout is 30 real rows never used for tuning; it is the
final check. Reporting both shows the result is not an artifact of one split.

**Why did the SVC win?**

It has the highest mean CV macro F1, but only by 0.000036 over Logistic
Regression. That difference is negligible relative to fold noise. The SVC won
under the pre-declared rule; Logistic Regression would also be defensible and
has lower fold variance.

**What do `C` and `gamma` mean?**

`C` controls the penalty for margin violations: larger `C` fits the training
data more tightly. `gamma` controls the reach of a single RBF kernel: larger
`gamma` makes the boundary more local and flexible. The tuned values are
`C = 100` and `gamma = 0.01`, i.e. a fairly soft, broad kernel.

**Why is Gaussian Naive Bayes weaker?**

Its conditional independence assumption is wrong for correlated Iris
measurements, especially petal length and width. It still performs reasonably
because the classes are well separated.

**Random Forest versus Extra Trees?**

Both average many trees. Random Forest searches for the best split among a
random feature subset; Extra Trees chooses random thresholds and therefore has
more variance reduction but more bias. Here they are close, with Extra Trees
slightly ahead.

**Why can a 30-row perfect holdout not be trusted as 100% accuracy?**

Thirty successes give an observed accuracy of 1.000, but the 95% Wilson
interval is roughly 0.886 to 1.000. The cross-validated estimate
(0.987 ± 0.012) is more stable. "100% on this holdout" is not "100% in the
field".

**Which species are confused?**

Setosa is never confused by any model. Versicolor and virginica overlap,
particularly in sepal measurements; the tree and Naive Bayes models made errors
in both directions.

**Why is the baseline's accuracy 0.333 but its macro F1 0.167?**

It predicts setosa for every row. It gets all 10 setosa right, but has zero
recall for the other two classes. The per-class F1 values are 0.5 for setosa
and 0 for the other two, so macro F1 is 0.167, while accuracy is 10/30 = 0.333.
The gap shows why accuracy alone is insufficient.

**What is in the confusion matrix?**

Rows are true species, columns are predicted species. Diagonal cells are
correct. Off-diagonal cells are specific error types, which is more informative
than a single accuracy number.

### Deployment

**Why not run Python on Vercel?**

It would add a second runtime, cold starts, dependency and upload-size risk.
Exporting the fitted model to JSON and running it in TypeScript gives one
runtime, fast inference and an inspectable model. The `.joblib` is still saved
for reproducibility, which satisfies the requirement to save the best model.

**How do you know the TypeScript model is the same as scikit-learn?**

A Python reference implementation of the JSON spec is compared with the fitted
pipeline on 500 inputs. Labels must match exactly and probabilities within
`1e-9` (`1e-6` for SVC calibration). Those cases are frozen as fixtures and
replayed by Vitest. Any drift fails the test suite.

**How do SVC probabilities work?**

The SVC is trained with `probability=True`. Platt scaling fits a sigmoid to
decision values, and pairwise coupling combines one-vs-one estimates into three
class probabilities that sum to one. The exporter stores `probA` and `probB`,
and the TypeScript engine implements the same coupling.

**What happens if I enter an impossible measurement?**

The API accepts finite values from 0.1 to 20 cm. Values outside the observed
real-data ranges are accepted but flagged with a warning. This is deliberate:
rejecting them would hide extrapolation, while silently accepting them would
overstate confidence.

**How is the app validated and secured?**

Zod validates the JSON body on the server. The API returns 400 with field
issues for invalid input. The UI validates the four measurements before sending
them. Sign-in, sign-up and prediction history are a browser-only demonstration:
a session is kept in `localStorage`, no password is stored or transmitted, and
there is no server-side account database. Clearing site data removes the local
account and history. The model is read-only and no measurement is sent to a
third party.

**What would you change with more time?**

Repeated or nested cross-validation, an external validation set, probability
calibration diagnostics, and a comparison with the conventional 80/20 split
over all 500 rows as an explicitly optimistic baseline.

## 4. Questions to ask yourself before the viva

- Can I explain the split order without looking at the code?
- Can I state the selection rule and why the holdout was not used?
- Can I read the confusion matrix aloud correctly?
- Can I explain why 100% on 30 rows is not proof of 100% accuracy?
- Do I know exactly which files contain the dataset, model, metrics and figures?
- Can I explain the difference between the `.joblib` and the JSON export?
- Can I show one failing input case and explain the response?

## 5. Files to have open

| Purpose | File |
|---|---|
| Dataset | `data/iris_500.csv` |
| All metrics | `artifacts/metrics.json` |
| Leaderboard | `artifacts/model_comparison.csv` |
| Selected model | `artifacts/best_model.joblib` |
| Deployed spec | `lib/model/model.json` |
| Inference engine | `lib/model/inference.ts` |
| Validation | `lib/schema.ts` |
| API | `app/api/predict/route.ts` |
| Dashboard shell | `components/dashboard-shell.tsx` |
| Species result card | `components/species-card.tsx` |
| Session storage | `lib/session.ts` |
| Prediction history | `lib/history.ts` |
| Synthetic generator | `ml/src/iris_ml/synthetic.py` |
| Split and validation | `ml/src/iris_ml/data.py` |
| Tuning | `ml/src/iris_ml/train.py` |
| Report figures | `public/model/figures/` |
| Parity fixtures | `ml/tests/fixtures/parity_cases.json` |

## 6. Things not to claim

- Do not say the synthetic rows are real observations.
- Do not say the model is 100% accurate in general.
- Do not say the holdout was used to tune the model.
- Do not say the SVC is clearly better than Logistic Regression; the margin is
  negligible.
- Do not say the KS tests prove the synthetic distribution is correct; they
  only fail to detect a difference.
- Do not say the TypeScript engine is scikit-learn; it is a tested
  reimplementation.
