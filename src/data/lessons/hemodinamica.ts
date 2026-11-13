import type { Lesson } from "../types";

export const hemodinamicaLesson: Lesson = {
  id: "hemodinamica",
  moduleId: "cardiovascular",
  title: "Hemodinâmica: princípios físicos da circulação",
  objective: "Relacionar diferenças de pressão, resistência, diâmetro vascular, velocidade e complacência ao transporte de sangue pelos vasos.",
  introduction: "Na aula anterior, calculamos quanto sangue o coração bombeia por minuto. Agora vamos acompanhar esse sangue pelos vasos. A hemodinâmica estuda como pressão, fluxo, resistência e propriedades das paredes vasculares determinam a circulação. Vamos usar equações simples, sempre explicando o significado fisiológico e os limites de cada modelo.",
  introductionSummary: "O sangue circula impulsionado por diferenças de pressão; a resistência dos vasos e sua capacidade de se distender modificam o fluxo e a pressão.",
  sections: [
    {
      id: "gradiente-pressao",
      title: "Pressão, fluxo e resistência",
      objective: "Explicar por que o fluxo depende de uma diferença de pressão e da resistência oferecida pelo trajeto.",
      paragraphs: [
        "A pressão sanguínea representa a força exercida pelo sangue por unidade de área. O fluxo volumétrico, indicado pela letra Q, é a quantidade de sangue que atravessa uma seção do vaso em determinado tempo. Suas unidades podem ser mililitros por segundo ou litros por minuto. Pressão e fluxo não são a mesma grandeza.",
        "Em um modelo simplificado de escoamento médio, o fluxo é igual à diferença de pressão entre dois pontos, dividida pela resistência: Q igual a delta P dividido por R. Delta P significa pressão de entrada menos pressão de saída. Assim, um valor isolado de pressão não é suficiente para determinar o fluxo; precisamos conhecer também a pressão a jusante e a resistência.",
        "Imagine uma região cuja pressão de entrada seja 100 milímetros de mercúrio e a pressão de saída seja 20 milímetros de mercúrio. O gradiente é 80 milímetros de mercúrio. Se a resistência do trajeto for 20 milímetros de mercúrio por litro por minuto, o fluxo será de 4 litros por minuto. Esses números são didáticos e não descrevem um órgão específico.",
        "No organismo, o bombeamento é pulsátil e os vasos são distensíveis. Por isso, essa equação descreve uma relação média útil para interpretar a circulação, mas não substitui uma análise completa das ondas de pressão e do movimento do sangue durante cada batimento.",
      ],
      summary: "O fluxo médio cresce com o gradiente de pressão e diminui quando a resistência aumenta, desde que as demais condições permaneçam comparáveis.",
      example: {
        title: "Calculando o fluxo a partir da pressão",
        paragraphs: [
          "Dados: entrada com 100 milímetros de mercúrio, saída com 20 milímetros de mercúrio e resistência igual a 20 milímetros de mercúrio por litro por minuto. Primeiro calculamos a diferença: 100 menos 20, igual a 80. Depois dividimos 80 por 20 e obtemos 4 litros por minuto.",
        ],
        formula: {
          visual: "Q = ΔP / R = (100 − 20) / 20 = 4 L/min",
          spoken: "Fluxo é igual à diferença de pressão dividida pela resistência. Neste exemplo, cem menos vinte, dividido por vinte, resulta em quatro litros por minuto.",
        },
      },
    },
    {
      id: "poiseuille",
      title: "Raio do vaso e lei de Poiseuille",
      objective: "Relacionar raio, viscosidade e comprimento do vaso à resistência hidráulica.",
      paragraphs: [
        "Um tubo mais estreito dificulta a passagem de um fluido. Para um líquido newtoniano em fluxo laminar, atravessando um tubo cilíndrico rígido e de raio constante, a lei de Poiseuille relaciona o fluxo ao gradiente de pressão, ao raio, ao comprimento e à viscosidade. A resistência é proporcional à viscosidade e ao comprimento, e inversamente proporcional à quarta potência do raio.",
        "A expressão é: resistência igual a oito vezes a viscosidade vezes o comprimento, dividido por pi vezes o raio elevado à quarta potência. Se o raio cair à metade, mantendo as demais variáveis constantes, a resistência aumenta dezesseis vezes. Se a pressão disponível não mudar, o fluxo resultante cai para um dezesseis avos.",
        "As arteríolas possuem musculatura lisa capaz de alterar seu calibre rapidamente. Elas constituem um componente importante da resistência vascular sistêmica e da distribuição regional do sangue. Vasoconstrição tende a elevar a resistência de um segmento; vasodilatação tende a reduzi-la.",
        "O sangue não é um líquido perfeitamente newtoniano, os vasos são elásticos e ramificados, e o escoamento nem sempre é estacionário ou laminar. Portanto, o fator de dezesseis vezes descreve o modelo ideal de Poiseuille, não uma previsão exata para todo vaso vivo.",
      ],
      summary: "No modelo de Poiseuille, a resistência varia com um dividido pelo raio à quarta potência; pequenas mudanças de calibre podem ter grande efeito sobre o fluxo.",
      example: {
        title: "Metade do raio não significa metade do fluxo",
        paragraphs: [
          "Se um tubo ideal passa de raio 2 milímetros para raio 1 milímetro, sua resistência passa a ser dezesseis vezes maior. Sob o mesmo gradiente de pressão, um fluxo inicial de 160 mililitros por minuto cairia para 10 mililitros por minuto.",
        ],
        formula: {
          visual: "R = 8ηL / (πr⁴);  Rnovo / Rantigo = (2/1)⁴ = 16",
          spoken: "Resistência é oito vezes viscosidade vezes comprimento, dividido por pi vezes o raio à quarta potência. Quando o raio cai de dois para um, a razão das resistências é dois à quarta potência, isto é, dezesseis.",
        },
      },
    },
    {
      id: "serie-paralelo",
      title: "Vasos em série e em paralelo",
      objective: "Distinguir a organização dos vasos em sequência da organização dos territórios vasculares em paralelo.",
      paragraphs: [
        "Em uma associação em série, o sangue passa sucessivamente pelos segmentos. O mesmo fluxo médio atravessa cada segmento, e as quedas de pressão se somam. A resistência equivalente é a soma das resistências individuais: R total igual a R um mais R dois e assim por diante.",
        "Em caminhos em paralelo, o sangue dispõe de mais de uma rota entre pontos com pressões semelhantes. A diferença de pressão é a mesma em cada ramo, enquanto o fluxo total é a soma dos fluxos dos ramos. A resistência equivalente é menor que a de qualquer ramo considerado isoladamente.",
        "Boa parte dos órgãos da circulação sistêmica recebe sangue por trajetos em paralelo a partir da circulação arterial. Isso permite que o fluxo seja redistribuído entre territórios sem exigir o mesmo fluxo em todos eles. Dentro de um órgão, também existem vasos organizados em série e em paralelo.",
        "Por exemplo, duas resistências idênticas de 4 unidades, ligadas em série, resultam em 8 unidades. As mesmas resistências em paralelo resultam em 2 unidades. É uma analogia de circuito hidráulico, não uma descrição literal de dois vasos reais.",
      ],
      summary: "Série: fluxos iguais e resistências somadas. Paralelo: mesma diferença de pressão, fluxos somados e menor resistência equivalente.",
      example: {
        title: "Dois caminhos para o sangue",
        paragraphs: [
          "Dois ramos de resistência igual a 4 unidades, em paralelo, apresentam resistência equivalente de 2 unidades. Se fossem colocados um depois do outro, a resistência total seria 8 unidades.",
        ],
        formula: {
          visual: "Rsérie = R₁ + R₂;  1/Rparalelo = 1/R₁ + 1/R₂",
          spoken: "Em série, somamos as resistências. Em paralelo, um dividido pela resistência equivalente é igual à soma dos inversos das resistências dos ramos.",
        },
      },
    },
    {
      id: "area-velocidade",
      title: "Área transversal e velocidade do sangue",
      objective: "Explicar por que a velocidade média do sangue diminui na rede capilar, apesar do calibre pequeno de cada capilar.",
      paragraphs: [
        "Velocidade é distância percorrida por unidade de tempo; fluxo volumétrico é volume por unidade de tempo. Para um conjunto de seções atravessadas pelo mesmo fluxo médio, vale Q igual à velocidade média vezes a área transversal total. Portanto, se a área total aumenta, a velocidade média diminui.",
        "Cada capilar tem diâmetro muito pequeno, mas a quantidade de capilares organizados em paralelo é enorme. Somadas, suas áreas de corte transversal superam a área de corte da aorta. Assim, a velocidade média do sangue na rede capilar é muito menor do que na aorta, favorecendo o tempo disponível para as trocas com os tecidos.",
        "No retorno venoso, diversos pequenos vasos se reúnem em veias maiores. A área transversal total do conjunto diminui em relação à rede capilar, e a velocidade média pode voltar a aumentar. Isso não significa que cada molécula de sangue se mova sempre com uma velocidade constante: estamos comparando valores médios em diferentes regiões.",
        "Essa relação também é utilizada em medições de Engenharia Biomédica. Se conhecemos a área de uma seção e a velocidade média do sangue, podemos estimar o fluxo volumétrico. Um erro na área estimada produz erro no fluxo calculado.",
      ],
      summary: "Para o mesmo fluxo, maior área transversal total significa menor velocidade média. A rede capilar é lenta porque reúne muitos vasos em paralelo.",
      example: {
        title: "Comparação entre duas seções",
        paragraphs: [
          "Em um sistema ideal, suponha fluxo de 6 centímetros cúbicos por segundo. Em uma seção de 2 centímetros quadrados, a velocidade média é 3 centímetros por segundo. Em uma seção total de 12 centímetros quadrados, a velocidade média cai para 0,5 centímetro por segundo.",
        ],
        formula: {
          visual: "Q = v × A;  v = Q/A",
          spoken: "Fluxo volumétrico é velocidade média multiplicada pela área transversal. Portanto, velocidade média é fluxo dividido pela área.",
        },
      },
    },
    {
      id: "complacencia",
      title: "Complacência e armazenamento de volume",
      objective: "Relacionar distensibilidade das paredes vasculares às variações de pressão e volume.",
      paragraphs: [
        "A parede dos vasos não é rígida. Quando a pressão transmural aumenta, a parede pode se distender e acomodar mais sangue. A complacência vascular descreve a variação de volume obtida para uma determinada variação de pressão: complacência igual a delta V dividido por delta P.",
        "Em geral, veias são mais complacentes do que artérias e conseguem acomodar grandes volumes de sangue com alterações relativamente pequenas de pressão. As artérias elásticas também se distendem durante a ejeção ventricular e liberam parte da energia armazenada enquanto o coração relaxa, suavizando a oscilação do fluxo.",
        "Uma artéria menos complacente se expande menos para uma mesma mudança de pressão. Para uma mesma variação de volume, a pressão tende a variar mais quando a complacência é reduzida. Essa relação ajuda a compreender o comportamento das ondas de pressão, embora a pressão arterial real dependa de vários fatores simultâneos.",
        "Não confunda complacência com resistência. Resistência descreve a oposição ao fluxo; complacência descreve quanto o volume se altera diante de uma mudança de pressão. Um sistema vascular pode apresentar alterações nas duas propriedades.",
      ],
      summary: "Complacência indica quanto o volume muda por unidade de pressão. Veias acomodam muito volume, enquanto artérias elásticas ajudam a amortecer a pulsação.",
      example: {
        title: "Comparação de complacência",
        paragraphs: [
          "Um compartimento que aumenta 30 mililitros quando a pressão sobe 5 milímetros de mercúrio possui complacência de 6 mililitros por milímetro de mercúrio, nesse intervalo. Se outro aumenta apenas 10 mililitros sob a mesma variação, sua complacência é menor.",
        ],
        formula: {
          visual: "C = ΔV / ΔP = 30/5 = 6 mL/mmHg",
          spoken: "Complacência é variação de volume dividida pela variação de pressão. Trinta mililitros divididos por cinco milímetros de mercúrio resultam em seis mililitros por milímetro de mercúrio.",
        },
      },
    },
    {
      id: "controle-fluxo",
      title: "Resistência arteriolar e perfusão tecidual",
      objective: "Relacionar demanda metabólica, variações do calibre vascular e perfusão de um tecido.",
      paragraphs: [
        "Perfusão é a passagem de sangue pela microcirculação de um tecido. Um órgão precisa receber fluxo adequado à sua atividade metabólica, e esse fluxo depende tanto da pressão que o impulsiona quanto da resistência de seus vasos.",
        "As arteríolas regulam parte importante dessa resistência por contração ou relaxamento de sua musculatura lisa. Sinais locais associados ao metabolismo, a mecanismos miogênicos e ao endotélio podem alterar o calibre vascular. O sistema nervoso simpático e substâncias circulantes também participam da regulação, com efeitos que variam conforme o órgão.",
        "Durante a atividade muscular, por exemplo, a liberação de substâncias locais pode favorecer a dilatação das arteríolas nos músculos ativos e aumentar a distribuição de sangue para essa região. Esse ajuste não significa que todas as artérias do corpo se dilatam igualmente.",
        "A pressão arterial média e o fluxo de um órgão estão relacionados, mas não são equivalentes. Uma pressão relativamente conservada pode coexistir com perfusão inadequada se houver obstrução local ou alterações importantes da microcirculação.",
      ],
      summary: "A perfusão de cada tecido depende do gradiente de pressão e da resistência local; as arteríolas ajudam a adequar o fluxo às necessidades metabólicas.",
    },
    {
      id: "aplicacao-biomédica",
      title: "Aplicação na Engenharia Biomédica",
      objective: "Identificar quais grandezas são medidas e quais são estimadas em técnicas de monitoramento vascular.",
      paragraphs: [
        "Uma medida de pressão arterial obtida com manguito não informa diretamente o fluxo de sangue por um órgão. Da mesma forma, um sensor de frequência cardíaca mede batimentos por minuto, e não velocidade sanguínea ou resistência vascular. Para interpretar dados fisiológicos, precisamos distinguir a grandeza observada daquela que foi calculada a partir de um modelo.",
        "O ultrassom Doppler permite estimar velocidades do sangue. Com informações sobre a geometria do vaso e com hipóteses adequadas sobre a distribuição da velocidade, é possível estimar o fluxo. Erros na determinação do diâmetro ou do ângulo do feixe podem comprometer os resultados.",
        "Ao analisar uma medida, pergunte: qual foi a unidade registrada? O sensor mediu pressão, velocidade, volume ou fluxo? Houve calibração? O modelo considera fluxo pulsátil? Essas perguntas evitam confundir uma alteração no sinal instrumental com uma mudança fisiológica comprovada.",
        "Na próxima aula, aplicaremos pressão, resistência, perfusão e tempo de relaxamento à circulação que alimenta o próprio músculo cardíaco: a circulação coronariana.",
      ],
      summary: "Instrumentos medem variáveis específicas; estimativas de fluxo ou resistência exigem modelos, hipóteses e atenção às fontes de erro.",
    },
  ],
  terms: [
    { term: "Hemodinâmica", definition: "Estudo do movimento do sangue e das forças e propriedades vasculares que influenciam esse movimento." },
    { term: "Pressão", definition: "Força exercida por unidade de área; frequentemente medida em milímetros de mercúrio no sistema cardiovascular." },
    { term: "Gradiente de pressão (ΔP)", definition: "Diferença entre as pressões de entrada e de saída de um trajeto vascular." },
    { term: "Fluxo volumétrico (Q)", definition: "Volume de sangue que atravessa uma seção por unidade de tempo." },
    { term: "Resistência vascular (R)", definition: "Relação entre a diferença de pressão e o fluxo médio de um trajeto vascular." },
    { term: "Viscosidade", definition: "Propriedade que expressa a resistência interna de um fluido ao escoamento." },
    { term: "Lei de Poiseuille", definition: "Modelo de escoamento laminar em tubo cilíndrico que relaciona resistência, viscosidade, comprimento e raio." },
    { term: "Arteríolas", definition: "Pequenos vasos com musculatura lisa que contribuem fortemente para a regulação da resistência e do fluxo regional." },
    { term: "Área transversal total", definition: "Soma das áreas das seções dos vasos que conduzem fluxos em paralelo em determinado nível da circulação." },
    { term: "Complacência (C)", definition: "Variação do volume de um compartimento por unidade de variação de pressão." },
    { term: "Perfusão", definition: "Passagem de sangue pela circulação de um tecido ou órgão, possibilitando suprimento e trocas." },
    { term: "Fluxo laminar", definition: "Escoamento em camadas organizadas, sem a mistura intensa característica do escoamento turbulento." },
  ],
  summary: [
    "Fluxo é volume por tempo; pressão é força por área. Uma diferença de pressão impulsiona o sangue através de uma resistência.",
    "No modelo médio simplificado, Q = ΔP/R, e o valor da pressão isoladamente não determina o fluxo.",
    "Pela lei de Poiseuille, a resistência de um tubo ideal varia inversamente à quarta potência do raio; essa relação não é exata para todos os vasos vivos.",
    "Segmentos em série somam resistências; ramos em paralelo permitem dividir o fluxo e reduzir a resistência equivalente.",
    "Para um mesmo fluxo, a velocidade média diminui quando a área transversal total aumenta, como acontece na rede capilar.",
    "Complacência é ΔV/ΔP e não deve ser confundida com resistência ao fluxo.",
    "A perfusão depende da pressão, da resistência vascular local e dos mecanismos de regulação que ajustam o fluxo à demanda do tecido.",
  ],
  questions: [
    {
      id: "hd-fluxo-pressao", sectionId: "gradiente-pressao", concept: "Diferença de pressão e fluxo",
      prompt: "Dois segmentos têm o mesmo gradiente de pressão. Qual apresenta maior fluxo médio?",
      options: [
        { id: "a", text: "O de maior resistência." }, { id: "b", text: "O de menor resistência." },
        { id: "c", text: "Os dois sempre apresentam fluxo zero." }, { id: "d", text: "Não há relação entre resistência e fluxo." },
      ],
      correctOptionId: "b", explanation: "Pela relação Q = ΔP/R, para o mesmo gradiente de pressão, menor resistência corresponde a maior fluxo médio.",
      supplement: "Uma pressão de entrada elevada, por si só, não define o fluxo: a pressão de saída e a resistência também importam.",
    },
    {
      id: "hd-calculo-gradiente", sectionId: "gradiente-pressao", concept: "Cálculo do fluxo",
      prompt: "Em um modelo, a pressão de entrada é 90 milímetros de mercúrio, a de saída é 30 e a resistência é 15 milímetros de mercúrio por litro por minuto. Qual é o fluxo?",
      options: [
        { id: "a", text: "2 litros por minuto." }, { id: "b", text: "4 litros por minuto." },
        { id: "c", text: "6 litros por minuto." }, { id: "d", text: "60 litros por minuto." },
      ],
      correctOptionId: "b", explanation: "A diferença de pressão é 90 menos 30, igual a 60. Dividindo 60 por 15, o fluxo é 4 litros por minuto.",
      supplement: "Sempre confira se a resistência está expressa em unidades compatíveis com o fluxo desejado.",
    },
    {
      id: "hd-raio", sectionId: "poiseuille", concept: "Dependência do raio",
      prompt: "No modelo ideal de Poiseuille, o raio de um tubo cai pela metade e todas as demais condições permanecem constantes. O que ocorre com a resistência?",
      options: [
        { id: "a", text: "Diminui duas vezes." }, { id: "b", text: "Aumenta duas vezes." },
        { id: "c", text: "Aumenta dezesseis vezes." }, { id: "d", text: "Não se altera." },
      ],
      correctOptionId: "c", explanation: "A resistência é inversamente proporcional a r elevado à quarta potência. Reduzir o raio à metade aumenta a resistência por um fator de 2 elevado à quarta potência, igual a 16.",
      supplement: "O resultado é exato para o modelo ideal, mas não é uma regra quantitativa universal para vasos sanguíneos reais.",
    },
    {
      id: "hd-limites-modelo", sectionId: "poiseuille", concept: "Limites do modelo",
      prompt: "Por que a lei de Poiseuille precisa ser aplicada com cuidado à circulação real?",
      options: [
        { id: "a", text: "Porque o sangue não possui viscosidade." },
        { id: "b", text: "Porque todos os vasos são tubos rígidos e retos." },
        { id: "c", text: "Porque o sangue é sempre parado." },
        { id: "d", text: "Porque vasos são distensíveis, ramificados e recebem fluxo pulsátil." },
      ],
      correctOptionId: "d", explanation: "A lei pressupõe condições idealizadas. A circulação apresenta pulsação, distensibilidade, ramificações e propriedades reológicas complexas.",
      supplement: "Mesmo assim, a dependência forte do raio ajuda a compreender o papel das arteríolas.",
    },
    {
      id: "hd-paralelo", sectionId: "serie-paralelo", concept: "Resistências em paralelo",
      prompt: "Duas resistências iguais a 4 unidades são ligadas em paralelo. Qual é a resistência equivalente?",
      options: [
        { id: "a", text: "2 unidades." }, { id: "b", text: "4 unidades." },
        { id: "c", text: "8 unidades." }, { id: "d", text: "16 unidades." },
      ],
      correctOptionId: "a", explanation: "Um dividido pela resistência equivalente é 1/4 + 1/4 = 1/2. Portanto, a resistência equivalente é 2 unidades.",
      supplement: "Se os ramos estivessem em série, a resistência equivalente seria 8 unidades.",
    },
    {
      id: "hd-capilares", sectionId: "area-velocidade", concept: "Área e velocidade",
      prompt: "Por que a velocidade média do sangue é baixa na rede capilar?",
      options: [
        { id: "a", text: "Porque a rede capilar não recebe sangue." },
        { id: "b", text: "Porque a área transversal total de muitos capilares em paralelo é muito grande." },
        { id: "c", text: "Porque o sangue deixa de ocupar volume." },
        { id: "d", text: "Porque a velocidade independe do fluxo." },
      ],
      correctOptionId: "b", explanation: "Para o mesmo fluxo total, velocidade média = fluxo dividido pela área transversal total. Como a área capilar total é grande, a velocidade é baixa.",
      supplement: "Não confunda a área de um capilar isolado com a soma das áreas de todos os capilares em paralelo.",
    },
    {
      id: "hd-complacencia", sectionId: "complacencia", concept: "Cálculo de complacência",
      prompt: "Um compartimento aumenta 20 mililitros quando a pressão sobe 5 milímetros de mercúrio. Qual é a complacência nesse intervalo?",
      options: [
        { id: "a", text: "0,25 mililitro por milímetro de mercúrio." },
        { id: "b", text: "4 mililitros por milímetro de mercúrio." },
        { id: "c", text: "25 mililitros por milímetro de mercúrio." },
        { id: "d", text: "100 mililitros por milímetro de mercúrio." },
      ],
      correctOptionId: "b", explanation: "Complacência é 20 dividido por 5, igual a 4 mililitros por milímetro de mercúrio.",
      supplement: "Complacência descreve uma relação entre volume e pressão; resistência descreve a oposição ao fluxo.",
    },
    {
      id: "hd-perfusao", sectionId: "controle-fluxo", concept: "Perfusão regional",
      prompt: "Durante a atividade muscular, qual ajuste pode aumentar o fluxo para o músculo ativo?",
      options: [
        { id: "a", text: "Aumento obrigatório da resistência de suas arteríolas." },
        { id: "b", text: "Interrupção do gradiente de pressão." },
        { id: "c", text: "Dilatação local de arteríolas, diminuindo sua resistência." },
        { id: "d", text: "Fechamento de todos os capilares do músculo." },
      ],
      correctOptionId: "c", explanation: "A dilatação local das arteríolas diminui a resistência e favorece a perfusão quando há gradiente de pressão adequado.",
      supplement: "A regulação do fluxo depende de mecanismos locais, nervosos e circulantes que variam entre os órgãos.",
    },
    {
      id: "hd-medicao", sectionId: "aplicacao-biomédica", concept: "Interpretação instrumental",
      prompt: "Qual afirmação é correta sobre medir pressão arterial com um manguito?",
      options: [
        { id: "a", text: "O manguito mede diretamente o fluxo por cada órgão." },
        { id: "b", text: "O resultado é uma medida de pressão, não uma medida direta do fluxo tecidual." },
        { id: "c", text: "A medida dispensa qualquer interpretação fisiológica." },
        { id: "d", text: "A pressão e a velocidade sanguínea são a mesma grandeza." },
      ],
      correctOptionId: "b", explanation: "A pressão arterial informa sobre pressão; estimar perfusão ou fluxo requer dados adicionais e hipóteses adequadas.",
      supplement: "Doppler pode fornecer estimativas de velocidade, mas também exige cuidado ao estimar fluxo volumétrico.",
    },
  ],
  quickReview: [
    { id: "hd-revisao-1", prompt: "O que representa Q = ΔP/R?", answer: "Uma relação média simplificada: o fluxo volumétrico é o gradiente de pressão dividido pela resistência do trajeto." },
    { id: "hd-revisao-2", prompt: "Qual o efeito de reduzir à metade o raio de um tubo ideal de Poiseuille?", answer: "A resistência aumenta dezesseis vezes se comprimento, viscosidade e demais condições forem mantidos." },
    { id: "hd-revisao-3", prompt: "Como diferenciar vasos em série e em paralelo?", answer: "Em série, o fluxo atravessa os segmentos sucessivamente e as resistências se somam; em paralelo, o fluxo se divide entre ramos." },
    { id: "hd-revisao-4", prompt: "Por que a velocidade média é baixa nos capilares?", answer: "A rede capilar possui área transversal total elevada; para um mesmo fluxo total, a velocidade média é menor." },
    { id: "hd-revisao-5", prompt: "Qual a diferença entre complacência e resistência?", answer: "Complacência relaciona mudança de volume com mudança de pressão; resistência relaciona gradiente de pressão com fluxo." },
    { id: "hd-revisao-6", prompt: "O que o ultrassom Doppler estima diretamente?", answer: "O deslocamento Doppler permite estimar componentes da velocidade sanguínea; calcular fluxo volumétrico exige ainda área e hipóteses de medição." },
  ],
  referenceIds: ["openstax-vasos-fluxo", "openstax-vasos", "openstax-regulacao-vascular"],
};
