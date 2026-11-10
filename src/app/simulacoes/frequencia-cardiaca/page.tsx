import type { Metadata } from "next";
import { HeartRateSimulation } from "@/components/simulations/heart-rate-simulation";
import { SimulationPage } from "@/components/simulations/simulation-page";
import { simulations } from "@/data/simulations";

const simulation = simulations.heartRate;

export const metadata: Metadata = { title: simulation.title, description: simulation.description };

export default function HeartRatePage() {
  return (
    <SimulationPage
      simulation={simulation}
      note="Compare dois ritmos regulares. Os valores exibidos são fictícios e o áudio é inteiramente sintético. Use a comparação numérica com ou sem som."
    >
      <HeartRateSimulation />
    </SimulationPage>
  );
}
