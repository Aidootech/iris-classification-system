"""Model definitions, tuning and selection."""

from __future__ import annotations

import warnings
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV, StratifiedKFold, cross_val_score
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.dummy import DummyClassifier

from .config import CV_FOLDS, SCORING, SEED

warnings.filterwarnings(
    "ignore",
    message=r"The `probability` parameter was deprecated",
    category=FutureWarning,
)


@dataclass(frozen=True)
class ModelSpec:
    key: str
    display: str
    family: str
    estimator: Pipeline
    param_grid: dict[str, list[Any]]
    eligible: bool = True
    note: str = ""


@dataclass
class TrainedModel:
    spec: ModelSpec
    estimator: Pipeline
    best_params: dict[str, Any]
    cv_mean: float
    cv_std: float
    cv_folds: list[float]
    real_cv_mean: float
    real_cv_std: float
    real_cv_folds: list[float]
    search_results: dict[str, Any] = field(default_factory=dict)


def _pipeline(model: object, scale: bool) -> Pipeline:
    steps: list[tuple[str, object]] = []
    if scale:
        steps.append(("scaler", StandardScaler()))
    steps.append(("clf", model))
    return Pipeline(steps)


def build_specs() -> list[ModelSpec]:
    """The candidate set.  Every family has a verified JSON exporter."""
    return [
        ModelSpec(
            key="logistic_regression",
            display="Logistic Regression",
            family="linear",
            estimator=_pipeline(
                LogisticRegression(max_iter=5000, random_state=SEED), scale=True
            ),
            param_grid={"clf__C": [0.01, 0.1, 1.0, 10.0, 100.0]},
        ),
        ModelSpec(
            key="knn",
            display="K-Nearest Neighbours",
            family="instance_based",
            estimator=_pipeline(KNeighborsClassifier(), scale=True),
            param_grid={
                "clf__n_neighbors": [3, 5, 7, 9, 11, 15, 21],
                "clf__weights": ["uniform", "distance"],
            },
        ),
        ModelSpec(
            key="gaussian_nb",
            display="Gaussian Naive Bayes",
            family="probabilistic",
            estimator=_pipeline(GaussianNB(), scale=False),
            param_grid={
                "clf__var_smoothing": [
                    1e-12,
                    1e-10,
                    1e-9,
                    1e-8,
                    1e-7,
                    1e-6,
                    1e-5,
                    1e-4,
                    1e-3,
                    1e-2,
                    1e-1,
                ]
            },
        ),
        ModelSpec(
            key="decision_tree",
            display="Decision Tree",
            family="tree",
            estimator=_pipeline(
                DecisionTreeClassifier(random_state=SEED), scale=False
            ),
            param_grid={
                "clf__criterion": ["gini", "entropy"],
                "clf__max_depth": [2, 3, 4, 5, 6, 8, None],
                "clf__min_samples_leaf": [1, 2, 3, 5],
            },
        ),
        ModelSpec(
            key="random_forest",
            display="Random Forest",
            family="ensemble",
            estimator=_pipeline(
                RandomForestClassifier(random_state=SEED, n_jobs=1), scale=False
            ),
            param_grid={
                "clf__n_estimators": [200, 400],
                "clf__max_depth": [None, 6, 10],
                "clf__min_samples_leaf": [1, 2],
                "clf__max_features": ["sqrt"],
            },
        ),
        ModelSpec(
            key="extra_trees",
            display="Extra Trees",
            family="ensemble",
            estimator=_pipeline(
                ExtraTreesClassifier(random_state=SEED, n_jobs=1), scale=False
            ),
            param_grid={
                "clf__n_estimators": [200, 400],
                "clf__max_depth": [None, 6, 10],
                "clf__min_samples_leaf": [1, 2],
                "clf__max_features": ["sqrt"],
            },
        ),
        ModelSpec(
            key="svc_rbf",
            display="Support Vector Machine",
            family="kernel",
            estimator=_pipeline(
                SVC(kernel="rbf", probability=True, random_state=SEED), scale=True
            ),
            param_grid={
                "clf__C": [0.1, 1.0, 10.0, 100.0],
                "clf__gamma": ["scale", 0.01, 0.1, 1.0],
            },
            note="RBF kernel with Platt-scaled probabilities.",
        ),
        ModelSpec(
            key="dummy",
            display="Majority-class baseline",
            family="baseline",
            estimator=_pipeline(DummyClassifier(strategy="most_frequent"), scale=False),
            param_grid={},
            eligible=False,
            note="Reference only; not eligible to be selected.",
        ),
    ]


def fit_models(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_real: np.ndarray,
    y_real: np.ndarray,
    n_jobs: int = 1,
) -> list[TrainedModel]:
    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=SEED)
    results: list[TrainedModel] = []

    for spec in build_specs():
        search = GridSearchCV(
            spec.estimator,
            spec.param_grid,
            scoring=SCORING,
            cv=cv,
            n_jobs=n_jobs,
            refit=True,
            error_score="raise",
        )
        search.fit(X_train, y_train)
        best_index = int(search.best_index_)
        folds = [
            float(search.cv_results_[f"split{fold}_test_score"][best_index])
            for fold in range(CV_FOLDS)
        ]

        real_scores = cross_val_score(
            search.best_estimator_,
            X_real,
            y_real,
            scoring=SCORING,
            cv=StratifiedKFold(
                n_splits=CV_FOLDS, shuffle=True, random_state=SEED
            ),
            n_jobs=n_jobs,
        )

        results.append(
            TrainedModel(
                spec=spec,
                estimator=search.best_estimator_,
                best_params={
                    key.replace("clf__", ""): value
                    for key, value in search.best_params_.items()
                },
                cv_mean=float(np.mean(folds)),
                cv_std=float(np.std(folds)),
                cv_folds=folds,
                real_cv_mean=float(np.mean(real_scores)),
                real_cv_std=float(np.std(real_scores)),
                real_cv_folds=[float(score) for score in real_scores],
                search_results={
                    "n_candidates": int(len(search.cv_results_["params"])),
                    "scoring": SCORING,
                    "folds": CV_FOLDS,
                },
            )
        )
    return results


def select_best(results: list[TrainedModel]) -> TrainedModel:
    """Select on cross-validated macro F1 only; the holdout stays untouched."""
    eligible = [result for result in results if result.spec.eligible]
    if not eligible:
        raise ValueError("no eligible models")
    return sorted(
        eligible,
        key=lambda result: (
            -result.cv_mean,
            result.cv_std,
            result.spec.display,
        ),
    )[0]
