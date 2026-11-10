import type { Question, ReviewCard } from "../types";

export const respiratoryQuestions: readonly Question[] = [
  {
    id: "resp-diafragma",
    concept: "Inspiração e diafragma",
    sectionId: "inspiracao",
    prompt: "O que acontece quando o diafragma se contrai durante a inspiração?",
    options: [
      { id: "sobe", text: "O diafragma sobe e o volume torácico diminui." },
      { id: "fixo", text: "O diafragma permanece imóvel e o volume torácico diminui." },
      { id: "desce", text: "O diafragma desce e o volume torácico aumenta." },
      { id: "desce-volume-cai", text: "O diafragma desce e o volume torácico diminui." },
    ],
    correctOptionId: "desce",
    explanation: "Ao contrair, o diafragma fica mais plano e desce em direção ao abdome. Isso aumenta a dimensão vertical do tórax e favorece a expansão pulmonar.",
    supplement: "Visualize a cúpula do diafragma achatando em direção ao abdome. O espaço disponível dentro do tórax aumenta, os pulmões se expandem e a pressão alveolar cai brevemente abaixo da atmosférica.",
  },
  {
    id: "resp-fluxo-entrada",
    concept: "Pressões e fluxo de ar",
    sectionId: "fluxo-e-resistencia",
    prompt: "Com as vias aéreas abertas, que relação de pressões faz o ar entrar nos pulmões?",
    options: [
      { id: "alv-menor", text: "Pressão alveolar menor que a atmosférica." },
      { id: "alv-maior", text: "Pressão alveolar maior que a atmosférica." },
      { id: "alv-igual", text: "Pressão alveolar igual à atmosférica." },
      { id: "pleural-isolada", text: "Pressão intrapleural negativa, qualquer que seja a pressão alveolar." },
    ],
    correctOptionId: "alv-menor",
    explanation: "O ar flui da maior pressão para a menor. Na inspiração espontânea, a pressão do ar atmosférico supera a dos alvéolos e impulsiona a entrada.",
    supplement: "Para prever o sentido do ar nas vias aéreas, compare as pressões no ambiente e nos alvéolos, que são as duas extremidades desse caminho. A pressão intrapleural participa da expansão pulmonar e fica fora do trajeto do ar.",
  },
  {
    id: "resp-expiracao-tranquila",
    concept: "Expiração e recuo elástico",
    sectionId: "expiracao",
    prompt: "Qual mecanismo predomina na expiração tranquila?",
    options: [
      { id: "abdominais", text: "Contração intensa dos músculos abdominais." },
      { id: "diafragma", text: "Contração mantida do diafragma." },
      { id: "pressao-igual", text: "Igualdade contínua entre as pressões alveolar e atmosférica." },
      { id: "recuo", text: "Relaxamento dos músculos inspiratórios e recuo elástico do sistema respiratório." },
    ],
    correctOptionId: "recuo",
    explanation: "O recuo elástico reduz o volume pulmonar depois que os músculos inspiratórios relaxam. A pressão alveolar então supera temporariamente a atmosférica e o ar sai.",
    supplement: "Os pulmões distendidos acumulam energia elástica durante a inspiração. No repouso, o relaxamento dos músculos inspiratórios permite que parte dessa energia impulsione a saída de ar. Na expiração forçada, músculos como os abdominais podem contribuir.",
  },
  {
    id: "resp-fim-da-inspiracao",
    concept: "Pressões e fluxo de ar",
    sectionId: "inspiracao",
    prompt: "No fim de uma inspiração tranquila, o fluxo de ar para. O que explica isso?",
    options: [
      { id: "alv-maior", text: "A pressão alveolar permanece acima da atmosférica durante toda a inspiração." },
      { id: "equilibrio", text: "As pressões alveolar e atmosférica se igualam naquele instante." },
      { id: "pleural-positiva", text: "A pressão intrapleural passa obrigatoriamente a ser positiva." },
      { id: "colapso", text: "Os alvéolos voltam ao menor volume do ciclo." },
    ],
    correctOptionId: "equilibrio",
    explanation: "Com as vias abertas, o fluxo cessa quando deixa de existir diferença de pressão entre alvéolos e ambiente. O pulmão ainda está expandido e a pressão intrapleural segue abaixo da atmosférica.",
    supplement: "Um pulmão pode estar mais expandido sem receber ar naquele instante. O volume depende da distensão pulmonar. O fluxo pelas vias abertas depende da diferença instantânea entre a pressão alveolar e a atmosférica.",
  },
  {
    id: "resp-resistencia",
    concept: "Pressões e fluxo de ar",
    sectionId: "fluxo-e-resistencia",
    prompt: "Se a resistência das vias aéreas aumenta e a diferença de pressão se mantém, o que acontece com a magnitude do fluxo?",
    options: [
      { id: "aumenta", text: "Aumenta." },
      { id: "iguala", text: "Permanece igual." },
      { id: "diminui", text: "Diminui." },
      { id: "inverte", text: "Inverte de sentido sem mudar de magnitude." },
    ],
    correctOptionId: "diminui",
    explanation: "Para a mesma diferença de pressão, uma via mais resistente permite menor fluxo. O sentido continua sendo determinado por qual extremidade tem maior pressão.",
    supplement: "Compare duas vias submetidas ao mesmo gradiente. Pela via mais estreita, a resistência tende a ser maior e passa menos ar por unidade de tempo. Para obter o mesmo fluxo, seria preciso aumentar a magnitude do gradiente.",
  },
];

export const respiratoryReview: readonly ReviewCard[] = [
  {
    id: "revisao-resp-diafragma",
    prompt: "Em que direção se move o diafragma quando se contrai?",
    answer: "Ele desce em direção ao abdome e aumenta a dimensão vertical do tórax.",
  },
  {
    id: "revisao-resp-gradiente",
    prompt: "Quais pressões você compara para prever o sentido do fluxo pelas vias aéreas?",
    answer: "A pressão atmosférica e a alveolar. O ar se move da região de maior pressão para a de menor pressão.",
  },
  {
    id: "revisao-resp-transpulmonar",
    prompt: "Como se calcula a pressão que distende o pulmão?",
    answer: "Subtraia a pressão intrapleural da pressão alveolar. O resultado é a pressão transpulmonar.",
  },
];
