"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, RotateCcw } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import type { Question } from "@/data";
import { resetLessonResponses, saveResponse } from "@/lib/study-storage";
import { useStudy } from "./study-provider";

type LessonQuizProps = {
  lessonId: string;
  lessonTitle: string;
  questions: readonly Question[];
  concepts: readonly string[];
};

export function LessonQuiz({ lessonId, lessonTitle, questions, concepts }: LessonQuizProps) {
  const [requestedIndex, setRequestedIndex] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
  const correctOption = question?.options.find((option) => option.id === question.correctOptionId);

  useEffect(() => {
    if (pendingFocus.current === "step") stepHeadingRef.current?.focus();
    if (pendingFocus.current === "feedback") feedbackRef.current?.focus();
    pendingFocus.current = null;
  });

  if (!questions.length) return null;

  function showStep(index: number) {
    pendingFocus.current = "step";
    setRequestedIndex(index);
    setSelectedId(null);
  }

  function checkAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question || !selectedId || answer) return;

    pendingFocus.current = "feedback";
    setRequestedIndex(currentIndex);
    saveResponse(lessonId, question.id, selectedId);
  }

  const correctCount = questions.filter((item) => answeredOption(item)?.id === item.correctOptionId).length;

  return (
    <section id="exercicios" className="study-panel lesson-quiz" aria-labelledby={titleId} tabIndex={-1}>
      <div className="quiz-heading">
        <ClipboardList aria-hidden="true" size={22} />
        <h2 id={titleId}>Exercícios de fixação</h2>
      </div>
      <p className="muted">Responda uma pergunta por vez. Você pode voltar e repetir a atividade no seu ritmo.</p>

      {question ? (
        <form className="quiz-body" onSubmit={checkAnswer}>
          <h3 className="quiz-step" ref={stepHeadingRef} tabIndex={-1}>
            Pergunta {currentIndex + 1} de {questions.length}
          </h3>
          <fieldset className="quiz-question" disabled={Boolean(answer)}>
            <legend>{question.prompt}</legend>
            {question.options.map((option) => (
              <label key={`${question.id}-${option.id}`} className="quiz-option" data-selected={(answer?.id ?? selectedId) === option.id}>
                <input
                  type="radio"
                  name={radioGroupName}
                  value={option.id}
                  checked={(answer?.id ?? selectedId) === option.id}
                  onChange={() => setSelectedId(option.id)}
                  required
                />
                <span>{option.text}</span>
              </label>
            ))}
          </fieldset>

          {answer && (
            <p
              className="quiz-feedback"
              data-correct={answer.id === question.correctOptionId}
              ref={feedbackRef}
              tabIndex={-1}
            >
              <strong>{answer.id === question.correctOptionId ? "Resposta correta." : "Resposta incorreta."}</strong>
              {answer.id !== question.correctOptionId && correctOption ? ` A alternativa correta é “${correctOption.text}”.` : ""}
              {` ${question.explanation}`}
            </p>
          )}

          <div className="control-row quiz-actions">
            {currentIndex > 0 && (
              <button type="button" className="button button-secondary" onClick={() => showStep(currentIndex - 1)}>
                <ArrowLeft size={18} aria-hidden="true" />
                Pergunta anterior
              </button>
            )}
            {answer ? (
              <button type="button" className="button button-primary" onClick={() => showStep(currentIndex + 1)}>
                {currentIndex === questions.length - 1 ? "Ver resultado" : "Próxima pergunta"}
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            ) : (
              <button type="submit" className="button button-primary">Conferir resposta</button>
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
          <div className="quiz-concepts">
            <h4>Conceitos para revisar</h4>
            <ul>{concepts.map((concept) => <li key={concept}>{concept}</li>)}</ul>
            <Link href={`/revisao/#revisao-${lessonId}`}>Ir para a revisão rápida</Link>
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
