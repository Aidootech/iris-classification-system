"""Run the full pipeline: data -> tuning -> evaluation -> export.

Usage (from the repository root):

    ml/.venv/Scripts/python.exe ml/run_pipeline.py      # Windows
    ml/.venv/bin/python ml/run_pipeline.py              # macOS / Linux
"""

from __future__ import annotations

import json
import platform
import shutil
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "src"))

import joblib
import numpy as np
import pandas as pd
import sklearn
from scipy.stats import ks_2samp

from iris_ml.config import (
    ARTIFACTS_DIR,
    BEST_MODEL_PATH,
    CLASS_NAMES,
    COMPARISON_PATH,
    CV_FOLDS,
    DATASET_PATH,
    FEATURES,
    FIGURES_DIR,
    METRICS_PATH,
    MODEL_DIR,
    N_TOTAL,
    PROJECT_ROOT,
    PUBLIC_DIR,
    SCHEMA_VERSION,
    SCORING,
    SEED,
    SYNTHETIC_METHOD,
    WEB_MODEL_PATH,
    WEB_POINTS_PATH,
    WEB_SUMMARY_PATH,
)
from iris_ml.data import (
    build_dataset,
    feature_ranges,
    load_dataset,
    save_dataset,
    sha256_file,
    validate_dataset,
)
from iris_ml.evaluate import compact, evaluate
from iris_ml.export import build_spec, write_json, write_parity_cases
from iris_ml.plots import (
    plot_comparison,
    plot_confusion,
    plot_confusion_grid,
    plot_dataset,
    plot_feature_distributions,
)
from iris_ml.train import fit_models, select_best
from iris_ml.utils import utc_now


def _fidelity(dataset: pd.DataFrame) -> dict[str, object]:
    output: dict[str, object] = {}
    for name in CLASS_NAMES:
        real = dataset[
            (dataset["species"] == name)
            & (dataset["source"] == "real")
            & (dataset["split"] == "train")
        ]
        synthetic = dataset[
            (dataset["species"] == name) & (dataset["source"] == "synthetic")
        ]
        output[name] = {}
        for feature in FEATURES:
            statistic = ks_2samp(real[feature], synthetic[feature])
            output[name][feature] = {
                "real_mean": round(float(real[feature].mean()), 3),
                "synthetic_mean": round(float(synthetic[feature].mean()), 3),
                "real_std": round(float(real[feature].std()), 3),
                "synthetic_std": round(float(synthetic[feature].std()), 3),
                "ks_statistic": round(float(statistic.statistic), 4),
                "ks_pvalue": round(float(statistic.pvalue), 4),
            }
    return output


def main() -> None:
    started = time.perf_counter()
    print("=" * 78)
    print("IRIS CLASSIFICATION SYSTEM — TRAINING PIPELINE")
    print("=" * 78)

    for directory in (
        ARTIFACTS_DIR,
        FIGURES_DIR,
        MODEL_DIR,
        PROJECT_ROOT / "ml" / "tests" / "fixtures",
        PUBLIC_DIR / "data",
        PUBLIC_DIR / "model" / "figures",
    ):
        directory.mkdir(parents=True, exist_ok=True)

    print("\n[1/6] Building dataset")
    dataset = build_dataset()
    profile = validate_dataset(dataset)
    save_dataset(dataset, DATASET_PATH)
    dataset = load_dataset(DATASET_PATH)
    dataset_hash = sha256_file(DATASET_PATH)
    ranges = feature_ranges(dataset)
    fidelity = _fidelity(dataset)

    print(
        f"      rows={profile['rows']} real={profile['real']} "
        f"synthetic={profile['synthetic']} train={profile['train']} test={profile['test']}"
    )
    print(f"      sha256={dataset_hash}")

    train = dataset[dataset["split"] == "train"]
    test = dataset[dataset["split"] == "test"]
    real_train = dataset[
        (dataset["split"] == "train") & (dataset["source"] == "real")
    ]

    X_train = train[FEATURES].to_numpy(dtype=float)
    y_train = train["species"].to_numpy()
    X_test = test[FEATURES].to_numpy(dtype=float)
    y_test = test["species"].to_numpy()
    X_real_train = real_train[FEATURES].to_numpy(dtype=float)
    y_real_train = real_train["species"].to_numpy()

    print("\n[2/6] Tuning and fitting candidate models")
    results = fit_models(X_train, y_train, X_real_train, y_real_train)
    best = select_best(results)
    print(f"      selected on CV macro F1: {best.spec.display}")

    print("\n[3/6] Evaluating on the 30-row real holdout")
    best_metrics = evaluate(best.estimator, X_test, y_test)
    model_records: list[dict[str, object]] = []
    for result in results:
        metrics = evaluate(result.estimator, X_test, y_test)
        model_records.append(
            {
                "key": result.spec.key,
                "display": result.spec.display,
                "family": result.spec.family,
                "eligible": result.spec.eligible,
                "note": result.spec.note,
                "params": result.best_params,
                "cv": {
                    "macro_f1_mean": result.cv_mean,
                    "macro_f1_std": result.cv_std,
                    "folds": result.cv_folds,
                    "rows": int(len(train)),
                },
                "real_cv": {
                    "macro_f1_mean": result.real_cv_mean,
                    "macro_f1_std": result.real_cv_std,
                    "folds": result.real_cv_folds,
                    "rows": int(len(real_train)),
                },
                "test": compact(metrics),
                "report_text": metrics["report_text"],
                "search": result.search_results,
            }
        )

    eligible = [record for record in model_records if record["eligible"]]
    eligible.sort(key=lambda record: -record["cv"]["macro_f1_mean"])
    baseline = [record for record in model_records if not record["eligible"]]
    ordered = eligible + baseline
    for record in ordered:
        record["is_best"] = record["key"] == best.spec.key

    metrics_payload = {
        "schema_version": SCHEMA_VERSION,
        "generated_at": utc_now(),
        "dataset": {
            **profile,
            "path": "data/iris_500.csv",
            "sha256": dataset_hash,
            "synthetic_method": SYNTHETIC_METHOD,
            "seed": SEED,
            "feature_ranges": ranges,
            "fidelity": fidelity,
        },
        "environment": {
            "python": platform.python_version(),
            "scikit_learn": sklearn.__version__,
            "numpy": np.__version__,
            "pandas": pd.__version__,
            "platform": platform.platform(),
        },
        "protocol": {
            "seed": SEED,
            "cv_folds": CV_FOLDS,
            "scoring": SCORING,
            "selection": (
                "highest mean 5-fold CV macro F1 among eligible models; "
                "the holdout was not used for selection"
            ),
            "train_rows": int(len(train)),
            "test_rows": int(len(test)),
        },
        "best_model": {
            "key": best.spec.key,
            "display": best.spec.display,
            "params": best.best_params,
            "cv": {
                "macro_f1_mean": best.cv_mean,
                "macro_f1_std": best.cv_std,
                "folds": best.cv_folds,
            },
            "real_cv": {
                "macro_f1_mean": best.real_cv_mean,
                "macro_f1_std": best.real_cv_std,
                "folds": best.real_cv_folds,
            },
        },
        "models": model_records,
    }
    write_json(METRICS_PATH, metrics_payload)

    comparison = pd.DataFrame(
        [
            {
                "model": record["display"],
                "key": record["key"],
                "eligible": record["eligible"],
                "cv_macro_f1_mean": record["cv"]["macro_f1_mean"],
                "cv_macro_f1_std": record["cv"]["macro_f1_std"],
                "real_cv_macro_f1_mean": record["real_cv"]["macro_f1_mean"],
                "real_cv_macro_f1_std": record["real_cv"]["macro_f1_std"],
                "test_accuracy": record["test"]["accuracy"],
                "test_precision_macro": record["test"]["macro"]["precision"],
                "test_recall_macro": record["test"]["macro"]["recall"],
                "test_f1_macro": record["test"]["macro"]["f1"],
                "test_f1_weighted": record["test"]["weighted"]["f1"],
                "roc_auc_ovr_macro": record["test"]["roc_auc_ovr_macro"],
                "best_params": json.dumps(record["params"], sort_keys=True),
            }
            for record in ordered
        ]
    )
    comparison.to_csv(COMPARISON_PATH, index=False)

    print("\n[4/6] Saving models and exporting the deployable spec")
    trained_at = utc_now()
    specs_dir = ARTIFACTS_DIR / "specs"
    specs_dir.mkdir(parents=True, exist_ok=True)
    best_spec = None

    for result in results:
        spec = build_spec(
            result,
            trained_at=trained_at,
            dataset_sha256=dataset_hash,
            sklearn_version=sklearn.__version__,
            dataset_rows=N_TOTAL,
        )
        write_json(specs_dir / f"{result.spec.key}.json", spec)
        joblib.dump(
            {
                "model": result.estimator,
                "feature_order": FEATURES,
                "classes": list(result.estimator.classes_),
                "model_key": result.spec.key,
                "dataset_sha256": dataset_hash,
                "trained_at": trained_at,
                "sklearn_version": sklearn.__version__,
            },
            specs_dir / f"{result.spec.key}.joblib",
        )
        if result is best:
            best_spec = spec

    if best_spec is None:
        raise RuntimeError("best model was not exported")

    model_bytes = write_json(WEB_MODEL_PATH, best_spec)
    joblib.dump(
        {
            "model": best.estimator,
            "feature_order": FEATURES,
            "classes": list(best.estimator.classes_),
            "model_key": best.spec.key,
            "display_name": best.spec.display,
            "params": best.best_params,
            "dataset_sha256": dataset_hash,
            "trained_at": trained_at,
            "sklearn_version": sklearn.__version__,
        },
        BEST_MODEL_PATH,
    )
    print(f"      lib/model/model.json ({model_bytes:,} bytes)")
    print(f"      artifacts/best_model.joblib")

    summary = {
        "schema_version": SCHEMA_VERSION,
        "generated_at": utc_now(),
        "model": {
            "key": best.spec.key,
            "display": best.spec.display,
            "version": "1.0.0",
            "trained_at": trained_at,
            "dataset_sha256": dataset_hash,
            "sklearn_version": sklearn.__version__,
            "feature_order": FEATURES,
        },
        "dataset": {
            **profile,
            "synthetic_method": SYNTHETIC_METHOD,
            "seed": SEED,
            "feature_ranges": ranges,
            "fidelity": fidelity,
        },
        "best": {
            "key": best.spec.key,
            "display": best.spec.display,
            "params": best.best_params,
            "cv": {
                "macro_f1_mean": best.cv_mean,
                "macro_f1_std": best.cv_std,
                "folds": best.cv_folds,
            },
            "real_cv": {
                "macro_f1_mean": best.real_cv_mean,
                "macro_f1_std": best.real_cv_std,
                "folds": best.real_cv_folds,
            },
            "test": compact(best_metrics),
        },
        "models": [
            {
                "key": record["key"],
                "display": record["display"],
                "family": record["family"],
                "eligible": record["eligible"],
                "note": record["note"],
                "is_best": record["is_best"],
                "params": record["params"],
                "cv": record["cv"],
                "real_cv": record["real_cv"],
                "test": record["test"],
            }
            for record in ordered
        ],
        "protocol": metrics_payload["protocol"],
    }
    write_json(WEB_SUMMARY_PATH, summary)

    points = {
        "x": "petal_length_cm",
        "y": "petal_width_cm",
        "classes": CLASS_NAMES,
        "points": [
            [
                float(row.petal_length_cm),
                float(row.petal_width_cm),
                int(row.species_id),
                1 if row.source == "synthetic" else 0,
            ]
            for row in dataset.itertuples()
        ],
    }
    write_json(WEB_POINTS_PATH, points)

    print("\n[5/6] Generating figures")
    plot_dataset(dataset, FIGURES_DIR / "dataset_overview.png")
    plot_feature_distributions(dataset, FIGURES_DIR / "feature_distributions.png")
    plot_comparison(ordered, FIGURES_DIR / "model_comparison.png")
    plot_confusion(
        best_metrics["confusion_matrix"]["counts"],
        CLASS_NAMES,
        FIGURES_DIR / "confusion_matrix_best.png",
        title=f"Best model: {best.spec.display}",
        subtitle=(
            f"Accuracy {best_metrics['accuracy']:.4f} "
            "on 30 held-out real observations"
        ),
    )
    plot_confusion_grid(
        [record for record in ordered if record["eligible"]],
        FIGURES_DIR / "confusion_matrices_all.png",
        CLASS_NAMES,
    )

    for figure in FIGURES_DIR.glob("*.png"):
        shutil.copy2(figure, PUBLIC_DIR / "model" / "figures" / figure.name)
    shutil.copy2(DATASET_PATH, PUBLIC_DIR / "data" / "iris_500.csv")

    print("\n[6/6] Writing parity fixtures for the TypeScript engine")
    real_inputs = dataset.loc[dataset["source"] == "real", FEATURES].to_numpy(dtype=float)
    case_count = write_parity_cases(
        ROOT / "tests" / "fixtures" / "parity_cases.json",
        best_spec,
        best.estimator,
        real_inputs,
        ranges,
    )
    print(f"      {case_count} frozen cases for {best.spec.key}")

    print("\n" + "=" * 78)
    print("HOLDOUT LEADERBOARD (30 real observations)")
    print("=" * 78)
    header = f"{'model':<26}{'cv f1':>9}{'real cv':>9}{'acc':>8}{'prec':>8}{'rec':>8}{'f1':>8}"
    print(header)
    print("-" * len(header))
    for record in ordered:
        marker = " *" if record["is_best"] else ""
        print(
            f"{record['display']:<26}"
            f"{record['cv']['macro_f1_mean']:>9.4f}"
            f"{record['real_cv']['macro_f1_mean']:>9.4f}"
            f"{record['test']['accuracy']:>8.4f}"
            f"{record['test']['macro']['precision']:>8.4f}"
            f"{record['test']['macro']['recall']:>8.4f}"
            f"{record['test']['macro']['f1']:>8.4f}"
            f"{marker}"
        )
    print("-" * len(header))
    print(f"* selected model: {best.spec.display}")
    print(f"\nCompleted in {time.perf_counter() - started:.1f}s")
    print(f"Artifacts: {ARTIFACTS_DIR}")


if __name__ == "__main__":
    main()
