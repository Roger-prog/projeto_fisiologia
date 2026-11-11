import { getLesson, getModule, lessons } from "@/data";
import { getLessonSteps } from "@/lib/lesson-steps";
import { fixedNarration, lessonTitleNarration, moduleLessonListNarration, narratedMessage, stepLabelNarration } from "@/lib/narration-messages";
import type { VoiceCommandContext } from "@/lib/voice-commands";

export function getVoiceContext(pathname: string, hash: string, quizFocused = false) {
  const [, route, lessonId, mode, stepId] = pathname.split("/");
  const reviewLessonId = route === "revisao" && hash.startsWith("#revisao-") ? hash.slice("#revisao-".length) : "";
  const lesson = route === "aulas" ? getLesson(lessonId) : getLesson(reviewLessonId);
  const module = route === "modulos" ? getModule(hash.slice(1)) : undefined;
  const steps = lesson ? getLessonSteps(lesson) : [];
  const stepIndex = route === "aulas" ? steps.findIndex(({ id }) => id === (mode === "guiado" ? stepId : hash.slice(1))) : -1;
  const quiz = route === "aulas" && (hash === "#exercicios" || quizFocused);
  const reviews = route === "minhas-revisoes" || route === "revisao";
  const guided = mode === "guiado";
  const commandContext: VoiceCommandContext = quiz ? "quiz" : reviews ? "review" : guided ? "guided" : lesson ? "lesson"
    : route === "modulos" ? "modules" : route ? "other" : "home";

  return {
    route,
    lesson,
    module,
    steps,
    stepIndex,
    step: steps[stepIndex],
    quiz,
    reviews,
    guided,
    commandContext,
  };
}

export function describeVoiceOptions(context: ReturnType<typeof getVoiceContext>) {
  const { route, lesson, module, step, stepIndex, quiz, reviews, guided } = context;
  if (quiz && lesson) {
    return narratedMessage(lessonTitleNarration(lesson), fixedNarration("ajuda-exercicios"));
  }
  if (guided && step && lesson) {
    const help = stepIndex + 1 < context.steps.length ? "ajuda-etapa" : "ajuda-etapa-final";
    return narratedMessage(lessonTitleNarration(lesson), stepLabelNarration(lesson, step, stepIndex), fixedNarration(help));
  }
  if (reviews && lesson) return narratedMessage(lessonTitleNarration(lesson), fixedNarration("ajuda-revisao-aula"));
  if (lesson) return narratedMessage(lessonTitleNarration(lesson), fixedNarration("ajuda-aula"));
  if (reviews) return narratedMessage(fixedNarration("ajuda-revisoes"));
  if (module) return narratedMessage(moduleLessonListNarration(module, lessons));
  if (!route) return narratedMessage(fixedNarration("boas-vindas"), fixedNarration("ajuda-inicio"));
  return narratedMessage(fixedNarration(route === "modulos" ? "ajuda-modulos" : "ajuda-geral"));
}
