"""Training and metric plumbing (fast checks; full tuning runs in the pipeline)."""

from __future__ import annotations

import numpy as np
import pytest
from sklearn.linear_model import LogisticRegression

from iris_ml.config import CLASS_NAMES, FEATURES
from iris_ml.data import build_dataset
from iris_ml.evaluate import compact, evaluate
from iris_ml.train import build_specs, select_best


def test_candidate_set_matches_the_documented_comparison() -> None:
    specs = build_specs()
    keys = [spec.key for spec in specs]
    assert keys == [
        "logistic_regression",
        "knn",
        "gaussian_nb",
        "decision_tree",
        "random_forest",
        "extra_trees",
        "svc_rbf",
        "dummy",
    ]
    assert len([spec for spec in specs if spec.eligible]) == 7
    assert [spec.key for spec in specs if not spec.eligible] == ["dummy"]


def test_metrics_are_complete_and_consistent() -> None:
    dataset = build_dataset()
    train = dataset[dataset["split"] == "train"]
    test = dataset[dataset["split"] == "test"]

    model = LogisticRegression(max_iter=5000, random_state=42)
    model.fit(train[FEATURES], train["species"])
    metrics = evaluate(model, test[FEATURES].to_numpy(), test["species"].to_numpy())

    assert 0.0 <= metrics["accuracy"] <= 1.0
    assert set(metrics["per_class"]) == set(CLASS_NAMES)
    assert int(np.asarray(metrics["confusion_matrix"]["counts"]).sum()) == len(test)
    assert metrics["n_test"] == 30
    assert metrics["confusion_matrix"]["labels"] == CLASS_NAMES
    assert all(
        abs(sum(row) - 1.0) < 1e-6
        for row in metrics["confusion_matrix"]["normalized"]
    )
    assert "report_text" in metrics
    assert "report_text" not in compact(metrics)


def test_select_best_never_chooses_the_baseline() -> None:
    class DummyResult:
        def __init__(self, key: str, eligible: bool, cv_mean: float, cv_std: float):
            self.spec = type("Spec", (), {"key": key, "display": key, "eligible": eligible})
            self.cv_mean = cv_mean
            self.cv_std = cv_std

    results = [
        DummyResult("dummy", False, 1.0, 0.0),
        DummyResult("model_a", True, 0.91, 0.02),
        DummyResult("model_b", True, 0.93, 0.03),
    ]
    best = select_best(results)  # type: ignore[arg-type]
    assert best.spec.key == "model_b"


def test_select_best_prefers_lower_variance_on_a_tie() -> None:
    class DummyResult:
        def __init__(self, key: str, cv_mean: float, cv_std: float):
            self.spec = type("Spec", (), {"key": key, "display": key, "eligible": True})
            self.cv_mean = cv_mean
            self.cv_std = cv_std

    results = [
        DummyResult("volatile", 0.95, 0.06),
        DummyResult("stable", 0.95, 0.01),
    ]
    assert select_best(results).spec.key == "stable"  # type: ignore[arg-type]
