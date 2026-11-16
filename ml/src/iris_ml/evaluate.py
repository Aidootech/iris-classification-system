"""Metric computation for a fitted classifier."""

from __future__ import annotations

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
    roc_auc_score,
)

from .config import CLASS_NAMES


def _round_list(values: np.ndarray, digits: int = 6) -> list[float]:
    return [round(float(value), digits) for value in values]


def evaluate(estimator, X: np.ndarray, y: np.ndarray) -> dict[str, object]:
    """Return accuracy, macro/weighted/ per-class P-R-F1 and confusion matrix."""
    y_pred = estimator.predict(X)
    probabilities = estimator.predict_proba(X)

    precision_macro, recall_macro, f1_macro, _ = precision_recall_fscore_support(
        y, y_pred, labels=CLASS_NAMES, average="macro", zero_division=0
    )
    precision_weighted, recall_weighted, f1_weighted, _ = (
        precision_recall_fscore_support(
            y, y_pred, labels=CLASS_NAMES, average="weighted", zero_division=0
        )
    )
    precision, recall, f1, support = precision_recall_fscore_support(
        y, y_pred, labels=CLASS_NAMES, average=None, zero_division=0
    )

    counts = confusion_matrix(y, y_pred, labels=CLASS_NAMES)
    row_totals = counts.sum(axis=1, keepdims=True)
    normalised = np.divide(
        counts,
        row_totals,
        out=np.zeros_like(counts, dtype=float),
        where=row_totals != 0,
    )

    try:
        roc_auc = float(
            roc_auc_score(
                y,
                probabilities,
                labels=CLASS_NAMES,
                multi_class="ovr",
                average="macro",
            )
        )
    except ValueError:
        roc_auc = None

    report = classification_report(
        y,
        y_pred,
        labels=CLASS_NAMES,
        output_dict=True,
        zero_division=0,
    )

    return {
        "accuracy": float(accuracy_score(y, y_pred)),
        "macro": {
            "precision": float(precision_macro),
            "recall": float(recall_macro),
            "f1": float(f1_macro),
        },
        "weighted": {
            "precision": float(precision_weighted),
            "recall": float(recall_weighted),
            "f1": float(f1_weighted),
        },
        "per_class": {
            name: {
                "precision": float(precision[index]),
                "recall": float(recall[index]),
                "f1": float(f1[index]),
                "support": int(support[index]),
            }
            for index, name in enumerate(CLASS_NAMES)
        },
        "confusion_matrix": {
            "labels": list(CLASS_NAMES),
            "counts": counts.astype(int).tolist(),
            "normalized": [
                _round_list(row) for row in normalised
            ],
        },
        "roc_auc_ovr_macro": roc_auc,
        "n_test": int(len(y)),
        "report_text": classification_report(
            y,
            y_pred,
            labels=CLASS_NAMES,
            digits=4,
            zero_division=0,
        ),
        "macro_avg_report": report.get("macro avg", {}),
    }


def compact(metrics: dict[str, object]) -> dict[str, object]:
    """Drop the verbose text report for the web summary."""
    return {
        key: value
        for key, value in metrics.items()
        if key not in {"report_text", "macro_avg_report"}
    }
