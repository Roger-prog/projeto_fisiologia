import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight } from "lucide-react";
import { ReferenceList } from "@/components/reference-list";
import { AudioPlayer } from "@/components/study/audio-player";
import { LessonQuiz } from "@/components/study/lesson-quiz";
import { LessonProgress } from "@/components/study/study-provider";
import { figureCredits, getLesson, getLessonReferences, getModule, lessons } from "@/data";
import { getLessonSpeechText } from "@/lib/lesson-speech";

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
  const credit = figureCredits.find(({ id }) => id === lesson.figure.creditId);

  return (
    <div className="site-shell inner-page lesson-page">
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
        </header>

        <div className="lesson-layout">
          <nav className="lesson-outline" aria-labelledby="nesta-aula">
            <h2 id="nesta-aula">Nesta aula</h2>
            <ul>
              {outline.map(({ id, label }) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}
            </ul>
          </nav>

          <div className="lesson-content">
            <div id="leitura" tabIndex={-1}><AudioPlayer text={getLessonSpeechText(lesson)} /></div>

            <section className="lesson-section" aria-labelledby="introducao">
              <h2 id="introducao" tabIndex={-1}>Introdução</h2>
              <p>{lesson.introduction}</p>
            </section>

            <section className="lesson-section" aria-labelledby="explicacao">
              <h2 id="explicacao" tabIndex={-1}>Entenda o tema</h2>
              {lesson.sections.map((section) => (
                <div key={section.id}>
                  <h3 id={section.id}>{section.title}</h3>
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              ))}
            </section>

            <section className="lesson-section" aria-labelledby="diagrama">
              <h2 id="diagrama" tabIndex={-1}>Diagrama</h2>
              <figure className="lesson-figure">
                {/* SVGs are served locally and retain their original vector format. */}
                <img src={lesson.figure.src} alt={lesson.figure.alt} loading="lazy" />
                <figcaption>
                  <p className="figure-title">{lesson.figure.title}</p>
                  <p>{lesson.figure.description}</p>
                  {credit && (
                    <p className="figure-credit">
                      {credit.author}. <Link href={`/referencias/#${credit.id}`}>Crédito e licença da imagem</Link>.
                    </p>
                  )}
                </figcaption>
              </figure>
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
              <LessonProgress lessonId={lesson.id} lessonTitle={lesson.title} />
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
