import { cardiovascularLesson } from "./lessons/cardiovascular";
import { respiratoryLesson } from "./lessons/respiratory";
import { modules } from "./modules";
import { references } from "./references";
import type { Lesson } from "./types";

export * from "./types";
export { figureCredits } from "./credits";
export { modules, references };

export const lessons: readonly Lesson[] = [cardiovascularLesson, respiratoryLesson];

export function getLesson(id: string) {
  return lessons.find((lesson) => lesson.id === id);
}

export function getModule(id: string) {
  return modules.find((module) => module.id === id);
}

export function getLessonReferences(lesson: Lesson) {
  return references.filter((reference) => lesson.referenceIds.includes(reference.id));
}
