import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { lessons } from "../src/data";
import { autonomyExercisesHref, autonomyStepHref } from "../src/lib/autonomy-routes";
import { getLessonSteps } from "../src/lib/lesson-steps";

const [cardiovascular, respiratory] = lessons;
const intro = getLessonSteps(cardiovascular)[0];
const respiratorySteps = getLessonSteps(respiratory);
const pressures = respiratorySteps.find(({ id }) => id === "pressoes")!;

test("abre a central e inicia a primeira etapa pelo teclado", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Estudar com acessibilidade por voz", exact: true }).press("Enter");
  await expect(page.getByRole("heading", { name: "Modo de Autonomia", level: 1 })).toBeFocused();
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Minhas Revisões", exact: true })).toHaveAttribute("href", "/minhas-revisoes/");
  const resume = page.getByRole("link", { name: "Continuar estudando", exact: true });
  await expect(resume).toHaveAttribute("href", autonomyStepHref(cardiovascular.id, intro.id));
  await page.keyboard.press("Tab");
  await expect(resume).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: intro.title, level: 1 })).toBeFocused();
  await expect(page.getByRole("link", { name: "Etapa anterior", exact: true })).toHaveCount(0);

  await page.getByRole("link", { name: "Voltar ao início", exact: true }).press("Enter");
  await page.getByRole("link", { name: "Voltar ao modo convencional", exact: true }).press("Enter");
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
});

test("retoma uma seção do modo completo e mantém a conclusão explícita", async ({ page }) => {
  await page.goto(`/aulas/${respiratory.id}/#${pressures.id}`);
  await expect.poll(() => page.evaluate(() => {
    const value = localStorage.getItem("fisioacessivel:study:v1");
    return value ? JSON.parse(value).progress?.lastLesson?.section?.id : null;
  })).toBe(pressures.id);

  await page.goto("/autonomia/");
  const resume = page.getByRole("link", { name: "Continuar estudando", exact: true });
  await expect(resume).toHaveAttribute("href", autonomyStepHref(respiratory.id, pressures.id));
  await expect(resume).toHaveAccessibleDescription(new RegExp(pressures.title));
  await resume.press("Enter");
  await expect(page.getByRole("heading", { name: pressures.title, level: 1 })).toBeFocused();

  const summary = page.locator("summary").filter({ hasText: "Consultar resumo e progresso" });
  await summary.press("Enter");
  await expect(page.getByText(pressures.summary!, { exact: true })).toBeVisible();
  const finish = page.getByRole("button", { name: "Marcar etapa como concluída", exact: true });
  await expect(finish).toHaveAttribute("aria-pressed", "false");
  await finish.press("Space");
  await expect(finish).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("link", { name: "Próxima etapa", exact: true }).press("Enter");
  const next = respiratorySteps[respiratorySteps.indexOf(pressures) + 1];
  await expect(page.getByRole("heading", { name: next.title, level: 1 })).toBeFocused();
  await page.getByRole("link", { name: "Etapa anterior", exact: true }).press("Enter");
  await expect(page.getByRole("heading", { name: pressures.title, level: 1 })).toBeFocused();
  await summary.press("Enter");
  await expect(finish).toHaveAttribute("aria-pressed", "true");
});

test("a etapa final abre os exercícios na interface simplificada", async ({ page }) => {
  await page.goto(autonomyStepHref(respiratory.id, "resumo"));
  await page.getByRole("link", { name: "Fazer exercícios", exact: true }).press("Enter");
  await expect(page).toHaveURL(autonomyExercisesHref(respiratory.id));
  await expect(page.getByRole("heading", { name: "Exercícios", level: 1 })).toBeFocused();
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Conferir resposta", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Voltar ao estudo", exact: true }).press("Enter");
  await expect(page).toHaveURL(autonomyStepHref(respiratory.id, "resumo"));
});

test.describe("sem JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("oferece o seletor de aulas e as etapas estáticas", async ({ page }) => {
    await page.goto("/autonomia/");
    await expect(page.getByRole("button", { name: "Continuar estudando", exact: true })).toBeDisabled();
    await page.getByText("Escolher aula", { exact: true }).press("Enter");
    await page.getByRole("link", { name: respiratory.title, exact: true }).press("Enter");
    await expect(page.getByText(respiratory.introduction, { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Próxima etapa", exact: true }).press("Enter");
    await expect(page.getByText(respiratory.sections[0].paragraphs[0], { exact: true })).toBeVisible();
  });
});

test.describe("tela estreita", () => {
  test.use({ viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });

  test("reorganiza a etapa com texto ampliado e alto contraste", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(autonomyStepHref(respiratory.id, pressures.id));
    const accessibility = page.getByRole("banner").getByText("Acessibilidade", { exact: true });
    await accessibility.press("Enter");
    const panel = page.locator(".accessibility-panel");
    await expect(panel).toBeVisible();
    expect(await panel.evaluate((node) => {
      const { left, right } = node.getBoundingClientRect();
      return left >= 0 && right <= document.documentElement.clientWidth;
    })).toBe(true);

    await page.setViewportSize({ width: 320, height: 720 });
    await page.getByRole("button", { name: "Alto contraste", exact: true }).press("Enter");
    const size = page.getByLabel("Tamanho do texto", { exact: true });
    await size.selectOption({ label: "Extra grande" });
    await size.press("Escape");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-text-size", "extra-large");
    await expect(html).toHaveAttribute("data-contrast", "high");
    expect(await html.evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(320);

    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(violations.map(({ id, nodes }) => ({ id, elements: nodes.map(({ target }) => target) }))).toEqual([]);
  });
});
