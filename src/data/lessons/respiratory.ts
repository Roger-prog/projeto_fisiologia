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
  introductionSummary: "Para explicar a entrada ou a saída de ar, acompanhe o movimento do diafragma, o volume dos pulmões e a diferença de pressão em relação ao ambiente.",
  sections: [
    {
      id: "ventilacao",
      title: "O que a ventilação faz",
      objective: "Diferenciar o deslocamento de ar pelas vias aéreas da difusão de gases nos alvéolos.",
      paragraphs: [
        "Ventilar é mover ar para dentro e para fora dos pulmões. Parte do ar inspirado renova o ar dos alvéolos, ajudando a manter as diferenças de pressão parcial que permitem a passagem de oxigênio para o sangue e de dióxido de carbono para o ar alveolar.",
        "A ventilação é o deslocamento de uma mistura de gases pelas vias aéreas. Na troca gasosa, cada gás se difunde separadamente através da barreira entre os alvéolos e o sangue. As duas etapas dependem de diferenças de pressão, mas a primeira envolve a pressão total do ar e a segunda envolve as pressões parciais de cada gás.",
      ],
      summary: "A ventilação move ar pelas vias aéreas. Na troca gasosa, oxigênio e dióxido de carbono se difundem pela barreira entre o alvéolo e o sangue.",
    },
    {
      id: "pressoes",
      title: "Três pressões em lugares diferentes",
      objective: "Localizar as pressões atmosférica, alveolar e intrapleural e calcular a pressão transpulmonar.",
      paragraphs: [
        "A pressão atmosférica é a do ar ao redor do corpo. Nesta aula, ela é a referência zero. A pressão alveolar é a pressão do ar dentro dos alvéolos. Quando ela fica abaixo de zero nessa escala, está apenas um pouco abaixo da pressão atmosférica.",
        "A pressão intrapleural é a pressão no espaço estreito entre a pleura que recobre o pulmão e a pleura que reveste a parede torácica. Uma fina camada de líquido facilita o deslizamento das pleuras e ajuda a transmitir os movimentos da parede ao pulmão. Em repouso, o pulmão tende a retrair para dentro e a parede torácica tende a expandir para fora ao fim de uma expiração tranquila. Essa oposição contribui para que a pressão intrapleural fique abaixo da atmosférica.",
        "A pressão transpulmonar é a pressão alveolar menos a pressão intrapleural. Essa diferença distende o pulmão. Se a pressão intrapleural cair mais do que a alveolar, a diferença aumenta e favorece a expansão. Já o sentido do fluxo de ar depende da comparação entre pressão alveolar e atmosférica.",
      ],
      summary: "A pressão alveolar menos a intrapleural é a diferença que distende o pulmão. A pressão alveolar comparada à atmosférica indica o sentido do fluxo.",
      example: {
        title: "Expansão sem fluxo no fim da inspiração",
        formula: {
          visual: "Pₜₚ = Pₐₗᵥ − Pₚₗ",
          spoken: "Pressão transpulmonar é igual à pressão alveolar menos a pressão intrapleural.",
        },
        paragraphs: [
          "Considere um instante sem fluxo ao fim da inspiração. Tome a pressão atmosférica como zero e use valores ilustrativos de zero para a pressão alveolar e menos sete centímetros de água para a pressão intrapleural. A diferença transpulmonar é de sete centímetros de água.",
          "Nesse instante, a diferença transpulmonar distende o pulmão, mas a igualdade entre as pressões alveolar e atmosférica faz com que o ar deixe de entrar.",
        ],
      },
    },
    {
      id: "inspiracao",
      title: "Na inspiração, o diafragma desce",
      objective: "Relacionar a contração do diafragma à expansão pulmonar e à entrada de ar.",
      paragraphs: [
        "O diafragma se contrai, fica mais plano e desce, aumentando a dimensão vertical do tórax. Os intercostais externos também podem contribuir, elevando as costelas. Com a expansão torácica, a pressão intrapleural diminui e os pulmões se expandem.",
        "O aumento de volume reduz temporariamente a pressão alveolar abaixo da atmosférica. O ar entra pelas vias aéreas, da maior pressão para a menor. No fim da inspiração, as pressões alveolar e atmosférica voltam a se igualar e o fluxo cessa por um instante, com o pulmão ainda expandido.",
      ],
      summary: "A expansão torácica diminui a pressão intrapleural. O pulmão se expande e o ar entra enquanto a pressão alveolar está abaixo da atmosférica.",
    },
    {
      id: "expiracao",
      title: "Na expiração tranquila, o pulmão recua",
      objective: "Explicar o papel do relaxamento muscular e do recuo elástico na saída de ar.",
      paragraphs: [
        "Ao relaxar, o diafragma retorna em direção ao tórax, recuperando sua forma de cúpula. O recuo elástico do sistema respiratório diminui o volume pulmonar e eleva temporariamente a pressão alveolar acima da atmosférica. O ar sai, e o fluxo cessa quando as duas pressões se igualam ao fim da expiração.",
        "Durante a expiração tranquila, a pressão intrapleural retorna a um valor menos negativo, permanecendo abaixo da atmosférica. A saída de ar em repouso depende principalmente do recuo elástico. Já em uma expiração forçada, músculos abdominais e parte dos intercostais internos podem contrair e ajudar a reduzir o volume torácico.",
      ],
      summary: "O recuo elástico diminui o volume pulmonar. O ar sai enquanto a pressão alveolar está acima da atmosférica.",
    },
    {
      id: "fluxo-e-resistencia",
      title: "Como prever o fluxo de ar",
      objective: "Prever como a diferença de pressão e a resistência das vias aéreas afetam o fluxo.",
      paragraphs: [
        "Com as vias aéreas abertas, compare primeiro a pressão alveolar com a do ambiente. Pressão alveolar menor indica entrada de ar. Pressão alveolar maior indica saída. Quando elas são iguais, o fluxo pelas vias aéreas é zero nesse modelo, mesmo que a pressão intrapleural continue negativa.",
        "A diferença de pressão e a resistência das vias aéreas determinam a intensidade do fluxo. Em um modelo simples, o fluxo em direção aos alvéolos é a pressão atmosférica menos a alveolar, dividida pela resistência. Se uma via aérea se estreita e a diferença de pressão permanece igual, a resistência aumenta e a magnitude do fluxo diminui.",
      ],
      summary: "A diferença de pressão determina o sentido do fluxo. Para a mesma diferença, aumentar a resistência reduz a magnitude do fluxo.",
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
    width: 720,
    height: 438,
    alt: "Comparação entre a entrada e a saída de ar na respiração tranquila, com setas para o fluxo e o deslocamento do diafragma.",
    title: "Inspiração e expiração em repouso",
    description:
      "À esquerda, durante a inspiração, o diafragma está contraído e mais baixo. Os pulmões estão se expandindo, a pressão intrapleural fica mais negativa e a pressão alveolar fica abaixo da atmosférica. Uma seta para baixo na via aérea indica entrada de ar. À direita, durante a expiração, o diafragma está relaxado e mais alto. Os pulmões diminuem de volume, a pressão intrapleural retorna a um valor menos negativo e a pressão alveolar fica acima da atmosférica. Uma seta para cima indica saída de ar. Quando as pressões alveolar e atmosférica se igualam na transição entre as fases, o fluxo é zero.",
    descriptionSteps: [
      "Observe o quadro da inspiração, à esquerda. A linha abaixo dos pulmões representa o diafragma. A seta aponta para baixo porque, ao se contrair, o músculo fica mais plano e desce.",
      "O tórax se expande, a pressão intrapleural diminui e os pulmões aumentam de volume. A pressão alveolar fica temporariamente abaixo da atmosférica. A seta na via aérea aponta para os pulmões, indicando entrada de ar.",
      "No quadro da expiração, à direita, a linha do diafragma está mais arqueada. A seta aponta para cima porque o diafragma relaxado volta a uma posição mais alta. Os pulmões recuam e a pressão intrapleural fica menos negativa.",
      "Na expiração, a pressão alveolar supera temporariamente a atmosférica. A seta na via aérea aponta para fora dos pulmões. No fim de cada fase, a pressão alveolar se iguala à atmosférica e o fluxo cessa.",
    ],
    creditId: "mecanica-ventilatoria",
    sectionId: "inspiracao",
  },
  simulation: {
    sectionId: "inspiracao",
    href: "/simulacoes/mecanica-respiratoria/",
    label: "Simular mecânica respiratória",
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
