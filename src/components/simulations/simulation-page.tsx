import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import type { simulations } from "@/data/simulations";
import styles from "./simulations.module.css";

type Simulation = (typeof simulations)[keyof typeof simulations];

export function SimulationPage({ simulation, note, children }: { simulation: Simulation; note: string; children: ReactNode }) {
  return (
    <div className="site-shell inner-page">
      <PageIntro category="Simulação didática" title={simulation.title}>{note}</PageIntro>
      <div className={styles.layout}>{children}</div>
      <nav className="lesson-pagination" aria-label="Recursos da simulação">
        <Link className="button button-secondary" href="/simulacoes/">
          <ArrowLeft size={18} aria-hidden="true" /> Todas as simulações
        </Link>
        <Link className="button button-secondary" href={`/aulas/${simulation.lessonId}/`}>
          <span><small>Voltar à aula</small>{simulation.lessonTitle}</span>
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </nav>
      <a className="text-link" href={simulation.sourceUrl} lang="en">{simulation.sourceTitle}</a>
    </div>
  );
}
