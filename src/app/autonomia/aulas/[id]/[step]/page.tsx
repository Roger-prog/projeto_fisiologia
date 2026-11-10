import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import styles from "@/components/autonomy/autonomy.module.css";
import { AudioPlayer } from "@/components/study/audio-player";
import { GuidedStepProgress } from "@/components/study/guided-step-progress";
import { LessonDiagram, LessonSimulationLink, LessonStepContent } from "@/components/study/lesson-step-content";
import { StudyOrientation } from "@/components/study/study-orientation";
import { TrackLessonVisit } from "@/components/study/track-lesson-visit";
import { getLesson, lessons } from "@/data";
import { autonomyExercisesHref, autonomyStepHref } from "@/lib/autonomy-routes";
import { getStepSpeechText } from "@/lib/lesson-speech";
import { getLessonSteps } from "@/lib/lesson-steps";

type PageProps = { params: Promise<{ id: string; step: string }> };

export function generateStaticParams() {
  return lessons.flatMap((lesson) => getLessonSteps(lesson).map(({ id }) => ({ id: lesson.id, step: id })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, step } = await params;
  const lesson = getLesson(id);
  const current = lesson && getLessonSteps(lesson).find((item) => item.id === step);
  return lesson && current
    ? { title: `${current.title} · ${lesson.title} · Autonomia`, description: current.objective }
    : {};
}

export default async function AutonomyStepPage({ params }: PageProps) {
  const { id, step: stepId } = await params;
  const lesson = getLesson(id);
  if (!lesson) notFound();

  const steps = getLessonSteps(lesson);
  const index = steps.findIndex((item) => item.id === stepId);
  const step = steps[index];
  if (!step) notFound();

  const previous = steps[index - 1];
  const next = steps[index + 1];
  const simulation = lesson.simulation?.sectionId === step.id ? lesson.simulation : undefined;
  const diagram = lesson.figure.sectionId === step.id ? lesson.figure : undefined;
  const progressLabel = step.summary ? "Consultar resumo e progresso" : "Progresso da etapa";
  const stepPosition = `Etapa ${index + 1} de ${steps.length}`;
  const forwardLabel = next ? "Próxima etapa" : "Fazer exercícios";
  const forwardHref = next ? autonomyStepHref(lesson.id, next.id) : autonomyExercisesHref(lesson.id);
  const continuation = next
    ? "Use Próxima etapa para avançar."
    : "Use Fazer exercícios para praticar os conceitos da aula.";

  return (
    <div className="site-shell inner-page">
      <article key={`${lesson.id}/${step.id}`} className={`${styles.surface} ${styles.flow}`} aria-labelledby="titulo-etapa">
        <TrackLessonVisit lessonId={lesson.id} lessonTitle={lesson.title} guidedStep={{ id: step.id, title: step.title }} />
        <header className={styles.intro}>
          <p className="eyebrow">Modo de Autonomia</p>
          <p className={styles.lessonLabel}>{lesson.title}</p>
          <p>{stepPosition}</p>
          <h1 id="titulo-etapa" tabIndex={-1}>{step.title}</h1>
        </header>

        <StudyOrientation
          lessonTitle={lesson.title}
          stageTitle={`${stepPosition}. ${step.title}`}
          actions={[
            "Ouvir a etapa",
            ...(previous ? ["Etapa anterior"] : []),
            forwardLabel, progressLabel, "Voltar ao início",
          ]}
          continuation={`Depois de iniciar a leitura, você pode usar Repetir explicação. Durante a leitura, use Parar leitura para interromper. ${continuation}`}
        />
        <AudioPlayer scope="section" compact text={getStepSpeechText(lesson, step)} />

        <nav className={styles.actions} aria-label="Navegação do estudo">
          {previous && (
            <Link className="button button-secondary" href={autonomyStepHref(lesson.id, previous.id)}>
              <ArrowLeft size={19} aria-hidden="true" /> Etapa anterior
            </Link>
          )}
          <Link className="button button-primary" href={forwardHref}>
            {forwardLabel} <ArrowRight size={19} aria-hidden="true" />
          </Link>
          <Link className="button button-secondary" href="/autonomia/">Voltar ao início</Link>
        </nav>

        <div className="lesson-section"><LessonStepContent step={step} showSummary={false} /></div>
        <details className={styles.disclosure}>
          <summary className="button button-secondary">{progressLabel} <ChevronDown size={18} aria-hidden="true" /></summary>
          <div className={`${styles.disclosed} summary-panel`}>
            {step.summary && <p>{step.summary}</p>}
            <GuidedStepProgress lessonId={lesson.id} stepId={step.id} />
          </div>
        </details>
        {(diagram || simulation) && (
          <details className={styles.disclosure}>
            <summary className="button button-secondary">Recursos da etapa <ChevronDown size={18} aria-hidden="true" /></summary>
            <div className={styles.disclosed}>
              {diagram && <LessonDiagram figure={diagram} />}
              {simulation && <LessonSimulationLink simulation={simulation} />}
            </div>
          </details>
        )}
      </article>
    </div>
  );
}
