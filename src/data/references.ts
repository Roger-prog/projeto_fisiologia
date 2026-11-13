import type { Reference } from "./types";

const book = {
  authors: "J. Gordon Betts et al.",
  publication: "Anatomy and Physiology 2e, OpenStax",
  year: 2022,
};
const bookUrl = "https://openstax.org/books/anatomy-and-physiology-2e/pages";

export const references: readonly Reference[] = [
  {
    ...book,
    id: "openstax-coracao",
    title: "19.1 Heart Anatomy",
    url: `${bookUrl}/19-1-heart-anatomy`,
  },
  {
    ...book,
    id: "openstax-fisiologia-cardiaca",
    title: "19.4 Cardiac Physiology",
    url: `${bookUrl}/19-4-cardiac-physiology`,
  },
  {
    ...book,
    id: "openstax-vasos-fluxo",
    title: "20.2 Blood Flow, Blood Pressure, and Resistance",
    url: `${bookUrl}/20-2-blood-flow-blood-pressure-and-resistance`,
  },
  {
    ...book,
    id: "openstax-vasos",
    title: "20.1 Structure and Function of Blood Vessels",
    url: `${bookUrl}/20-1-structure-and-function-of-blood-vessels`,
  },
  {
    id: "blanco-doppler-debito",
    authors: "Pablo Blanco",
    title: "Rationale for using the velocity–time integral and the minute distance for assessing the stroke volume and cardiac output in point-of-care settings",
    publication: "The Ultrasound Journal, 12:21",
    year: 2020,
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7174466/",
  },
  {
    id: "basnet-rout-fick",
    authors: "Arjun Basnet; Preeti Rout",
    title: "Calculating FICK Cardiac Output and Input",
    publication: "StatPearls, NCBI Bookshelf",
    year: 2024,
    url: "https://www.ncbi.nlm.nih.gov/books/NBK606091/",
  },
  {
    ...book,
    id: "openstax-regulacao-vascular",
    title: "20.4 Homeostatic Regulation of the Vascular System",
    url: `${bookUrl}/20-4-homeostatic-regulation-of-the-vascular-system`,
  },
  {
    id: "ncbi-fisiologia-coronariana",
    authors: "Saad Rehman; Amir Khan; Afzal Rehman",
    title: "Physiology, Coronary Circulation",
    publication: "StatPearls, NCBI Bookshelf",
    year: 2023,
    url: "https://www.ncbi.nlm.nih.gov/books/NBK482413/",
  },
  {
    id: "pathania-clark-coronarias",
    authors: "V. Pathania; S. Clark",
    title: "The coronary circulation in healthy and diseased states",
    publication: "BJA Education, 24(6):210–216",
    year: 2024,
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11096616/",
  },
  {
    id: "ncbi-perfusao-coronariana",
    authors: "Samuel J. Heward; Pirbhat Shams; Jason Widrich",
    title: "Coronary Perfusion Pressure",
    publication: "StatPearls, NCBI Bookshelf",
    year: 2025,
    url: "https://www.ncbi.nlm.nih.gov/books/NBK551531/",
  },
  {
    ...book,
    id: "openstax-pulmoes",
    title: "22.2 The Lungs",
    url: `${bookUrl}/22-2-the-lungs`,
  },
  {
    ...book,
    id: "openstax-ventilacao",
    title: "22.3 The Process of Breathing",
    url: `${bookUrl}/22-3-the-process-of-breathing`,
  },
  {
    ...book,
    id: "openstax-trocas",
    title: "22.4 Gas Exchange",
    url: `${bookUrl}/22-4-gas-exchange`,
  },
];
