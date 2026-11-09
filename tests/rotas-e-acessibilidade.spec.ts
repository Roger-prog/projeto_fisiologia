import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const cardiovascular = "/aulas/introducao-ao-sistema-cardiovascular/";
const respiratoria = "/aulas/mecanica-respiratoria/";
const rotas = [
  "/",
  "/modulos/",
  cardiovascular,
  respiratoria,
  "/revisao/",
  "/referencias/",
];

async function verificarAcessibilidade(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(violations.map(({ id, help, nodes }) => ({
    id,
    help,
    elementos: nodes.map(({ target }) => target),
  }))).toEqual([]);
}

for (const rota of rotas) {
  test(`a rota estática ${rota} carrega em português e passa na análise axe`, async ({ page }) => {
    const erros: string[] = [];
    page.on("pageerror", (erro) => erros.push(erro.message));

    const resposta = await page.goto(rota);
    expect(resposta?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const ids = await page.locator("[id]").evaluateAll((elementos) => elementos.map((elemento) => elemento.id));
    expect(new Set(ids).size).toBe(ids.length);
    const destinosAusentes = await page.locator('a[href^="#"]').evaluateAll((links) => links
      .map((link) => link.getAttribute("href")!.slice(1))
      .filter((id) => !document.getElementById(id)));
    expect(destinosAusentes).toEqual([]);
    await verificarAcessibilidade(page);
    expect(erros).toEqual([]);
  });
}

test("uma aula inexistente retorna 404 e oferece acesso aos módulos", async ({ page }) => {
  const resposta = await page.goto("/aulas/aula-inexistente/");
  expect(resposta?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Página não encontrada" })).toBeVisible();
  await page.getByRole("link", { name: "Ver módulos", exact: true }).click();
  await expect(page).toHaveURL(/\/modulos\/$/);
});

test("os módulos oferecem links apenas para as aulas disponíveis", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Começar a estudar", exact: true }).click();
  await expect(page).toHaveURL(/\/modulos\/$/);
  await expect(page.getByText("Em desenvolvimento", { exact: true })).toHaveCount(11);

  const links = await page.getByRole("main").locator('a[href*="/aulas/"]').evaluateAll(
    (elementos) => [...new Set(elementos.map((elemento) => elemento.getAttribute("href")))].sort(),
  );
  expect(links).toEqual([cardiovascular, respiratoria]);
});

test("a navegação entre aulas leva ao próximo conteúdo disponível e permite voltar", async ({ page }) => {
  await page.goto(cardiovascular);
  const navegacao = page.getByRole("navigation", { name: "Navegação entre aulas disponíveis" });

  await navegacao.getByRole("link", { name: /Próxima aula/ }).click();
  await expect(page).toHaveURL(/\/aulas\/mecanica-respiratoria\/$/);
  await navegacao.getByRole("link", { name: /Aula anterior/ }).click();
  await expect(page).toHaveURL(/\/aulas\/introducao-ao-sistema-cardiovascular\/$/);
});

test("o primeiro Tab revela o atalho e Enter move o foco ao conteúdo", async ({ page }) => {
  await page.goto("/");

  const atalho = page.getByRole("link", { name: "Pular para o conteúdo" });
  await page.keyboard.press("Tab");
  await expect(atalho).toBeFocused();
  await expect(atalho).toBeInViewport();

  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Começar a estudar", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/modulos\/$/);
  const navegacao = page.getByRole("navigation", { name: "Navegação principal" });
  await expect(navegacao.getByRole("link", { name: "Módulos", exact: true })).toHaveAttribute("aria-current", "page");
});

test.describe("tela estreita", () => {
  test.use({ viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });

  test("reorganiza conteúdo com texto extra grande e salva as preferências", async ({ page }) => {
    await page.goto(respiratoria);
    const html = page.locator("html");
    const acessibilidade = page.getByRole("banner").getByText("Acessibilidade", { exact: true });
    const tamanhoInicial = await html.evaluate((elemento) => getComputedStyle(elemento).fontSize);
    const corDeFundo = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const corInicial = await corDeFundo();
    expect(await html.evaluate((elemento) => elemento.scrollWidth)).toBeLessThanOrEqual(320);

    await acessibilidade.click();
    await page.getByRole("button", { name: "Alto contraste", exact: true }).click();
    await page.getByLabel("Tamanho do texto", { exact: true }).selectOption({ label: "Extra grande" });
    await expect.poll(corDeFundo).not.toBe(corInicial);
    await expect.poll(() => html.evaluate((elemento) => Number.parseFloat(getComputedStyle(elemento).fontSize)))
      .toBeGreaterThan(Number.parseFloat(tamanhoInicial));
    expect(await html.evaluate((elemento) => elemento.scrollWidth)).toBeLessThanOrEqual(320);

    await verificarAcessibilidade(page);
    await page.reload();
    await acessibilidade.click();
    await expect(page.getByRole("button", { name: "Alto contraste", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Tamanho do texto", { exact: true })).toHaveValue("extra-large");
    expect(await html.evaluate((elemento) => elemento.scrollWidth)).toBeLessThanOrEqual(320);
  });
});
