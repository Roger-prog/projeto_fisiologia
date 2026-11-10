import { expect, test } from "@playwright/test";
import { lessons } from "../src/data";

test("recupera preferências, conclusão e respostas salvas pela versão anterior", async ({ page }) => {
  const [lesson] = lessons;
  const [question, nextQuestion] = lesson.questions;
  const correct = question.options.find(({ id }) => id === question.correctOptionId)!;
  const answeredAt = "2026-09-01T16:00:00.000Z";
  const storedResponse = { optionId: correct.id, answeredAt };

  await page.addInitScript(({ lessonId, lessonTitle, questionId, response }) => {
    if (sessionStorage.getItem("fixture-v1")) return;
    localStorage.setItem("fisioacessivel:study:v1", JSON.stringify({
      preferences: { contrast: "high", textSize: "large" },
      progress: {
        lastLesson: { id: lessonId, title: lessonTitle },
        lessons: {
          [lessonId]: { completedAt: response.answeredAt, responses: { [questionId]: response } },
        },
      },
    }));
    sessionStorage.setItem("fixture-v1", "true");
  }, { lessonId: lesson.id, lessonTitle: lesson.title, questionId: question.id, response: storedResponse });

  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "high");
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "large");
  await page.getByRole("link", { name: "Continuar estudando", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/aulas/${lesson.id}/$`));
  await expect(page.getByRole("button", { name: "Marcar aula como concluída" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(nextQuestion.prompt, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pergunta anterior", exact: true }).click();
  await expect(page.getByRole("radio", { name: correct.text, exact: true })).toBeChecked();

  await page.getByRole("banner").getByText("Acessibilidade", { exact: true }).click();
  await page.getByLabel("Tamanho do texto", { exact: true }).selectOption("extra-large");
  const saved = await page.evaluate((lessonId) => {
    const raw = localStorage.getItem("fisioacessivel:study:v1");
    return JSON.parse(raw!).progress.lessons[lessonId];
  }, lesson.id);
  expect(saved).toMatchObject({
    completedAt: answeredAt,
    responses: { [question.id]: storedResponse },
    questionPractice: { [question.id]: storedResponse },
    completedSteps: {},
    lastGuidedStep: null,
  });
});
