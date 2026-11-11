const commandPhrases = {
  "next-step": ["próxima", "avançar", "próxima etapa", "etapa seguinte", "avançar etapa", "ir para a próxima etapa", "pode continuar", "vamos para a próxima"],
  "previous-step": ["anterior", "etapa anterior", "voltar uma etapa", "voltar à etapa anterior", "voltar para a etapa anterior"],
  "repeat-reading": ["repetir", "repete", "repetir explicação", "repetir a explicação", "explicar novamente", "explica de novo", "fala novamente", "ouvir de novo", "ouvir novamente", "repetir leitura", "não entendi explica de novo"],
  "start-reading": ["ouvir", "ler", "ouvir etapa", "ouvir a etapa", "ler a etapa", "ouvir a aula", "iniciar leitura", "iniciar a leitura", "começar a leitura"],
  "continue-reading": ["continuar leitura", "continuar a leitura", "retomar leitura", "retomar a leitura"],
  "stop-reading": ["parar", "interromper", "parar leitura", "parar a leitura", "interromper leitura", "interromper a leitura", "parar áudio", "parar narração", "parar a narração"],
  "use-browser-voice": ["usar voz do navegador", "usar a voz do navegador", "ouvir com voz do navegador"],
  "start-quiz": ["exercícios", "fazer exercício", "fazer exercícios", "fazer os exercícios", "abrir exercícios", "começar os exercícios"],
  "reveal-review-answer": ["revelar resposta", "revelar a resposta", "mostrar resposta do cartão", "mostrar a resposta do cartão"],
  "resume-study": ["continuar", "continuar estudando", "continuar estudo", "continuar o estudo", "continuar de onde parei", "continuar de onde parou", "quero continuar estudando", "onde eu parei", "onde parei", "voltar à aula", "voltar para minha aula", "voltar para a minha aula", "retomar estudo", "retomar o estudo"],
  "list-modules": ["módulos", "listar módulos", "mostrar módulos", "ver módulos", "abrir módulos", "quais são os módulos"],
  "mode-complete": ["completo", "modo completo", "voltar para o modo completo", "quero a aula inteira", "quero ouvir a aula inteira", "aula inteira", "mostrar todo o conteúdo"],
  "mode-guided": ["guiado", "modo guiado", "passo a passo", "explica por partes", "explicar por partes", "quero estudar passo a passo"],
  "mode-review": ["revisão", "modo revisão", "modo de revisão", "quero revisar", "vamos fazer uma revisão", "fazer revisão"],
  reviews: ["revisões", "minhas revisões", "abrir revisões", "abrir minhas revisões", "acessar revisões", "ir para minhas revisões"],
  help: ["ajuda", "preciso de ajuda", "pedir ajuda", "me ajude", "mostrar ajuda"],
  options: ["opções", "ouvir opções", "ouvir as opções", "ouvir minhas opções", "quais são as opções", "quais são minhas opções", "o que posso fazer", "o que eu posso fazer", "não sei como continuar", "comandos", "ouvir comandos", "quais comandos posso usar"],
  "end-session": ["encerrar voz", "encerrar sessão", "encerrar a sessão", "encerrar sessão de voz", "encerrar interação por voz", "desativar voz", "desativar interação por voz", "parar de escutar", "desligar microfone"],
  "confirm-answer": ["confirmar resposta", "confirmar a resposta", "conferir resposta", "conferir a resposta"],
  "next-question": ["próxima pergunta", "pergunta seguinte", "avançar pergunta", "próxima questão", "questão seguinte"],
  "previous-question": ["pergunta anterior", "questão anterior", "voltar pergunta", "voltar uma pergunta", "voltar para a pergunta anterior"],
  "read-question": ["ouvir pergunta", "ouvir a pergunta", "ler pergunta", "repetir pergunta", "repetir a pergunta", "ouvir alternativas", "ouvir pergunta e alternativas", "ouvir a pergunta e as alternativas"],
  "list-lessons": ["aulas", "listar aulas", "mostrar aulas", "ver aulas", "quais aulas", "quais aulas tem", "quais são as aulas", "quais são as aulas disponíveis", "escolher aula", "escolher uma aula", "quero escolher uma matéria"],
  home: ["início", "ir para o início", "voltar ao início", "voltar para o início", "página inicial", "abrir página inicial"],
} as const;

type FixedCommandKind = keyof typeof commandPhrases;

export type VoiceCommand =
  | { [Kind in FixedCommandKind]: { kind: Kind } }[FixedCommandKind]
  | { kind: "open-lesson"; lessonId: string }
  | { kind: "open-module"; moduleId: string }
  | { kind: "select-option"; index: number }
  | { kind: "clarify-back" };

type VoiceItem = { id: string; title: string };
export type VoiceCommandContext = "home" | "modules" | "lesson" | "guided" | "quiz" | "review" | "other";
type InterpretationOptions = {
  modules?: readonly VoiceItem[];
  context?: VoiceCommandContext;
  clarification?: "back";
  confidence?: number;
};

export type VoiceInterpretation = {
  command: VoiceCommand | null;
  match: "exact" | "approximate" | "clarification" | "rejected";
  reason?: "empty" | "unknown" | "ambiguous" | "low-confidence" | "unavailable-context";
  alternatives: readonly VoiceCommand[];
  confidence?: number;
};

function normalizePhrase(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/^[\p{P}\s]+|[\p{P}\s]+$/gu, "")
    .replace(/[\s,.:;!?]+/gu, " ");
}

const fixedCommands = new Map<string, FixedCommandKind>();
for (const kind of Object.keys(commandPhrases) as FixedCommandKind[]) {
  for (const phrase of commandPhrases[kind]) fixedCommands.set(normalizePhrase(phrase), kind);
}

const optionIndex = new Map([["a", 0], ["b", 1], ["be", 1], ["c", 2], ["ce", 2], ["d", 3], ["de", 3]]);
const optionCommand = /^(?:(?:escolher|escolha|selecionar|selecione|marcar|marque) (?:a )?)?(?:letra|alternativa|opcao|resposta) ([a-d]|be|ce|de)$/u;
const namedPrefix = /^(?:(?:quero )?(?:abrir|abra|escolher|escolha|ir para|estudar) )?(?:(?:[ao] )?(?:(aula|modulo)(?: de| do| sobre)? )|(?:[ao] ))?/u;
const navigationContexts = new Set<VoiceCommandContext>(["lesson", "guided", "quiz", "review"]);
const ambiguousBack = new Set(["voltar", "quero voltar", "pode voltar", "volta"]);
const leaveLesson = new Set(["sair", "sair da aula", "sair da revisao", "segunda opcao", "segunda"]);
const previousChoice = new Set(["primeira opcao", "primeira", "voltar a etapa anterior"]);

const approximateKinds = new Set<FixedCommandKind>([
  "resume-study", "list-modules", "list-lessons", "mode-complete", "mode-guided", "mode-review",
  "next-step", "previous-step", "repeat-reading", "help", "options",
]);
const approximatePhrases = [...fixedCommands].filter(([, kind]) => approximateKinds.has(kind));

function oneEditApart(input: string, target: string) {
  if (input === target || Math.abs(input.length - target.length) > 1 || input.split(" ").length !== target.split(" ").length) return false;
  let prefix = 0;
  while (prefix < input.length && input[prefix] === target[prefix]) prefix += 1;
  const inputRest = input.slice(prefix);
  const targetRest = target.slice(prefix);
  if (input.length < target.length) return inputRest === targetRest.slice(1);
  if (input.length > target.length) return inputRest.slice(1) === targetRest;
  return inputRest.slice(1) === targetRest.slice(1)
    || (inputRest[0] === targetRest[1] && inputRest[1] === targetRest[0] && inputRest.slice(2) === targetRest.slice(2));
}

function aliases(title: string, moduleId?: string) {
  const topic = title.replace(/^introducao (?:a|ao|as|aos) /u, "");
  const shortTopic = topic.replace(/^sistema /u, "");
  const common = moduleId === "cardiovascular" ? ["coracao"] : moduleId === "respiratorio" ? ["respiracao", "pulmao", "pulmoes"] : [];
  return [...new Set([topic, shortTopic, ...common])].filter((name) => name !== title);
}

function uniqueCommands(commands: readonly VoiceCommand[]) {
  const keyed = new Map(commands.map((command) => [JSON.stringify(command), command]));
  return [...keyed.values()];
}

function namedMatches(phrase: string, lessons: readonly VoiceItem[], modules: readonly VoiceItem[], approximate: boolean) {
  const prefix = phrase.match(namedPrefix);
  const name = phrase.slice(prefix?.[0].length ?? 0);
  const category = prefix?.[1];
  const lessonEntries = category === "modulo" ? [] : lessons.map(({ id, title }) => ({
    title: normalizePhrase(title), command: { kind: "open-lesson", lessonId: id } as const,
  }));
  const moduleEntries = category === "aula" ? [] : modules.map(({ id, title }) => ({
    title: normalizePhrase(title), command: { kind: "open-module", moduleId: id } as const,
  }));
  const matches = (target: string) => approximate
    ? target.length >= 6 && oneEditApart(name, target)
    : name === target;
  const entries = [...lessonEntries, ...moduleEntries];
  const fullTitles = entries.filter(({ title }) => matches(title));
  if (fullTitles.length) return fullTitles.map(({ command }) => command);
  const shortened = entries.flatMap(({ title, command }) => {
    const moduleId = command.kind === "open-module" ? command.moduleId : undefined;
    return aliases(title, moduleId).filter(matches).map((alias) => ({ alias, command }));
  });
  const moduleAliases = new Set(shortened.flatMap(({ alias, command }) => command.kind === "open-module" ? [alias] : []));
  return shortened
    .filter(({ alias, command }) => command.kind === "open-module" || !moduleAliases.has(alias))
    .map(({ command }) => command);
}

export function interpretVoiceCommand(
  transcript: string,
  lessons: readonly VoiceItem[],
  { modules = [], context = "other", clarification, confidence: rawConfidence }: InterpretationOptions = {},
): VoiceInterpretation {
  const phrase = normalizePhrase(transcript);
  const confidence = typeof rawConfidence === "number" && rawConfidence >= 0 && rawConfidence <= 1 ? rawConfidence : undefined;
  const weakConfidence = confidence !== undefined && confidence < 0.45;
  function result(command: VoiceCommand | null, match: VoiceInterpretation["match"], reason?: VoiceInterpretation["reason"], alternatives: readonly VoiceCommand[] = []): VoiceInterpretation {
    return { command, match, ...(reason ? { reason } : {}), alternatives, ...(confidence !== undefined ? { confidence } : {}) };
  }

  if (!phrase) return result(null, "rejected", "empty");

  if (ambiguousBack.has(phrase)) {
    return navigationContexts.has(context)
      ? result({ kind: "clarify-back" }, "clarification", "ambiguous", [{ kind: "previous-step" }, { kind: "list-modules" }])
      : result(null, "rejected", "unavailable-context");
  }
  if (clarification === "back" && previousChoice.has(phrase)) return result({ kind: "previous-step" }, "exact");
  if (
    (clarification === "back" && leaveLesson.has(phrase))
    || (navigationContexts.has(context) && (phrase === "sair da aula" || phrase === "sair da revisao"))
  ) return result({ kind: "list-modules" }, "exact");

  // Selection and confirmation must match whole phrases and never enter approximate matching.
  const kind = fixedCommands.get(phrase);
  if (kind === "confirm-answer" || (phrase === "confirmar" && (context === "quiz" || context === "review"))) {
    return weakConfidence ? result(null, "rejected", "low-confidence") : result({ kind: "confirm-answer" }, "exact");
  }
  if (kind) return result({ kind }, "exact");

  const option = phrase.match(optionCommand);
  if (option) {
    const index = optionIndex.get(option[1]);
    if (weakConfidence) return result(null, "rejected", "low-confidence");
    if (index !== undefined) return result({ kind: "select-option", index }, "exact");
  }

  const exact = uniqueCommands(namedMatches(phrase, lessons, modules, false));
  if (exact.length === 1) return result(exact[0], "exact");
  if (exact.length > 1) return result(null, "rejected", "ambiguous", exact);

  if (phrase.length < 6 || /\b(?:nao|nunca|nem|sem|confirmar|conferir|alternativa|letra|opcao|resposta)\b/u.test(phrase)) {
    return result(null, "rejected", "unknown");
  }

  const approximate = uniqueCommands([
    ...approximatePhrases.filter(([alias]) => alias.length >= 6 && oneEditApart(phrase, alias)).map(([, commandKind]) => ({ kind: commandKind })),
    ...namedMatches(phrase, lessons, modules, true),
  ]);
  if (!approximate.length) return result(null, "rejected", "unknown");
  if (approximate.length > 1) return result(null, "rejected", "ambiguous", approximate);
  if (weakConfidence) return result(null, "rejected", "low-confidence", approximate);
  return result(approximate[0], "approximate", undefined, approximate);
}

export function parseVoiceCommand(transcript: string, lessons: readonly VoiceItem[], options?: InterpretationOptions): VoiceCommand | null {
  return interpretVoiceCommand(transcript, lessons, options).command;
}
