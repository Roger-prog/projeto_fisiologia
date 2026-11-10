"use client";

import { useRef } from "react";
import type { Question } from "@/data";
import {
  explanationNarration, fixedNarration, narratedMessage, questionNarration, selectedOptionNarration,
} from "@/lib/narration-messages";
import { useVoiceActions } from "./voice-provider";

type QuestionVoiceOptions = {
  question: Question | undefined;
  isActive: () => boolean;
  answered: boolean;
  onSelect: (optionId: string) => void;
  onConfirm: (optionId: string) => boolean;
  confirmation: "resposta-registrada" | "resposta-conferida";
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
      return narratedMessage(questionNarration(question));
    }
    if (command.kind !== "select-option" && command.kind !== "confirm-answer") return;
    if (answered) return narratedMessage(fixedNarration("pergunta-conferida"));

    if (command.kind === "select-option") {
      const option = question.options[command.index];
      if (!option) return narratedMessage(fixedNarration("alternativa-indisponivel"));

      pending.current = { questionId: question.id, optionId: option.id };
      onSelect(option.id);
      return narratedMessage(selectedOptionNarration(question, command.index), fixedNarration("confirmar-alternativa"));
    }

    const choice = pending.current;
    clearVoiceChoice();
    if (choice?.questionId !== question.id) {
      return narratedMessage(fixedNarration("escolher-alternativa"));
    }
    if (!onConfirm(choice.optionId)) return narratedMessage(fixedNarration("ja-registrada"));

    const correct = choice.optionId === question.correctOptionId;
    const verdict = fixedNarration(correct ? "resposta-correta" : "resposta-incorreta");
    return narratedMessage(
      fixedNarration(confirmation),
      verdict,
      ...(correct ? [] : [fixedNarration("revisar")]),
      explanationNarration(question),
    );
  });

  return clearVoiceChoice;
}
