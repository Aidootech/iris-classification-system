import { PredictView } from "@/components/dashboard/predict-view";
import { scatter, summary } from "@/lib/model";

export default function DashboardPredictPage() {
  return (
    <PredictView
      modelName={summary.model.display}
      ranges={summary.dataset.feature_ranges}
      points={scatter.points}
    />
  );
}
