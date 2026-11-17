import { OverviewView } from "@/components/dashboard/overview-view";
import { summary } from "@/lib/model";

export default function DashboardOverviewPage() {
  const best = summary.best;
  const dataset = summary.dataset;

  return (
    <OverviewView
      modelName={best.display}
      accuracy={best.test.accuracy}
      macroF1={best.test.macro.f1}
      cvF1={best.cv.macro_f1_mean}
      datasetRows={dataset.rows}
      trainRows={dataset.train}
      testRows={dataset.test}
      realRows={dataset.real}
      syntheticRows={dataset.synthetic}
    />
  );
}
