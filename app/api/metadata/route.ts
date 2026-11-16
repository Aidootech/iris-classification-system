import { summary } from "@/lib/model";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return Response.json({
    model: summary.model,
    dataset: {
      rows: summary.dataset.rows,
      real: summary.dataset.real,
      synthetic: summary.dataset.synthetic,
      train: summary.dataset.train,
      test: summary.dataset.test,
      synthetic_method: summary.dataset.synthetic_method,
      seed: summary.dataset.seed,
    },
    best: {
      key: summary.best.key,
      display: summary.best.display,
      params: summary.best.params,
      cv: summary.best.cv,
      test: summary.best.test,
    },
    protocol: summary.protocol,
  });
}
