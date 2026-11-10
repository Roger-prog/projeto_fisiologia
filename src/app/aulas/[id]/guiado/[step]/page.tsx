import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { AudioPlayer } from "@/components/study/audio-player";
import { GuidedStepProgress } from "@/components/study/guided-step-progress";
import { LessonModeNav } from "@/components/study/lesson-mode-nav";
import { LessonDiagram, LessonSimulationLink, LessonStepContent } from "@/components/study/lesson-step-content";
import { TrackLessonVisit } from "@/components/study/track-lesson-visit";
import { getLesson, lessons } from "@/data";
import { getStepNarrationClips } from "@/lib/narration-catalog";
import { getStepSpeechText } from "@/lib/lesson-speech";
import { getLessonSteps, guidedLessonHref } from "@/lib/lesson-steps";

type PageProps = { params: Promise<{ id: string; step: string }> };

export function generateStaticParams() {
  return lessons.flatMap((lesson) => getLessonSteps(lesson).map(({ id }) => ({ id: lesson.id, step: id })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, step } = await params;
  const lesson = getLesson(id);
  const current = lesson && getLessonSteps(lesson).find((item) => item.id === step);
  return lesson && current ? { title: `${current.title} · ${lesson.title}`, description: current.objective } : {};
}

export default async function GuidedLessonPage({ params }: PageProps) {
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
  const narration = getStepNarrationClips(lesson, step);

  return (
    <div className="site-shell inner-page lesson-page">
      <article className="mx-auto max-w-4xl" aria-labelledby="titulo-etapa">
        <TrackLessonVisit key={`${lesson.id}/${step.id}`} lessonId={lesson.id} lessonTitle={lesson.title} guidedStep={{ id: step.id, title: step.title }} />

        <header className="lesson-header">
          <p className="eyebrow"><BookOpen size={17} aria-hidden="true" />{lesson.title}</p>
          <p className="mt-3 font-semibold">Etapa {index + 1} de {steps.length}</p>
          <h1 id="titulo-etapa" tabIndex={-1}>{step.title}</h1>
          <LessonModeNav lessonId={lesson.id} stepIds={steps.map(({ id }) => id)} current="guided" stepId={step.id} />
        </header>

        <div className="lesson-content">
          <AudioPlayer
            key={`${lesson.id}/${step.id}`}
            scope="section"
            text={getStepSpeechText(lesson, step)}
            clipIds={narration.map(({ id }) => id)}
            voiceBlocks={narration.map(({ text }) => text)}
          />
          <div className="lesson-section">
            <LessonStepContent step={step} />
            {simulation && <LessonSimulationLink simulation={simulation} />}
          </div>
          {lesson.figure.sectionId === step.id && (
            <section className="lesson-section" aria-labelledby="diagrama-etapa">
              <h2 id="diagrama-etapa">Diagrama</h2>
              <LessonDiagram figure={lesson.figure} />
            </section>
          )}
          <GuidedStepProgress lessonId={lesson.id} stepId={step.id} />
        </div>

        <nav className="lesson-pagination" aria-label="Navegação entre etapas">
          {previous && (
            <Link className="button button-secondary" href={guidedLessonHref(lesson.id, previous.id)}>
              <ArrowLeft size={19} aria-hidden="true" />
              Etapa anterior
            </Link>
          )}
          {next ? (
            <Link className="button button-primary" href={guidedLessonHref(lesson.id, next.id)}>
              Próxima etapa
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
          ) : (
            <Link className="button button-primary" href={`/aulas/${lesson.id}/#exercicios`}>
              Fazer exercícios da aula
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
          )}
        </nav>
      </article>
    </div>
  );
}
