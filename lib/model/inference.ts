/**
 * Portable inference engine for the exported scikit-learn model.
 *
 * The engine mirrors scikit-learn's arithmetic, including libsvm's pairwise
 * probability coupling and the float32 cast used during tree traversal.
 * Parity with the Python reference is enforced by tests/inference.test.ts.
 */

import type {
  GaussianNbParams,
  KnnParams,
  LogisticRegressionParams,
  ModelParams,
  ModelSpec,
  Species,
  SvcParams,
  TreePayload,
} from "./types";

export interface Prediction {
  species: Species;
  index: number;
  confidence: number;
  probabilities: number[];
}

function softmax(scores: number[]): number[] {
  const maximum = Math.max(...scores);
  const exponentials = scores.map((score) => Math.exp(score - maximum));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / total);
}

function argmax(values: number[]): number {
  let best = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] > values[best]) {
      best = index;
    }
  }
  return best;
}

function standardize(spec: ModelSpec, input: number[]): number[] {
  if (spec.preprocessing.type === "none") {
    return [...input];
  }
  const { mean, scale } = spec.preprocessing;
  return input.map((value, index) => (value - mean[index]) / scale[index]);
}

function treeProbabilities(tree: TreePayload, row: number[]): number[] {
  let node = 0;
  while (tree.left[node] !== -1) {
    const feature = tree.feature[node];
    // scikit-learn casts tree inputs to float32 before comparing thresholds.
    const value = Math.fround(row[feature]);
    node = value <= tree.threshold[node] ? tree.left[node] : tree.right[node];
  }
  return tree.proba[node];
}

function logisticRegression(
  model: LogisticRegressionParams,
  row: number[],
): number[] {
  const scores = model.coef.map((coefficients, index) => {
    let score = model.intercept[index];
    for (let feature = 0; feature < coefficients.length; feature += 1) {
      score += coefficients[feature] * row[feature];
    }
    return score;
  });

  if (model.coef.length === 1) {
    const positive = 1 / (1 + Math.exp(-scores[0]));
    return [1 - positive, positive];
  }
  return softmax(scores);
}

function decisionTree(model: ModelParams, row: number[]): number[] {
  if (model.type !== "decision_tree") {
    throw new Error("unexpected model type");
  }
  return treeProbabilities(model.tree, row);
}

function forest(model: ModelParams, row: number[]): number[] {
  if (model.type !== "random_forest" && model.type !== "extra_trees") {
    throw new Error("unexpected model type");
  }
  const totals = new Array(model.n_classes).fill(0);
  for (const tree of model.trees) {
    const probabilities = treeProbabilities(tree, row);
    for (let index = 0; index < totals.length; index += 1) {
      totals[index] += probabilities[index];
    }
  }
  return totals.map((value) => value / model.trees.length);
}

function knn(model: KnnParams, row: number[]): number[] {
  const distances = model.training_data.map((trainingRow) => {
    let squared = 0;
    for (let feature = 0; feature < row.length; feature += 1) {
      const difference = row[feature] - trainingRow[feature];
      squared += difference * difference;
    }
    return Math.sqrt(squared);
  });

  const order = distances
    .map((distance, index) => ({ distance, index }))
    .sort((left, right) => left.distance - right.distance || left.index - right.index)
    .slice(0, model.n_neighbors);

  const hasExactMatch = order.some((entry) => entry.distance === 0);
  const weights = order.map((entry) => {
    if (model.weights === "uniform") return 1;
    if (hasExactMatch) return entry.distance === 0 ? 1 : 0;
    return 1 / entry.distance;
  });

  const totals = new Array(model.n_classes).fill(0);
  order.forEach((entry, position) => {
    totals[model.training_labels[entry.index]] += weights[position];
  });
  const total = totals.reduce((sum, value) => sum + value, 0);
  return total > 0
    ? totals.map((value) => value / total)
    : new Array(model.n_classes).fill(1 / model.n_classes);
}

function gaussianNaiveBayes(model: GaussianNbParams, row: number[]): number[] {
  const logJoint = model.theta.map((theta, classIndex) => {
    let value = Math.log(model.class_prior[classIndex]);
    for (let feature = 0; feature < theta.length; feature += 1) {
      const variance = model.var[classIndex][feature];
      const difference = row[feature] - theta[feature];
      value -= 0.5 * Math.log(2 * Math.PI * variance);
      value -= (0.5 * difference * difference) / variance;
    }
    return value;
  });
  return softmax(logJoint);
}

function sigmoidPredict(decision: number, a: number, b: number): number {
  const value = decision * a + b;
  return value >= 0
    ? Math.exp(-value) / (1 + Math.exp(-value))
    : 1 / (1 + Math.exp(value));
}

/** Port of libsvm's method 2 (Wu, Lin & Weng, 2004). */
function multiclassProbability(k: number, r: number[][]): number[] {
  const q: number[][] = Array.from({ length: k }, () =>
    new Array<number>(k).fill(0),
  );
  const p = new Array<number>(k).fill(1 / k);

  for (let t = 0; t < k; t += 1) {
    q[t][t] = 0;
    for (let j = 0; j < t; j += 1) {
      q[t][t] += r[j][t] * r[j][t];
      q[t][j] = q[j][t];
    }
    for (let j = t + 1; j < k; j += 1) {
      q[t][t] += r[j][t] * r[j][t];
      q[t][j] = -r[j][t] * r[t][j];
    }
  }

  const eps = 0.005 / k;
  const maxIterations = Math.max(100, k);

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    let qp = q.map((row) => row.reduce((sum, value, j) => sum + value * p[j], 0));
    let pqp = p.reduce((sum, value, index) => sum + value * qp[index], 0);
    let maxError = 0;
    for (let t = 0; t < k; t += 1) {
      maxError = Math.max(maxError, Math.abs(qp[t] - pqp));
    }
    if (maxError < eps) break;

    for (let t = 0; t < k; t += 1) {
      const diff = (-qp[t] + pqp) / q[t][t];
      p[t] += diff;
      pqp = (pqp + diff * (diff * q[t][t] + 2 * qp[t])) / (1 + diff) / (1 + diff);
      const denominator = 1 + diff;
      for (let j = 0; j < k; j += 1) {
        qp[j] = (qp[j] + diff * q[t][j]) / denominator;
        p[j] /= denominator;
      }
    }
  }
  return p;
}

function svcDecisions(
  model: SvcParams,
  row: number[],
): { decisions: number[]; votes: number[] } {
  const starts = [0];
  for (const count of model.n_support) {
    starts.push(starts[starts.length - 1] + count);
  }

  const decisions: number[] = [];
  const votes = new Array(model.n_classes).fill(0);
  let pair = 0;

  for (let i = 0; i < model.n_classes; i += 1) {
    for (let j = i + 1; j < model.n_classes; j += 1) {
      let value = model.intercept[pair];

      for (let offset = 0; offset < model.n_support[i]; offset += 1) {
        const index = starts[i] + offset;
        const difference = row.map(
          (feature, featureIndex) => feature - model.support_vectors[index][featureIndex],
        );
        const squared = difference.reduce((sum, item) => sum + item * item, 0);
        value += Math.exp(-model.gamma * squared) * model.dual_coef[j - 1][index];
      }

      for (let offset = 0; offset < model.n_support[j]; offset += 1) {
        const index = starts[j] + offset;
        const difference = row.map(
          (feature, featureIndex) => feature - model.support_vectors[index][featureIndex],
        );
        const squared = difference.reduce((sum, item) => sum + item * item, 0);
        value += Math.exp(-model.gamma * squared) * model.dual_coef[i][index];
      }

      decisions.push(value);
      votes[value > 0 ? i : j] += 1;
      pair += 1;
    }
  }

  return { decisions, votes };
}

function svcProbabilities(model: SvcParams, decisions: number[]): number[] {
  const minimum = 1e-7;
  const pairwise: number[][] = Array.from({ length: model.n_classes }, () =>
    new Array<number>(model.n_classes).fill(0),
  );

  let pair = 0;
  for (let i = 0; i < model.n_classes; i += 1) {
    for (let j = i + 1; j < model.n_classes; j += 1) {
      const value = Math.min(
        Math.max(
          sigmoidPredict(decisions[pair], model.prob_a[pair], model.prob_b[pair]),
          minimum,
        ),
        1 - minimum,
      );
      pairwise[i][j] = value;
      pairwise[j][i] = 1 - value;
      pair += 1;
    }
  }

  return multiclassProbability(model.n_classes, pairwise);
}

export function predict(spec: ModelSpec, input: number[]): Prediction {
  if (input.length !== spec.feature_order.length) {
    throw new Error(
      `expected ${spec.feature_order.length} features, received ${input.length}`,
    );
  }

  const row = standardize(spec, input);
  const model = spec.model;
  let probabilities: number[];
  let index: number;

  switch (model.type) {
    case "logistic_regression":
      probabilities = logisticRegression(model, row);
      index = argmax(probabilities);
      break;
    case "decision_tree":
      probabilities = decisionTree(model, row);
      index = argmax(probabilities);
      break;
    case "random_forest":
    case "extra_trees":
      probabilities = forest(model, row);
      index = argmax(probabilities);
      break;
    case "knn":
      probabilities = knn(model, row);
      index = argmax(probabilities);
      break;
    case "gaussian_nb":
      probabilities = gaussianNaiveBayes(model, row);
      index = argmax(probabilities);
      break;
    case "svc_rbf": {
      const { decisions, votes } = svcDecisions(model, row);
      probabilities = svcProbabilities(model, decisions);
      // libsvm's predict() uses votes, not argmax probabilities.
      index = argmax(votes);
      break;
    }
    case "constant":
      probabilities = [...model.probabilities];
      index = model.class_index;
      break;
    default:
      throw new Error(`unsupported model type: ${(model as ModelParams).type}`);
  }

  return {
    species: spec.classes[index],
    index,
    confidence: probabilities[index],
    probabilities,
  };
}
