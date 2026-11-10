import type { PhysiologyModule } from "./types";

export const modules: readonly PhysiologyModule[] = [
  {
    id: "cardiovascular",
    title: "Sistema Cardiovascular",
    description: "Estude como o coração bombeia o sangue, como os vasos o distribuem e como a circulação atende às necessidades dos tecidos.",
    topics: [
      {
        id: "introducao-ao-sistema-cardiovascular",
        title: "Introdução ao Sistema Cardiovascular",
        lessonId: "introducao-ao-sistema-cardiovascular",
      },
      { id: "musculo-cardiaco", title: "Propriedades do músculo cardíaco", lessonId: "musculo-cardiaco" },
      { id: "ciclo-cardiaco", title: "Ciclo cardíaco", lessonId: "ciclo-cardiaco" },
      { id: "regulacao-do-bombeamento", title: "Regulação do bombeamento cardíaco" },
      { id: "debito-cardiaco", title: "Débito cardíaco" },
      { id: "hemodinamica", title: "Hemodinâmica: princípios físicos da circulação" },
      { id: "circulacao-coronariana", title: "Circulação coronariana" },
      { id: "regulacao-da-pressao-arterial", title: "Regulação da pressão arterial" },
    ],
  },
  {
    id: "respiratorio",
    title: "Sistema Respiratório",
    description: "Entenda a estrutura dos pulmões, a mecânica da ventilação e o controle da respiração.",
    topics: [
      { id: "arquitetura-pulmonar", title: "Arquitetura pulmonar" },
      {
        id: "mecanica-respiratoria",
        title: "Mecânica Respiratória",
        lessonId: "mecanica-respiratoria",
      },
      { id: "volumes-e-capacidades-pulmonares", title: "Volumes e capacidades pulmonares" },
      { id: "ventilacao-alveolar", title: "Ventilação e ventilação alveolar" },
      { id: "controle-da-respiracao", title: "Controle da respiração" },
    ],
  },
];
