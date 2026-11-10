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
    id: "openstax-vasos",
    title: "20.1 Structure and Function of Blood Vessels",
    url: `${bookUrl}/20-1-structure-and-function-of-blood-vessels`,
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
