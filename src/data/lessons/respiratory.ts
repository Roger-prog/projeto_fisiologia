import { respiratoryQuestions, respiratoryReview } from "../questions/respiratory";
import type { Lesson } from "../types";

export const respiratoryLesson: Lesson = {
  id: "mecanica-respiratoria",
  moduleId: "respiratorio",
  title: "Mecânica Respiratória",
  objective:
    "Ao final desta aula, você será capaz de prever o sentido do fluxo de ar a partir das pressões e explicar como o diafragma, a pleura e o recuo elástico produzem a ventilação em repouso.",
  introduction:
    "Ao inspirar, o ar entra porque surge uma diferença de pressão entre o ambiente e os alvéolos. Para entender de onde ela vem, vamos acompanhar três mudanças ao longo de um ciclo respiratório: a posição do diafragma, o volume pulmonar e as pressões que fazem o ar se mover.",
  sections: [
    {
      id: "ventilacao",
      title: "O que a ventilação faz",
      paragraphs: [
        "Ventilar é mover ar para dentro e para fora dos pulmões. Parte do ar inspirado renova o ar dos alvéolos, ajudando a manter as diferenças de pressão parcial que permitem a passagem de oxigênio para o sangue e de dióxido de carbono para o ar alveolar.",
        "A ventilação é o deslocamento de uma mistura de gases pelas vias aéreas. Na troca gasosa, cada gás se difunde separadamente através da barreira entre os alvéolos e o sangue. As duas etapas dependem de diferenças de pressão, mas a primeira envolve a pressão total do ar e a segunda envolve as pressões parciais de cada gás.",
      ],
    },
    {
      id: "pressoes",
      title: "Três pressões em lugares diferentes",
      paragraphs: [
        "A pressão atmosférica é a do ar ao redor do corpo. Nesta aula, ela é a referência zero. A pressão alveolar é a pressão do ar dentro dos alvéolos. Quando ela fica abaixo de zero nessa escala, está apenas um pouco abaixo da pressão atmosférica.",
        "A pressão intrapleural é a pressão no espaço estreito entre a pleura que recobre o pulmão e a pleura que reveste a parede torácica. Uma fina camada de líquido facilita o deslizamento das pleuras e ajuda a transmitir os movimentos da parede ao pulmão. Em repouso, o pulmão tende a retrair para dentro e a parede torácica tende a expandir para fora ao fim de uma expiração tranquila. Essa oposição contribui para que a pressão intrapleural fique abaixo da atmosférica.",
        "A pressão transpulmonar é a pressão alveolar menos a pressão intrapleural. Essa diferença distende o pulmão. Se a pressão intrapleural cair mais do que a alveolar, a diferença aumenta e favorece a expansão. Já o sentido do fluxo de ar depende da comparação entre pressão alveolar e atmosférica.",
      ],
    },
    {
      id: "inspiracao",
      title: "Na inspiração, o diafragma desce",
      paragraphs: [
        "O diafragma se contrai, fica mais plano e desce, aumentando a dimensão vertical do tórax. Os intercostais externos também podem contribuir, elevando as costelas. Com a expansão torácica, a pressão intrapleural diminui e os pulmões se expandem.",
        "O aumento de volume reduz temporariamente a pressão alveolar abaixo da atmosférica. O ar entra pelas vias aéreas, da maior pressão para a menor. No fim da inspiração, as pressões alveolar e atmosférica voltam a se igualar e o fluxo cessa por um instante, com o pulmão ainda expandido.",
      ],
    },
    {
      id: "expiracao",
      title: "Na expiração tranquila, o pulmão recua",
      paragraphs: [
        "Ao relaxar, o diafragma retorna em direção ao tórax, recuperando sua forma de cúpula. O recuo elástico do sistema respiratório diminui o volume pulmonar e eleva temporariamente a pressão alveolar acima da atmosférica. O ar sai, e o fluxo cessa quando as duas pressões se igualam ao fim da expiração.",
        "Durante a expiração tranquila, a pressão intrapleural retorna a um valor menos negativo, permanecendo abaixo da atmosférica. A saída de ar em repouso depende principalmente do recuo elástico. Já em uma expiração forçada, músculos abdominais e parte dos intercostais internos podem contrair e ajudar a reduzir o volume torácico.",
      ],
    },
    {
      id: "fluxo-e-resistencia",
      title: "Como prever o fluxo de ar",
      paragraphs: [
        "Com as vias aéreas abertas, compare primeiro a pressão alveolar com a do ambiente. Pressão alveolar menor indica entrada de ar. Pressão alveolar maior indica saída. Quando elas são iguais, o fluxo pelas vias aéreas é zero nesse modelo, mesmo que a pressão intrapleural continue negativa.",
        "A diferença de pressão e a resistência das vias aéreas determinam a intensidade do fluxo. Em um modelo simples, o fluxo em direção aos alvéolos é a pressão atmosférica menos a alveolar, dividida pela resistência. Se uma via aérea se estreita e a diferença de pressão permanece igual, a resistência aumenta e a magnitude do fluxo diminui.",
      ],
    },
  ],
  terms: [
    { term: "Ventilação pulmonar", definition: "Movimento de ar para dentro e para fora dos pulmões." },
    { term: "Diafragma", definition: "Músculo em forma de cúpula entre tórax e abdome. Ao contrair, desce e aumenta o volume do tórax." },
    { term: "Pressão alveolar", definition: "Pressão do ar dentro dos alvéolos." },
    { term: "Pressão intrapleural", definition: "Pressão no espaço estreito entre as pleuras visceral e parietal." },
    { term: "Pressão transpulmonar", definition: "Pressão alveolar menos pressão intrapleural. É a diferença que distende o pulmão." },
    { term: "Recuo elástico", definition: "Tendência de uma estrutura distendida a voltar a um volume menor quando a força de distensão diminui." },
  ],
  figure: {
    src: "/diagrams/mecanica-ventilatoria.svg",
    alt: "Comparação entre a entrada e a saída de ar na respiração tranquila, com setas para o fluxo e o deslocamento do diafragma.",
    title: "Inspiração e expiração em repouso",
    description:
      "À esquerda, durante a inspiração, o diafragma está contraído e mais baixo. Os pulmões estão se expandindo, a pressão intrapleural fica mais negativa e a pressão alveolar fica abaixo da atmosférica. Uma seta para baixo na via aérea indica entrada de ar. À direita, durante a expiração, o diafragma está relaxado e mais alto. Os pulmões diminuem de volume, a pressão intrapleural retorna a um valor menos negativo e a pressão alveolar fica acima da atmosférica. Uma seta para cima indica saída de ar. Quando as pressões alveolar e atmosférica se igualam na transição entre as fases, o fluxo é zero.",
    creditId: "mecanica-ventilatoria",
  },
  summary: [
    "A ventilação move o ar pelas vias aéreas e renova parte do ar alveolar.",
    "Na inspiração, o diafragma desce, o tórax se expande e a pressão intrapleural fica mais negativa.",
    "A pressão alveolar cai abaixo da atmosférica durante a entrada de ar e sobe acima dela durante a saída.",
    "Na expiração tranquila, os músculos inspiratórios relaxam e o recuo elástico reduz o volume pulmonar.",
    "A pressão transpulmonar distende o pulmão. A diferença entre pressão alveolar e atmosférica impulsiona o fluxo de ar.",
  ],
  questions: respiratoryQuestions,
  quickReview: respiratoryReview,
  referenceIds: ["openstax-pulmoes", "openstax-ventilacao", "openstax-trocas"],
};
