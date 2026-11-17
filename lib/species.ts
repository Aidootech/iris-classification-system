import type { Species } from "./model/types";

export type SpeciesInfo = {
  display: string;
  common: string;
  description: string;
  image: string;
  imageAlt: string;
  note: string;
};

export const SPECIES_INFO: Record<Species, SpeciesInfo> = {
  setosa: {
    display: "Iris setosa",
    common: "Bristle-pointed iris",
    description:
      "Compact arctic iris with broad, rounded petals and a dependable early-summer bloom.",
    image: "/species/setosa.jpg",
    imageAlt: "Close-up of an Iris setosa flower with broad violet petals",
    note: "Smallest petals of the three species",
  },
  versicolor: {
    display: "Iris versicolor",
    common: "Blue flag iris",
    description:
      "The blue flag of damp meadows, sitting between the compact setosa and the taller virginica.",
    image: "/species/versicolor.jpg",
    imageAlt: "Close-up of an Iris versicolor flower with pale violet petals",
    note: "Intermediate petal length and width",
  },
  virginica: {
    display: "Iris virginica",
    common: "Virginia blue flag",
    description:
      "Tall, moisture-loving iris with large violet flowers and bold yellow signal patches.",
    image: "/species/virginica.jpg",
    imageAlt: "Close-up of an Iris virginica flower with violet and yellow petals",
    note: "Largest petals of the three species",
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
