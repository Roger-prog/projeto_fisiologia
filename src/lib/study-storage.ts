import { scheduleReview, type ReviewGrade, type ReviewRecord } from "./review-schedule";

export type TextSize = "normal" | "large" | "extra-large";
export type Contrast = "default" | "high";

type SectionVisit = { id: string; title: string; mode: "guided" | "complete" };
type LessonVisit = { id: string; title: string; section?: SectionVisit };
type SavedResponse = { optionId: string; answeredAt: string };
type SavedLesson = {
  completedAt: string | null;
  responses: Record<string, SavedResponse>;
  questionPractice: Record<string, SavedResponse>;
  lastGuidedStep: string | null;
  completedSteps: Record<string, string>;
};

type ReviewEvent = { itemId: string; grade: ReviewGrade; reviewedAt: string };

type StudyState = {
  preferences: { contrast: Contrast; textSize: TextSize; preferVoice: boolean };
  progress: {
    lastLesson: LessonVisit | null;
    lessons: Record<string, SavedLesson>;
    reviews: Record<string, ReviewRecord>;
    reviewHistory: ReviewEvent[];
  };
};

const storageKey = "fisioacessivel:study:v1";
const maxHistoryEntries = 100;
const emptyProgress: StudyState["progress"] = {
  lastLesson: null,
  lessons: {},
  reviews: {},
  reviewHistory: [],
};
const defaultStudyState: StudyState = {
  preferences: { contrast: "default", textSize: "normal", preferVoice: false },
  progress: emptyProgress,
};
const emptyLesson: SavedLesson = {
  completedAt: null,
  responses: {},
  questionPractice: {},
  lastGuidedStep: null,
  completedSteps: {},
};

const listeners = new Set<() => void>();
let memoryOnly = false;
let lastRawValue: string | null | undefined;
let clientState = defaultStudyState;

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function readResponses(value: unknown): SavedLesson["responses"] {
  const entries = Object.entries(asRecord(value)).flatMap(([id, response]) => {
    const { optionId, answeredAt } = asRecord(response);
    if (typeof optionId === "string" && typeof answeredAt === "string") {
      return [[id, { optionId, answeredAt }] as const];
    }
    return [];
  });
  return Object.fromEntries(entries);
}

function isSlug(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9-]+$/.test(value);
}

function readLessonVisit(value: unknown): LessonVisit | null {
  const { id, title, section } = asRecord(value);
  if (!isSlug(id) || typeof title !== "string") return null;

  const { id: sectionId, title: sectionTitle, mode } = asRecord(section);
  if (isSlug(sectionId) && typeof sectionTitle === "string" && (mode === "complete" || mode === "guided")) {
    return { id, title, section: { id: sectionId, title: sectionTitle, mode } };
  }
  return { id, title };
}

function readLesson(value: unknown): SavedLesson {
  const { completedAt, responses, questionPractice, lastGuidedStep, completedSteps } = asRecord(value);
  const savedResponses = readResponses(responses);
  const steps = Object.entries(asRecord(completedSteps))
    .filter((entry): entry is [string, string] => isSlug(entry[0]) && typeof entry[1] === "string");

  return {
    completedAt: typeof completedAt === "string" ? completedAt : null,
    responses: savedResponses,
    questionPractice: { ...savedResponses, ...readResponses(questionPractice) },
    lastGuidedStep: isSlug(lastGuidedStep) ? lastGuidedStep : null,
    completedSteps: Object.fromEntries(steps),
  };
}

function isReviewGrade(value: unknown): value is ReviewGrade {
  return value === "easy" || value === "hard" || value === "forgot";
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function readReviews(value: unknown): Record<string, ReviewRecord> {
  return Object.fromEntries(Object.entries(asRecord(value)).flatMap(([itemId, item]) => {
    const { dueAt, intervalIndex, grade, reviewedAt } = asRecord(item);
    if (
      isTimestamp(dueAt) && isTimestamp(reviewedAt) && isReviewGrade(grade) &&
      typeof intervalIndex === "number" && Number.isInteger(intervalIndex) && intervalIndex >= 0
    ) {
      return [[itemId, { dueAt, intervalIndex, grade, reviewedAt }] as const];
    }
    return [];
  }));
}

function readReviewHistory(value: unknown): ReviewEvent[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const { itemId, grade, reviewedAt } = asRecord(item);
    return typeof itemId === "string" && isReviewGrade(grade) && isTimestamp(reviewedAt)
      ? [{ itemId, grade, reviewedAt }]
      : [];
  }).slice(0, maxHistoryEntries);
}

function parseState(rawValue: string | null): StudyState {
  if (!rawValue) return defaultStudyState;

  try {
    const saved = asRecord(JSON.parse(rawValue));
    const { contrast, textSize, preferVoice } = asRecord(saved.preferences);
    const progress = asRecord(saved.progress);
    const lessons = Object.entries(asRecord(progress.lessons))
      .map(([lessonId, lesson]) => [lessonId, readLesson(lesson)] as const);

    return {
      preferences: {
        contrast: contrast === "high" ? "high" : "default",
        textSize: textSize === "large" || textSize === "extra-large" ? textSize : "normal",
        preferVoice: preferVoice === true,
      },
      progress: {
        lastLesson: readLessonVisit(progress.lastLesson),
        lessons: Object.fromEntries(lessons),
        reviews: readReviews(progress.reviews),
        reviewHistory: readReviewHistory(progress.reviewHistory),
      },
    };
  } catch {
    return defaultStudyState;
  }
}

export function getServerStudyState() {
  return defaultStudyState;
}

export function getClientStudyState() {
  if (memoryOnly) return clientState;

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (rawValue !== lastRawValue) {
      clientState = parseState(rawValue);
      lastRawValue = rawValue;
    }
  } catch {
    memoryOnly = true;
  }
  return clientState;
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function onStorageChange(event: StorageEvent) {
  if (event.key === storageKey || event.key === null) notifyListeners();
}

export function subscribeToStudyState(listener: () => void) {
  if (!listeners.size) window.addEventListener("storage", onStorageChange);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", onStorageChange);
  };
}

function updateState(update: (state: StudyState) => StudyState) {
  const previousState = getClientStudyState();
  const nextState = update(previousState);
  if (nextState === previousState) return;

  clientState = nextState;
  if (!memoryOnly) {
    try {
      const rawValue = JSON.stringify(nextState);
      window.localStorage.setItem(storageKey, rawValue);
      lastRawValue = rawValue;
    } catch {
      // Keep the current session usable when browser storage is blocked or full.
      memoryOnly = true;
    }
  }
  notifyListeners();
}

export function setStudyPreferences(preferences: Partial<StudyState["preferences"]>) {
  updateState((state) => ({ ...state, preferences: { ...state.preferences, ...preferences } }));
}

export function visitLesson(lesson: LessonVisit) {
  updateState((state) => {
    const { progress } = state;
    const previous = progress.lastLesson;
    const { section } = lesson;
    const saved = progress.lessons[lesson.id] ?? emptyLesson;
    const lastGuidedStep = section?.mode === "guided" ? section.id : saved.lastGuidedStep;
    if (
      previous?.id === lesson.id && previous.title === lesson.title &&
      previous.section?.id === section?.id && previous.section?.mode === section?.mode &&
      previous.section?.title === section?.title && lastGuidedStep === saved.lastGuidedStep
    ) return state;

    return {
      ...state,
      progress: {
        ...progress,
        lastLesson: lesson,
        lessons: lastGuidedStep === saved.lastGuidedStep
          ? progress.lessons
          : { ...progress.lessons, [lesson.id]: { ...saved, lastGuidedStep } },
      },
    };
  });
}

function updateLesson(lessonId: string, update: (lesson: SavedLesson) => SavedLesson) {
  updateState((state) => ({
    ...state,
    progress: {
      ...state.progress,
      lessons: {
        ...state.progress.lessons,
        [lessonId]: update(state.progress.lessons[lessonId] ?? emptyLesson),
      },
    },
  }));
}

export function toggleLessonCompletion(lessonId: string) {
  updateLesson(lessonId, (lesson) => ({
    ...lesson,
    completedAt: lesson.completedAt ? null : new Date().toISOString(),
  }));
}

export function toggleStepCompletion(lessonId: string, stepId: string) {
  updateLesson(lessonId, (lesson) => {
    const completedSteps = { ...lesson.completedSteps };
    if (Object.hasOwn(completedSteps, stepId)) {
      delete completedSteps[stepId];
    } else {
      completedSteps[stepId] = new Date().toISOString();
    }
    return { ...lesson, completedSteps };
  });
}

export function saveResponse(lessonId: string, questionId: string, optionId: string) {
  const response = { optionId, answeredAt: new Date().toISOString() };
  updateLesson(lessonId, (lesson) => ({
    ...lesson,
    responses: { ...lesson.responses, [questionId]: response },
    questionPractice: { ...lesson.questionPractice, [questionId]: response },
  }));
}

export function resetQuestionResponse(lessonId: string, questionId: string) {
  updateLesson(lessonId, (lesson) => {
    const responses = { ...lesson.responses };
    delete responses[questionId];
    return { ...lesson, responses };
  });
}

export function resetLessonResponses(lessonId: string) {
  updateLesson(lessonId, (lesson) => ({ ...lesson, responses: {} }));
}

export function recordReview(itemId: string, grade: ReviewGrade, seed?: ReviewRecord) {
  updateState((state) => {
    const { progress } = state;
    const record = scheduleReview(progress.reviews[itemId] ?? seed, grade, new Date());
    const event = { itemId, grade, reviewedAt: record.reviewedAt };
    return {
      ...state,
      progress: {
        ...progress,
        reviews: { ...progress.reviews, [itemId]: record },
        reviewHistory: [event, ...progress.reviewHistory].slice(0, maxHistoryEntries),
      },
    };
  });
}

export function clearStudyProgress() {
  updateState((state) => ({ ...state, progress: emptyProgress }));
}
