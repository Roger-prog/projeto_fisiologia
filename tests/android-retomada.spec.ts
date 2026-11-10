import { chromium, devices, expect, test } from "@playwright/test";

const lesson = "mecanica-respiratoria";
const guidedStage = `/aulas/${lesson}/guiado/expiracao/`;
const autonomyLesson = `/autonomia/aulas/${lesson}/`;
const { defaultBrowserType: _defaultBrowserType, ...mobile } = devices["Pixel 7"];

test("retoma a etapa e preserva a resposta depois de fechar e reabrir o navegador", async ({ baseURL }, testInfo) => {
  const profile = testInfo.outputPath("perfil-chromium");
  const options = { ...mobile, baseURL, locale: "pt-BR", channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL };
  const first = await chromium.launchPersistentContext(profile, options);

  try {
    const page = first.pages()[0];
    await page.goto(guidedStage);
    await expect(page.getByRole("heading", { name: "Na expiração tranquila, o pulmão recua", exact: true })).toBeFocused();
    await page.goto("/");
    await page.getByRole("link", { name: "Estudar com acessibilidade por voz", exact: true }).press("Enter");
    const resume = page.getByRole("link", { name: "Continuar estudando", exact: true });
    await expect(resume).toHaveAttribute("href", `${autonomyLesson}expiracao/`);
    await resume.press("Enter");
    await expect(page).toHaveURL(`${autonomyLesson}expiracao/`);

    const next = page.getByRole("link", { name: "Próxima etapa", exact: true });
    await next.press("Enter");
    await expect(page).toHaveURL(`${autonomyLesson}fluxo-e-resistencia/`);
    await expect(next).toHaveAttribute("href", `${autonomyLesson}resumo/`);
    await next.press("Enter");
    await expect(page).toHaveURL(`${autonomyLesson}resumo/`);
    await page.getByRole("link", { name: "Fazer exercícios", exact: true }).press("Enter");
    await page.getByRole("radio", { name: "Alternativa A", exact: true }).press("Space");
    await page.getByRole("button", { name: "Conferir resposta", exact: true }).press("Enter");
    await expect(page.locator(".quiz-feedback")).toBeFocused();
  } finally {
    await first.close();
  }

  const reopened = await chromium.launchPersistentContext(profile, options);
  try {
    const page = reopened.pages()[0];
    await page.goto("/");
    await page.getByRole("link", { name: "Estudar com acessibilidade por voz", exact: true }).press("Enter");
    const resume = page.getByRole("link", { name: "Continuar estudando", exact: true });
    await expect(resume).toHaveAttribute("href", `${autonomyLesson}resumo/`);
    await resume.press("Enter");
    await expect(page).toHaveURL(`${autonomyLesson}resumo/`);
    await page.getByRole("link", { name: "Fazer exercícios", exact: true }).press("Enter");
    await expect(page.getByRole("heading", { name: "Pergunta 2 de 5", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Pergunta anterior", exact: true }).press("Enter");
    await expect(page.getByRole("radio", { name: "Alternativa A", exact: true })).toBeChecked();
    await expect(page.locator(".quiz-feedback")).toContainText("Resposta incorreta.");
  } finally {
    await reopened.close();
  }
});
