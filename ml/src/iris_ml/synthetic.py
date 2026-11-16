"""Synthetic observation generation.

The generator is deliberately simple and auditable: one multivariate Gaussian
per species, fitted on the *training* real observations only.  Draws are
clipped to the observed per-feature range for that species and rounded to one
decimal place, matching the precision of the original Iris measurements.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from .config import (
    CLASS_NAMES,
    FEATURES,
    REAL_TRAIN_PER_CLASS,
    SYNTHETIC_METHOD,
)


def generate_synthetic(
    real_train: pd.DataFrame, counts: dict[str, int], seed: int
) -> pd.DataFrame:
    """Generate class-conditional Gaussian samples from real training rows.

    Parameters
    ----------
    real_train:
        Real observations with ``source == "real"``.  Must contain exactly
        ``REAL_TRAIN_PER_CLASS`` rows per species.  Holdout rows must never be
        passed here; this is the only input to the generator.
    counts:
        Number of synthetic rows to draw per species name.
    seed:
        Seed for ``numpy.random.default_rng``.  Fixed for reproducibility.
    """
    rng = np.random.default_rng(seed)
    rows: list[dict[str, object]] = []
    ridge = np.eye(len(FEATURES)) * 1e-6

    for species_id, name in enumerate(CLASS_NAMES):
        subset = real_train.loc[real_train["species_id"] == species_id, FEATURES]
        values = subset.to_numpy(dtype=float)
        if len(values) != REAL_TRAIN_PER_CLASS:
            raise ValueError(
                f"{name}: expected {REAL_TRAIN_PER_CLASS} training rows, "
                f"found {len(values)}"
            )

        mean = values.mean(axis=0)
        covariance = np.cov(values, rowvar=False) + ridge
        draws = rng.multivariate_normal(mean, covariance, size=counts[name])

        lower = values.min(axis=0)
        upper = values.max(axis=0)
        draws = np.clip(draws, lower, upper)
        # The real data is recorded to 0.1 cm, so synthetic values must be too.
        draws = np.round(draws, 1)
        draws = np.clip(draws, lower, upper)

        for draw in draws:
            rows.append(
                {
                    "sepal_length_cm": float(draw[0]),
                    "sepal_width_cm": float(draw[1]),
                    "petal_length_cm": float(draw[2]),
                    "petal_width_cm": float(draw[3]),
                    "species": name,
                    "species_id": species_id,
                    "source": "synthetic",
                    "synthetic_method": SYNTHETIC_METHOD,
                }
            )

    frame = pd.DataFrame(rows)
    frame.insert(
        0,
        "record_id",
        [f"SYN-{index:04d}" for index in range(1, len(frame) + 1)],
    )
    return frame
