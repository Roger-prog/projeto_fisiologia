import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { AutonomyResume } from "@/components/autonomy/autonomy-resume";
import { AutonomyTitle } from "@/components/autonomy/autonomy-title";
import styles from "@/components/autonomy/autonomy.module.css";
import { lessons } from "@/data";
import { autonomyStepHref } from "@/lib/autonomy-routes";
import { getLessonSteps } from "@/lib/lesson-steps";

export const metadata: Metadata = {
  title: "Modo de Autonomia",
  description: "Aulas com controles simplificados para estudar com Voice Access, TalkBack ou teclado.",
};

export default function AutonomyPage() {
  const choices = lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    steps: getLessonSteps(lesson).map(({ id, title }) => ({ id, title })),
  }));

  return (
    <div className={`site-shell inner-page ${styles.surface} ${styles.flow}`}>
      <div className={styles.intro}>
        <AutonomyTitle>Modo de Autonomia</AutonomyTitle>
        <p>Estude uma etapa por vez com controles para ouvir, avançar e praticar.</p>
      </div>
      <AutonomyResume choices={choices} />
      <noscript><p>Use Escolher aula para abrir o conteúdo.</p></noscript>
      <details className={styles.disclosure}>
        <summary className="button button-secondary">Escolher aula <ChevronDown size={18} aria-hidden="true" /></summary>
        <ul className={styles.disclosed}>
          {choices.map((lesson) => (
            <li key={lesson.id}>
              <Link className="button button-secondary" href={autonomyStepHref(lesson.id, lesson.steps[0].id)}>
                {lesson.title}
              </Link>
            </li>
          ))}
        </ul>
      </details>
      <nav className={styles.actions} aria-label="Opções do Modo de Autonomia">
        <Link className="button button-secondary" href="/minhas-revisoes/">Minhas Revisões</Link>
        <Link className="button button-secondary" href="/">Voltar ao modo convencional</Link>
      </nav>
      <p className="muted">
        Com o Voice Access ativo no Android, use o nome do controle ou peça para mostrar números.
        Você também pode usar o teclado. A leitura começa quando você escolhe ouvir.
      </p>
    </div>
  );
}
