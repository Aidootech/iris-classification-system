"""Report and web figures.

Visual rules: flat fills, hairline axes, no gradients, no chart junk.  The same
species colours are used in the web interface.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Sequence

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.colors import LinearSegmentedColormap

from .config import CLASS_NAMES, FEATURES, FEATURE_LABELS

INK = "#141417"
MUTED = "#71717A"
FAINT = "#9A9AA3"
GRID = "#E8E8EC"
PAPER = "#FFFFFF"
ACCENT = "#23594A"
SPECIES = {
    "setosa": "#4F7F66",
    "versicolor": "#A97D2F",
    "virginica": "#6A5A94",
}
CMAP = LinearSegmentedColormap.from_list(
    "iris_green", ["#FFFFFF", "#E1ECE7", "#7FA795", "#23594A"]
)

plt.rcParams.update(
    {
        "font.family": "DejaVu Sans",
        "font.size": 9,
        "axes.edgecolor": "#D0D0D7",
        "axes.linewidth": 0.8,
        "axes.labelcolor": MUTED,
        "axes.titlecolor": INK,
        "xtick.color": MUTED,
        "ytick.color": MUTED,
        "xtick.labelsize": 8,
        "ytick.labelsize": 8,
        "legend.fontsize": 8,
        "legend.frameon": False,
        "figure.facecolor": PAPER,
        "axes.facecolor": PAPER,
        "savefig.facecolor": PAPER,
    }
)


def _clean_axes(ax) -> None:
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.grid(axis="both", color=GRID, linewidth=0.7)
    ax.set_axisbelow(True)
    ax.tick_params(length=2.5, width=0.7)


def plot_dataset(dataset: pd.DataFrame, path: Path) -> Path:
    fig, ax = plt.subplots(figsize=(7.4, 4.4), constrained_layout=True)

    for name in CLASS_NAMES:
        subset = dataset[dataset["species"] == name]
        real = subset[subset["source"] == "real"]
        synthetic = subset[subset["source"] == "synthetic"]
        colour = SPECIES[name]

        ax.scatter(
            real["petal_length_cm"],
            real["petal_width_cm"],
            s=26,
            c=colour,
            edgecolors="none",
            alpha=0.9,
            label=f"{name} · real ({len(real)})",
            zorder=3,
        )
        ax.scatter(
            synthetic["petal_length_cm"],
            synthetic["petal_width_cm"],
            s=20,
            facecolors="none",
            edgecolors=colour,
            linewidths=0.8,
            alpha=0.5,
            label=f"{name} · synthetic ({len(synthetic)})",
            zorder=2,
        )

    ax.set_xlabel("Petal length (cm)")
    ax.set_ylabel("Petal width (cm)")
    ax.set_title(
        "Petals separate the three species; synthetic rows fill the class envelopes",
        loc="left",
        fontsize=10,
        pad=10,
    )
    _clean_axes(ax)
    ax.legend(loc="upper left", ncols=2, handletextpad=0.4, columnspacing=1.2)
    fig.savefig(path, dpi=180)
    plt.close(fig)
    return path


def plot_feature_distributions(dataset: pd.DataFrame, path: Path) -> Path:
    fig, axes = plt.subplots(2, 2, figsize=(7.4, 5.6), constrained_layout=True)
    bins = 18

    for ax, feature in zip(axes.ravel(), FEATURES):
        for name in CLASS_NAMES:
            subset = dataset[dataset["species"] == name]
            real = subset[subset["source"] == "real"][feature]
            synthetic = subset[subset["source"] == "synthetic"][feature]
            colour = SPECIES[name]

            ax.hist(
                synthetic,
                bins=bins,
                density=True,
                color=colour,
                alpha=0.22,
                linewidth=0,
            )
            ax.hist(
                real,
                bins=bins,
                density=True,
                histtype="step",
                color=colour,
                linewidth=1.4,
            )

        ax.set_title(FEATURE_LABELS[feature], loc="left", fontsize=9, pad=6)
        ax.set_yticks([])
        _clean_axes(ax)
        ax.grid(axis="x", visible=False)
        ax.spines["left"].set_visible(False)

    handles = [
        plt.Line2D([], [], color=SPECIES[name], linewidth=1.6) for name in CLASS_NAMES
    ]
    handles += [
        plt.Rectangle((0, 0), 1, 1, color=MUTED, alpha=0.25, linewidth=0),
    ]
    labels = ["setosa", "versicolor", "virginica", "synthetic density"]
    fig.legend(
        handles,
        labels,
        loc="lower center",
        ncols=4,
        bbox_to_anchor=(0.5, -0.02),
        handletextpad=0.5,
    )
    fig.suptitle(
        "Real observations (outline) and synthetic draws (fill) by feature",
        x=0.01,
        ha="left",
        fontsize=10,
    )
    fig.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(fig)
    return path


def plot_confusion(
    counts: Sequence[Sequence[int]],
    labels: Sequence[str],
    path: Path,
    title: str,
    subtitle: str | None = None,
) -> Path:
    matrix = np.asarray(counts, dtype=float)
    fig, ax = plt.subplots(figsize=(4.2, 3.8), constrained_layout=True)
    ax.imshow(matrix, cmap=CMAP, vmin=0, vmax=max(1.0, matrix.max()))

    for row in range(matrix.shape[0]):
        for column in range(matrix.shape[1]):
            value = int(matrix[row, column])
            colour = PAPER if value > matrix.max() * 0.55 else INK
            ax.text(
                column,
                row,
                str(value),
                ha="center",
                va="center",
                color=colour,
                fontsize=10,
                fontweight="normal",
            )

    ax.set_xticks(range(len(labels)))
    ax.set_yticks(range(len(labels)))
    ax.set_xticklabels(labels, rotation=20, ha="right")
    ax.set_yticklabels(labels)
    ax.set_xlabel("Predicted species")
    ax.set_ylabel("True species")
    ax.set_title(title, loc="left", fontsize=10, pad=10)
    if subtitle:
        ax.text(
            0,
            1.02,
            subtitle,
            transform=ax.transAxes,
            fontsize=8,
            color=MUTED,
            va="bottom",
        )
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.tick_params(length=0)
    fig.savefig(path, dpi=180)
    plt.close(fig)
    return path


def plot_confusion_grid(
    models: Sequence[dict[str, Any]], path: Path, labels: Sequence[str]
) -> Path:
    columns = 2
    rows = int(np.ceil(len(models) / columns))
    fig, axes = plt.subplots(
        rows, columns, figsize=(8.6, 2.5 * rows), constrained_layout=True
    )
    axes = np.atleast_1d(axes).ravel()

    for ax, model in zip(axes, models):
        matrix = np.asarray(model["test"]["confusion_matrix"]["counts"], dtype=float)
        ax.imshow(matrix, cmap=CMAP, vmin=0, vmax=max(1.0, matrix.max()))
        for row in range(matrix.shape[0]):
            for column in range(matrix.shape[1]):
                value = int(matrix[row, column])
                ax.text(
                    column,
                    row,
                    str(value),
                    ha="center",
                    va="center",
                    fontsize=8,
                    color=PAPER if value > matrix.max() * 0.55 else INK,
                )
        ax.set_title(
            f"{model['display']} · {model['test']['accuracy']:.4f}",
            loc="left",
            fontsize=8.5,
            pad=5,
        )
        ax.set_xticks(range(len(labels)))
        ax.set_yticks(range(len(labels)))
        ax.set_xticklabels(labels, fontsize=6.5, rotation=25, ha="right")
        ax.set_yticklabels(labels, fontsize=6.5)
        ax.tick_params(length=0)
        for spine in ax.spines.values():
            spine.set_visible(False)

    for ax in axes[len(models) :]:
        ax.set_visible(False)

    fig.suptitle(
        "Holdout confusion matrices (30 real observations)",
        x=0.01,
        ha="left",
        fontsize=10,
    )
    fig.savefig(path, dpi=180)
    plt.close(fig)
    return path


def plot_comparison(models: Sequence[dict[str, Any]], path: Path) -> Path:
    ordered = list(models)
    positions = np.arange(len(ordered))
    height = 0.34
    cv_scores = [model["cv"]["macro_f1_mean"] for model in ordered]
    holdout_scores = [model["test"]["macro"]["f1"] for model in ordered]

    fig, ax = plt.subplots(figsize=(7.8, 0.52 * len(ordered) + 1.9), constrained_layout=True)
    ax.barh(
        positions - height / 2,
        cv_scores,
        height=height,
        color="#C9C9D0",
        label="5-fold CV macro F1 (470 training rows)",
    )
    ax.barh(
        positions + height / 2,
        holdout_scores,
        height=height,
        color=ACCENT,
        label="Holdout macro F1 (30 real rows)",
    )

    for position, value in zip(positions - height / 2, cv_scores):
        ax.text(value + 0.008, position, f"{value:.3f}", va="center", fontsize=7.5, color=MUTED)
    for position, value in zip(positions + height / 2, holdout_scores):
        ax.text(value + 0.008, position, f"{value:.3f}", va="center", fontsize=7.5, color=INK)

    ax.set_yticks(positions)
    ax.set_yticklabels(
        [model["display"] for model in ordered],
        fontsize=8.5,
        color=INK,
    )
    ax.invert_yaxis()
    ax.set_xlim(0, 1.12)
    ax.set_xlabel("Macro F1")
    ax.set_title("Model comparison", loc="left", fontsize=10, pad=10)
    _clean_axes(ax)
    ax.grid(axis="y", visible=False)
    ax.legend(loc="lower right", ncols=1)
    fig.savefig(path, dpi=180)
    plt.close(fig)
    return path
