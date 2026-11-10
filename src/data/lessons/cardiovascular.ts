import { cardiovascularQuestions, cardiovascularReview } from "../questions/cardiovascular";
import type { Lesson } from "../types";

export const cardiovascularLesson: Lesson = {
  id: "introducao-ao-sistema-cardiovascular",
  moduleId: "cardiovascular",
  title: "Introdução ao Sistema Cardiovascular",
  objective:
    "Ao final desta aula, você será capaz de descrever o percurso do sangue pelos dois circuitos, relacionar cada tipo de vaso à sua função e explicar como a circulação sustenta a oferta de oxigênio aos tecidos.",
  introduction:
    "Imagine acompanhar uma hemácia que acabou de deixar os capilares de um músculo da perna. Ela passa pelo coração, atravessa os pulmões, volta ao coração e então pode seguir para outro tecido. Vamos reconstruir esse percurso e entender o que muda em cada trecho.",
  introductionSummary: "A mesma hemácia passa pelos pulmões e pelos tecidos em uma volta completa, impulsionada pelas duas metades do coração.",
  sections: [
    {
      id: "bomba-e-rede",
      title: "O coração impulsiona o sangue pela rede vascular",
      objective: "Distinguir o papel dos átrios, dos ventrículos e das valvas no bombeamento do sangue.",
      paragraphs: [
        "O coração gera diferenças de pressão que impulsionam o sangue por uma rede fechada de vasos. O sangue leva oxigênio, nutrientes e outras substâncias aos tecidos, recolhe produtos do metabolismo e ajuda a distribuir calor pelo corpo.",
        "Cada lado do coração tem um átrio que recebe sangue e um ventrículo que o ejeta. O ventrículo direito alimenta o circuito pulmonar e o esquerdo alimenta o sistêmico. As valvas abrem e fecham conforme as diferenças de pressão entre suas faces, favorecendo o fluxo em um sentido e limitando o refluxo.",
      ],
      summary: "Átrios recebem o sangue, ventrículos o ejetam e as valvas limitam o refluxo.",
      example: {
        title: "Do número de batimentos ao volume bombeado",
        formula: {
          visual: "DC = FC × VS",
          spoken: "Débito cardíaco é igual à frequência cardíaca multiplicada pelo volume sistólico.",
        },
        paragraphs: [
          "Se um ventrículo ejeta 70 mililitros a cada batimento e o coração bate 80 vezes por minuto, o ventrículo bombeia 5.600 mililitros por minuto, ou 5,6 litros por minuto. São valores escolhidos para ilustrar a relação entre as grandezas.",
          "O volume sistólico é o volume ejetado por batimento. Em uma pessoa, ele pode variar junto com a frequência. Por isso, medir só a frequência não basta para determinar o débito cardíaco.",
        ],
      },
    },
    {
      id: "vasos-sanguineos",
      title: "O papel de cada tipo de vaso",
      objective: "Ordenar os vasos no sentido do fluxo e relacionar sua estrutura à função.",
      paragraphs: [
        "As artérias conduzem sangue para fora do coração. As grandes artérias elásticas se distendem durante a ejeção e devolvem parte da energia armazenada entre os batimentos, ajudando a manter o fluxo. Artérias menores distribuem sangue às regiões do corpo. As arteríolas, seus ramos finos com músculo liso, ajustam a resistência ao fluxo que chega a cada rede capilar.",
        "Nos capilares, uma parede muito fina e uma ampla área de contato favorecem as trocas entre o sangue e o meio ao redor. As vênulas recolhem o sangue dos capilares e convergem em veias, que o conduzem de volta ao coração. Muitas veias dos membros têm valvas. Durante o movimento, a compressão dessas veias pelos músculos ajuda a impulsionar o sangue em direção ao coração.",
        "Artéria e veia são nomes definidos pelo sentido do fluxo em relação ao coração. Por isso, as artérias pulmonares continuam sendo artérias mesmo quando conduzem sangue com menos oxigênio, e as veias pulmonares continuam sendo veias mesmo quando transportam sangue com mais oxigênio.",
      ],
      summary: "A sequência é artérias, arteríolas, capilares, vênulas e veias. As arteríolas ajustam a resistência, enquanto as trocas ocorrem principalmente nos capilares.",
    },
    {
      id: "circuito-pulmonar",
      title: "Circuito pulmonar, do ventrículo direito ao átrio esquerdo",
      objective: "Seguir o sangue pelo lado direito do coração e pelos pulmões até o átrio esquerdo.",
      paragraphs: [
        "O sangue que volta da maior parte do corpo chega pelas veias cavas ao átrio direito. Passa pela valva tricúspide e entra no ventrículo direito. Na ejeção, atravessa a valva pulmonar, segue pelo tronco pulmonar e pelas artérias pulmonares até os capilares próximos aos alvéolos.",
        "Nos pulmões, o oxigênio se difunde do ar alveolar para o sangue, onde se liga principalmente à hemoglobina das hemácias. O dióxido de carbono se difunde do sangue para o ar alveolar e pode sair na expiração. Depois das trocas, o sangue volta pelas veias pulmonares ao átrio esquerdo.",
      ],
      summary: "O sangue sai do ventrículo direito pelas artérias pulmonares, troca gases nos capilares pulmonares e volta pelas veias pulmonares ao átrio esquerdo.",
    },
    {
      id: "circuito-sistemico",
      title: "Circuito sistêmico, do ventrículo esquerdo ao átrio direito",
      objective: "Seguir o sangue do ventrículo esquerdo aos tecidos e descrever seu retorno ao átrio direito.",
      paragraphs: [
        "Do átrio esquerdo, o sangue passa pela valva mitral até o ventrículo esquerdo. Na ejeção, atravessa a valva aórtica e entra na aorta. O fluxo segue por artérias e arteríolas até as redes capilares dos órgãos. Depois passa por vênulas e veias, e o retorno da maior parte do corpo se reúne nas veias cavas antes de entrar no átrio direito.",
        "Os circuitos pulmonar e sistêmico estão em série. O sangue que sai de um passa pelo outro para fechar a volta. Em uma situação estável, os ventrículos bombeiam aproximadamente o mesmo volume por minuto em média. Como a resistência do circuito sistêmico é maior, o ventrículo esquerdo gera uma pressão de ejeção maior que o direito.",
      ],
      summary: "O sangue sai do ventrículo esquerdo para a aorta, percorre os vasos dos órgãos e retorna ao átrio direito pelas veias sistêmicas.",
    },
    {
      id: "oxigenacao-dos-tecidos",
      title: "Do pulmão à célula",
      objective: "Explicar como o fluxo sanguíneo e o conteúdo de oxigênio determinam a oferta de oxigênio a um tecido.",
      paragraphs: [
        "Em muitos tecidos, o consumo de oxigênio pelas células mantém sua pressão parcial mais baixa que a do sangue que chega. Parte do oxigênio se desprende da hemoglobina e atravessa a parede capilar até os tecidos. O dióxido de carbono produzido pelas células tende a seguir o caminho oposto, em direção ao sangue.",
        "A quantidade de oxigênio entregue por minuto a um tecido depende de quanto sangue chega e de quanto oxigênio esse sangue contém. Em um músculo ativo, por exemplo, a dilatação local de arteríolas pode aumentar o fluxo e, com isso, a oferta de oxigênio. A troca nos pulmões e a distribuição de fluxo nos tecidos são etapas complementares do mesmo percurso.",
      ],
      summary: "A oferta de oxigênio depende de quanto sangue passa pelo tecido a cada minuto e de quanto oxigênio esse sangue carrega.",
    },
  ],
  terms: [
    { term: "Átrio", definition: "Câmara que recebe sangue das veias e o encaminha ao ventrículo." },
    { term: "Ventrículo", definition: "Câmara que ejeta sangue para o tronco pulmonar ou para a aorta." },
    { term: "Artéria", definition: "Vaso que conduz sangue para fora do coração." },
    { term: "Arteríola", definition: "Pequeno ramo arterial que regula a resistência e o fluxo em direção aos capilares." },
    { term: "Capilar", definition: "Vaso microscópico de parede fina onde ocorrem trocas com o meio ao redor." },
    { term: "Vênula", definition: "Pequeno vaso que coleta sangue da rede capilar e o encaminha às veias." },
    { term: "Veia", definition: "Vaso que conduz sangue de volta ao coração." },
    { term: "Perfusão", definition: "Passagem de sangue pela rede vascular de um tecido ou órgão." },
  ],
  figure: {
    src: "/diagrams/circuitos-circulatorios.svg",
    width: 720,
    height: 444,
    alt: "Esquema com setas que ligam coração direito, pulmões, coração esquerdo e tecidos em uma volta completa.",
    title: "Circuitos pulmonar e sistêmico",
    description:
      "Comece no ventrículo direito. A seta que sobe pelas artérias pulmonares chega aos capilares pulmonares, onde o sangue recebe oxigênio e libera dióxido de carbono. Das veias pulmonares, a seta desce ao átrio esquerdo e passa pelo ventrículo esquerdo. Pela aorta e pelas artérias sistêmicas, o sangue segue aos capilares dos tecidos, onde entrega oxigênio e recebe dióxido de carbono. As veias sistêmicas fecham o percurso ao levar sangue ao átrio direito, de onde ele passa ao ventrículo direito.",
    descriptionSteps: [
      "Comece no átrio direito, na caixa à esquerda. A seta aponta para baixo, em direção ao ventrículo direito. O sangue atravessa a valva tricúspide nesse trecho.",
      "Do ventrículo direito, a seta sobe até a caixa dos capilares pulmonares. O sangue passa pela valva pulmonar, pelo tronco pulmonar e pelas artérias pulmonares. Nos capilares, o sangue recebe oxigênio e libera dióxido de carbono para o ar alveolar.",
      "A seta das veias pulmonares desce para o átrio esquerdo, na caixa à direita. De lá, uma seta aponta para o ventrículo esquerdo. O sangue passa pela valva mitral entre essas duas câmaras.",
      "A seta do ventrículo esquerdo desce até os capilares dos tecidos. O sangue atravessa a valva aórtica e segue pela aorta, pelas artérias e pelas arteríolas. Nos capilares, entrega oxigênio aos tecidos e recebe dióxido de carbono.",
      "A última seta volta dos capilares dos tecidos ao átrio direito. Ela representa o retorno por vênulas e veias sistêmicas. O sangue da maior parte do corpo chega pelas veias cavas e o percurso recomeça.",
    ],
    creditId: "circuitos-circulatorios",
    sectionId: "circuito-pulmonar",
  },
  simulation: {
    sectionId: "bomba-e-rede",
    href: "/simulacoes/frequencia-cardiaca/",
    label: "Simular frequência cardíaca",
  },
  summary: [
    "Átrios recebem sangue e ventrículos o ejetam. As valvas favorecem o fluxo em um sentido.",
    "Artérias saem do coração, arteríolas distribuem o fluxo, capilares fazem trocas, vênulas recolhem o sangue e veias o trazem de volta.",
    "O circuito pulmonar vai do ventrículo direito ao átrio esquerdo e permite a troca de gases nos pulmões.",
    "O circuito sistêmico vai do ventrículo esquerdo ao átrio direito e distribui sangue aos tecidos.",
    "A oferta de oxigênio a um tecido depende tanto da perfusão quanto do conteúdo de oxigênio do sangue.",
  ],
  questions: cardiovascularQuestions,
  quickReview: cardiovascularReview,
  referenceIds: ["openstax-coracao", "openstax-fisiologia-cardiaca", "openstax-vasos", "openstax-trocas"],
};
