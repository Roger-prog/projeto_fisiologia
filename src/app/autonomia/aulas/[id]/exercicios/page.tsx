import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutonomyTitle } from "@/components/autonomy/autonomy-title";
import styles from "@/components/autonomy/autonomy.module.css";
import { LessonQuiz } from "@/components/study/lesson-quiz";
import { StudyOrientation } from "@/components/study/study-orientation";
import { getLesson, lessons } from "@/data";
import { autonomyStepHref } from "@/lib/autonomy-routes";

type PageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return lessons.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lesson = getLesson((await params).id);
  return lesson ? { title: `Exercícios · ${lesson.title} · Autonomia` } : {};
}

export default async function AutonomyExercisesPage({ params }: PageProps) {
  const lesson = getLesson((await params).id);
  if (!lesson) notFound();

  return (
    <div className={`site-shell inner-page ${styles.surface} ${styles.flow}`}>
      <header className={styles.intro}>
        <p className="eyebrow">Modo de Autonomia</p>
        <p className={styles.lessonLabel}>{lesson.title}</p>
        <AutonomyTitle>Exercícios</AutonomyTitle>
      </header>
      <StudyOrientation
        lessonTitle={lesson.title}
        stageTitle="Exercícios"
        actions={["Ouvir pergunta e alternativas", "Conferir resposta", "Voltar ao estudo", "Voltar ao início"]}
        continuation="Durante uma questão, escolha a alternativa pela letra e use Conferir resposta. Depois do comentário, avance para a próxima pergunta."
      />
      <LessonQuiz
        key={lesson.id}
        lessonId={lesson.id}
        lessonTitle={lesson.title}
        questions={lesson.questions}
        concepts={lesson.summary}
        compact
      />
      <nav className={styles.actions} aria-label="Navegação do estudo">
        <Link className="button button-secondary" href={autonomyStepHref(lesson.id, "resumo")}>Voltar ao estudo</Link>
        <Link className="button button-secondary" href="/autonomia/">Voltar ao início</Link>
      </nav>
    </div>
  );
}
