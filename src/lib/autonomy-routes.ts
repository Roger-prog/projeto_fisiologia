export function autonomyStepHref(lessonId: string, stepId: string) {
  return `/autonomia/aulas/${lessonId}/${stepId}/`;
}

export function autonomyExercisesHref(lessonId: string) {
  return `/autonomia/aulas/${lessonId}/exercicios/`;
}

export function isAutonomyPath(pathname: string) {
  return pathname === "/autonomia" || pathname.startsWith("/autonomia/");
}
