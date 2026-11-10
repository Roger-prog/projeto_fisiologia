const commandPhrases = {
  "next-step": ["próxima", "avançar", "próxima etapa", "etapa seguinte", "avançar etapa", "ir para a próxima etapa"],
  "previous-step": ["anterior", "voltar", "etapa anterior", "voltar uma etapa", "voltar para a etapa anterior"],
  "repeat-reading": ["repetir", "repetir explicação", "repetir a explicação", "explicar novamente", "ouvir de novo", "ouvir novamente", "repetir leitura"],
  "start-reading": ["ouvir", "ler", "ouvir etapa", "ouvir a etapa", "ler a etapa", "ouvir a aula", "iniciar leitura", "iniciar a leitura", "começar a leitura"],
  "continue-reading": ["continuar leitura", "continuar a leitura", "retomar leitura", "retomar a leitura"],
  "stop-reading": ["parar", "interromper", "parar leitura", "parar a leitura", "interromper leitura", "interromper a leitura", "parar áudio"],
  "start-quiz": ["exercícios", "fazer exercício", "fazer exercícios", "fazer os exercícios", "abrir exercícios", "começar os exercícios"],
  "resume-study": ["continuar estudando", "continuar estudo", "continuar o estudo", "continuar de onde parei", "continuar de onde parou", "retomar estudo", "retomar o estudo"],
  reviews: ["revisões", "minhas revisões", "abrir revisões", "abrir minhas revisões", "acessar revisões", "ir para minhas revisões"],
  help: ["ajuda", "preciso de ajuda", "pedir ajuda", "me ajude", "mostrar ajuda"],
  options: ["opções", "ouvir opções", "ouvir as opções", "ouvir minhas opções", "quais são as opções", "o que posso fazer", "comandos", "ouvir comandos", "quais comandos posso usar"],
  "end-session": ["encerrar voz", "encerrar sessão", "encerrar a sessão", "encerrar sessão de voz", "encerrar interação por voz", "desativar voz", "desativar interação por voz", "parar de escutar", "desligar microfone"],
  "confirm-answer": ["confirmar resposta", "confirmar a resposta", "conferir resposta", "conferir a resposta"],
  "next-question": ["próxima pergunta", "pergunta seguinte", "avançar pergunta", "próxima questão", "questão seguinte"],
  "previous-question": ["pergunta anterior", "questão anterior", "voltar pergunta", "voltar uma pergunta", "voltar para a pergunta anterior"],
  "read-question": ["ouvir pergunta", "ouvir a pergunta", "ler pergunta", "repetir pergunta", "repetir a pergunta", "ouvir alternativas", "ouvir pergunta e alternativas", "ouvir a pergunta e as alternativas"],
  "list-lessons": ["aulas", "listar aulas", "mostrar aulas", "ver aulas", "quais aulas", "quais são as aulas", "quais são as aulas disponíveis"],
  home: ["início", "ir para o início", "voltar ao início", "voltar para o início", "página inicial", "abrir página inicial"],
} as const;

type FixedCommandKind = keyof typeof commandPhrases;

export type VoiceCommand =
  | { [Kind in FixedCommandKind]: { kind: Kind } }[FixedCommandKind]
  | { kind: "open-lesson"; lessonId: string }
  | { kind: "select-option"; index: number };

type VoiceLesson = { id: string; title: string };

function normalizePhrase(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/^[\p{P}\s]+|[\p{P}\s]+$/gu, "")
    .replace(/[\s,]+/gu, " ");
}

const fixedCommands = new Map<string, FixedCommandKind>();
for (const kind of Object.keys(commandPhrases) as FixedCommandKind[]) {
  for (const phrase of commandPhrases[kind]) fixedCommands.set(normalizePhrase(phrase), kind);
}

const optionIndex = new Map([["a", 0], ["b", 1], ["be", 1], ["c", 2], ["ce", 2], ["d", 3], ["de", 3]]);
const optionCommand = /^(?:(?:escolher|escolha|selecionar|selecione|marcar|marque) (?:a )?)?(?:letra|alternativa|opcao|resposta) ([a-d]|be|ce|de)$/u;
const lessonPrefix = /^(?:(?:abrir|abra|escolher|escolha|ir para)(?: a)?(?: aula(?: de| sobre)?)?|aula(?: de| sobre)?|(?:quero )?estudar) /u;

function findLesson(phrase: string, lessons: readonly VoiceLesson[]) {
  const titles = lessons.map(({ id, title }) => ({ id, title: normalizePhrase(title) }));
  const exact = titles.filter(({ title }) => title === phrase);
  if (exact.length) return exact.length === 1 ? exact[0].id : undefined;

  const shortened = titles.filter(({ title }) => {
    const topic = title.replace(/^introducao (?:a|ao|as|aos) /u, "");
    return topic === phrase || topic.replace(/^sistema /u, "") === phrase;
  });
  return shortened.length === 1 ? shortened[0].id : undefined;
}

export function parseVoiceCommand(transcript: string, lessons: readonly VoiceLesson[]): VoiceCommand | null {
  const phrase = normalizePhrase(transcript);
  if (!phrase) return null;

  // Match whole phrases so negations and extra instructions cannot trigger a command.
  const kind = fixedCommands.get(phrase);
  if (kind) return { kind };

  const option = phrase.match(optionCommand);
  if (option) {
    const index = optionIndex.get(option[1]);
    return index === undefined ? null : { kind: "select-option", index };
  }

  const lessonName = phrase.replace(lessonPrefix, "");
  const lessonId = findLesson(lessonName, lessons);
  return lessonId ? { kind: "open-lesson", lessonId } : null;
}
