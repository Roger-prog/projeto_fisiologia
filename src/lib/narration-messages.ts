export const narrationMessages = {
  "boas-vindas": "Bem-vindo ao FisioAcessível.",
  "retomar": "Vamos continuar sua última aula.",
  "resposta-correta": "Resposta correta.",
  "revisar": "Vamos revisar esse conceito.",
  "proxima-etapa": "Próxima etapa.",
  "comando-desconhecido": "Não consegui entender o comando.",
  "ajuda-comando": "Diga Ajuda para ouvir as opções.",
} as const;

export type NarrationMessage = keyof typeof narrationMessages;
