import type { Lesson } from "../types";

export const regulacaoPressaoArterialLesson: Lesson = {
  id: "regulacao-da-pressao-arterial",
  moduleId: "cardiovascular",
  title: "Regulação da pressão arterial",
  objective:
    "Explicar como mecanismos nervosos, renais e hormonais regulam a pressão arterial em diferentes escalas de tempo, relacionando suas respostas à perfusão dos tecidos.",
  introduction:
    "Nas aulas anteriores, estudamos o bombeamento cardíaco, o débito e a resistência dos vasos. Nesta aula, vamos reunir esses conceitos para responder a uma pergunta: como o organismo consegue manter a circulação quando uma pessoa se levanta, faz exercício ou perde líquido? A regulação da pressão não depende de um único órgão. Coração, vasos, sistema nervoso, rins e hormônios trabalham de maneira integrada. Vamos percorrer cada mecanismo em uma sequência que possa ser acompanhada apenas pela escuta.",
  introductionSummary:
    "A pressão arterial depende do bombeamento do coração, da resistência dos vasos e do volume circulante; sua regulação envolve respostas rápidas e ajustes que levam horas ou dias.",
  sections: [
    {
      id: "pressao-media",
      title: "O que determina a pressão arterial",
      objective:
        "Diferenciar pressão sistólica, diastólica e média e relacionar pressão arterial média, débito cardíaco e resistência vascular.",
      paragraphs: [
        "A pressão arterial sistêmica varia ao longo do batimento. A pressão sistólica é o maior valor durante a ejeção ventricular, e a diastólica é o menor valor antes da próxima ejeção. Em um registro de 120 por 80 milímetros de mercúrio, 120 é a pressão sistólica e 80 é a diastólica. Esses valores servem aqui como exemplo matemático, não como diagnóstico individual.",
        "A pressão arterial média, ou PAM, representa a média temporal da pressão nas artérias ao longo do ciclo cardíaco. Em uma frequência cardíaca usual de repouso, podemos estimá-la somando a pressão diastólica a um terço da pressão de pulso. A pressão de pulso é a sistólica menos a diastólica. Para 120 por 80, a pressão de pulso é 40 e a PAM estimada é aproximadamente 93 milímetros de mercúrio. Em frequências altas ou formas de onda alteradas, essa aproximação perde precisão.",
        "A relação hemodinâmica mais útil é: pressão arterial média menos pressão venosa central é aproximadamente igual ao débito cardíaco multiplicado pela resistência vascular sistêmica. Como a pressão venosa central costuma ser pequena em comparação com a PAM, frequentemente se usa a forma simplificada PAM aproximadamente igual a débito cardíaco vezes resistência vascular sistêmica.",
        "A pressão não informa, isoladamente, quanto sangue um órgão recebe. O fluxo de cada território também depende da resistência local. Manter a pressão sistêmica contribui para a perfusão, mas não garante que todos os órgãos estejam sendo perfundidos adequadamente.",
      ],
      summary:
        "A PAM resulta da interação entre débito cardíaco e resistência vascular sistêmica; o volume sanguíneo, o retorno venoso e as propriedades vasculares também influenciam o sistema.",
      example: {
        title: "Estimando a pressão arterial média",
        paragraphs: [
          "Considere 120 por 80 milímetros de mercúrio. Primeiro subtraímos 80 de 120 e obtemos uma pressão de pulso de 40. Em seguida dividimos 40 por 3, obtendo cerca de 13,3. Somamos esse resultado a 80: a pressão arterial média estimada é 93,3 milímetros de mercúrio.",
        ],
        formula: {
          visual: "PAM ≈ PAD + (PAS − PAD)/3 = 80 + (120 − 80)/3 ≈ 93,3 mmHg",
          spoken:
            "Pressão arterial média aproximada é pressão diastólica mais um terço da diferença entre pressão sistólica e diastólica. Oitenta mais quarenta dividido por três é aproximadamente noventa e três vírgula três milímetros de mercúrio.",
        },
      },
    },
    {
      id: "barorreceptores",
      title: "Barorreceptores e resposta rápida à pressão",
      objective:
        "Descrever o circuito sensorial e a resposta de retroalimentação negativa do reflexo barorreceptor.",
      paragraphs: [
        "Os barorreceptores arteriais são terminações nervosas sensíveis ao estiramento da parede dos vasos. Dois locais importantes são o seio carotídeo, situado na região de origem da artéria carótida interna, e o arco da aorta. Em geral, quando a pressão aumenta, a parede se distende mais e a frequência de impulsos desses receptores aumenta. Quando a pressão cai, a frequência dos impulsos diminui.",
        "Os sinais do seio carotídeo chegam ao tronco encefálico principalmente pelo nervo glossofaríngeo, o nono par craniano; os do arco da aorta chegam pelo nervo vago, o décimo par. As informações são processadas no bulbo, especialmente no núcleo do trato solitário, e influenciam os circuitos que regulam a atividade simpática e parassimpática.",
        "Imagine primeiro uma elevação súbita da pressão: há maior distensão, maior descarga dos barorreceptores, redução da ação simpática sobre coração e vasos e aumento da influência vagal no coração. A frequência cardíaca tende a diminuir e muitas arteríolas dilatam. Essa resposta ajuda a contrariar a elevação inicial da pressão.",
        "Agora imagine uma queda súbita: a distensão e a descarga aferente diminuem. A resposta reflexa tende a elevar a atividade simpática e reduzir a influência vagal sobre o coração. A frequência e a contratilidade cardíacas podem aumentar; muitos vasos se contraem. Esse é um exemplo de retroalimentação negativa: a resposta fisiológica se opõe à alteração inicial.",
        "O reflexo opera em segundos e ajuda a estabilizar a circulação diante de mudanças rápidas. Em alterações sustentadas, a sensibilidade e o ponto de operação do reflexo podem se reajustar; por isso ele não explica, sozinho, o controle da pressão a longo prazo.",
      ],
      summary:
        "Pressão sobe: barorreceptores disparam mais e a resposta tende a reduzi-la. Pressão cai: disparam menos e a resposta tende a elevá-la. É um controle rápido de retroalimentação negativa.",
    },
    {
      id: "resposta-autonomica",
      title: "Como o sistema nervoso modifica coração e vasos",
      objective:
        "Relacionar as vias simpática e parassimpática à frequência cardíaca, contratilidade e resistência vascular.",
      paragraphs: [
        "O sistema nervoso autônomo é uma das vias efetoras do reflexo. Nos nós sinoatrial e atrioventricular, a influência parassimpática vagal tende a reduzir a frequência dos disparos e a condução elétrica. O efeito parassimpático direto sobre a força de contração ventricular é relativamente limitado quando comparado ao simpático.",
        "O simpático atua, entre outros locais, em receptores beta um no coração, elevando a frequência e a contratilidade em condições apropriadas. Em muitos vasos, a ativação de receptores alfa um favorece vasoconstrição. O resultado sistêmico depende de quais territórios vasculares estão sendo ativados e de sinais locais que podem se opor à constrição.",
        "Também há vasos venosos sob controle simpático. A venoconstrição reduz a capacidade de armazenamento venoso e pode favorecer o retorno de sangue ao coração. Isso ajuda a sustentar o enchimento cardíaco em situações como a mudança súbita da posição deitada para a posição em pé.",
        "Ao ficar de pé, parte do sangue tende a acumular-se temporariamente nas regiões inferiores do corpo pela gravidade. O retorno venoso e o volume sistólico podem cair. O reflexo barorreceptor responde aumentando o tônus simpático e reduzindo o vagal, ajudando a recuperar a pressão. Esse ajuste rápido não depende de aumentar imediatamente o volume total de sangue.",
      ],
      summary:
        "O simpático pode elevar frequência, força de contração e resistência vascular; o vago reduz principalmente a frequência cardíaca. O controle das veias também influencia o retorno venoso.",
      example: {
        title: "Mudança de postura sem precisar de um desenho",
        paragraphs: [
          "Sequência para memorizar: levantar-se, acúmulo temporário de sangue nas pernas, redução do retorno venoso, queda transitória da pressão, menor descarga dos barorreceptores, aumento da resposta simpática, recuperação parcial da pressão. Dizer essa sequência em voz alta ajuda a identificar causa, receptor, centro integrador e resposta.",
        ],
      },
    },
    {
      id: "quimiorreceptores",
      title: "Quimiorreceptores e outros sinais de controle",
      objective:
        "Explicar a contribuição dos quimiorreceptores periféricos e distinguir seu papel do reflexo barorreceptor.",
      paragraphs: [
        "Quimiorreceptores periféricos estão presentes nos corpos carotídeos e aórticos. Diferentemente dos barorreceptores, que respondem principalmente ao estiramento, esses sensores respondem a alterações químicas, como redução importante da pressão parcial de oxigênio e elevações de dióxido de carbono ou de íons hidrogênio.",
        "A ativação dos quimiorreceptores contribui fortemente para ajustes ventilatórios. Também pode influenciar os centros cardiovasculares, sobretudo em condições de hipóxia ou perturbações circulatórias relevantes. A resposta da pressão pode variar conforme a intensidade do estímulo, a ventilação e o estado fisiológico.",
        "Outros receptores, como os cardiopulmonares de baixa pressão, informam mudanças de enchimento e volume central. Reflexos oriundos do coração, das grandes veias e dos pulmões ajudam a coordenar respostas autonômicas, renais e hormonais.",
        "Para não confundir: barorreceptor arterial percebe estiramento associado à pressão; quimiorreceptor percebe condições químicas do sangue; receptor cardiopulmonar informa principalmente enchimento e volume central. Todos podem contribuir para o controle circulatório, mas não são sensores equivalentes.",
      ],
      summary:
        "Quimiorreceptores monitoram sinais químicos, enquanto barorreceptores monitoram estiramento; a integração de diferentes receptores permite respostas adequadas à situação.",
    },
    {
      id: "rins-natriurese",
      title: "Rins, sódio e volume sanguíneo",
      objective:
        "Explicar o papel da excreção renal de sódio e água no controle sustentado da pressão arterial.",
      paragraphs: [
        "Respostas nervosas rápidas podem alterar a resistência dos vasos ou a atividade cardíaca, mas o volume de líquido mantido no organismo depende, em grande parte, do balanço entre ingestão e eliminação de água e sódio. Os rins filtram o plasma e ajustam quanto sódio e água retorna ao sangue ou é eliminado na urina.",
        "Se a retenção de sódio aumenta de forma sustentada, mais água tende a permanecer no compartimento extracelular. Dependendo dos mecanismos compensatórios, isso pode elevar o volume circulante, o retorno venoso, o débito e a pressão. Em sentido contrário, uma maior eliminação renal de sódio e água pode reduzir o volume extracelular.",
        "Natriurese pressórica é o aumento da excreção renal de sódio favorecido pela elevação da pressão de perfusão renal. Diurese pressórica é o aumento da eliminação de água associado à pressão. Esses mecanismos fazem parte da relação entre pressão arterial e balanço de líquidos ao longo do tempo; não funcionam como um interruptor isolado ou instantâneo.",
        "A pressão final resulta do equilíbrio entre ingestão de sal e água, excreção renal, mecanismos hormonais e controle neural. Alterações renais podem deslocar essa relação e tornar necessária uma pressão mais alta para eliminar determinada carga de sódio. Isso ajuda a compreender por que os rins são essenciais ao controle de longo prazo.",
      ],
      summary:
        "Os rins regulam o balanço de sódio e água. A excreção de sódio tende a aumentar com a pressão renal, contribuindo para o controle sustentado do volume e da pressão arterial.",
    },
    {
      id: "sraa",
      title: "Sistema renina–angiotensina–aldosterona",
      objective:
        "Reconstruir a cascata hormonal e relacionar cada componente aos vasos, rins e volume sanguíneo.",
      paragraphs: [
        "O sistema renina–angiotensina–aldosterona, também chamado SRAA, é ativado por sinais que podem indicar redução da perfusão renal ou necessidade de conservar sódio. Entre os estímulos para liberação de renina estão menor distensão da arteríola aferente renal, menor entrega de cloreto de sódio à mácula densa e estímulo simpático beta um nas células justaglomerulares.",
        "A sequência é: o fígado produz angiotensinogênio; a renina liberada pelos rins transforma angiotensinogênio em angiotensina um; a enzima conversora de angiotensina, ECA, presente em endotélio de diferentes regiões, inclusive pulmões, transforma angiotensina um em angiotensina dois. Essa última é uma substância biologicamente ativa importante no controle cardiovascular.",
        "A angiotensina dois promove vasoconstrição em vários territórios e estimula a secreção de aldosterona pela zona glomerulosa do córtex da suprarrenal. A aldosterona aumenta a reabsorção de sódio principalmente em regiões distais do néfron; a água pode acompanhar a retenção de sódio conforme as condições fisiológicas. A aldosterona também favorece a excreção renal de potássio.",
        "A angiotensina dois ainda favorece a reabsorção renal de sódio, a sede e a liberação de vasopressina. Assim, o sistema combina uma ação vascular relativamente rápida com efeitos sobre o balanço de sal e água que ajudam na regulação ao longo de horas e dias.",
        "Uma maneira de memorizar a cascata sem imagem é recitar cinco passos: rim libera renina; renina gera angiotensina um; ECA gera angiotensina dois; angiotensina dois contrai vasos e estimula aldosterona; aldosterona favorece retenção de sódio. Essa é a via clássica simplificada e não esgota todas as ações do sistema.",
      ],
      summary:
        "Renina inicia a cascata; ECA forma angiotensina II; esta promove vasoconstrição e estimula aldosterona, que favorece a retenção renal de sódio.",
    },
    {
      id: "outros-hormonios",
      title: "Vasopressina, peptídeos natriuréticos e sede",
      objective:
        "Comparar respostas hormonais que conservam água e sódio com respostas que favorecem sua eliminação.",
      paragraphs: [
        "A vasopressina, também chamada hormônio antidiurético ou ADH, é produzida no hipotálamo e liberada pela neuro-hipófise. Ela aumenta a reabsorção de água nos ductos coletores renais por ação predominante em receptores V2. Em concentrações mais elevadas, também pode exercer efeito vasoconstritor por receptores V1.",
        "A secreção de vasopressina responde à osmolaridade plasmática e também a estímulos relacionados ao volume ou à pressão. Quando o organismo precisa conservar água, o aumento de vasopressina pode reduzir a quantidade de água perdida na urina. É importante separar esse efeito da aldosterona: vasopressina atua diretamente na conservação de água; aldosterona regula sobretudo o transporte de sódio e potássio.",
        "Os peptídeos natriuréticos são liberados pelo coração em resposta a condições de maior estiramento das câmaras. O peptídeo natriurético atrial, ou ANP, e o peptídeo natriurético do tipo B, ou BNP, participam de respostas que favorecem excreção de sódio e água e se opõem a diferentes ações de retenção de volume. Sua importância relativa depende do estado fisiológico e clínico.",
        "A sede também faz parte do balanço hídrico. Regiões do hipotálamo e estruturas próximas ao terceiro ventrículo, incluindo circuitos associados à região anteroventral do terceiro ventrículo, ou AV3V, integram sinais osmóticos, hormonais e cardiovasculares que contribuem para a ingestão de água e para respostas neuroendócrinas. Não se deve confundir essa integração central com a localização dos barorreceptores arteriais, que ficam nos grandes vasos.",
      ],
      summary:
        "Vasopressina conserva principalmente água; aldosterona favorece retenção de sódio; peptídeos natriuréticos favorecem eliminação de sódio e água; a sede contribui para o equilíbrio hídrico.",
    },
    {
      id: "integracao-tempos",
      title: "Integração: segundos, horas e dias",
      objective:
        "Prever como os diferentes sistemas participam de mudanças de postura, exercício e redução de volume sanguíneo.",
      paragraphs: [
        "A regulação da pressão utiliza mecanismos que se sobrepõem no tempo. Em segundos, reflexos nervosos modificam frequência cardíaca, contratilidade e tônus vascular. Em minutos ou horas, hormônios e ajustes de distribuição de líquidos podem ganhar importância. Ao longo de horas e dias, o equilíbrio renal de sódio e água ajuda a sustentar a pressão. Esses intervalos são aproximados; não existem fronteiras rígidas entre as respostas.",
        "Quando uma pessoa se levanta rapidamente, o principal desafio inicial é a queda transitória do retorno venoso por efeito da gravidade. A compensação imediata é sobretudo reflexa: aumento simpático, redução da atividade vagal e alterações no calibre vascular. Em contraste, uma perda real de sangue também reduz o volume circulante e pode ativar mecanismos renais e hormonais para conservar água e sódio.",
        "Durante o exercício, o comando central e os reflexos envolvidos no movimento alteram a atividade autonômica. O débito cardíaco aumenta, enquanto substâncias locais favorecem a dilatação dos vasos nos músculos ativos. O reflexo barorreceptor continua funcionando, mas pode operar em torno de outro nível de pressão. Não seria correto dizer que todos os vasos se contraem ou dilatam igualmente.",
        "Na hipertensão persistente, mecanismos nervosos, renais, hormonais, vasculares e outros fatores podem contribuir em diferentes graus. O barorreflexo sozinho não determina a pressão mantida ao longo de meses. Da mesma forma, medir apenas uma frequência cardíaca elevada não permite concluir que a pressão arterial também esteja elevada.",
        "Para revisar o raciocínio, sempre pergunte quatro coisas: o que mudou primeiro; qual sensor percebeu a alteração; qual caminho nervoso, hormonal ou renal foi ativado; e qual efeito esperado ocorreu sobre coração, vasos ou volume circulante.",
      ],
      summary:
        "Mudanças rápidas são amortecidas por reflexos; ajustes hormonais e renais coordenam respostas prolongadas. Em toda situação, é preciso separar o estímulo inicial dos mecanismos de compensação.",
    },
    {
      id: "engenharia-biomedica",
      title: "Medir a pressão não é medir todos os seus mecanismos",
      objective:
        "Interpretar medidas instrumentais de pressão e reconhecer o que pode e o que não pode ser inferido delas.",
      paragraphs: [
        "Um aparelho oscilométrico de braço detecta oscilações de pressão no manguito e utiliza algoritmos para estimar valores sistólico e diastólico. Ele não mede diretamente a descarga dos barorreceptores, o nível de aldosterona, o fluxo sanguíneo cerebral ou a atividade simpática. É importante distinguir o sinal captado da variável fisiológica inferida.",
        "Uma pressão medida isoladamente varia conforme postura, atividade, condições da medida, tamanho e posicionamento do manguito, movimentação e características do aparelho. Em monitoramento repetido, a análise do contexto e da qualidade do sinal faz parte da interpretação técnica.",
        "A pressão arterial média pode ser estimada por uma equação aproximada, mas sua determinação a partir de uma forma de onda arterial medida continuamente considera a média temporal do sinal. Já a variabilidade da frequência cardíaca oferece informações indiretas sobre controle autonômico, sem identificar sozinha um mecanismo causal específico da pressão.",
        "Na Engenharia Biomédica, o objetivo é construir ou utilizar instrumentos confiáveis e interpretar seus limites. Uma mudança simultânea de pressão e frequência não demonstra, por si só, que um hormônio específico aumentou ou que determinado reflexo falhou. Para testar um mecanismo, são necessárias medidas e condições experimentais adequadas.",
      ],
      summary:
        "Pressão, frequência e perfusão são grandezas diferentes. Sensores e algoritmos fornecem medidas e estimativas que devem ser interpretadas conforme o método e seu contexto.",
    },
  ],
  terms: [
    { term: "Pressão arterial sistólica (PAS)", definition: "Valor máximo da pressão arterial sistêmica durante o ciclo cardíaco." },
    { term: "Pressão arterial diastólica (PAD)", definition: "Valor mínimo da pressão arterial sistêmica durante o ciclo cardíaco." },
    { term: "Pressão arterial média (PAM)", definition: "Média temporal da pressão arterial ao longo de um ciclo cardíaco." },
    { term: "Pressão de pulso", definition: "Diferença entre pressão sistólica e diastólica." },
    { term: "Resistência vascular sistêmica", definition: "Oposição global oferecida pela circulação sistêmica ao fluxo sanguíneo." },
    { term: "Barorreceptor arterial", definition: "Terminação sensorial que responde ao estiramento da parede arterial e participa da regulação rápida da pressão." },
    { term: "Seio carotídeo", definition: "Dilatação na região inicial da carótida interna rica em barorreceptores." },
    { term: "Núcleo do trato solitário", definition: "Região do bulbo que recebe aferências viscerais e participa da integração de reflexos cardiovasculares." },
    { term: "Retroalimentação negativa", definition: "Mecanismo em que a resposta tende a se opor à mudança inicial de uma variável." },
    { term: "Quimiorreceptor periférico", definition: "Sensor em corpos carotídeos ou aórticos que responde a alterações de gases e do equilíbrio ácido-base." },
    { term: "Natriurese pressórica", definition: "Aumento da excreção renal de sódio favorecido pela elevação da pressão de perfusão renal." },
    { term: "Diurese", definition: "Produção e eliminação de urina; a diurese pressórica relaciona sua elevação ao aumento de pressão renal." },
    { term: "Mácula densa", definition: "Grupo de células do néfron que detecta a entrega tubular de cloreto de sódio e participa do controle da renina." },
    { term: "Renina", definition: "Enzima liberada pelas células justaglomerulares que inicia a formação de angiotensina I a partir do angiotensinogênio." },
    { term: "Angiotensina II", definition: "Peptídeo ativo do SRAA que exerce ações vasculares, renais, hormonais e centrais." },
    { term: "Aldosterona", definition: "Hormônio do córtex suprarrenal que aumenta a reabsorção renal de sódio e favorece a secreção de potássio." },
    { term: "Vasopressina (ADH)", definition: "Hormônio que aumenta a reabsorção renal de água e que, em concentrações elevadas, também pode contribuir para vasoconstrição." },
    { term: "ANP e BNP", definition: "Peptídeos natriuréticos cardíacos que participam de mecanismos que favorecem a eliminação de sódio e água." },
    { term: "AV3V", definition: "Região anteroventral relacionada ao terceiro ventrículo, com circuitos envolvidos na integração de sinais de sede, osmolaridade e controle cardiovascular." },
    { term: "Hipotensão ortostática", definition: "Queda de pressão relacionada à mudança para a posição em pé; sua identificação clínica requer critérios próprios de medida." },
  ],
  summary: [
    "Pressão arterial média está relacionada ao débito cardíaco e à resistência vascular sistêmica; é diferente da pressão sistólica e da diastólica.",
    "Barorreceptores do seio carotídeo e arco da aorta informam ao bulbo o estiramento das paredes arteriais e ajudam no controle rápido da pressão.",
    "Queda súbita de pressão reduz a descarga dos barorreceptores e tende a aumentar a atividade simpática; a elevação da pressão produz uma resposta reflexa oposta.",
    "Quimiorreceptores, receptores cardiopulmonares e sinais centrais complementam a informação recebida sobre o estado circulatório.",
    "Rins controlam o volume extracelular ao ajustar a excreção de sódio e água; natriurese pressórica participa do controle de longo prazo.",
    "A sequência clássica do SRAA é renina, angiotensina I, ECA, angiotensina II e aldosterona, com ações sobre vasos e retenção de sódio.",
    "Vasopressina conserva água, peptídeos natriuréticos favorecem eliminação de sódio e água, e circuitos de sede participam do balanço hídrico.",
    "Respostas rápidas e prolongadas atuam juntas. Medidas de pressão isoladas não identificam qual mecanismo está ativo.",
  ],
  questions: [
    {
      id: "pa-pam", sectionId: "pressao-media", concept: "Cálculo da PAM",
      prompt: "Em uma medida de 120 por 80 milímetros de mercúrio, qual é a PAM aproximada usando a expressão válida como estimativa em repouso?",
      options: [
        { id: "a", text: "40 milímetros de mercúrio." },
        { id: "b", text: "80 milímetros de mercúrio." },
        { id: "c", text: "93 milímetros de mercúrio." },
        { id: "d", text: "120 milímetros de mercúrio." },
      ],
      correctOptionId: "c",
      explanation: "A pressão de pulso é 120 menos 80, igual a 40. A estimativa da PAM é 80 mais 40 dividido por 3, aproximadamente 93 milímetros de mercúrio.",
      supplement: "Essa fórmula é uma aproximação e não corresponde necessariamente à média temporal em qualquer frequência cardíaca.",
    },
    {
      id: "pa-fluxo", sectionId: "pressao-media", concept: "Determinantes da pressão",
      prompt: "Em um modelo hemodinâmico simplificado, mantendo a resistência sistêmica constante, o que tende a acontecer com a PAM se o débito cardíaco aumentar?",
      options: [
        { id: "a", text: "Tende a aumentar." },
        { id: "b", text: "Tende a cair para zero." },
        { id: "c", text: "Fica necessariamente igual à pressão venosa." },
        { id: "d", text: "Passa a representar somente a pressão diastólica." },
      ],
      correctOptionId: "a",
      explanation: "Na relação aproximada entre pressão, débito e resistência, um débito maior, sob resistência constante, eleva a diferença de pressão necessária para manter o fluxo.",
      supplement: "No organismo, a resistência também pode mudar; por isso a relação é uma ferramenta de raciocínio, não uma previsão automática.",
    },
    {
      id: "pa-barorreceptores", sectionId: "barorreceptores", concept: "Resposta ao aumento de pressão",
      prompt: "Qual sequência corresponde à resposta reflexa esperada após uma elevação súbita da pressão arterial?",
      options: [
        { id: "a", text: "Menor estiramento, menor descarga e aumento reflexo da frequência cardíaca." },
        { id: "b", text: "Maior estiramento, maior descarga e tendência à redução simpática." },
        { id: "c", text: "Maior pressão, interrupção completa do reflexo barorreceptor." },
        { id: "d", text: "Maior pressão, produção imediata de novos glóbulos vermelhos." },
      ],
      correctOptionId: "b",
      explanation: "Maior estiramento gera maior frequência de impulsos dos barorreceptores, favorecendo menor atividade simpática e maior influência vagal cardíaca.",
      supplement: "A resposta reflexa constitui retroalimentação negativa, pois se opõe à alteração inicial.",
    },
    {
      id: "pa-vias", sectionId: "barorreceptores", concept: "Vias aferentes",
      prompt: "Quais nervos conduzem principalmente as informações dos barorreceptores do seio carotídeo e do arco da aorta, respectivamente?",
      options: [
        { id: "a", text: "Glossofaríngeo e vago." },
        { id: "b", text: "Óptico e olfatório." },
        { id: "c", text: "Radial e mediano." },
        { id: "d", text: "Vago e nervo frênico." },
      ],
      correctOptionId: "a",
      explanation: "O seio carotídeo envia sinais principalmente pelo nervo glossofaríngeo, e o arco aórtico pelo nervo vago, até circuitos do tronco encefálico.",
      supplement: "Ambas as informações alcançam regiões bulbares que coordenam as respostas autonômicas.",
    },
    {
      id: "pa-postura", sectionId: "resposta-autonomica", concept: "Compensação postural",
      prompt: "Ao levantar-se rapidamente, o retorno venoso cai temporariamente. Qual resposta ajuda a compensar a pressão arterial?",
      options: [
        { id: "a", text: "Redução de toda atividade simpática e dilatação venosa generalizada." },
        { id: "b", text: "Parada imediata da produção de urina como único mecanismo." },
        { id: "c", text: "Aumento reflexo simpático, com ajustes cardíacos e vasculares." },
        { id: "d", text: "Fechamento permanente das valvas cardíacas." },
      ],
      correctOptionId: "c",
      explanation: "A menor descarga barorreceptora tende a elevar a atividade simpática, ajudando a manter frequência, resistência e retorno venoso.",
      supplement: "A compensação inicial é rápida e não depende de aumentar imediatamente a quantidade total de sangue.",
    },
    {
      id: "pa-quimio", sectionId: "quimiorreceptores", concept: "Tipos de receptores",
      prompt: "Qual alteração é percebida diretamente pelos quimiorreceptores periféricos, e não principalmente pelos barorreceptores arteriais?",
      options: [
        { id: "a", text: "Estiramento da parede do seio carotídeo." },
        { id: "b", text: "Diminuição importante da pressão parcial de oxigênio no sangue arterial." },
        { id: "c", text: "Abertura mecânica da valva aórtica." },
        { id: "d", text: "Aumento do comprimento do sarcômero cardíaco." },
      ],
      correctOptionId: "b",
      explanation: "Quimiorreceptores periféricos respondem a variáveis químicas, incluindo queda relevante de oxigênio, aumento de dióxido de carbono e alterações do pH.",
      supplement: "Sua ação inclui importante controle da ventilação e participação cardiovascular dependente do contexto.",
    },
    {
      id: "pa-rins", sectionId: "rins-natriurese", concept: "Natriurese pressórica",
      prompt: "O que é natriurese pressórica?",
      options: [
        { id: "a", text: "Aumento da frequência cardíaca provocado pelo nervo vago." },
        { id: "b", text: "Aumento da excreção de sódio pelos rins associado ao aumento da pressão de perfusão renal." },
        { id: "c", text: "Conversão de angiotensina I em angiotensina II nos pulmões." },
        { id: "d", text: "Armazenamento permanente de água na bexiga." },
      ],
      correctOptionId: "b",
      explanation: "A pressão de perfusão renal maior pode reduzir a reabsorção tubular de sódio e favorecer sua eliminação, contribuindo para o balanço de volume.",
      supplement: "A resposta é modulada por fatores neurais e hormonais e participa do controle sustentado da pressão.",
    },
    {
      id: "pa-renina", sectionId: "sraa", concept: "Estímulos à renina",
      prompt: "Qual condição favorece a liberação de renina pelas células justaglomerulares?",
      options: [
        { id: "a", text: "Redução da pressão de perfusão renal." },
        { id: "b", text: "Aumento isolado do estiramento atrial como único mecanismo." },
        { id: "c", text: "Bloqueio completo do aparelho justaglomerular." },
        { id: "d", text: "Ausência de angiotensinogênio associada a maior produção de angiotensina I." },
      ],
      correctOptionId: "a",
      explanation: "A baixa perfusão renal, a menor oferta tubular de cloreto de sódio e o estímulo simpático beta um estão entre os sinais que estimulam renina.",
      supplement: "A renina atua sobre o angiotensinogênio, iniciando a formação da angiotensina I.",
    },
    {
      id: "pa-cascata", sectionId: "sraa", concept: "Sequência do SRAA",
      prompt: "Qual sequência apresenta corretamente o caminho clássico do SRAA?",
      options: [
        { id: "a", text: "Aldosterona converte renina em angiotensina I; depois ocorre relaxamento vascular obrigatório." },
        { id: "b", text: "Renina forma angiotensina I; ECA forma angiotensina II; angiotensina II estimula aldosterona." },
        { id: "c", text: "Vasopressina forma angiotensinogênio diretamente no coração." },
        { id: "d", text: "A mácula densa transforma aldosterona em sódio." },
      ],
      correctOptionId: "b",
      explanation: "A renina age sobre angiotensinogênio para formar angiotensina I, convertida em angiotensina II pela ECA. A angiotensina II estimula a secreção de aldosterona.",
      supplement: "A angiotensina II também possui ações diretas nos vasos e nos rins.",
    },
    {
      id: "pa-adh", sectionId: "outros-hormonios", concept: "Conservação de água",
      prompt: "Qual hormônio aumenta diretamente a reabsorção de água nos ductos coletores renais por receptores V2?",
      options: [
        { id: "a", text: "ANP." },
        { id: "b", text: "Renina." },
        { id: "c", text: "Vasopressina, também chamada ADH." },
        { id: "d", text: "Angiotensinogênio." },
      ],
      correctOptionId: "c",
      explanation: "A vasopressina aumenta a permeabilidade à água nos ductos coletores, reduzindo a perda urinária de água conforme as condições osmóticas e circulatórias.",
      supplement: "A aldosterona atua principalmente sobre o transporte renal de sódio e potássio.",
    },
    {
      id: "pa-natriureticos", sectionId: "outros-hormonios", concept: "Resposta à distensão cardíaca",
      prompt: "Qual é uma ação geral dos peptídeos natriuréticos cardíacos?",
      options: [
        { id: "a", text: "Favorecer a eliminação renal de sódio e água em determinadas condições." },
        { id: "b", text: "Impedir permanentemente toda produção de urina." },
        { id: "c", text: "Atuar como única causa de vasoconstrição sistêmica." },
        { id: "d", text: "Converter a pressão arterial em frequência cardíaca." },
      ],
      correctOptionId: "a",
      explanation: "ANP e BNP participam de respostas à distensão cardíaca que favorecem a excreção de sódio e água, contribuindo para regular o volume circulante.",
      supplement: "Esses efeitos se contrapõem a diferentes mecanismos de retenção de volume.",
    },
    {
      id: "pa-integracao", sectionId: "integracao-tempos", concept: "Escalas de tempo",
      prompt: "Qual comparação entre os mecanismos de regulação da pressão arterial está correta?",
      options: [
        { id: "a", text: "O barorreflexo funciona apenas após vários dias, e os rins só atuam em segundos." },
        { id: "b", text: "O reflexo barorreceptor participa do ajuste rápido, enquanto o balanço renal de sódio e água é central para ajustes sustentados." },
        { id: "c", text: "Todos os mecanismos aparecem e desaparecem exatamente no mesmo segundo." },
        { id: "d", text: "Os hormônios não participam da regulação da pressão arterial." },
      ],
      correctOptionId: "b",
      explanation: "Reflexos autonômicos amortecem oscilações rápidas; rins e hormônios participam de ajustes prolongados, embora suas ações se sobreponham no tempo.",
      supplement: "A mudança postural e a perda persistente de volume podem compartilhar reflexos iniciais, mas exigem compensações diferentes.",
    },
    {
      id: "pa-medicao", sectionId: "engenharia-biomedica", concept: "Interpretação instrumental",
      prompt: "Qual informação um aparelho de pressão de braço fornece sem medir diretamente a atividade autonômica?",
      options: [
        { id: "a", text: "Concentração sanguínea de aldosterona." },
        { id: "b", text: "Número de impulsos dos barorreceptores por segundo." },
        { id: "c", text: "Estimativas de pressão sistólica e diastólica obtidas por método instrumental." },
        { id: "d", text: "Fluxo sanguíneo de cada órgão, medido diretamente." },
      ],
      correctOptionId: "c",
      explanation: "O equipamento estima valores de pressão com base no sinal registrado e em seu método; não revela diretamente os mecanismos que originaram a pressão.",
      supplement: "Distinguir medidas diretas, estimativas algorítmicas e inferências fisiológicas é essencial na Engenharia Biomédica.",
    },
  ],
  quickReview: [
    { id: "pa-revisao-1", prompt: "Como estimar a pressão arterial média em repouso?", answer: "Some a pressão diastólica a um terço da diferença entre sistólica e diastólica. Para 120 por 80, aproximadamente 93 milímetros de mercúrio." },
    { id: "pa-revisao-2", prompt: "Qual o caminho do reflexo barorreceptor quando a pressão cai?", answer: "Menor estiramento, menor descarga dos barorreceptores, integração no bulbo, aumento da atividade simpática e menor influência vagal; frequência, contratilidade e resistência podem aumentar." },
    { id: "pa-revisao-3", prompt: "Quais nervos levam sinais do seio carotídeo e do arco da aorta?", answer: "Principalmente glossofaríngeo, nono par craniano, para o seio carotídeo; e vago, décimo par craniano, para o arco aórtico." },
    { id: "pa-revisao-4", prompt: "O que significa natriurese pressórica?", answer: "É o aumento da eliminação renal de sódio favorecido pela elevação da pressão de perfusão dos rins." },
    { id: "pa-revisao-5", prompt: "Recite a cascata clássica do SRAA.", answer: "Renina age sobre angiotensinogênio e forma angiotensina I; ECA forma angiotensina II; esta causa vasoconstrição e estimula aldosterona, que favorece a retenção de sódio." },
    { id: "pa-revisao-6", prompt: "Qual a diferença entre vasopressina e aldosterona?", answer: "Vasopressina aumenta diretamente a reabsorção de água nos ductos coletores; aldosterona regula principalmente a reabsorção de sódio e a secreção de potássio." },
    { id: "pa-revisao-7", prompt: "Como os peptídeos natriuréticos ajudam a controlar o volume?", answer: "ANP e BNP participam de respostas que favorecem eliminação de sódio e água, especialmente diante do aumento de distensão cardíaca." },
    { id: "pa-revisao-8", prompt: "Qual a diferença entre controle rápido e sustentado da pressão?", answer: "O controle rápido envolve principalmente reflexos nervosos; o sustentado exige equilíbrio renal de sódio e água, com participação hormonal e neural." },
    { id: "pa-revisao-9", prompt: "Por que medir a pressão não basta para identificar um mecanismo regulador?", answer: "Porque pressão é um resultado integrado. A medida não revela diretamente atividade simpática, descarga barorreceptora, concentração hormonal ou fluxo de cada órgão." },
  ],
  referenceIds: [
    "openstax-vasos-fluxo",
    "openstax-regulacao-vascular",
    "ncbi-barorreceptores",
    "ncbi-sraa",
    "pubmed-natriurese-pressoria",
    "pubmed-av3v-homeostase",
  ],
};
