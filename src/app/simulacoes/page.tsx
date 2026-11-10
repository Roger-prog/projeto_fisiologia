import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartPulse, Wind } from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import styles from "@/components/simulations/simulations.module.css";
import { simulations } from "@/data/simulations";

export const metadata: Metadata = { title: "Simulações" };

const catalog = [
  { simulation: simulations.heartRate, Icon: HeartPulse },
  { simulation: simulations.breathing, Icon: Wind },
];

export default function SimulationsPage() {
  return (
    <div className="site-shell inner-page">
      <PageIntro category="Prática" title="Simulações">
        Compare frequências cardíacas ou explore as fases da respiração. Os dois modelos podem ser usados pelo teclado e têm explicações em texto.
      </PageIntro>
      <div className="module-grid">
        {catalog.map(({ simulation, Icon }) => (
          <section className={`study-panel ${styles.catalogCard}`} key={simulation.href}>
            <div className="module-symbol"><Icon size={24} aria-hidden="true" /></div>
            <h2>{simulation.title}</h2>
            <p>{simulation.description}</p>
            <Link className="text-link" href={simulation.href}>
              Abrir simulação de {simulation.title.toLowerCase()} <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </section>
        ))}
      </div>
    </div>
  );
}
