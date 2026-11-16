"""Shared configuration for the Iris classification pipeline."""

from __future__ import annotations

from pathlib import Path

SCHEMA_VERSION = 1
SEED = 42

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = PROJECT_ROOT / "data"
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"
FIGURES_DIR = ARTIFACTS_DIR / "figures"
PUBLIC_DIR = PROJECT_ROOT / "public"
MODEL_DIR = PROJECT_ROOT / "lib" / "model"

DATASET_PATH = DATA_DIR / "iris_500.csv"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"
COMPARISON_PATH = ARTIFACTS_DIR / "model_comparison.csv"
BEST_MODEL_PATH = ARTIFACTS_DIR / "best_model.joblib"

WEB_MODEL_PATH = MODEL_DIR / "model.json"
WEB_SUMMARY_PATH = MODEL_DIR / "summary.json"
WEB_POINTS_PATH = MODEL_DIR / "points.json"

FEATURES = [
    "sepal_length_cm",
    "sepal_width_cm",
    "petal_length_cm",
    "petal_width_cm",
]

FEATURE_LABELS = {
    "sepal_length_cm": "Sepal length",
    "sepal_width_cm": "Sepal width",
    "petal_length_cm": "Petal length",
    "petal_width_cm": "Petal width",
}

CLASS_NAMES = ["setosa", "versicolor", "virginica"]
CLASS_IDS = {name: index for index, name in enumerate(CLASS_NAMES)}

N_REAL = 150
N_SYNTHETIC = 350
N_TOTAL = N_REAL + N_SYNTHETIC
REAL_HOLDOUT_PER_CLASS = 10
REAL_TRAIN_PER_CLASS = 40

SYNTHETIC_METHOD = "class_conditional_gaussian_v1"
SYNTHETIC_COUNTS = {"setosa": 117, "versicolor": 117, "virginica": 116}

CV_FOLDS = 5
SCORING = "f1_macro"
