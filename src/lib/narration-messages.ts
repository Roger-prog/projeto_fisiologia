import type { Lesson, Question, ReviewCard } from "../data/types";
import type { LessonStep } from "./lesson-steps";
import { optionLetter, voiceQuestionText } from "./voice-question";

export const narrationMessages = {
  "boas-vindas": "Bem-vindo ao FisioAcessível.",
  "retomar": "Vamos continuar sua última aula.",
  "resposta-correta": "Resposta correta.",
  "revisar": "Vamos revisar esse conceito.",
  "proxima-etapa": "Próxima etapa.",
  "comando-desconhecido": "Não consegui entender o comando.",
  "ajuda-comando": "Diga Ajuda para ouvir as opções.",
  "etapa-anterior": "Etapa anterior.",
  "pagina-inicial": "Página inicial.",
  "minhas-revisoes": "Minhas Revisões.",
  "aguarde-pagina": "Aguarde a página abrir e repita o comando.",
  "comando-indisponivel": "Este comando não está disponível nesta tela. Diga Ajuda para ouvir as opções.",
  "reconhecimento-indisponivel": "O reconhecimento de voz está indisponível neste navegador. Use os controles da página para continuar.",
  "primeira-etapa": "Esta é a primeira etapa.",
  "ultima-etapa": "Esta é a última etapa. Diga Fazer exercícios para praticar.",
  "leitura-interrompida": "Leitura interrompida.",
  "iniciar-leitura": "Diga ouvir para iniciar a leitura.",
  "pergunta-conferida": "Esta pergunta já foi conferida.",
  "alternativa-indisponivel": "Essa alternativa não está disponível nesta pergunta.",
  "escolher-alternativa": "Escolha uma alternativa por voz antes de confirmar a resposta.",
  "ja-registrada": "A resposta já foi registrada.",
  "resposta-incorreta": "Resposta incorreta.",
  "resposta-registrada": "Resposta registrada.",
  "resposta-conferida": "Resposta conferida.",
  "confirmar-alternativa": "Diga confirmar resposta para registrar.",
  "resultado-exercicios": "Você chegou ao resultado dos exercícios.",
  "confirmar-antes-avancar": "Confirme a alternativa antes de avançar.",
  "primeira-pergunta": "Você já está na primeira pergunta.",
  "sem-fallback": "Nenhuma narração está aguardando troca de voz.",
  "ajuda-exercicios": "Exercícios. Diga Ouvir pergunta, escolha a letra e diga Confirmar resposta. Use Próxima pergunta para avançar.",
  "ajuda-etapa": "Diga Ouvir a etapa, Repetir ou Próxima etapa. Entre trechos, diga Continuar leitura ou Parar leitura.",
  "ajuda-etapa-final": "Diga Ouvir a etapa, Repetir ou Fazer exercícios. Entre trechos, diga Continuar leitura ou Parar leitura.",
  "ajuda-aula": "Aula completa. Diga Ouvir a aula, Fazer exercícios ou Continuar de onde parei. Entre trechos, diga Continuar leitura ou Parar leitura.",
  "ajuda-revisoes": "Você está nas revisões. Abra uma sessão pelos controles da página. Diga Ouvir pergunta para ler o item atual. Em uma pergunta, escolha a letra e diga Confirmar resposta.",
  "ajuda-inicio": "Você está na página inicial. Diga Continuar de onde parei, Listar aulas ou Minhas Revisões. Para encerrar, diga Encerrar voz.",
  "ajuda-modulos": "Você está nos módulos. Diga Continuar de onde parei, Listar aulas ou Minhas Revisões. Para encerrar, diga Encerrar voz.",
  "ajuda-geral": "Você está no FisioAcessível. Diga Continuar de onde parei, Listar aulas ou Minhas Revisões. Para encerrar, diga Encerrar voz.",
} as const;

export type NarrationMessage = keyof typeof narrationMessages;
export type NarrationLine = { id: string; text: string };

export function fixedNarration(key: NarrationMessage): NarrationLine {
  return { id: `interface/${key}`, text: narrationMessages[key] };
}

export function narratedMessage(...lines: NarrationLine[]) {
  return { message: lines.map(({ text }) => text).join(" "), clipIds: lines.map(({ id }) => id) };
}

export function lessonTitleNarration(lesson: Lesson): NarrationLine {
  return { id: `lesson/${lesson.id}/titulo/1`, text: `${lesson.title}.` };
}

export function stepLabelNarration(lesson: Lesson, step: LessonStep, index: number): NarrationLine {
  return { id: `interface/etapa/${lesson.id}/${step.id}`, text: `Etapa ${index + 1}. ${step.title}.` };
}

export function lessonListNarration(lessons: readonly Lesson[]): NarrationLine {
  return {
    id: "interface/listar-aulas",
    text: `Aulas disponíveis. ${lessons.map(({ title }) => title).join(". ")}. Diga Abrir aula e o nome da aula.`,
  };
}

export function exerciseTitleNarration(lesson: Lesson): NarrationLine {
  return { id: `interface/exercicios/${lesson.id}`, text: `Exercícios de ${lesson.title}.` };
}

export function questionNarration(question: Question): NarrationLine {
  return { id: `interface/pergunta/${question.id}/leitura`, text: voiceQuestionText(question) };
}

export function selectedOptionNarration(question: Question, index: number): NarrationLine {
  return {
    id: `interface/pergunta/${question.id}/alternativa-${index + 1}`,
    text: `Alternativa ${optionLetter(index)} selecionada. ${question.options[index].text}`,
  };
}

export function explanationNarration(question: Question): NarrationLine {
  return { id: `interface/pergunta/${question.id}/explicacao`, text: question.explanation };
}

export function questionNumberNarration(number: number): NarrationLine {
  return { id: `interface/numero-pergunta/${number}`, text: `Pergunta ${number}. Diga ler pergunta para ouvir.` };
}

export function exerciseResultNarration(correct: number, total: number): NarrationLine {
  return {
    id: `interface/resultado/${total}/${correct}`,
    text: `Exercícios concluídos. ${correct} de ${total} respostas corretas.`,
  };
}

export function reviewCardNarration(card: ReviewCard, revealed: boolean): NarrationLine {
  return {
    id: `interface/cartao/${card.id}/${revealed ? "resposta" : "pergunta"}`,
    text: revealed ? card.answer : card.prompt,
  };
}
