"use client";

import { useRef } from "react";
import type { Question } from "@/data";
import { optionLetter, voiceQuestionText } from "@/lib/voice-question";
import { useVoiceActions } from "./voice-provider";

type QuestionVoiceOptions = {
  question: Question | undefined;
  isActive: () => boolean;
  answered: boolean;
  onSelect: (optionId: string) => void;
  onConfirm: (optionId: string) => boolean;
  confirmation: string;
};

export function useVoiceQuestion({ question, isActive, answered, onSelect, onConfirm, confirmation }: QuestionVoiceOptions) {
  const pending = useRef<{ questionId: string; optionId: string } | null>(null);
  function clearVoiceChoice() {
    pending.current = null;
  }

  useVoiceActions((command) => {
    if (command.kind === "session-ended") {
      clearVoiceChoice();
      return;
    }
    if (!question || !isActive()) return;

    if (command.kind === "read-question" || command.kind === "start-reading" || command.kind === "repeat-reading") {
      return {
        message: voiceQuestionText(question),
      };
    }
    if (command.kind !== "select-option" && command.kind !== "confirm-answer") return;
    if (answered) return { message: "Esta pergunta já foi conferida." };

    if (command.kind === "select-option") {
      const option = question.options[command.index];
      if (!option) return { message: "Essa alternativa não está disponível nesta pergunta." };

      pending.current = { questionId: question.id, optionId: option.id };
      onSelect(option.id);
      return {
        message: `Alternativa ${optionLetter(command.index)} selecionada. ${option.text} Diga confirmar resposta para registrar.`,
      };
    }

    const choice = pending.current;
    clearVoiceChoice();
    if (choice?.questionId !== question.id) {
      return { message: "Escolha uma alternativa por voz antes de confirmar a resposta." };
    }
    if (!onConfirm(choice.optionId)) return { message: "A resposta já foi registrada." };

    const correct = choice.optionId === question.correctOptionId;
    return {
      message: `${confirmation} ${correct ? "Resposta correta." : "Resposta incorreta."} ${question.explanation}`,
      clips: correct ? ["resposta-correta"] : ["revisar"],
      speechText: correct ? `${confirmation} ${question.explanation}` : `${confirmation} Resposta incorreta. ${question.explanation}`,
    };
  });

  return clearVoiceChoice;
}
