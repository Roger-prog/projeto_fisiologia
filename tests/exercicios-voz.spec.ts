import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { lessons } from "../src/data";

type RegistroDeVoz = {
  falas: { texto: string; idioma: string }[];
  interrupcoes: number;
  concluirTrecho: () => boolean;
};

const aula = lessons[0];
const pergunta = aula.questions[0];
const incorreta = pergunta.options.findIndex(({ id }) => id !== pergunta.correctOptionId);
const correta = pergunta.options.findIndex(({ id }) => id === pergunta.correctOptionId);
const nomeDaAlternativa = (indice: number) => `Alternativa ${"ABCD"[indice]}`;

test.use({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });

async function simularVoz(page: Page) {
  await page.addInitScript(() => {
    let trecho: SpeechSynthesisUtterance | null = null;
    const registro: RegistroDeVoz = {
      falas: [],
      interrupcoes: 0,
      concluirTrecho() {
        if (!trecho) return false;
        const anterior = trecho;
        trecho = null;
        anterior.dispatchEvent(new Event("end"));
        return true;
      },
    };
    Reflect.set(window, "vozDoExercicio", registro);

    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices: () => [],
        speak(utterance: SpeechSynthesisUtterance) {
          trecho = utterance;
          registro.falas.push({ texto: utterance.text, idioma: utterance.lang });
        },
        cancel() {
          trecho = null;
          registro.interrupcoes += 1;
        },
      },
    });
  });
}

function lerRegistroDeVoz(page: Page) {
  return page.evaluate(() => {
    const { falas, interrupcoes } = Reflect.get(window, "vozDoExercicio") as RegistroDeVoz;
    return { falas, interrupcoes };
  });
}

function lerRespostaSalva(page: Page) {
  return page.evaluate(({ aulaId, perguntaId }) => {
    const dados = JSON.parse(localStorage.getItem("fisioacessivel:study:v1") ?? "{}");
    return (dados.progress?.lessons?.[aulaId]?.responses?.[perguntaId]?.optionId ?? null) as string | null;
  }, { aulaId: aula.id, perguntaId: pergunta.id });
}

test("nomeia e narra alternativas sem confirmar até a ação explícita", async ({ page }) => {
  await simularVoz(page);
  await page.goto(`/autonomia/aulas/${aula.id}/exercicios/`);

  const exercicios = page.getByRole("region", { name: "Exercícios de fixação" });
  const alternativa = (indice: number) => exercicios.getByRole("radio", { name: nomeDaAlternativa(indice), exact: true });
  const ouvir = exercicios.getByRole("button", { name: "Ouvir pergunta e alternativas", exact: true });
  const conferir = exercicios.getByRole("button", { name: "Conferir resposta", exact: true });
  const feedback = exercicios.locator(".quiz-feedback");

  await expect(ouvir).toBeEnabled();
  expect((await lerRegistroDeVoz(page)).falas).toEqual([]);
  for (const [indice, opcao] of pergunta.options.entries()) {
    await expect(exercicios.getByText(nomeDaAlternativa(indice), { exact: true })).toBeVisible();
    await expect(alternativa(indice)).toHaveAccessibleDescription(opcao.text);
  }
  const alvo = await exercicios.locator(".quiz-option").nth(incorreta).boundingBox();
  expect(alvo?.height ?? 0).toBeGreaterThanOrEqual(48);

  await alternativa(incorreta).press("Space");
  await page.keyboard.press("ArrowRight");
  await expect(alternativa(incorreta + 1)).toBeChecked();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Enter");
  await expect(alternativa(incorreta)).toBeChecked();
  await expect(feedback).toHaveCount(0);
  expect(await lerRespostaSalva(page)).toBeNull();

  await ouvir.press("Enter");
  await expect(exercicios.getByText("Leitura em andamento.", { exact: true })).toBeVisible();
  const antesDaRepeticao = await lerRegistroDeVoz(page);
  await exercicios.getByRole("button", { name: "Repetir pergunta", exact: true }).press("Enter");
  await page.evaluate(() => {
    const registro = Reflect.get(window, "vozDoExercicio") as RegistroDeVoz;
    for (let trecho = 0; trecho < 30 && registro.concluirTrecho(); trecho += 1) {
      // O fim de cada trecho pode iniciar outro na API de síntese.
    }
  });
  await expect(exercicios.getByText("Leitura concluída.", { exact: true })).toBeVisible();
  const depoisDaRepeticao = await lerRegistroDeVoz(page);
  expect(depoisDaRepeticao.interrupcoes).toBeGreaterThan(antesDaRepeticao.interrupcoes);
  const repeticao = depoisDaRepeticao.falas.slice(antesDaRepeticao.falas.length);
  expect(repeticao.every(({ idioma }) => idioma === "pt-BR")).toBe(true);
  const texto = repeticao.map(({ texto }) => texto).join(" ");
  expect(texto).toContain(pergunta.prompt);
  for (const [indice, opcao] of pergunta.options.entries()) {
    expect(texto).toContain(`${nomeDaAlternativa(indice)}. ${opcao.text}`);
  }
  await expect(alternativa(incorreta)).toBeChecked();
  expect(await lerRespostaSalva(page)).toBeNull();

  await ouvir.press("Enter");
  const interrupcoes = (await lerRegistroDeVoz(page)).interrupcoes;
  await conferir.press("Enter");
  await expect(feedback).toBeFocused();
  await expect(feedback).toContainText("Resposta incorreta.");
  await expect(feedback).toContainText(nomeDaAlternativa(correta));
  await expect.poll(async () => (await lerRegistroDeVoz(page)).interrupcoes).toBeGreaterThan(interrupcoes);
  expect(await lerRespostaSalva(page)).toBe(pergunta.options[incorreta].id);

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(violations.map(({ id, nodes }) => ({ id, elementos: nodes.map(({ target }) => target) }))).toEqual([]);
});

test("ouve e interrompe uma questão da revisão sem alterar a resposta anterior", async ({ page }) => {
  await simularVoz(page);
  await page.goto(`/aulas/${aula.id}/`);

  const exercicios = page.getByRole("region", { name: "Exercícios de fixação" });
  await exercicios.getByRole("radio", { name: nomeDaAlternativa(incorreta), exact: true }).press("Space");
  await exercicios.getByRole("button", { name: "Conferir resposta", exact: true }).press("Enter");
  await expect(exercicios.locator(".quiz-feedback")).toContainText("Resposta incorreta.");

  await page.goto("/minhas-revisoes/");
  await page.getByRole("button", { name: "Iniciar sessão curta", exact: true }).press("Enter");
  const sessao = page.getByRole("region", { name: "Sessão curta de estudo" });
  const escolha = sessao.getByRole("radio", { name: nomeDaAlternativa(correta), exact: true });
  await expect(escolha).toHaveAccessibleDescription(pergunta.options[correta].text);
  await escolha.press("Space");
  await escolha.press("Enter");
  await expect(sessao.locator(".quiz-feedback")).toHaveCount(0);

  await sessao.getByRole("button", { name: "Ouvir pergunta e alternativas", exact: true }).press("Enter");
  await sessao.getByRole("button", { name: "Repetir pergunta", exact: true }).press("Enter");
  await sessao.getByRole("button", { name: "Parar leitura", exact: true }).press("Enter");
  await expect(sessao.getByText("Leitura interrompida.", { exact: true })).toBeVisible();
  await expect(escolha).toBeChecked();
  await expect(sessao.locator(".quiz-feedback")).toHaveCount(0);

  await sessao.getByRole("button", { name: "Conferir resposta", exact: true }).press("Enter");
  await expect(sessao.locator(".quiz-feedback")).toBeFocused();
  await expect(sessao.locator(".quiz-feedback")).toContainText("Resposta correta.");
  expect(await lerRespostaSalva(page)).toBe(pergunta.options[incorreta].id);
});
