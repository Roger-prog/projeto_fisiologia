import { expect, test } from "@playwright/test";
import { lessons } from "../src/data";
import { getQuestionOptionLabel } from "../src/lib/question-option-label";

for (const aula of lessons) {
  const rota = `/aulas/${aula.id}/`;

  test(`carrega a figura com texto alternativo em ${aula.title}`, async ({ page }) => {
    await page.goto(rota);
    const figura = page.getByRole("img", { name: aula.figure.alt, exact: true });
    await expect(figura).toBeVisible();
    await figura.scrollIntoViewIfNeeded();
    await expect.poll(() => figura.evaluate((elemento) => (elemento as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    await expect(page.getByText(aula.figure.description, { exact: true })).toBeVisible();
  });

  test(`responde, revisita e refaz os exercícios de ${aula.title}`, async ({ page }) => {
    await page.goto(rota);
    const conferir = page.getByRole("button", { name: "Conferir resposta", exact: true });
    const primeira = aula.questions[0];
    const incorreta = primeira.options.find((opcao) => opcao.id !== primeira.correctOptionId)!;
    const opcaoIncorreta = page.getByRole("radio", {
      name: getQuestionOptionLabel(primeira.options.indexOf(incorreta)),
      exact: true,
    });
    const feedback = page.locator(".quiz-feedback");

    await conferir.press("Enter");
    await expect(page.getByRole("radio").first()).toBeFocused();
    await expect(feedback).toHaveCount(0);
    await opcaoIncorreta.press("Space");
    await expect(opcaoIncorreta).toBeChecked();
    await conferir.press("Enter");
    await expect(feedback).toBeFocused();
    await expect(feedback).toContainText("Resposta incorreta.");
    await expect(feedback).toContainText(primeira.explanation);

    const proxima = page.getByRole("button", { name: "Próxima pergunta", exact: true });
    await proxima.press("Enter");
    await expect(page.getByText(aula.questions[1].prompt, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Pergunta anterior", exact: true }).press("Enter");
    await expect(opcaoIncorreta).toBeChecked();

    await page.reload();
    await expect(page.getByText(aula.questions[1].prompt, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Pergunta anterior", exact: true }).press("Enter");
    await expect(opcaoIncorreta).toBeChecked();
    await expect(feedback).toContainText(primeira.explanation);
    await proxima.click();

    for (const [indice, pergunta] of aula.questions.slice(1).entries()) {
      await expect(page.getByText(pergunta.prompt, { exact: true })).toBeVisible();
      const correta = pergunta.options.find((opcao) => opcao.id === pergunta.correctOptionId)!;
      await page.getByRole("radio", { name: getQuestionOptionLabel(pergunta.options.indexOf(correta)), exact: true }).check();
      await conferir.click();
      await expect(feedback).toContainText("Resposta correta.");
      await expect(feedback).toContainText(pergunta.explanation);

      if (indice < aula.questions.length - 2) {
        await proxima.click();
      }
    }

    await page.getByRole("button", { name: "Ver resultado", exact: true }).click();
    const total = aula.questions.length;
    await expect(page.getByRole("heading", { name: "Exercícios concluídos", exact: true })).toBeFocused();
    await expect(page.getByText(`Você acertou ${total - 1} de ${total} questões.`, { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Conceitos para revisar", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Refazer pergunta 1", exact: true }).click();
    const correta = primeira.options.find((opcao) => opcao.id === primeira.correctOptionId)!;
    await page.getByRole("radio", { name: getQuestionOptionLabel(primeira.options.indexOf(correta)), exact: true }).check();
    await conferir.click();
    await page.getByRole("button", { name: "Ver resultado", exact: true }).click();
    await expect(page.getByText(`Você acertou ${total} de ${total} questões.`, { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Ir para a revisão rápida", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Revisão rápida", level: 1, exact: true })).toBeVisible();
    await expect(page.locator(`#revisao-${aula.id}`)).toBeInViewport();

    await page.goBack();
    await expect(page.getByText(`Você acertou ${total} de ${total} questões.`, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Refazer exercícios", exact: true }).click();
    await expect(opcaoIncorreta).toBeVisible();
    await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  });
}

test.describe("sem JavaScript e sem imagens", () => {
  test.use({ javaScriptEnabled: false });

  for (const aula of lessons) {
    test(`mantém o conteúdo de ${aula.title} disponível`, async ({ page }) => {
      await page.route("**/diagrams/**", (route) => route.abort("blockedbyclient"));
      await page.goto(`/aulas/${aula.id}/`);

      const artigo = page.getByRole("article", { name: aula.title });
      const figura = artigo.getByRole("img", { name: aula.figure.alt, exact: true });
      await figura.scrollIntoViewIfNeeded();
      await expect.poll(() => figura.evaluate((elemento) => {
        const imagem = elemento as HTMLImageElement;
        return imagem.complete && imagem.naturalWidth === 0;
      })).toBe(true);

      await expect(artigo.getByText(aula.objective, { exact: true })).toBeVisible();
      await expect(artigo.getByText(aula.introduction, { exact: true })).toBeVisible();
      for (const secao of aula.sections) {
        await expect(artigo.getByRole("heading", { name: secao.title, exact: true })).toBeVisible();
        await expect(artigo.getByText(secao.paragraphs[0], { exact: true })).toBeVisible();
      }
      await expect(artigo.getByText(aula.figure.description, { exact: true })).toBeVisible();
      await expect(artigo.getByText(aula.summary[0], { exact: true })).toBeVisible();
      await expect(artigo.getByRole("heading", { name: "Referências da aula", exact: true })).toBeVisible();
    });
  }
});

test("retoma a aula salva e apaga o progresso por confirmação", async ({ page }) => {
  const aula = lessons[0];
  const rota = `/aulas/${aula.id}/`;
  const retomar = page.getByRole("link", { name: "Continuar estudando", exact: true });
  const marcar = page.getByRole("button", { name: "Marcar aula como concluída", exact: true });

  await page.goto("/");
  await expect(retomar).toHaveCount(0);
  await page.goto(rota);
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Conferir resposta", exact: true }).click();
  await marcar.click();
  await expect(marcar).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Aula concluída", { exact: true })).toBeVisible();

  await page.goto("/");
  await expect(retomar).toHaveAttribute("href", rota);
  await retomar.click();
  await expect(marcar).toHaveAttribute("aria-pressed", "true");

  await page.goto("/revisao/");
  const apagar = page.getByRole("button", { name: "Apagar progresso", exact: true });
  await apagar.click();
  const confirmar = page.getByRole("button", { name: "Confirmar exclusão", exact: true });
  await expect(confirmar).toBeFocused();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(apagar).toBeFocused();
  await page.goto("/");
  await expect(retomar).toBeVisible();

  await page.goto("/revisao/");
  await apagar.click();
  await confirmar.click();
  await expect(page.getByRole("status").filter({ hasText: "Progresso apagado deste navegador." })).toBeVisible();

  await page.goto("/");
  await expect(retomar).toHaveCount(0);
  await page.goto(rota);
  await expect(marcar).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("radio").first()).not.toBeChecked();
});

test("revela respostas da Revisão rápida pelo teclado", async ({ page }) => {
  await page.goto("/revisao/");

  for (const aula of lessons) {
    const cartao = aula.quickReview[0];
    const pergunta = page.locator("summary").filter({ hasText: cartao.prompt });
    const resposta = page.getByText(cartao.answer, { exact: true });
    await expect(pergunta).toBeVisible();
    await expect(resposta).toBeHidden();
    await pergunta.press("Enter");
    await expect(resposta).toBeVisible();
    await pergunta.press("Space");
    await expect(resposta).toBeHidden();
  }
});

test("mantém a aula disponível quando o navegador não oferece síntese de voz", async ({ page }) => {
  const aula = lessons[0];
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, "speechSynthesis");
    Reflect.deleteProperty(window, "SpeechSynthesisUtterance");
  });
  await page.goto(`/aulas/${aula.id}/`);

  await expect(page.getByText("A leitura em voz alta não está disponível neste navegador.")).toBeVisible();
  await expect(page.getByText(aula.introduction, { exact: true })).toBeVisible();
  await expect(page.getByRole("radio").first()).toBeVisible();
});

test("controla a leitura em voz alta sem iniciar automaticamente", async ({ page }) => {
  await page.addInitScript(() => {
    const chamadas: string[] = [];
    Reflect.set(window, "chamadasDeSintese", chamadas);

    Object.defineProperty(window, "speechSynthesis", {
      value: Object.assign(new EventTarget(), {
        getVoices: () => [],
        speak: (utterance: SpeechSynthesisUtterance) => {
          chamadas.push(`speak ${utterance.lang} ${utterance.rate}`);
        },
        pause: () => chamadas.push("pause"),
        resume: () => chamadas.push("resume"),
        cancel: () => chamadas.push("cancel"),
      }),
    });
  });

  const ler = page.getByRole("button", { name: "Ouvir a aula", exact: true });
  const chamadas = () => page.evaluate(() => Reflect.get(window, "chamadasDeSintese") as string[]);
  await page.goto(`/aulas/${lessons[0].id}/`);
  await expect(ler).toBeEnabled();
  expect((await chamadas()).filter((chamada) => chamada.startsWith("speak"))).toEqual([]);

  await page.getByLabel("Velocidade da leitura", { exact: true }).selectOption("1.25");
  await ler.press("Enter");
  await page.getByRole("button", { name: "Pausar", exact: true }).press("Enter");
  await page.getByRole("button", { name: "Continuar", exact: true }).press("Enter");
  await page.getByRole("button", { name: "Parar leitura", exact: true }).press("Enter");
  await expect(ler).toBeEnabled();
  expect((await chamadas()).slice(-4)).toEqual(["speak pt-BR 1.25", "pause", "resume", "cancel"]);
});

test("avisa quando a síntese falha e mantém o texto da aula disponível", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices: () => [],
        speak: (utterance: SpeechSynthesisUtterance) => {
          queueMicrotask(() => utterance.dispatchEvent(new Event("error")));
        },
        cancel: () => {},
      },
    });
  });

  const [aula] = lessons;
  await page.goto(`/aulas/${aula.id}/`);
  const audio = page.getByRole("region", { name: "Leitura em voz alta", exact: true });
  await audio.getByRole("button", { name: "Ouvir a aula", exact: true }).press("Enter");
  await expect(audio.getByRole("status")).toContainText("Não foi possível reproduzir a leitura em voz alta.");
  await expect(audio.getByRole("button", { name: "Ouvir a aula", exact: true })).toBeEnabled();
  await expect(page.getByText(aula.introduction, { exact: true })).toBeVisible();
});
