export interface ModuleTopic {
  id: string;
  title: string;
  lessonId?: string;
}

export interface PhysiologyModule {
  id: string;
  title: string;
  description: string;
  topics: readonly ModuleTopic[];
}

export interface LessonSection {
  id: string;
  title: string;
  paragraphs: readonly string[];
}

export interface LessonTerm {
  term: string;
  definition: string;
}

export interface LessonFigure {
  src: string;
  alt: string;
  title: string;
  description: string;
  creditId: string;
}

export interface Question {
  id: string;
  prompt: string;
  options: readonly { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
}

export interface ReviewCard {
  id: string;
  prompt: string;
  answer: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  objective: string;
  introduction: string;
  sections: readonly LessonSection[];
  terms: readonly LessonTerm[];
  figure: LessonFigure;
  summary: readonly string[];
  questions: readonly Question[];
  quickReview: readonly ReviewCard[];
  referenceIds: readonly string[];
}

export interface Reference {
  id: string;
  authors: string;
  title: string;
  publication: string;
  year: number;
  url: string;
}

export interface FigureCredit {
  id: string;
  title: string;
  author: string;
  source: string;
  license: string;
  licenseUrl?: string;
  changes: string;
}
