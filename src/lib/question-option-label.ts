const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function getQuestionOptionLabel(index: number) {
  return `Alternativa ${letters[index] ?? index + 1}`;
}
