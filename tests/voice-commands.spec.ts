import { expect, test } from "@playwright/test";
import { lessons } from "../src/data";
import { parseVoiceCommand, type VoiceCommand } from "../src/lib/voice-commands";

test("interpreta variações curtas de comandos em português brasileiro", () => {
  const exemplos: readonly [string, VoiceCommand][] = [
    ["   PRÓXIMA    ETAPA! ", { kind: "next-step" }],
    ["Avançar", { kind: "next-step" }],
    ["próxima", { kind: "next-step" }],
    ["Etapa anterior.", { kind: "previous-step" }],
    ["Explicar novamente", { kind: "repeat-reading" }],
    ["Repetir", { kind: "repeat-reading" }],
    ["Ouvir a etapa", { kind: "start-reading" }],
    ["Continuar a leitura", { kind: "continue-reading" }],
    ["Parar leitura", { kind: "stop-reading" }],
    ["Usar a voz do navegador", { kind: "use-browser-voice" }],
    ["Fazer exercícios", { kind: "start-quiz" }],
    ["Continuar de onde parei", { kind: "resume-study" }],
    ["Minhas Revisões", { kind: "reviews" }],
    ["Preciso de ajuda", { kind: "help" }],
    ["Ouvir minhas opções", { kind: "options" }],
    ["Desligar microfone", { kind: "end-session" }],
    ["Confirmar a resposta!", { kind: "confirm-answer" }],
    ["Conferir resposta", { kind: "confirm-answer" }],
    ["Próxima questão", { kind: "next-question" }],
    ["Voltar uma pergunta", { kind: "previous-question" }],
    ["Ouvir pergunta e alternativas", { kind: "read-question" }],
    ["Listar aulas", { kind: "list-lessons" }],
    ["Voltar ao início", { kind: "home" }],
    ["Escolher a alternativa A", { kind: "select-option", index: 0 }],
    ["Letra B", { kind: "select-option", index: 1 }],
    ["ALTERNATIVA, BÊ.", { kind: "select-option", index: 1 }],
    ["Marque opção C", { kind: "select-option", index: 2 }],
    ["Opção Dê", { kind: "select-option", index: 3 }],
    ["Abrir aula de mecânica respiratória", { kind: "open-lesson", lessonId: "mecanica-respiratoria" }],
    ["Aula de Mecânica Respiratória", { kind: "open-lesson", lessonId: "mecanica-respiratoria" }],
    ["Introdução ao Sistema Cardiovascular", { kind: "open-lesson", lessonId: "introducao-ao-sistema-cardiovascular" }],
    ["Quero estudar cardiovascular", { kind: "open-lesson", lessonId: "introducao-ao-sistema-cardiovascular" }],
  ];

  for (const [frase, resultado] of exemplos) {
    expect(parseVoiceCommand(frase, lessons), frase).toEqual(resultado);
  }
});

test("rejeita negativas, trechos soltos e comandos misturados", () => {
  for (const frase of [
    "Não avance", "não, próxima etapa", "alternativa B não", "Letra E", "b",
    "alternativa B e confirmar resposta", "confirmar resposta, não", "confirmar resposta. próxima etapa",
    "se eu disser confirmar resposta", "não confirmar resposta", "sim", "confirmar", "confirma",
    "Não usar voz do navegador", "usar voz do navegador e avançar",
    "abrir qualquer aula", "abrir aula de física", "um comentário sobre o assunto", "  ...  ",
  ]) {
    expect(parseVoiceCommand(frase, lessons), frase).toBeNull();
  }
});

test("não escolhe uma aula quando seu nome curto identifica mais de uma", () => {
  const catalogo = [
    { id: "introducao", title: "Introdução ao Sistema Cardiovascular" },
    { id: "sistema", title: "Sistema Cardiovascular" },
  ];

  expect(parseVoiceCommand("abrir cardiovascular", catalogo)).toBeNull();
  expect(parseVoiceCommand("abrir Sistema Cardiovascular", catalogo)).toEqual({ kind: "open-lesson", lessonId: "sistema" });
});
