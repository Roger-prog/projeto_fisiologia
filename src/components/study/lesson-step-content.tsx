import Link from "next/link";
import { figureCredits, type LessonFigure, type Lesson } from "@/data";
import type { LessonStep } from "@/lib/lesson-steps";

export function LessonStepContent({
  step,
  headingLevel = 2,
  showObjective = true,
}: {
  step: LessonStep;
  headingLevel?: 2 | 3 | 4;
  showObjective?: boolean;
}) {
  const Heading = `h${headingLevel}` as const;

  return (
    <div className="space-y-4">
      {showObjective && (
        <div>
          <Heading>Objetivo da etapa</Heading>
          <p>{step.objective}</p>
        </div>
      )}
      {step.kind === "summary" ? (
        <ul className="list-disc space-y-2 ps-6">
          {step.paragraphs.map((point) => <li key={point}>{point}</li>)}
        </ul>
      ) : (
        <div>
          {step.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      )}
      {step.example && (
        <div className="study-panel">
          <Heading>{step.example.title}</Heading>
          {step.example.formula && (
            <p className="my-2 font-semibold">
              <span aria-hidden="true">{step.example.formula.visual}</span>
              <span className="sr-only">{step.example.formula.spoken}</span>
            </p>
          )}
          {step.example.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      )}
      {step.summary && (
        <div className="summary-panel">
          <Heading>Resumo da etapa</Heading>
          <p>{step.summary}</p>
        </div>
      )}
    </div>
  );
}

export function LessonDiagram({ figure }: { figure: LessonFigure }) {
  const credit = figureCredits.find(({ id }) => id === figure.creditId);

  return (
    <figure className="lesson-figure">
      <img src={figure.src} width={figure.width} height={figure.height} alt={figure.alt} loading="lazy" />
      <figcaption>
        <p className="figure-title">{figure.title}</p>
        <p>{figure.description}</p>
        <ol className="my-3 list-decimal space-y-2 ps-6" aria-label="Descrição sequencial do diagrama">
          {figure.descriptionSteps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        {credit && (
          <p className="figure-credit">
            {credit.author}. <Link href={`/referencias/#${credit.id}`}>Crédito e licença da imagem</Link>.
          </p>
        )}
      </figcaption>
    </figure>
  );
}

export function LessonSimulationLink({ simulation }: { simulation: NonNullable<Lesson["simulation"]> }) {
  return <Link className="button button-secondary mt-4" href={simulation.href}>{simulation.label}</Link>;
}
