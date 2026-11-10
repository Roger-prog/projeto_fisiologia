// These substitutions apply only to the text sent to the speech engine.
// Formulas with a context-dependent reading use the lesson's authored spoken field.
const pronunciation: Readonly<Record<string, string>> = {
  FisioAcessível: "Físio Acessível",
  "80 bpm": "oitenta batimentos por minuto",
  bpm: "batimentos por minuto",
  mmHg: "milímetros de mercúrio",
  "mL/min": "mililitros por minuto",
  "L/min": "litros por minuto",
  "mL": "mililitros",
};

const escapedTerms = Object.keys(pronunciation).map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
const pronunciationPattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${escapedTerms.join("|")})(?![\\p{L}\\p{N}])`, "gu");

export function prepareNarrationText(text: string) {
  return text.normalize("NFC")
    .replace(pronunciationPattern, (term) => pronunciation[term])
    .replace(/\s*\n\s*/gu, "\n")
    .trim();
}
