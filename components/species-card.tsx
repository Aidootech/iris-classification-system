import Image from "next/image";

import { percent, SPECIES_LABELS } from "@/lib/format";
import type { Species } from "@/lib/model/types";
import { confidenceTier, SPECIES_INFO } from "@/lib/species";

export type SpeciesCardMeasurements = {
  sepal_length: number;
  sepal_width: number;
  petal_length: number;
  petal_width: number;
};

export function SpeciesCard({
  species,
  confidence,
  measurements,
  model,
}: {
  species: Species;
  confidence: number;
  measurements: SpeciesCardMeasurements;
  model?: string;
}) {
  const info = SPECIES_INFO[species];
  const tier = confidenceTier(confidence);

  return (
    <article className="species-card">
      <div className="species-card-media">
        <Image
          src={info.image}
          alt={info.imageAlt}
          fill
          unoptimized
          loading="eager"
          sizes="(max-width: 720px) 100vw, 220px"
        />
        <span className="species-card-media-tag">{SPECIES_LABELS[species]}</span>
      </div>

      <div className="species-card-body">
        <div className="species-card-head">
          <div>
            <span className="species-card-kicker">Predicted species</span>
            <h3>{info.display}</h3>
            <span className="species-card-common">{info.common}</span>
          </div>
          <span className={`tier tier-${tier.tone}`}>{tier.label}</span>
        </div>

        <p className="species-card-description">{info.description}</p>

        <dl className="species-card-measurements">
          <div>
            <dt>Sepal</dt>
            <dd>
              {measurements.sepal_length.toFixed(1)} ×{" "}
              {measurements.sepal_width.toFixed(1)} cm
            </dd>
          </div>
          <div>
            <dt>Petal</dt>
            <dd>
              {measurements.petal_length.toFixed(1)} ×{" "}
              {measurements.petal_width.toFixed(1)} cm
            </dd>
          </div>
        </dl>

        <div className="species-card-foot">
          <span className="species-card-model">{model ?? "RBF SVC"}</span>
          <span className="species-card-confidence">
            <strong>{percent(confidence)}</strong>
            <small>confidence</small>
          </span>
        </div>
      </div>
    </article>
  );
}
