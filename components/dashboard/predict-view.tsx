"use client";

import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Predictor } from "@/components/predictor";
import { ArrowRightIcon, ShieldIcon } from "@/components/icons";
import { recordPrediction } from "@/lib/history";
import type { FeatureKey } from "@/lib/model/types";

export function PredictView({
  modelName,
  ranges,
  points,
}: {
  modelName: string;
  ranges: Record<FeatureKey, { min: number; max: number }>;
  points: [number, number, number, number][];
}) {
  return (
    <div className="dash-page">
      <PageHeader
        eyebrow="Classify"
        title="Run a prediction"
        description="Enter the four measurements of a specimen. The tuned support vector machine returns the most likely species and a calibrated probability for every class."
        actions={
          <Link href="/dashboard/history" className="btn btn-ghost btn-sm">
            Prediction history
            <ArrowRightIcon size={15} />
          </Link>
        }
      />

      <div className="workbench dash-workbench">
        <Predictor
          modelName={modelName}
          ranges={ranges}
          points={points}
          onPrediction={({ result, measurements }) => {
            recordPrediction({
              species: result.species,
              speciesDisplay: result.species_display,
              confidence: result.confidence,
              probabilities: result.probabilities,
              measurements,
              model: result.model.display,
              modelVersion: result.model.version,
            });
          }}
        />
      </div>

      <p className="dash-privacy">
        <ShieldIcon size={16} />
        Every prediction is stored in this browser only and appears in your
        history. Measurements are sent to the classifier API, never to a third
        party.
      </p>
    </div>
  );
}
