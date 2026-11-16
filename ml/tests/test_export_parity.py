"""Parity: exported JSON spec vs the fitted scikit-learn pipeline.

This is the gate that allows the TypeScript engine to be trusted.  Every model
family is checked, not only the selected model.
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pytest

from iris_ml.config import ARTIFACTS_DIR, DATASET_PATH, FEATURES, PROJECT_ROOT, WEB_MODEL_PATH
from iris_ml.data import feature_ranges, load_dataset, sha256_file
from iris_ml.reference import predict, predict_proba

SPECS_DIR = ARTIFACTS_DIR / "specs"
pytestmark = pytest.mark.skipif(
    not SPECS_DIR.exists() or not any(SPECS_DIR.glob("*.json")),
    reason="run ml/run_pipeline.py before the parity tests",
)


def _load_cases() -> tuple[list[tuple[Path, dict, dict]], np.ndarray]:
    dataset = load_dataset(DATASET_PATH)
    ranges = feature_ranges(dataset)
    lows = np.array([ranges[feature]["min"] for feature in FEATURES])
    highs = np.array([ranges[feature]["max"] for feature in FEATURES])
    rng = np.random.default_rng(2026)

    real = dataset.loc[dataset["source"] == "real", FEATURES].to_numpy(dtype=float)
    random = rng.uniform(lows, highs, size=(400, len(FEATURES)))
    inputs = np.vstack([real, random])

    cases: list[tuple[Path, dict, dict]] = []
    for spec_path in sorted(SPECS_DIR.glob("*.json")):
        spec = json.loads(spec_path.read_text(encoding="utf-8"))
        artifact = joblib.load(spec_path.with_suffix(".joblib"))
        cases.append((spec_path, spec, artifact))
    return cases, inputs


_CASES, _INPUTS = _load_cases()


@pytest.mark.parametrize("spec_path,spec,artifact", _CASES, ids=lambda value: getattr(value, "stem", ""))
def test_probabilities_match_sklearn(spec_path: Path, spec: dict, artifact: dict) -> None:
    model = artifact["model"]
    expected = model.predict_proba(_INPUTS)
    actual = predict_proba(spec, _INPUTS)

    assert actual.shape == expected.shape
    assert np.allclose(actual, expected, atol=1e-9, rtol=0), spec_path.name
    assert np.allclose(actual.sum(axis=1), 1.0, atol=1e-9)


@pytest.mark.parametrize("spec_path,spec,artifact", _CASES, ids=lambda value: getattr(value, "stem", ""))
def test_labels_match_sklearn(spec_path: Path, spec: dict, artifact: dict) -> None:
    model = artifact["model"]
    expected = model.predict(_INPUTS)
    actual = predict(spec, _INPUTS)
    assert (np.asarray(actual) == np.asarray(expected)).all(), spec_path.name


def test_export_metadata_is_consistent() -> None:
    dataset = load_dataset(DATASET_PATH)
    expected_hash = sha256_file(DATASET_PATH)
    for spec_path in sorted(SPECS_DIR.glob("*.json")):
        spec = json.loads(spec_path.read_text(encoding="utf-8"))
        artifact = joblib.load(spec_path.with_suffix(".joblib"))
        assert spec["feature_order"] == FEATURES
        assert spec["classes"] == ["setosa", "versicolor", "virginica"]
        assert spec["dataset_rows"] == len(dataset) == 500
        assert spec["dataset_sha256"] == expected_hash == artifact["dataset_sha256"]
        assert list(artifact["model"].classes_) == spec["classes"]


def test_deployable_model_is_small_enough() -> None:
    model_path = WEB_MODEL_PATH if WEB_MODEL_PATH.exists() else PROJECT_ROOT / "lib" / "model" / "model.json"
    assert model_path.exists(), "run ml/run_pipeline.py first"
    assert model_path.stat().st_size < 8 * 1024 * 1024
