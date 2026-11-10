import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { lessons } from "../src/data";
import { getLessonSteps, guidedLessonHref } from "../src/lib/lesson-steps";

const lesson = lessons.find(({ id }) => id === "mecanica-respiratoria")!;
const fullLesson = `/aulas/${lesson.id}/`;
const steps = getLessonSteps(lesson);
const [introduction, ventilation, pressures] = steps;
const stepPath = (id: string) => guidedLessonHref(lesson.id, id);

test("retoma a etapa correta e só conclui quando o estudante marca", async ({ page }) => {
  await page.goto(fullLesson);
  const guided = page.getByRole("link", { name: "Modo guiado", exact: true });
  await expect(guided).toHaveAttribute("href", stepPath(introduction.id));
  await guided.press("Enter");

  await expect(page.getByRole("heading", { name: introduction.title, level: 1 })).toBeFocused();
  const complete = page.getByRole("button", { name: "Marcar etapa como concluída" });
  await expect(complete).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("link", { name: "Próxima etapa" }).press("Enter");
  await expect(page).toHaveURL(stepPath(ventilation.id));

  await expect(page.getByRole("heading", { name: ventilation.title, level: 1 })).toBeFocused();
  await expect(page.getByText("Etapa 2 de 7")).toBeVisible();
  await expect(page.getByText(ventilation.objective, { exact: true })).toBeVisible();
  await expect(page.getByText(ventilation.summary!, { exact: true })).toBeVisible();
  await expect(page.getByText(pressures.paragraphs[0], { exact: true })).toHaveCount(0);
  await expect(complete).toHaveAttribute("aria-pressed", "false");
  await complete.press("Space");
  await expect(complete).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("status").filter({ hasText: "Etapa concluída" })).toBeVisible();

  await page.getByRole("link", { name: "Próxima etapa" }).press("Enter");
  await expect(page).toHaveURL(stepPath(pressures.id));
  await expect(complete).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("link", { name: "Etapa anterior" }).press("Enter");
  await expect(complete).toHaveAttribute("aria-pressed", "true");

  await page.goto("/");
  const resume = page.getByRole("link", { name: "Continuar estudando", exact: true });
  await expect(resume).toHaveAttribute("href", stepPath(ventilation.id));
  await resume.click();
  await expect(page.getByRole("heading", { name: ventilation.title, level: 1 })).toBeFocused();
  await expect(complete).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("link", { name: "Modo completo", exact: true }).click();
  await expect(page).toHaveURL(`${fullLesson}#${ventilation.id}`);
  await expect(page.getByRole("heading", { name: lesson.title, level: 1 })).toBeVisible();
  await expect(guided).toHaveAttribute("href", stepPath(ventilation.id));

  await page.goto("/");
  await expect(resume).toHaveAttribute("href", `${fullLesson}#${ventilation.id}`);
});

test("a leitura guiada repete a etapa e para ao navegar", async ({ page }) => {
  await page.addInitScript(() => {
    const calls: string[] = [];
    Reflect.set(window, "sectionSpeechCalls", calls);
    Object.defineProperty(window, "speechSynthesis", {
      value: Object.assign(new EventTarget(), {
        getVoices: () => [],
        speak: ({ text }: SpeechSynthesisUtterance) => calls.push(text),
        pause: () => {},
        resume: () => {},
        cancel: () => calls.push("cancel"),
      }),
    });
  });

  const calls = () => page.evaluate(() => Reflect.get(window, "sectionSpeechCalls") as string[]);
  await page.goto(stepPath(ventilation.id));
  const listen = page.getByRole("button", { name: "Ouvir a etapa", exact: true });
  await expect(listen).toBeEnabled();
  expect(await calls()).toEqual([]);

  await listen.press("Enter");
  await page.getByRole("button", { name: "Repetir explicação", exact: true }).press("Enter");
  expect(await calls()).toEqual([`${ventilation.title}.`, "cancel", `${ventilation.title}.`]);
  await page.getByRole("link", { name: "Próxima etapa" }).press("Enter");
  await expect(page.getByRole("heading", { name: pressures.title, level: 1 })).toBeFocused();
  await expect.poll(calls).toEqual([`${ventilation.title}.`, "cancel", `${ventilation.title}.`, "cancel"]);
  await expect(listen).toBeEnabled();
  await expect(page.getByRole("button", { name: "Interromper", exact: true })).toBeDisabled();
});

test("mantém a retomada ao abrir âncoras auxiliares e acompanha o histórico de etapas", async ({ page, context }) => {
  const home = await context.newPage();
  await home.goto("/");
  const resume = home.getByRole("link", { name: "Continuar estudando", exact: true });
  const introAnchor = `${fullLesson}#introducao`;
  const summaryAnchor = `${fullLesson}#resumo`;

  await page.goto(introAnchor);
  await expect(resume).toHaveAttribute("href", introAnchor);
  const outline = page.getByRole("navigation", { name: "Nesta aula" });
  await outline.getByRole("link", { name: "Resumo", exact: true }).click();
  await expect(resume).toHaveAttribute("href", summaryAnchor);

  await page.goBack();
  await expect(resume).toHaveAttribute("href", introAnchor);
  await page.goForward();
  await expect(resume).toHaveAttribute("href", summaryAnchor);

  await outline.getByRole("link", { name: "Diagrama", exact: true }).click();
  await expect(page).toHaveURL(`${fullLesson}#diagrama`);
  await expect(resume).toHaveAttribute("href", summaryAnchor);

  await outline.getByText("Seções da explicação", { exact: true }).press("Enter");
  const inspiration = outline.getByRole("link", { name: "Na inspiração, o diafragma desce", exact: true });
  await inspiration.press("Enter");
  await expect(page.getByRole("heading", { name: "Na inspiração, o diafragma desce", exact: true })).toBeFocused();
  await expect(resume).toHaveAttribute("href", `${fullLesson}#inspiracao`);
});

test("todas as etapas são servidas na exportação estática", async ({ request }) => {
  for (const item of lessons) {
    for (const step of getLessonSteps(item)) {
      const response = await request.get(guidedLessonHref(item.id, step.id));
      expect(response.status()).toBe(200);
      expect(await response.text()).toContain(step.paragraphs[0]);
    }
  }
});

test.describe("etapa em tela estreita", () => {
  test.use({ viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });

  test("mantém descrição sequencial e passa no axe com texto extra grande", async ({ page }) => {
    await page.goto(stepPath(lesson.figure.sectionId));
    const html = page.locator("html");
    await page.getByRole("banner").getByText("Acessibilidade", { exact: true }).click();
    await page.getByLabel("Tamanho do texto", { exact: true }).selectOption({ label: "Extra grande" });
    await expect(html).toHaveAttribute("data-text-size", "extra-large");
    const description = page.getByRole("list", { name: "Descrição sequencial do diagrama" });
    await expect(description.getByRole("listitem")).toHaveCount(lesson.figure.descriptionSteps.length);
    expect(await html.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(320);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(violations.map(({ id, nodes }) => ({ id, elements: nodes.map(({ target }) => target) }))).toEqual([]);
  });
});
