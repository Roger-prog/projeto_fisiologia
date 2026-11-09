export type TextSize = "normal" | "large" | "extra-large";
export type Contrast = "default" | "high";

type LessonVisit = { id: string; title: string };
type SavedResponse = { optionId: string; answeredAt: string };
type SavedLesson = {
  completedAt: string | null;
  responses: Record<string, SavedResponse>;
};

type StudyState = {
  preferences: { contrast: Contrast; textSize: TextSize };
  progress: {
    lastLesson: LessonVisit | null;
    lessons: Record<string, SavedLesson>;
  };
};

const storageKey = "fisioacessivel:study:v1";
const emptyProgress: StudyState["progress"] = { lastLesson: null, lessons: {} };
const defaultStudyState: StudyState = {
  preferences: { contrast: "default", textSize: "normal" },
  progress: emptyProgress,
};
const emptyLesson: SavedLesson = { completedAt: null, responses: {} };

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

function parseState(rawValue: string | null): StudyState {
  if (!rawValue) return defaultStudyState;

  try {
    const saved = asRecord(JSON.parse(rawValue));
    const { contrast, textSize } = asRecord(saved.preferences);
    const progress = asRecord(saved.progress);
    const { id, title } = asRecord(progress.lastLesson);
    const lessons = Object.entries(asRecord(progress.lessons)).map(([lessonId, lesson]) => {
      const { completedAt, responses } = asRecord(lesson);
      return [lessonId, {
        completedAt: typeof completedAt === "string" ? completedAt : null,
        responses: readResponses(responses),
      }] as const;
    });

    return {
      preferences: {
        contrast: contrast === "high" ? "high" : "default",
        textSize: textSize === "large" || textSize === "extra-large" ? textSize : "normal",
      },
      progress: {
        lastLesson: typeof id === "string" && /^[a-z0-9-]+$/.test(id) && typeof title === "string"
          ? { id, title }
          : null,
        lessons: Object.fromEntries(lessons),
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
    const previous = state.progress.lastLesson;
    if (previous?.id === lesson.id && previous.title === lesson.title) return state;
    return { ...state, progress: { ...state.progress, lastLesson: lesson } };
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

export function saveResponse(lessonId: string, questionId: string, optionId: string) {
  updateLesson(lessonId, (lesson) => ({
    ...lesson,
    responses: {
      ...lesson.responses,
      [questionId]: { optionId, answeredAt: new Date().toISOString() },
    },
  }));
}

export function resetLessonResponses(lessonId: string) {
  updateLesson(lessonId, (lesson) => ({ ...lesson, responses: {} }));
}

export function clearStudyProgress() {
  updateState((state) => ({ ...state, progress: emptyProgress }));
}
