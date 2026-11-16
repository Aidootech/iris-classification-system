"""Dataset invariants: composition, provenance, split isolation, reproducibility."""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest
from sklearn.datasets import load_iris

from iris_ml.config import (
    CLASS_NAMES,
    DATASET_PATH,
    FEATURES,
    N_REAL,
    N_SYNTHETIC,
    N_TOTAL,
    SYNTHETIC_METHOD,
)
from iris_ml.data import (
    build_dataset,
    load_dataset,
    save_dataset,
    sha256_file,
    validate_dataset,
)


@pytest.fixture(scope="module")
def dataset() -> pd.DataFrame:
    return build_dataset()


def test_real_source_is_the_sklearn_dataset() -> None:
    bunch = load_iris()
    real = load_dataset() if DATASET_PATH.exists() else build_dataset()
    real = real[real["source"] == "real"].sort_values("record_id")
    assert len(real) == len(bunch.data) == N_REAL
    assert np.allclose(real[FEATURES].to_numpy(), bunch.data, atol=1e-12)
    assert real["species"].tolist() == [bunch.target_names[i] for i in bunch.target]


def test_exactly_five_hundred_documented_rows(dataset: pd.DataFrame) -> None:
    profile = validate_dataset(dataset)
    assert profile["rows"] == N_TOTAL == 500
    assert profile["real"] == N_REAL == 150
    assert profile["synthetic"] == N_SYNTHETIC == 350
    assert profile["train"] == 470
    assert profile["test"] == 30


def test_holdout_is_real_only_and_balanced(dataset: pd.DataFrame) -> None:
    test = dataset[dataset["split"] == "test"]
    assert set(test["source"]) == {"real"}
    assert test.groupby("species").size().to_dict() == {
        name: 10 for name in CLASS_NAMES
    }


def test_synthetic_rows_are_labelled_and_bounded(dataset: pd.DataFrame) -> None:
    synthetic = dataset[dataset["source"] == "synthetic"]
    train_real = dataset[
        (dataset["source"] == "real") & (dataset["split"] == "train")
    ]
    assert (synthetic["synthetic_method"] == SYNTHETIC_METHOD).all()
    assert (train_real["synthetic_method"] == "not_applicable").all()
    assert len(synthetic) == N_SYNTHETIC

    for name in CLASS_NAMES:
        generated = synthetic[synthetic["species"] == name]
        real = train_real[train_real["species"] == name]
        for feature in FEATURES:
            assert generated[feature].min() >= real[feature].min()
            assert generated[feature].max() <= real[feature].max()
            # Measurements are recorded to 0.1 cm.
            assert np.allclose(generated[feature] * 10, np.round(generated[feature] * 10))


def test_generation_is_deterministic(dataset: pd.DataFrame, tmp_path) -> None:
    again = build_dataset()
    pd.testing.assert_frame_equal(dataset, again)

    first = save_dataset(dataset, tmp_path / "first.csv")
    second = save_dataset(again, tmp_path / "second.csv")
    assert sha256_file(first) == sha256_file(second)


def test_committed_csv_matches_the_generator(dataset: pd.DataFrame) -> None:
    assert DATASET_PATH.exists(), "run ml/run_pipeline.py before the test suite"
    committed = load_dataset(DATASET_PATH)
    pd.testing.assert_frame_equal(committed, dataset)


def test_no_synthetic_row_leaks_into_the_holdout(dataset: pd.DataFrame) -> None:
    assert not (
        (dataset["split"] == "test") & (dataset["source"] == "synthetic")
    ).any()
    # The synthetic generator is fitted on 120 real training rows only.
    assert len(dataset[(dataset["source"] == "real") & (dataset["split"] == "train")]) == 120
