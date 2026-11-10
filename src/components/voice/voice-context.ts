import { getLesson } from "@/data";
import { getLessonSteps } from "@/lib/lesson-steps";
import { fixedNarration, lessonTitleNarration, narratedMessage, stepLabelNarration } from "@/lib/narration-messages";

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
    return narratedMessage(lessonTitleNarration(lesson), fixedNarration("ajuda-exercicios"));
  }
  if (step && lesson) {
    const help = stepIndex + 1 < context.steps.length ? "ajuda-etapa" : "ajuda-etapa-final";
    return narratedMessage(lessonTitleNarration(lesson), stepLabelNarration(lesson, step, stepIndex), fixedNarration(help));
  }
  if (lesson) return narratedMessage(lessonTitleNarration(lesson), fixedNarration("ajuda-aula"));
  if (reviews) return narratedMessage(fixedNarration("ajuda-revisoes"));
  if (!route) return narratedMessage(fixedNarration("boas-vindas"), fixedNarration("ajuda-inicio"));
  return narratedMessage(fixedNarration(route === "modulos" ? "ajuda-modulos" : "ajuda-geral"));
}
