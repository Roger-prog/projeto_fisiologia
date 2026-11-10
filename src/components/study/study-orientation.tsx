import { ChevronDown } from "lucide-react";
import { NarrationControls } from "./narration-controls";

export function StudyOrientation({ lessonTitle, stageTitle, actions, continuation }: {
  lessonTitle: string;
  stageTitle: string;
  actions: readonly string[];
  continuation: string;
}) {
  const context = [`Você está na aula ${lessonTitle}.`, `Tela atual. ${stageTitle}.`];
  const controls = "Controles disponíveis";
  const text = [...context, `${controls}.`, ...actions.map((action) => `${action}.`), continuation].join("\n");

  return (
    <div className="space-y-2">
      <NarrationControls
        text={text}
        startLabel="Ouvir minhas opções"
        unavailableMessage="A orientação por áudio está indisponível. Consulte o texto em O que posso fazer nesta tela?"
      />
      <details className="review-card">
        <summary>O que posso fazer nesta tela? <ChevronDown size={18} aria-hidden="true" /></summary>
        <div className="px-4 pb-4 space-y-2">
          {context.map((line) => <div key={line}>{line}</div>)}
          <div>{controls}</div>
          <ul className="list-disc ps-6" role="list">
            {actions.map((action) => <li key={action}>{action}</li>)}
          </ul>
          <div>{continuation}</div>
        </div>
      </details>
    </div>
  );
}
