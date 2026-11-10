"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { Question } from "@/data";
import { stopActiveSpeech } from "@/lib/speech-playback";
import { resetLessonResponses, resetQuestionResponse, saveResponse } from "@/lib/study-storage";
import { QuestionNarration } from "./question-narration";
import { QuestionConfirmation, QuestionFeedback, QuestionOptions } from "./question-parts";
import { useStudy } from "./study-provider";

type LessonQuizProps = {
  lessonId: string;
  lessonTitle: string;
  questions: readonly Question[];
  concepts: readonly string[];
  compact?: boolean;
};

export function LessonQuiz({ lessonId, lessonTitle, questions, concepts, compact = false }: LessonQuizProps) {
  const [requestedIndex, setRequestedIndex] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [retryIndex, setRetryIndex] = useState<number | null>(null);
  const responses = useStudy().progress.lessons[lessonId]?.responses;
  const titleId = useId();
  const radioGroupName = useId();
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const pendingFocus = useRef<"step" | "feedback" | null>(null);

  function answeredOption(question: Question) {
    const savedId = responses?.[question.id]?.optionId;
    return question.options.find((option) => option.id === savedId);
  }

  const firstUnanswered = questions.findIndex((question) => !answeredOption(question));
  const initialIndex = firstUnanswered < 0 ? questions.length : firstUnanswered;
  const currentIndex = requestedIndex === null || requestedIndex >= questions.length ? initialIndex : requestedIndex;
  const question = questions[currentIndex];
  const answer = question && answeredOption(question);
  const showResult = currentIndex === questions.length - 1 || (currentIndex === retryIndex && firstUnanswered < 0);

  useEffect(() => {
    if (pendingFocus.current === "step") stepHeadingRef.current?.focus();
    if (pendingFocus.current === "feedback") feedbackRef.current?.focus();
    pendingFocus.current = null;
  });

  if (!questions.length) return null;

  function showStep(index: number) {
    stopActiveSpeech();
    pendingFocus.current = "step";
    setRequestedIndex(index);
    setSelectedId(null);
    setRetryIndex(null);
  }

  function checkAnswer() {
    if (!question || !selectedId || answer) return;

    stopActiveSpeech();
    pendingFocus.current = "feedback";
    setRequestedIndex(currentIndex);
    saveResponse(lessonId, question.id, selectedId);
  }

  function retryQuestion(index: number) {
    showStep(index);
    setRetryIndex(index);
    resetQuestionResponse(lessonId, questions[index].id);
  }

  const correctCount = questions.filter((item) => answeredOption(item)?.id === item.correctOptionId).length;

  return (
    <section id="exercicios" className="study-panel lesson-quiz" aria-labelledby={titleId} tabIndex={-1}>
      <div className="quiz-heading">
        <ClipboardList aria-hidden="true" size={22} />
        <h2 id={titleId}>Exercícios de fixação</h2>
      </div>
      <p className="muted">
        {compact
          ? "Escolha uma alternativa e use Conferir resposta."
          : "Responda uma pergunta por vez. Você pode voltar e repetir a atividade no seu ritmo."}
      </p>

      {question ? (
        <form className="quiz-body" onSubmit={(event) => event.preventDefault()}>
          <h3 className="quiz-step" ref={stepHeadingRef} tabIndex={-1}>
            Pergunta {currentIndex + 1} de {questions.length}
          </h3>
          <QuestionNarration key={`${question.id}-${Boolean(answer)}`} question={question} />
          <QuestionOptions
            question={question}
            groupName={radioGroupName}
            selectedId={answer?.id ?? selectedId}
            onSelect={setSelectedId}
            disabled={Boolean(answer)}
          />

          {answer && (
            <QuestionFeedback question={question} lessonId={lessonId} optionId={answer.id} feedbackRef={feedbackRef} />
          )}

          <div className="control-row quiz-actions">
            {currentIndex > 0 && (
              <button type="button" className="button button-secondary" onClick={() => showStep(currentIndex - 1)}>
                <ArrowLeft size={18} aria-hidden="true" />
                Pergunta anterior
              </button>
            )}
            {answer ? (
              <>
                <button type="button" className="button button-primary" onClick={() => showStep(showResult ? questions.length : currentIndex + 1)}>
                  {showResult ? "Ver resultado" : "Próxima pergunta"}
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
                <button type="button" className="button button-secondary" onClick={() => retryQuestion(currentIndex)}>
                  Refazer esta pergunta
                </button>
              </>
            ) : (
              <QuestionConfirmation onConfirm={checkAnswer} />
            )}
          </div>
        </form>
      ) : (
        <div className="quiz-body quiz-result">
          <h3 ref={stepHeadingRef} tabIndex={-1}>
            <CheckCircle2 aria-hidden="true" size={22} />
            Exercícios concluídos
          </h3>
          <p>Você acertou {correctCount} de {questions.length} questões.</p>
          <QuizPerformance
            questions={questions}
            lessonId={lessonId}
            isCorrect={(question) => answeredOption(question)?.id === question.correctOptionId}
            onRetry={retryQuestion}
          />
          <div className="quiz-concepts">
            <h4>Conceitos para revisar</h4>
            <ul>{concepts.map((concept) => <li key={concept}>{concept}</li>)}</ul>
            {compact ? (
              <Link className="text-link" href="/minhas-revisoes/">Minhas Revisões</Link>
            ) : (
              <Link href={`/revisao/#revisao-${lessonId}`}>Ir para a revisão rápida</Link>
            )}
          </div>
          <div className="control-row quiz-actions">
            <button type="button" className="button button-secondary" onClick={() => showStep(questions.length - 1)}>
              <ArrowLeft size={18} aria-hidden="true" />
              Pergunta anterior
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                showStep(0);
                resetLessonResponses(lessonId);
              }}
            >
              <RotateCcw size={18} aria-hidden="true" />
              Refazer exercícios
            </button>
          </div>
          <p className="muted quiz-note">Ao refazer os exercícios de “{lessonTitle}”, suas respostas anteriores serão apagadas.</p>
        </div>
      )}
    </section>
  );
}

function QuizPerformance({ questions, lessonId, isCorrect, onRetry }: {
  questions: readonly Question[];
  lessonId: string;
  isCorrect: (question: Question) => boolean;
  onRetry: (index: number) => void;
}) {
  const topics = new Map<string, { correct: number; total: number }>();
  const incorrect: { question: Question; index: number }[] = [];

  questions.forEach((question, index) => {
    const result = topics.get(question.concept) ?? { correct: 0, total: 0 };
    result.total += 1;
    if (isCorrect(question)) {
      result.correct += 1;
    } else {
      incorrect.push({ question, index });
    }
    topics.set(question.concept, result);
  });

  return (
    <div className="quiz-concepts">
      <h4>Desempenho por conteúdo</h4>
      <ul>
        {[...topics].map(([topic, { correct, total }]) => (
          <li key={topic}><strong>{topic}</strong> — {correct} de {total} {total === 1 ? "questão" : "questões"} com acerto</li>
        ))}
      </ul>
      {incorrect.length > 0 && (
        <>
          <h4>Conceitos que vale praticar</h4>
          <ul className="quiz-retry-list">
            {incorrect.map(({ question, index }) => (
              <li key={question.id}>
                <p><strong>Pergunta {index + 1}.</strong> {question.concept}</p>
                <div className="control-row">
                  <Link className="text-link" href={`/aulas/${lessonId}/#${question.sectionId}`}>
                    Rever trecho da pergunta {index + 1}
                  </Link>
                  <button type="button" className="button button-secondary" onClick={() => onRetry(index)}>
                    Refazer pergunta {index + 1}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
