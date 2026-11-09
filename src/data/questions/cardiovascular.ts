import type { Question, ReviewCard } from "../types";

export const cardiovascularQuestions: readonly Question[] = [
  {
    id: "cardio-sentido-arteria",
    prompt: "Por que as artérias pulmonares recebem esse nome mesmo transportando sangue com menos oxigênio?",
    options: [
      { id: "volume", text: "Porque carregam mais sangue do que as veias pulmonares." },
      { id: "sentido", text: "Porque levam sangue do coração aos pulmões." },
      { id: "oxigenacao", text: "Porque aumentam o teor de oxigênio do sangue em suas paredes." },
      { id: "retorno", text: "Porque levam sangue dos pulmões de volta ao coração." },
    ],
    correctOptionId: "sentido",
    explanation: "Artérias conduzem sangue para fora do coração. As pulmonares levam o sangue ejetado pelo ventrículo direito aos pulmões, antes das trocas gasosas.",
  },
  {
    id: "cardio-percurso-pulmonar",
    prompt: "Qual percurso representa o circuito pulmonar completo?",
    options: [
      { id: "sistemico", text: "Ventrículo esquerdo, aorta, tecidos e átrio direito." },
      { id: "veias-primeiro", text: "Ventrículo direito, veias pulmonares, pulmões e átrio esquerdo." },
      { id: "pulmonar", text: "Ventrículo direito, artérias pulmonares, pulmões, veias pulmonares e átrio esquerdo." },
      { id: "aorta-primeiro", text: "Ventrículo esquerdo, aorta, pulmões e átrio direito." },
    ],
    correctOptionId: "pulmonar",
    explanation: "O ventrículo direito ejeta sangue no tronco pulmonar, que se divide nas artérias pulmonares. Após atravessar os capilares pulmonares, o sangue retorna ao átrio esquerdo pelas veias pulmonares.",
  },
  {
    id: "cardio-resistencia-local",
    prompt: "Qual tipo de vaso ajusta diretamente a resistência ao fluxo que entra em uma rede capilar?",
    options: [
      { id: "arteriola", text: "Arteríola." },
      { id: "venula", text: "Vênula." },
      { id: "veia-cava", text: "Veia cava." },
      { id: "capilar", text: "Capilar." },
    ],
    correctOptionId: "arteriola",
    explanation: "As arteríolas têm músculo liso em sua parede. Ao contrair ou relaxar esse músculo, elas modificam o diâmetro do vaso e regulam a resistência ao fluxo que chega aos capilares.",
  },
  {
    id: "cardio-valva-aortica",
    prompt: "Qual valva o sangue atravessa para sair do ventrículo esquerdo e entrar na aorta?",
    options: [
      { id: "mitral", text: "Valva mitral." },
      { id: "pulmonar", text: "Valva pulmonar." },
      { id: "tricuspide", text: "Valva tricúspide." },
      { id: "aortica", text: "Valva aórtica." },
    ],
    correctOptionId: "aortica",
    explanation: "A valva aórtica separa o ventrículo esquerdo da aorta e abre durante a ejeção. A mitral permite a passagem anterior, do átrio esquerdo ao ventrículo esquerdo.",
  },
  {
    id: "cardio-oferta-oxigenio",
    prompt: "Se o sangue mantém o mesmo conteúdo de oxigênio, o que aumenta a quantidade de oxigênio entregue por minuto a um músculo?",
    options: [
      { id: "menos-fluxo", text: "A redução do fluxo de sangue para esse músculo." },
      { id: "mais-fluxo", text: "O aumento do fluxo de sangue para esse músculo." },
      { id: "mesmo-fluxo", text: "A manutenção do mesmo fluxo de sangue para esse músculo." },
      { id: "fluxo-outro-tecido", text: "O aumento do fluxo em outro órgão, mantendo constante o fluxo no músculo." },
    ],
    correctOptionId: "mais-fluxo",
    explanation: "Se cada volume de sangue carrega a mesma quantidade de oxigênio, enviar mais sangue por minuto aumenta a oferta local de oxigênio.",
  },
];

export const cardiovascularReview: readonly ReviewCard[] = [
  {
    id: "revisao-cardio-circuitos",
    prompt: "Em qual ventrículo começa cada circuito?",
    answer: "O pulmonar começa no ventrículo direito e o sistêmico começa no ventrículo esquerdo.",
  },
  {
    id: "revisao-cardio-vasos",
    prompt: "Quais vasos ligam as artérias às veias, na ordem do fluxo?",
    answer: "Arteríolas, capilares e vênulas. As arteríolas chegam à rede de troca e as vênulas recolhem o sangue que sai dela.",
  },
  {
    id: "revisao-cardio-oxigenio",
    prompt: "Para onde se difunde o oxigênio nos pulmões e nos tecidos?",
    answer: "Nos pulmões, do ar alveolar para o sangue. Nos tecidos, do sangue para o meio que cerca as células e então para as células.",
  },
];
