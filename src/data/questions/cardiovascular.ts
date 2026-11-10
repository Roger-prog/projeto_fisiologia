import type { Question, ReviewCard } from "../types";

export const cardiovascularQuestions: readonly Question[] = [
  {
    id: "cardio-sentido-arteria",
    concept: "Tipos e funções dos vasos",
    sectionId: "vasos-sanguineos",
    prompt: "Por que as artérias pulmonares recebem esse nome mesmo transportando sangue com menos oxigênio?",
    options: [
      { id: "volume", text: "Porque carregam mais sangue do que as veias pulmonares." },
      { id: "sentido", text: "Porque levam sangue do coração aos pulmões." },
      { id: "oxigenacao", text: "Porque aumentam o teor de oxigênio do sangue em suas paredes." },
      { id: "retorno", text: "Porque levam sangue dos pulmões de volta ao coração." },
    ],
    correctOptionId: "sentido",
    explanation: "Artérias conduzem sangue para fora do coração. As pulmonares levam o sangue ejetado pelo ventrículo direito aos pulmões, antes das trocas gasosas.",
    supplement: "Para classificar o vaso, siga a direção do fluxo em relação ao coração. A aorta e as artérias pulmonares saem de ventrículos diferentes, enquanto as veias pulmonares chegam a um átrio. O teor de oxigênio muda conforme o circuito.",
  },
  {
    id: "cardio-percurso-pulmonar",
    concept: "Circulação pulmonar",
    sectionId: "circuito-pulmonar",
    prompt: "Qual percurso representa o circuito pulmonar completo?",
    options: [
      { id: "sistemico", text: "Ventrículo esquerdo, aorta, tecidos e átrio direito." },
      { id: "veias-primeiro", text: "Ventrículo direito, veias pulmonares, pulmões e átrio esquerdo." },
      { id: "pulmonar", text: "Ventrículo direito, artérias pulmonares, pulmões, veias pulmonares e átrio esquerdo." },
      { id: "aorta-primeiro", text: "Ventrículo esquerdo, aorta, pulmões e átrio direito." },
    ],
    correctOptionId: "pulmonar",
    explanation: "O ventrículo direito ejeta sangue no tronco pulmonar, que se divide nas artérias pulmonares. Após atravessar os capilares pulmonares, o sangue retorna ao átrio esquerdo pelas veias pulmonares.",
    supplement: "Use dois pontos de referência. O sangue sai do ventrículo direito pela valva pulmonar e retorna ao átrio esquerdo. Entre esses pontos, os capilares junto aos alvéolos são o local das trocas gasosas.",
  },
  {
    id: "cardio-resistencia-local",
    concept: "Tipos e funções dos vasos",
    sectionId: "vasos-sanguineos",
    prompt: "Qual tipo de vaso ajusta diretamente a resistência ao fluxo que entra em uma rede capilar?",
    options: [
      { id: "arteriola", text: "Arteríola." },
      { id: "venula", text: "Vênula." },
      { id: "veia-cava", text: "Veia cava." },
      { id: "capilar", text: "Capilar." },
    ],
    correctOptionId: "arteriola",
    explanation: "As arteríolas têm músculo liso em sua parede. Ao contrair ou relaxar esse músculo, elas modificam o diâmetro do vaso e regulam a resistência ao fluxo que chega aos capilares.",
    supplement: "Imagine dois leitos capilares em paralelo. Se uma arteríola se dilata, diminui a resistência na entrada do leito que ela alimenta. Mantido o gradiente de pressão, a passagem de sangue por esse caminho aumenta.",
  },
  {
    id: "cardio-valva-aortica",
    concept: "Circulação sistêmica e valvas",
    sectionId: "circuito-sistemico",
    prompt: "Qual valva o sangue atravessa para sair do ventrículo esquerdo e entrar na aorta?",
    options: [
      { id: "mitral", text: "Valva mitral." },
      { id: "pulmonar", text: "Valva pulmonar." },
      { id: "tricuspide", text: "Valva tricúspide." },
      { id: "aortica", text: "Valva aórtica." },
    ],
    correctOptionId: "aortica",
    explanation: "A valva aórtica separa o ventrículo esquerdo da aorta e abre durante a ejeção. A mitral permite a passagem anterior, do átrio esquerdo ao ventrículo esquerdo.",
    supplement: "Percorra o lado esquerdo do coração em duas passagens. O enchimento do ventrículo ocorre pela mitral. Na ejeção, a pressão ventricular supera a aórtica, abrindo a valva aórtica e permitindo a saída de sangue.",
  },
  {
    id: "cardio-oferta-oxigenio",
    concept: "Oferta de oxigênio aos tecidos",
    sectionId: "oxigenacao-dos-tecidos",
    prompt: "Se o sangue mantém o mesmo conteúdo de oxigênio, o que aumenta a quantidade de oxigênio entregue por minuto a um músculo?",
    options: [
      { id: "menos-fluxo", text: "A redução do fluxo de sangue para esse músculo." },
      { id: "mais-fluxo", text: "O aumento do fluxo de sangue para esse músculo." },
      { id: "mesmo-fluxo", text: "A manutenção do mesmo fluxo de sangue para esse músculo." },
      { id: "fluxo-outro-tecido", text: "O aumento do fluxo em outro órgão, mantendo constante o fluxo no músculo." },
    ],
    correctOptionId: "mais-fluxo",
    explanation: "Se cada volume de sangue carrega a mesma quantidade de oxigênio, enviar mais sangue por minuto aumenta a oferta local de oxigênio.",
    supplement: "A oferta local é o produto do fluxo sanguíneo pelo conteúdo arterial de oxigênio. Se o conteúdo por litro se mantém e chegam mais litros por minuto, aumenta a quantidade de oxigênio entregue por minuto. O consumo do tecido também depende de quanto ele extrai.",
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
