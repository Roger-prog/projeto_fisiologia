export const simulations = {
  heartRate: {
    title: "Frequência cardíaca",
    description: "Compare o intervalo entre batimentos em dois ritmos regulares. O som sintético é opcional.",
    href: "/simulacoes/frequencia-cardiaca/",
    lessonId: "introducao-ao-sistema-cardiovascular",
    lessonTitle: "Introdução ao Sistema Cardiovascular",
    sourceTitle: "OpenStax · Cardiac Physiology",
    sourceUrl: "https://openstax.org/books/anatomy-and-physiology-2e/pages/19-4-cardiac-physiology",
  },
  breathing: {
    title: "Mecânica respiratória",
    description: "Percorra um ciclo respiratório para relacionar o movimento do diafragma, a pressão e o fluxo de ar.",
    href: "/simulacoes/mecanica-respiratoria/",
    lessonId: "mecanica-respiratoria",
    lessonTitle: "Mecânica Respiratória",
    sourceTitle: "OpenStax · The Process of Breathing",
    sourceUrl: "https://openstax.org/books/anatomy-and-physiology-2e/pages/22-3-the-process-of-breathing",
  },
} as const;

export const heartRates = [60, 80, 100, 120] as const;
export type HeartRate = (typeof heartRates)[number];

export function secondsPerBeat(rate: HeartRate) {
  return 60 / rate;
}

export const heartRateQuestions = [
  {
    id: "intervalo",
    prompt: "Qual é o menor intervalo entre batimentos, a 60 ou a 120 bpm?",
    answer: "A 120 bpm, o intervalo é de 0,50 segundo. A 60 bpm, é de 1,00 segundo. Ao dobrar a frequência de um ritmo regular, o intervalo cai pela metade.",
  },
  {
    id: "diferenca",
    prompt: "Quantos batimentos a mais ocorrem em um minuto a 100 bpm em comparação com 80 bpm?",
    answer: "Ocorrem 20 batimentos a mais, pois 100 menos 80 é igual a 20. A diferença se refere a um minuto inteiro.",
  },
  {
    id: "debito",
    prompt: "Que outra informação é necessária para calcular o débito cardíaco?",
    answer: "É preciso conhecer o volume ejetado pelo ventrículo a cada batimento. O débito cardíaco é a frequência cardíaca multiplicada por esse volume.",
  },
] as const;

export const breathingPhases = [
  {
    id: "inspiracao",
    title: "Inspiração",
    diaphragm: "Contrai, desce e fica mais plano.",
    volume: "Aumenta à medida que o tórax se expande.",
    pressure: "Menor que a pressão atmosférica.",
    airflow: "O ar entra nos pulmões.",
    explanation: "A expansão do tórax distende os pulmões. A diferença entre a pressão do ambiente e a pressão alveolar faz o ar entrar pelas vias aéreas.",
    direction: "in",
  },
  {
    id: "fim-inspiracao",
    title: "Fim da inspiração",
    diaphragm: "Está em posição mais baixa, ao fim do movimento inspiratório.",
    volume: "Atinge seu maior valor neste ciclo.",
    pressure: "Igual à pressão atmosférica.",
    airflow: "O fluxo de ar cessa momentaneamente.",
    explanation: "Os pulmões permanecem expandidos. Quando a pressão alveolar se iguala à do ambiente, o gradiente que fazia o ar entrar desaparece.",
    direction: "none",
  },
  {
    id: "expiracao",
    title: "Expiração",
    diaphragm: "Relaxa e volta em direção à posição elevada.",
    volume: "Diminui com o retorno elástico do sistema respiratório.",
    pressure: "Maior que a pressão atmosférica.",
    airflow: "O ar sai dos pulmões.",
    explanation: "Na respiração tranquila, os músculos inspiratórios relaxam e o retorno elástico reduz o volume pulmonar. A pressão alveolar sobe acima da atmosférica e o ar sai.",
    direction: "out",
  },
  {
    id: "fim-expiracao",
    title: "Fim da expiração",
    diaphragm: "Está relaxado e mais elevado, em forma de cúpula.",
    volume: "Retorna ao menor volume deste ciclo.",
    pressure: "Igual à pressão atmosférica.",
    airflow: "O fluxo de ar cessa momentaneamente.",
    explanation: "A pressão alveolar volta a se igualar à do ambiente. Ainda há ar nos pulmões ao final da expiração tranquila.",
    direction: "none",
  },
] as const;
