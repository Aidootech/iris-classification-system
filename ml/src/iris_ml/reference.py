"""Numpy-only evaluator for the exported JSON inference spec.

This is the reference implementation used by the parity tests.  It must not
import scikit-learn: if the JSON spec cannot reproduce a prediction with plain
arithmetic, the deployed TypeScript engine cannot either.
"""

from __future__ import annotations

from typing import Any

import numpy as np


def _softmax(scores: np.ndarray) -> np.ndarray:
    shifted = scores - scores.max(axis=1, keepdims=True)
    exponentials = np.exp(shifted)
    return exponentials / exponentials.sum(axis=1, keepdims=True)


def _sigmoid(value: np.ndarray | float) -> np.ndarray | float:
    return 1.0 / (1.0 + np.exp(-value))


def _sigmoid_predict(decision: float, a: float, b: float) -> float:
    """Exact port of libsvm's ``sigmoid_predict`` to avoid cancellation."""
    f_apb = decision * a + b
    if f_apb >= 0:
        return float(np.exp(-f_apb) / (1.0 + np.exp(-f_apb)))
    return float(1.0 / (1.0 + np.exp(f_apb)))


def _multiclass_probability(k: int, r: np.ndarray) -> np.ndarray:
    """Port of libsvm's method 2 (Wu, Lin & Weng, 2004)."""
    q = np.zeros((k, k), dtype=float)
    p = np.full(k, 1.0 / k, dtype=float)

    for t in range(k):
        q[t, t] = 0.0
        for j in range(t):
            q[t, t] += r[j, t] * r[j, t]
            q[t, j] = q[j, t]
        for j in range(t + 1, k):
            q[t, t] += r[j, t] * r[j, t]
            q[t, j] = -r[j, t] * r[t, j]

    eps = 0.005 / k
    max_iter = max(100, k)

    for _ in range(max_iter):
        qp = q @ p
        pqp = float(p @ qp)
        if np.max(np.abs(qp - pqp)) < eps:
            break
        for t in range(k):
            diff = (-qp[t] + pqp) / q[t, t]
            p[t] += diff
            pqp = (pqp + diff * (diff * q[t, t] + 2.0 * qp[t])) / (1.0 + diff) / (
                1.0 + diff
            )
            qp = (qp + diff * q[t, :]) / (1.0 + diff)
            p = p / (1.0 + diff)

    return p


def _tree_proba(tree: dict[str, Any], row: np.ndarray) -> np.ndarray:
    node = 0
    while tree["left"][node] != -1:
        feature = tree["feature"][node]
        # scikit-learn stores tree inputs as float32 and compares against a
        # float64 threshold.  Reproduce the cast or boundary cases diverge.
        value = float(np.float32(row[feature]))
        if value <= tree["threshold"][node]:
            node = tree["left"][node]
        else:
            node = tree["right"][node]
    return np.asarray(tree["proba"][node], dtype=float)


def _prepare(spec: dict[str, Any], inputs: np.ndarray) -> np.ndarray:
    values = np.asarray(inputs, dtype=float)
    if values.ndim == 1:
        values = values.reshape(1, -1)
    expected = len(spec["feature_order"])
    if values.ndim != 2 or values.shape[1] != expected:
        raise ValueError(f"expected shape (n, {expected}), got {values.shape}")

    preprocessing = spec["preprocessing"]
    if preprocessing["type"] == "standard_scaler":
        mean = np.asarray(preprocessing["mean"], dtype=float)
        scale = np.asarray(preprocessing["scale"], dtype=float)
        values = (values - mean) / scale
    elif preprocessing["type"] != "none":
        raise ValueError(f"unsupported preprocessing: {preprocessing['type']}")
    return values


def _svc_decisions(spec: dict[str, Any], values: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    model = spec["model"]
    support_vectors = np.asarray(model["support_vectors"], dtype=float)
    dual_coef = np.asarray(model["dual_coef"], dtype=float)
    intercept = np.asarray(model["intercept"], dtype=float)
    n_support = np.asarray(model["n_support"], dtype=int)
    gamma = float(model["gamma"])

    squared = ((values[:, None, :] - support_vectors[None, :, :]) ** 2).sum(axis=2)
    kernel = np.exp(-gamma * squared)

    n_samples = values.shape[0]
    n_classes = int(model["n_classes"])
    n_pairs = n_classes * (n_classes - 1) // 2
    decisions = np.zeros((n_samples, n_pairs), dtype=float)
    starts = np.concatenate(([0], np.cumsum(n_support)))
    votes = np.zeros((n_samples, n_classes), dtype=int)

    pair = 0
    for i in range(n_classes):
        for j in range(i + 1, n_classes):
            si, sj = int(starts[i]), int(starts[j])
            ci, cj = int(n_support[i]), int(n_support[j])
            value = (
                kernel[:, si : si + ci] @ dual_coef[j - 1, si : si + ci]
                + kernel[:, sj : sj + cj] @ dual_coef[i, sj : sj + cj]
                + intercept[pair]
            )
            decisions[:, pair] = value
            positive = value > 0
            votes[positive, i] += 1
            votes[~positive, j] += 1
            pair += 1

    return decisions, votes


def _svc_probabilities(spec: dict[str, Any], decisions: np.ndarray) -> np.ndarray:
    model = spec["model"]
    n_classes = int(model["n_classes"])
    prob_a = np.asarray(model["prob_a"], dtype=float)
    prob_b = np.asarray(model["prob_b"], dtype=float)
    minimum = 1e-7

    output = np.empty((decisions.shape[0], n_classes), dtype=float)
    for row in range(decisions.shape[0]):
        pairwise = np.zeros((n_classes, n_classes), dtype=float)
        pair = 0
        for i in range(n_classes):
            for j in range(i + 1, n_classes):
                value = _sigmoid_predict(
                    float(decisions[row, pair]),
                    float(prob_a[pair]),
                    float(prob_b[pair]),
                )
                value = min(max(value, minimum), 1.0 - minimum)
                pairwise[i, j] = value
                pairwise[j, i] = 1.0 - value
                pair += 1
        output[row] = _multiclass_probability(n_classes, pairwise)
    return output


def predict_proba(spec: dict[str, Any], inputs: np.ndarray) -> np.ndarray:
    values = _prepare(spec, inputs)
    model = spec["model"]
    model_type = model["type"]
    n_classes = int(model["n_classes"])

    if model_type == "logistic_regression":
        coefficients = np.asarray(model["coef"], dtype=float)
        intercept = np.asarray(model["intercept"], dtype=float)
        scores = values @ coefficients.T + intercept
        if coefficients.shape[0] == 1:
            positive = np.asarray(_sigmoid(scores[:, 0]), dtype=float)
            return np.column_stack((1.0 - positive, positive))
        return _softmax(scores)

    if model_type == "decision_tree":
        return np.vstack([_tree_proba(model["tree"], row) for row in values])

    if model_type in {"random_forest", "extra_trees"}:
        trees = model["trees"]
        total = np.zeros((values.shape[0], n_classes), dtype=float)
        for tree in trees:
            for index, row in enumerate(values):
                total[index] += _tree_proba(tree, row)
        return total / len(trees)

    if model_type == "knn":
        training = np.asarray(model["training_data"], dtype=float)
        labels = np.asarray(model["training_labels"], dtype=int)
        k = int(model["n_neighbors"])
        weights_mode = str(model["weights"])

        distances = np.sqrt(((values[:, None, :] - training[None, :, :]) ** 2).sum(axis=2))
        output = np.zeros((values.shape[0], n_classes), dtype=float)
        for index in range(values.shape[0]):
            order = np.argsort(distances[index], kind="stable")[:k]
            neighbour_labels = labels[order]
            if weights_mode == "uniform":
                weights = np.ones(len(order), dtype=float)
            elif weights_mode == "distance":
                neighbour_distances = distances[index][order]
                safe = np.where(neighbour_distances == 0, 1.0, neighbour_distances)
                weights = 1.0 / safe
                infinite = np.isinf(weights)
                if infinite.any():
                    weights = np.where(infinite, 1.0, 0.0)
            else:
                raise ValueError(f"unsupported KNN weights: {weights_mode}")

            for class_index in range(n_classes):
                output[index, class_index] = weights[
                    neighbour_labels == class_index
                ].sum()
            total = output[index].sum()
            output[index] = output[index] / total if total else 1.0 / n_classes
        return output

    if model_type == "gaussian_nb":
        theta = np.asarray(model["theta"], dtype=float)
        variance = np.asarray(model["var"], dtype=float)
        prior = np.asarray(model["class_prior"], dtype=float)
        log_joint = np.empty((values.shape[0], n_classes), dtype=float)
        for class_index in range(n_classes):
            log_joint[:, class_index] = (
                np.log(prior[class_index])
                - 0.5 * np.sum(np.log(2.0 * np.pi * variance[class_index]))
                - 0.5
                * np.sum(
                    ((values - theta[class_index]) ** 2) / variance[class_index],
                    axis=1,
                )
            )
        return _softmax(log_joint)

    if model_type == "svc_rbf":
        decisions, _ = _svc_decisions(spec, values)
        return _svc_probabilities(spec, decisions)

    if model_type == "constant":
        probabilities = np.asarray(model["probabilities"], dtype=float)
        return np.tile(probabilities, (values.shape[0], 1))

    raise ValueError(f"unsupported model type: {model_type}")


def predict(spec: dict[str, Any], inputs: np.ndarray) -> np.ndarray:
    """Return predicted labels (strings) using the same rule as scikit-learn."""
    values = _prepare(spec, inputs)
    classes = np.asarray(spec["classes"], dtype=object)

    if spec["model"]["type"] == "svc_rbf":
        _, votes = _svc_decisions(spec, values)
        return classes[np.argmax(votes, axis=1)]

    probabilities = predict_proba(spec, inputs)
    return classes[np.argmax(probabilities, axis=1)]
