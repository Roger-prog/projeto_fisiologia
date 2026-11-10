import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight } from "lucide-react";
import { ReferenceList } from "@/components/reference-list";
import { AudioPlayer } from "@/components/study/audio-player";
import { LessonModeNav } from "@/components/study/lesson-mode-nav";
import { LessonQuiz } from "@/components/study/lesson-quiz";
import { LessonDiagram, LessonSimulationLink, LessonStepContent } from "@/components/study/lesson-step-content";
import { LessonProgress } from "@/components/study/study-provider";
import { StudyOrientation } from "@/components/study/study-orientation";
import { TrackLessonVisit } from "@/components/study/track-lesson-visit";
import { getLesson, getLessonReferences, getModule, lessons } from "@/data";
import { getLessonSpeechText } from "@/lib/lesson-speech";
import { getLessonSteps, guidedLessonHref } from "@/lib/lesson-steps";

type PageProps = { params: Promise<{ id: string }> };

const outline = [
  { id: "leitura", label: "Leitura em voz alta" },
  { id: "introducao", label: "Introdução" },
  { id: "explicacao", label: "Entenda o tema" },
  { id: "diagrama", label: "Diagrama" },
  { id: "termos", label: "Termos importantes" },
  { id: "resumo", label: "Resumo" },
  { id: "exercicios", label: "Exercícios" },
  { id: "fontes", label: "Referências" },
];

export function generateStaticParams() {
  return lessons.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lesson = getLesson((await params).id);
  return lesson ? { title: lesson.title, description: lesson.objective } : {};
}

export default async function LessonPage({ params }: PageProps) {
  const lesson = getLesson((await params).id);
  if (!lesson) notFound();
  const module = getModule(lesson.moduleId);
  if (!module) notFound();

  const index = lessons.indexOf(lesson);
  const previous = lessons[index - 1];
  const next = lessons[index + 1];
  const steps = getLessonSteps(lesson);
  const [introduction] = steps;
  const explanationSteps = steps.filter((step) => step.kind === "section");

  return (
    <div className="site-shell inner-page lesson-page">
      <TrackLessonVisit lessonId={lesson.id} lessonTitle={lesson.title} steps={steps.map(({ id, title }) => ({ id, title }))} />
      <nav aria-label="Localização" className="breadcrumb">
        <ol>
          <li><Link href="/modulos/">Módulos</Link></li>
          <li><ChevronRight size={15} aria-hidden="true" /><Link href={`/modulos/#${module.id}`}>{module.title}</Link></li>
          <li><ChevronRight size={15} aria-hidden="true" /><span aria-current="page">Aula</span></li>
        </ol>
      </nav>

      <article aria-labelledby="titulo-aula">
        <header className="lesson-header">
          <p className="eyebrow"><BookOpen size={17} aria-hidden="true" />Aula piloto · {module.title}</p>
          <h1 id="titulo-aula">{lesson.title}</h1>
          <div className="objective">
            <h2>Objetivo de aprendizagem</h2>
            <p>{lesson.objective}</p>
          </div>
          <LessonModeNav lessonId={lesson.id} stepIds={steps.map(({ id }) => id)} current="complete" />
          <div className="mt-4 max-w-xl">
            <StudyOrientation
              lessonTitle={lesson.title}
              stageTitle="Aula completa"
              actions={["Ouvir a aula", "Modo guiado", "Modo revisão", "Exercícios"]}
              continuation="Depois de iniciar o áudio, use Parar leitura se quiser interromper. Use Modo guiado para estudar uma etapa de cada vez."
            />
          </div>
        </header>

        <div className="lesson-layout">
          <nav className="lesson-outline" aria-labelledby="nesta-aula">
            <h2 id="nesta-aula">Nesta aula</h2>
            <ul role="list">
              {outline.map(({ id, label }) => (
                <li key={id}>
                  <a href={`#${id}`}>{label}</a>
                  {id === "explicacao" && (
                    <details className="lesson-outline-steps">
                      <summary>Seções da explicação</summary>
                      <ul role="list">
                        {explanationSteps.map((step) => (
                          <li key={step.id}><a href={`#${step.id}`}>{step.title}</a></li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="lesson-content">
            <div id="leitura" tabIndex={-1}><AudioPlayer key={lesson.id} text={getLessonSpeechText(lesson)} /></div>

            <section className="lesson-section" aria-labelledby="introducao">
              <h2 id="introducao" tabIndex={-1}>Introdução</h2>
              <LessonStepContent step={introduction} headingLevel={3} showObjective={false} />
            </section>

            <section className="lesson-section" aria-labelledby="explicacao">
              <h2 id="explicacao" tabIndex={-1}>Entenda o tema</h2>
              {explanationSteps.map((step) => (
                <div key={step.id} className="mb-8">
                  <h3 id={step.id} tabIndex={-1}>{step.title}</h3>
                  <LessonStepContent step={step} headingLevel={4} />
                  <div className="control-row mt-4">
                    <Link
                      className="button button-secondary"
                      href={guidedLessonHref(lesson.id, step.id)}
                      aria-label={`Estudar esta etapa. ${step.title}`}
                    >
                      Estudar esta etapa
                    </Link>
                  </div>
                  {lesson.simulation?.sectionId === step.id && <LessonSimulationLink simulation={lesson.simulation} />}
                </div>
              ))}
            </section>

            <section className="lesson-section" aria-labelledby="diagrama">
              <h2 id="diagrama" tabIndex={-1}>Diagrama</h2>
              <LessonDiagram figure={lesson.figure} />
            </section>

            <section className="lesson-section" aria-labelledby="termos">
              <h2 id="termos" tabIndex={-1}>Termos importantes</h2>
              <dl className="term-list">
                {lesson.terms.map(({ term, definition }) => (
                  <div key={term}><dt>{term}</dt><dd>{definition}</dd></div>
                ))}
              </dl>
            </section>

            <section className="lesson-section summary-panel" aria-labelledby="resumo">
              <h2 id="resumo" tabIndex={-1}>Resumo</h2>
              <ul>{lesson.summary.map((point) => <li key={point}>{point}</li>)}</ul>
              <LessonProgress lessonId={lesson.id} />
            </section>

            <LessonQuiz
              lessonId={lesson.id}
              lessonTitle={lesson.title}
              questions={lesson.questions}
              concepts={lesson.summary}
            />

            <section className="lesson-section" aria-labelledby="fontes">
              <h2 id="fontes" tabIndex={-1}>Referências da aula</h2>
              <ReferenceList entries={getLessonReferences(lesson)} />
            </section>
          </div>
        </div>
      </article>

      <nav className="lesson-pagination" aria-label="Navegação entre aulas disponíveis">
        {previous ? (
          <Link className="button button-secondary" href={`/aulas/${previous.id}/`}>
            <ArrowLeft size={19} aria-hidden="true" />
            <span><small>Aula anterior</small>{previous.title}</span>
          </Link>
        ) : (
          <Link className="button button-secondary" href="/modulos/">
            <ArrowLeft size={19} aria-hidden="true" />Voltar aos módulos
          </Link>
        )}
        {next && (
          <Link className="button button-secondary" href={`/aulas/${next.id}/`}>
            <span><small>Próxima aula</small>{next.title}</span>
            <ArrowRight size={19} aria-hidden="true" />
          </Link>
        )}
      </nav>
    </div>
  );
}
