import { getLesson } from "@/data";
import { getLessonSteps } from "@/lib/lesson-steps";

export function getVoiceContext(pathname: string, hash: string) {
  const [, route, lessonId, mode, stepId] = pathname.split("/");
  const lesson = route === "aulas" ? getLesson(lessonId) : undefined;
  const steps = lesson ? getLessonSteps(lesson) : [];
  const stepIndex = mode === "guiado" ? steps.findIndex(({ id }) => id === stepId) : -1;

  return {
    route,
    lesson,
    steps,
    stepIndex,
    step: steps[stepIndex],
    quiz: Boolean(lesson && hash === "#exercicios"),
    reviews: route === "minhas-revisoes" || route === "revisao",
  };
}

export function describeVoiceOptions(context: ReturnType<typeof getVoiceContext>) {
  const { route, lesson, step, stepIndex, quiz, reviews } = context;
  if (quiz && lesson) {
    return `${lesson.title}. Exercícios. Diga Ouvir pergunta, escolha a letra e diga Confirmar resposta. Use Próxima pergunta para avançar.`;
  }
  if (step && lesson) {
    const forward = stepIndex + 1 < context.steps.length ? "Próxima etapa" : "Fazer exercícios";
    return `${lesson.title}. Etapa ${stepIndex + 1}. ${step.title}. Diga Ouvir a etapa, Repetir ou ${forward}. Entre trechos, diga Continuar leitura ou Parar leitura.`;
  }
  if (lesson) {
    return `${lesson.title}. Aula completa. Diga Ouvir a aula, Fazer exercícios ou Continuar de onde parei.`;
  }
  if (reviews) {
    return "Você está nas revisões. Abra uma sessão pelos controles da página. Se houver uma pergunta, diga Ouvir pergunta, escolha a letra e diga Confirmar resposta.";
  }
  const place = route === "modulos" ? "nos módulos" : route ? "no FisioAcessível" : "na página inicial";
  return `Você está ${place}. Diga Continuar de onde parei, Listar aulas ou Minhas Revisões. Para encerrar, diga Encerrar voz.`;
}
