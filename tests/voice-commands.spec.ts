import { expect, test } from "@playwright/test";
import { lessons, modules } from "../src/data";
import { interpretVoiceCommand, parseVoiceCommand, type VoiceCommand } from "../src/lib/voice-commands";

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

test("reconhece formas naturais de retomar o estudo, escolher o modo e pedir ajuda", () => {
  const equivalentes: readonly [VoiceCommand, readonly string[]][] = [
    [{ kind: "resume-study" }, ["Continuar", "Onde eu parei?", "Voltar à aula", "Quero continuar estudando", "Voltar para minha aula"]],
    [{ kind: "mode-complete" }, ["Completo", "Quero a aula inteira", "Mostrar todo o conteúdo"]],
    [{ kind: "mode-guided" }, ["Guiado", "Passo a passo", "Explica por partes"]],
    [{ kind: "mode-review" }, ["Revisão", "Quero revisar", "Vamos fazer uma revisão"]],
    [{ kind: "next-step" }, ["Pode continuar", "Vamos para a próxima"]],
    [{ kind: "repeat-reading" }, ["Repete", "Fala novamente", "Não entendi, explica de novo"]],
    [{ kind: "options" }, ["O que eu posso fazer?", "Quais são minhas opções?", "Não sei como continuar."]],
    [{ kind: "reveal-review-answer" }, ["Revelar resposta", "Mostrar resposta do cartão"]],
  ];

  for (const [comando, frases] of equivalentes) {
    for (const frase of frases) expect(parseVoiceCommand(frase, lessons), frase).toEqual(comando);
  }
});

test("distingue a seleção de um módulo de uma aula específica", () => {
  const exemplos: readonly [string, VoiceCommand][] = [
    ["Mostrar módulos", { kind: "list-modules" }],
    ["Quais aulas tem?", { kind: "list-lessons" }],
    ["Quero escolher uma matéria", { kind: "list-lessons" }],
    ["Escolher aula", { kind: "list-lessons" }],
    ["Coração", { kind: "open-module", moduleId: "cardiovascular" }],
    ["Cardiovascular", { kind: "open-module", moduleId: "cardiovascular" }],
    ["Quero estudar o coração", { kind: "open-module", moduleId: "cardiovascular" }],
    ["Abrir módulo respiratório", { kind: "open-module", moduleId: "respiratorio" }],
    ["Abrir aula cardiovascular", { kind: "open-lesson", lessonId: "introducao-ao-sistema-cardiovascular" }],
    ["Introdução ao Sistema Cardiovascular", { kind: "open-lesson", lessonId: "introducao-ao-sistema-cardiovascular" }],
  ];
  for (const [frase, comando] of exemplos) {
    expect(parseVoiceCommand(frase, lessons, { modules }), frase).toEqual(comando);
  }
});

test("aceita um erro de transcrição apenas com uma intenção reversível e única", () => {
  const resultado = interpretVoiceCommand("Contiunar estudando", lessons, { confidence: 0.8 });
  expect(resultado).toEqual({
    command: { kind: "resume-study" },
    match: "approximate",
    alternatives: [{ kind: "resume-study" }],
    confidence: 0.8,
  });
  expect(parseVoiceCommand("Cardiovascuar", lessons, { modules })).toEqual({ kind: "open-module", moduleId: "cardiovascular" });
  expect(parseVoiceCommand("Abrir aula de Mecânica Respiratoriaa", lessons, { modules })).toEqual({
    kind: "open-lesson", lessonId: "mecanica-respiratoria",
  });
  expect(interpretVoiceCommand("Contiunar estudando", lessons, { confidence: 0.3 })).toMatchObject({
    command: null, match: "rejected", reason: "low-confidence",
  });
  expect(interpretVoiceCommand("Mecânica Senal", [
    { id: "renal", title: "Mecânica Renal" },
    { id: "venal", title: "Mecânica Venal" },
  ])).toMatchObject({
    command: null, match: "rejected", reason: "ambiguous",
    alternatives: [{ kind: "open-lesson", lessonId: "renal" }, { kind: "open-lesson", lessonId: "venal" }],
  });
});

test("pede esclarecimento para voltar e exige uma resposta inequívoca", () => {
  expect(interpretVoiceCommand("Quero voltar", lessons, { context: "guided" })).toEqual({
    command: { kind: "clarify-back" },
    match: "clarification",
    reason: "ambiguous",
    alternatives: [{ kind: "previous-step" }, { kind: "list-modules" }],
  });
  expect(interpretVoiceCommand("Voltar", lessons, { context: "home" })).toMatchObject({
    command: null, reason: "unavailable-context",
  });
  expect(parseVoiceCommand("Etapa anterior", lessons, { context: "guided", clarification: "back" })).toEqual({ kind: "previous-step" });
  expect(parseVoiceCommand("Sair da aula", lessons, { context: "guided", clarification: "back" })).toEqual({ kind: "list-modules" });
  expect(parseVoiceCommand("Segunda", lessons, { context: "guided" })).toBeNull();
});

test("não usa aproximação para selecionar ou confirmar respostas", () => {
  const context = "quiz";
  expect(parseVoiceCommand("Confirmar", lessons, { context })).toEqual({ kind: "confirm-answer" });
  expect(parseVoiceCommand("Confirmar", lessons, { context: "home" })).toBeNull();
  for (const frase of ["Confimar resposta", "Altenativa B", "Não, confirmar", "Sim, confirmar", "confirmar e próxima", "alternativa B e confirmar"]) {
    expect(parseVoiceCommand(frase, lessons, { context }), frase).toBeNull();
  }
  expect(parseVoiceCommand("Confirmar resposta", lessons, { context, confidence: 0.21 })).toBeNull();
});
