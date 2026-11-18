import type { Species } from "./model/types";

export type SpeciesInfo = {
  display: string;
  common: string;
  description: string;
  image: string;
  imageAlt: string;
  note: string;
  sepalRange: string;
  petalRange: string;
  bloom: string;
  region: string;
};

export const SPECIES_INFO: Record<Species, SpeciesInfo> = {
  setosa: {
    display: "Iris setosa",
    common: "Bristle-pointed iris",
    description:
      "A compact arctic iris with broad, rounded petals. It is the most distinct of the three species, which is why the classifier separates it with almost no ambiguity.",
    image: "/species/setosa.jpg",
    imageAlt: "Close-up of an Iris setosa flower with broad violet petals",
    note: "Smallest petals of the three species",
    sepalRange: "4.3–5.8 cm",
    petalRange: "1.0–1.9 cm",
    bloom: "Late spring to early summer",
    region: "Arctic and subarctic coasts",
  },
  versicolor: {
    display: "Iris versicolor",
    common: "Blue flag iris",
    description:
      "The blue flag of damp meadows, sitting between the compact setosa and the taller virginica. Its measurements overlap with virginica, so the model leans on petal width to separate them.",
    image: "/species/versicolor.jpg",
    imageAlt: "Close-up of an Iris versicolor flower with pale violet petals",
    note: "Intermediate petal length and width",
    sepalRange: "4.9–7.0 cm",
    petalRange: "3.0–5.1 cm",
    bloom: "Late spring to late summer",
    region: "Eastern North American wetlands",
  },
  virginica: {
    display: "Iris virginica",
    common: "Virginia blue flag",
    description:
      "A tall, moisture-loving iris with large violet flowers and bold yellow signal patches. It has the widest petals of the three and grows along the coastal plain.",
    image: "/species/virginica.jpg",
    imageAlt:
      "Close-up of an Iris virginica flower with violet and yellow petals",
    note: "Largest petals of the three species",
    sepalRange: "4.9–7.9 cm",
    petalRange: "4.5–6.9 cm",
    bloom: "Late spring to midsummer",
    region: "Southeastern United States",
  },
};

export function confidenceTier(value: number): {
  label: string;
  tone: "high" | "medium" | "low";
} {
  if (value >= 0.9) return { label: "High confidence", tone: "high" };
  if (value >= 0.7) return { label: "Moderate confidence", tone: "medium" };
  return { label: "Low confidence", tone: "low" };
}
