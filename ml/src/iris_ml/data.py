"""Dataset construction, validation and persistence."""

from __future__ import annotations

import hashlib
from pathlib import Path

import pandas as pd
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split

from .config import (
    CLASS_NAMES,
    DATASET_PATH,
    FEATURES,
    N_REAL,
    N_SYNTHETIC,
    N_TOTAL,
    REAL_HOLDOUT_PER_CLASS,
    REAL_TRAIN_PER_CLASS,
    SEED,
    SYNTHETIC_COUNTS,
)
from .synthetic import generate_synthetic

COLUMNS = [
    "record_id",
    *FEATURES,
    "species",
    "species_id",
    "source",
    "synthetic_method",
    "split",
]


def load_real_iris() -> pd.DataFrame:
    """Load the 150 real observations directly from scikit-learn."""
    bunch = load_iris(as_frame=True)
    frame = bunch.frame.rename(
        columns={
            "sepal length (cm)": "sepal_length_cm",
            "sepal width (cm)": "sepal_width_cm",
            "petal length (cm)": "petal_length_cm",
            "petal width (cm)": "petal_width_cm",
            "target": "species_id",
        }
    ).copy()

    frame["species"] = frame["species_id"].map(dict(enumerate(CLASS_NAMES)))
    frame["source"] = "real"
    frame["synthetic_method"] = "not_applicable"
    frame.insert(
        0,
        "record_id",
        [f"REAL-{index:04d}" for index in range(1, len(frame) + 1)],
    )
    return frame


def split_real(frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Stratified 120/30 split of the real observations."""
    train_index, holdout_index = train_test_split(
        frame.index,
        test_size=0.2,
        random_state=SEED,
        shuffle=True,
        stratify=frame["species_id"],
    )
    train = frame.loc[train_index].copy()
    holdout = frame.loc[holdout_index].copy()

    for species_id, name in enumerate(CLASS_NAMES):
        if (train["species_id"] == species_id).sum() != REAL_TRAIN_PER_CLASS:
            raise AssertionError(f"{name}: unexpected training count")
        if (holdout["species_id"] == species_id).sum() != REAL_HOLDOUT_PER_CLASS:
            raise AssertionError(f"{name}: unexpected holdout count")
    return train, holdout


def build_dataset() -> pd.DataFrame:
    """Build the documented 500-row dataset.

    Order: 120 real training rows, 350 synthetic training rows, 30 real
    holdout rows.  Synthetic rows are generated from the 120 real training
    rows only, so no holdout observation influences them.
    """
    real = load_real_iris()
    real_train, real_holdout = split_real(real)

    synthetic = generate_synthetic(real_train, SYNTHETIC_COUNTS, SEED)

    real_train = real_train.sort_values(["species_id", "record_id"]).reset_index(
        drop=True
    )
    synthetic = synthetic.sort_values(["species_id", "record_id"]).reset_index(
        drop=True
    )
    real_holdout = real_holdout.sort_values(
        ["species_id", "record_id"]
    ).reset_index(drop=True)

    real_train["split"] = "train"
    synthetic["split"] = "train"
    real_holdout["split"] = "test"

    dataset = pd.concat(
        [real_train, synthetic, real_holdout], ignore_index=True
    )
    return dataset[COLUMNS]


def validate_dataset(dataset: pd.DataFrame) -> dict[str, object]:
    """Fail loudly if the dataset breaks any documented invariant."""
    errors: list[str] = []

    if len(dataset) != N_TOTAL:
        errors.append(f"expected {N_TOTAL} rows, found {len(dataset)}")
    if list(dataset.columns) != COLUMNS:
        errors.append(f"unexpected columns: {list(dataset.columns)}")

    real = dataset[dataset["source"] == "real"]
    synthetic = dataset[dataset["source"] == "synthetic"]
    train = dataset[dataset["split"] == "train"]
    test = dataset[dataset["split"] == "test"]

    if len(real) != N_REAL:
        errors.append(f"expected {N_REAL} real rows, found {len(real)}")
    if len(synthetic) != N_SYNTHETIC:
        errors.append(f"expected {N_SYNTHETIC} synthetic rows, found {len(synthetic)}")
    if len(test) != REAL_HOLDOUT_PER_CLASS * len(CLASS_NAMES):
        errors.append(f"expected 30 test rows, found {len(test)}")
    if (test["source"] != "real").any():
        errors.append("synthetic rows must not appear in the test split")

    for species_id, name in enumerate(CLASS_NAMES):
        if (real["species_id"] == species_id).sum() != 50:
            errors.append(f"{name}: expected 50 real rows")
        if (train["species_id"] == species_id).sum() != 40 + SYNTHETIC_COUNTS[name]:
            errors.append(f"{name}: unexpected training count")
        if (test["species_id"] == species_id).sum() != REAL_HOLDOUT_PER_CLASS:
            errors.append(f"{name}: unexpected holdout count")

    if dataset[FEATURES].isna().any().any():
        errors.append("missing feature values")
    if not dataset["record_id"].is_unique:
        errors.append("record_id values are not unique")
    if (synthetic["synthetic_method"] != "class_conditional_gaussian_v1").any():
        errors.append("synthetic rows are not labelled with their method")
    if (real["synthetic_method"] != "not_applicable").any():
        errors.append("real rows must be labelled not_applicable")

    if errors:
        raise AssertionError("dataset validation failed:\n- " + "\n- ".join(errors))

    return {
        "rows": int(len(dataset)),
        "real": int(len(real)),
        "synthetic": int(len(synthetic)),
        "train": int(len(train)),
        "test": int(len(test)),
        "class_counts": {
            name: {
                "real": int((real["species_id"] == index).sum()),
                "synthetic": int((synthetic["species_id"] == index).sum()),
                "total": int((dataset["species_id"] == index).sum()),
            }
            for index, name in enumerate(CLASS_NAMES)
        },
        "duplicates": int(
            dataset.duplicated(subset=[*FEATURES, "species"]).sum()
        ),
    }


def save_dataset(dataset: pd.DataFrame, path: Path = DATASET_PATH) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(
        path,
        index=False,
        float_format="%.1f",
        lineterminator="\n",
    )
    return path


def load_dataset(path: Path = DATASET_PATH) -> pd.DataFrame:
    return pd.read_csv(path)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def feature_ranges(dataset: pd.DataFrame) -> dict[str, dict[str, float]]:
    real = dataset[dataset["source"] == "real"]
    return {
        feature: {
            "min": float(real[feature].min()),
            "max": float(real[feature].max()),
            "mean": round(float(real[feature].mean()), 3),
        }
        for feature in FEATURES
    }
