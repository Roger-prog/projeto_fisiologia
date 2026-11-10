import { expect, test, type Page } from "@playwright/test";
import { lessons } from "../src/data";
import { getLessonSteps, guidedLessonHref } from "../src/lib/lesson-steps";
import { getQuestionOptionLabel } from "../src/lib/question-option-label";

const lesson = lessons[0];
const [firstStep, secondStep] = getLessonSteps(lesson);

async function mockSpeech(page: Page) {
  await page.addInitScript(() => {
    let current: SpeechSynthesisUtterance | undefined;
    const calls: string[] = [];
    Reflect.set(window, "speechCalls", calls);
    Reflect.set(window, "finishSpeech", () => {
      while (current) {
        const utterance = current;
        current = undefined;
        utterance.dispatchEvent(new Event("end"));
      }
    });
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices: () => [],
        speak: (utterance: SpeechSynthesisUtterance) => {
          calls.push(utterance.text);
          current = utterance;
        },
        cancel: () => {
          calls.push("cancel");
          const utterance = current;
          current = undefined;
          // Some browsers dispatch an event when a canceled utterance leaves the queue.
          utterance?.dispatchEvent(new Event("error"));
        },
      },
    });
  });
}

const getSpeechCalls = (page: Page) => page.evaluate(() => Reflect.get(window, "speechCalls") as string[]);
const finishSpeech = (page: Page) => page.evaluate(() => Reflect.get(window, "finishSpeech")());

test("orientação tem texto equivalente e substitui a narração da etapa sem sobrepor falas", async ({ page }) => {
  await mockSpeech(page);
  await page.goto(guidedLessonHref(lesson.id, firstStep.id));
  const options = page.getByRole("button", { name: "Ouvir minhas opções", exact: true });
  const listen = page.getByRole("button", { name: "Ouvir a etapa", exact: true });
  const stop = page.getByRole("button", { name: "Parar leitura", exact: true });
  await expect(listen).toBeEnabled();
  const details = page.locator("summary").filter({ hasText: "O que posso fazer nesta tela?" });
  await details.press("Enter");
  await expect(page.getByText(`Você está na aula ${lesson.title}.`, { exact: true })).toBeVisible();
  const currentStage = page.getByText(/^Tela atual\./);
  await expect(currentStage).toBeVisible();
  await expect(currentStage).toContainText(firstStep.title);
  expect(await getSpeechCalls(page)).toEqual([]);

  await listen.press("Enter");
  await expect(listen).toBeDisabled();
  await expect(stop).toHaveCount(1);
  await options.press("Enter");
  await expect(listen).toBeEnabled();
  await expect(options).toBeDisabled();
  await expect(stop).toHaveCount(1);
  expect((await getSpeechCalls(page)).slice(0, 3)).toEqual([
    `${firstStep.title}.`,
    "cancel",
    `Você está na aula ${lesson.title}.`,
  ]);

  await finishSpeech(page);
  const spoken = await getSpeechCalls(page);
  expect(spoken.find((part) => part.startsWith("Tela atual."))).toContain(firstStep.title);
  expect(spoken.join(" ")).toContain("Use Próxima etapa para avançar.");
  await expect(stop).toHaveCount(0);
  await expect(options).toBeEnabled();

  await listen.press("Enter");
  await stop.press("Enter");
  await expect(listen).toBeFocused();
  await expect(stop).toHaveCount(0);
  await page.getByRole("button", { name: "Repetir explicação", exact: true }).press("Enter");
  await page.getByRole("link", { name: "Próxima etapa", exact: true }).press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: secondStep.title })).toBeFocused();
  await expect.poll(async () => (await getSpeechCalls(page)).at(-1)).toBe("cancel");
});

test("ouvir e repetir as alternativas mantém a escolha e encerra a leitura anterior", async ({ page }) => {
  await mockSpeech(page);
  await page.goto(`/aulas/${lesson.id}/`);
  const [question] = lesson.questions;
  const listen = page.getByRole("button", { name: "Ouvir a aula", exact: true });
  const readQuestion = page.getByRole("button", { name: "Ouvir pergunta e alternativas", exact: true });
  const option = page.getByRole("radio", { name: getQuestionOptionLabel(1), exact: true });
  const stop = page.getByRole("button", { name: "Parar leitura", exact: true });
  await expect(readQuestion).toBeEnabled();
  expect(await getSpeechCalls(page)).toEqual([]);

  await listen.press("Enter");
  await option.press("Space");
  await expect(option).toBeChecked();
  await readQuestion.press("Enter");
  await expect(option).toBeChecked();
  await expect(stop).toHaveCount(1);
  await expect(listen).toBeEnabled();
  await finishSpeech(page);
  const spoken = (await getSpeechCalls(page)).join(" ");
  expect(spoken).toContain(`${lesson.title}. cancel ${question.prompt}`);
  for (const [index, item] of question.options.entries()) {
    expect(spoken).toContain(`${getQuestionOptionLabel(index)}. ${item.text}`);
  }

  await page.getByRole("button", { name: "Repetir pergunta", exact: true }).press("Enter");
  await expect(option).toBeChecked();
  await stop.press("Enter");
  await expect(readQuestion).toBeFocused();
  await expect(option).toBeChecked();
  await expect(page.locator(".quiz-feedback")).toHaveCount(0);
});
