export type Species = "setosa" | "versicolor" | "virginica";

export type FeatureKey =
  | "sepal_length_cm"
  | "sepal_width_cm"
  | "petal_length_cm"
  | "petal_width_cm";

export type MeasurementKey =
  | "sepal_length"
  | "sepal_width"
  | "petal_length"
  | "petal_width";

export interface TreePayload {
  feature: number[];
  threshold: number[];
  left: number[];
  right: number[];
  proba: number[][];
}

interface ModelBase {
  n_classes: number;
}

export interface LogisticRegressionParams extends ModelBase {
  type: "logistic_regression";
  coef: number[][];
  intercept: number[];
}

export interface KnnParams extends ModelBase {
  type: "knn";
  training_data: number[][];
  training_labels: number[];
  n_neighbors: number;
  weights: "uniform" | "distance";
}

export interface GaussianNbParams extends ModelBase {
  type: "gaussian_nb";
  theta: number[][];
  var: number[][];
  class_prior: number[];
}

export interface TreeParams extends ModelBase {
  type: "decision_tree";
  tree: TreePayload;
}

export interface ForestParams extends ModelBase {
  type: "random_forest" | "extra_trees";
  n_estimators: number;
  trees: TreePayload[];
}

export interface SvcParams extends ModelBase {
  type: "svc_rbf";
  kernel: "rbf";
  support_vectors: number[][];
  dual_coef: number[][];
  intercept: number[];
  gamma: number;
  n_support: number[];
  prob_a: number[];
  prob_b: number[];
}

export interface ConstantParams extends ModelBase {
  type: "constant";
  probabilities: number[];
  class_index: number;
}

export type ModelParams =
  | LogisticRegressionParams
  | KnnParams
  | GaussianNbParams
  | TreeParams
  | ForestParams
  | SvcParams
  | ConstantParams;

export interface ModelSpec {
  schema_version: number;
  model_key: string;
  display_name: string;
  family: string;
  trained_at: string;
  dataset_sha256: string;
  dataset_rows: number;
  sklearn_version: string;
  feature_order: FeatureKey[];
  classes: Species[];
  preprocessing:
    | { type: "none" }
    | { type: "standard_scaler"; mean: number[]; scale: number[] };
  model: ModelParams;
}

export interface ConfusionMatrix {
  labels: Species[];
  counts: number[][];
  normalized: number[][];
}

export interface ClassMetrics {
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface TestMetrics {
  accuracy: number;
  macro: { precision: number; recall: number; f1: number };
  weighted: { precision: number; recall: number; f1: number };
  per_class: Record<Species, ClassMetrics>;
  confusion_matrix: ConfusionMatrix;
  roc_auc_ovr_macro: number | null;
  n_test: number;
}

export interface MetricSummary {
  macro_f1_mean: number;
  macro_f1_std: number;
  folds: number[];
  rows: number;
}

export interface ModelSummary {
  key: string;
  display: string;
  family: string;
  eligible: boolean;
  note: string;
  is_best: boolean;
  params: Record<string, string | number | boolean | null>;
  cv: MetricSummary;
  real_cv: MetricSummary;
  test: TestMetrics;
}

export interface DatasetSummary {
  rows: number;
  real: number;
  synthetic: number;
  train: number;
  test: number;
  duplicates: number;
  synthetic_method: string;
  seed: number;
  class_counts: Record<Species, { real: number; synthetic: number; total: number }>;
  feature_ranges: Record<FeatureKey, { min: number; max: number; mean: number }>;
  fidelity: Record<
    Species,
    Record<
      FeatureKey,
      {
        real_mean: number;
        synthetic_mean: number;
        real_std: number;
        synthetic_std: number;
        ks_statistic: number;
        ks_pvalue: number;
      }
    >
  >;
}

export interface Summary {
  schema_version: number;
  generated_at: string;
  model: {
    key: string;
    display: string;
    version: string;
    trained_at: string;
    dataset_sha256: string;
    sklearn_version: string;
    feature_order: FeatureKey[];
  };
  dataset: DatasetSummary;
  best: {
    key: string;
    display: string;
    params: Record<string, string | number | boolean | null>;
    cv: MetricSummary;
    real_cv: MetricSummary;
    test: TestMetrics;
  };
  models: ModelSummary[];
  protocol: {
    seed: number;
    cv_folds: number;
    scoring: string;
    selection: string;
    train_rows: number;
    test_rows: number;
  };
}

export interface PredictionResponse {
  species: Species;
  species_display: string;
  confidence: number;
  probabilities: Record<Species, number>;
  warnings: string[];
  model: {
    key: string;
    display: string;
    version: string;
    trained_at: string;
    sklearn_version: string;
  };
}

export interface ApiError {
  error: string;
  message: string;
  issues?: { field: string; message: string }[];
}

export interface ScatterData {
  x: FeatureKey;
  y: FeatureKey;
  classes: Species[];
  /** [petal length, petal width, class index, 1 if synthetic else 0] */
  points: [number, number, number, number][];
}
