"""Export a fitted scikit-learn pipeline to a portable JSON inference spec.

The spec contains only the arithmetic required at prediction time: the
standardisation parameters and the model parameters.  ``reference.py`` and the
TypeScript engine both evaluate this spec, and parity tests compare them with
scikit-learn's own predictions.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

from .config import FEATURES, SCHEMA_VERSION
from .train import TrainedModel
from .utils import to_jsonable


def _scaler_payload(pipeline: Pipeline) -> dict[str, Any]:
    scaler: StandardScaler | None = None
    for name, step in pipeline.steps[:-1]:
        if step == "passthrough" or name == "passthrough":
            continue
        if isinstance(step, StandardScaler):
            if scaler is not None:
                raise TypeError("multiple scalers are not supported")
            scaler = step
        else:
            raise TypeError(f"unsupported pipeline step: {type(step).__name__}")

    if scaler is None:
        return {"type": "none"}
    return {
        "type": "standard_scaler",
        "mean": [float(value) for value in scaler.mean_],
        "scale": [float(value) for value in scaler.scale_],
    }


def _tree_payload(estimator: DecisionTreeClassifier) -> dict[str, Any]:
    tree = estimator.tree_
    value = np.asarray(tree.value, dtype=float)
    if value.ndim == 3:
        value = value[:, 0, :]
    totals = value.sum(axis=1)
    probabilities = np.divide(
        value,
        totals[:, None],
        out=np.zeros_like(value),
        where=totals[:, None] != 0,
    )
    return {
        "feature": tree.feature.astype(int).tolist(),
        "threshold": tree.threshold.astype(float).tolist(),
        "left": tree.children_left.astype(int).tolist(),
        "right": tree.children_right.astype(int).tolist(),
        "proba": probabilities.astype(float).tolist(),
    }


def _model_payload(estimator: Any) -> dict[str, Any]:
    if isinstance(estimator, LogisticRegression):
        return {
            "type": "logistic_regression",
            "coef": np.asarray(estimator.coef_, dtype=float).tolist(),
            "intercept": np.asarray(estimator.intercept_, dtype=float).tolist(),
        }

    if isinstance(estimator, KNeighborsClassifier):
        if callable(estimator.weights):
            raise TypeError("callable KNN weights are not supported")
        return {
            "type": "knn",
            "training_data": np.asarray(estimator._fit_X, dtype=float).tolist(),
            "training_labels": np.asarray(estimator._y, dtype=int).tolist(),
            "n_neighbors": int(estimator.n_neighbors),
            "weights": str(estimator.weights),
        }

    if isinstance(estimator, GaussianNB):
        return {
            "type": "gaussian_nb",
            "theta": np.asarray(estimator.theta_, dtype=float).tolist(),
            "var": np.asarray(estimator.var_, dtype=float).tolist(),
            "class_prior": np.asarray(estimator.class_prior_, dtype=float).tolist(),
        }

    if isinstance(estimator, (RandomForestClassifier, ExtraTreesClassifier)):
        return {
            "type": "random_forest"
            if isinstance(estimator, RandomForestClassifier)
            else "extra_trees",
            "n_estimators": len(estimator.estimators_),
            "trees": [_tree_payload(tree) for tree in estimator.estimators_],
        }

    if isinstance(estimator, DecisionTreeClassifier):
        return {"type": "decision_tree", "tree": _tree_payload(estimator)}

    if isinstance(estimator, SVC):
        # scikit-learn 1.9 deprecates the public probability attributes together
        # with SVC(probability=True); the private values are what libsvm uses.
        if not estimator.probability or estimator._probA is None:
            raise TypeError("SVC must be fitted with probability=True")
        return {
            "type": "svc_rbf",
            "kernel": "rbf",
            "support_vectors": np.asarray(
                estimator.support_vectors_, dtype=float
            ).tolist(),
            "dual_coef": np.asarray(estimator.dual_coef_, dtype=float).tolist(),
            "intercept": np.asarray(estimator.intercept_, dtype=float).tolist(),
            "gamma": float(estimator._gamma),
            "n_support": np.asarray(estimator.n_support_, dtype=int).tolist(),
            "prob_a": np.asarray(estimator._probA, dtype=float).tolist(),
            "prob_b": np.asarray(estimator._probB, dtype=float).tolist(),
        }

    if isinstance(estimator, DummyClassifier):
        constant = np.asarray(
            estimator.predict_proba(np.zeros((1, len(FEATURES)))), dtype=float
        )[0]
        return {
            "type": "constant",
            "probabilities": constant.tolist(),
            "class_index": int(np.argmax(constant)),
        }

    raise TypeError(f"unsupported estimator: {type(estimator).__name__}")


def build_spec(
    trained: TrainedModel,
    *,
    trained_at: str,
    dataset_sha256: str,
    sklearn_version: str,
    dataset_rows: int,
) -> dict[str, Any]:
    pipeline = trained.estimator
    final_estimator = pipeline.steps[-1][1]
    classes = [str(label) for label in pipeline.classes_]

    return {
        "schema_version": SCHEMA_VERSION,
        "model_key": trained.spec.key,
        "display_name": trained.spec.display,
        "family": trained.spec.family,
        "trained_at": trained_at,
        "dataset_sha256": dataset_sha256,
        "dataset_rows": dataset_rows,
        "sklearn_version": sklearn_version,
        "feature_order": list(FEATURES),
        "classes": classes,
        "preprocessing": _scaler_payload(pipeline),
        "model": {
            "n_classes": len(classes),
            **_model_payload(final_estimator),
        },
    }


def write_json(path: Path, payload: dict[str, Any]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(to_jsonable(payload), indent=2, ensure_ascii=False) + "\n"
    path.write_text(text, encoding="utf-8")
    return len(text.encode("utf-8"))


def write_parity_cases(
    path: Path,
    spec: dict[str, Any],
    estimator,
    real_inputs: np.ndarray,
    ranges: dict[str, dict[str, float]],
    seed: int = 123,
    n_random: int = 350,
) -> int:
    """Freeze model outputs for the TypeScript parity test."""
    rng = np.random.default_rng(seed)
    lows = np.array([ranges[feature]["min"] for feature in FEATURES])
    highs = np.array([ranges[feature]["max"] for feature in FEATURES])
    random_inputs = rng.uniform(lows, highs, size=(n_random, len(FEATURES)))
    inputs = np.vstack([real_inputs, random_inputs])

    labels = estimator.predict(inputs)
    probabilities = estimator.predict_proba(inputs)

    cases = [
        {
            "input": [float(value) for value in row],
            "label": str(label),
            "probabilities": [float(value) for value in probs],
        }
        for row, label, probs in zip(inputs, labels, probabilities)
    ]
    payload = {
        "schema_version": SCHEMA_VERSION,
        "model_key": spec["model_key"],
        "feature_order": spec["feature_order"],
        "classes": spec["classes"],
        "tolerance": 1e-6,
        "case_count": len(cases),
        "cases": cases,
    }
    write_json(path, payload)
    return len(cases)
