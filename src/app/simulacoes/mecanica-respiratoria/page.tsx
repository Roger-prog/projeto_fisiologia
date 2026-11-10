import type { Metadata } from "next";
import { BreathingSimulation } from "@/components/simulations/breathing-simulation";
import { SimulationPage } from "@/components/simulations/simulation-page";
import { simulations } from "@/data/simulations";

const simulation = simulations.breathing;

export const metadata: Metadata = { title: "Simulação de mecânica respiratória", description: simulation.description };

export default function BreathingSimulationPage() {
  return (
    <SimulationPage
      simulation={simulation}
      note="Observe um ciclo de respiração tranquila em quatro fases. O esquema original representa qualitativamente as mudanças do tórax, do diafragma e do fluxo de ar."
    >
      <BreathingSimulation />
    </SimulationPage>
  );
}
