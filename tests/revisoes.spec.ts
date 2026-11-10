import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { lessons } from "../src/data";
import { getQuestionOptionLabel } from "../src/lib/question-option-label";
import { isReviewDue, scheduleReview } from "../src/lib/review-schedule";

function dia(numero: number) {
  return new Date(2026, 10, numero, 12);
}

test("avança por 1, 3 e 7 dias e mantém o conceito na fila", () => {
  const primeira = scheduleReview(undefined, "easy", dia(9));
  expect(primeira.dueAt).toBe(dia(10).toISOString());
  expect(isReviewDue(primeira.dueAt, dia(9))).toBe(false);
  expect(isReviewDue(primeira.dueAt, dia(10))).toBe(true);
  expect(scheduleReview(primeira, "easy", dia(9)).dueAt).toBe(primeira.dueAt);

  const segunda = scheduleReview(primeira, "easy", dia(10));
  const terceira = scheduleReview(segunda, "easy", dia(13));
  expect(segunda.dueAt).toBe(dia(13).toISOString());
  expect(terceira.dueAt).toBe(dia(20).toISOString());
  expect(scheduleReview(terceira, "easy", dia(20)).dueAt).toBe(dia(27).toISOString());
  expect(scheduleReview(terceira, "hard", dia(20)).dueAt).toBe(dia(23).toISOString());
  expect(scheduleReview(terceira, "hard", dia(19)).dueAt).toBe(terceira.dueAt);
  expect(scheduleReview(terceira, "forgot", dia(13)).dueAt).toBe(dia(14).toISOString());
});

test("registra um cartão, mostra a revisão no dia previsto e permite apagar o histórico", async ({ page }) => {
  const cartao = lessons[0].quickReview[0];
  await page.clock.setFixedTime(dia(9));
  await page.goto("/revisao/");

  const detalhes = page.locator(`#cartao-${cartao.id}`);
  await detalhes.locator("summary").press("Enter");
  await detalhes.getByRole("button", { name: "Lembrei com dificuldade", exact: true }).press("Enter");
  const agendamento = detalhes.getByRole("status");
  await expect(agendamento).toContainText("Próxima revisão");
  await expect(agendamento.locator("time")).toHaveAttribute("datetime", dia(10).toISOString());

  await page.getByRole("link", { name: "Abrir Minhas Revisões", exact: true }).click();
  await expect(page).toHaveURL(/\/minhas-revisoes\/$/);
  const hoje = page.getByRole("region", { name: "Revisões de hoje" });
  const pratica = page.getByRole("region", { name: "Conceitos que precisam de mais prática" });
  const historico = page.getByRole("region", { name: "Histórico de revisão" });
  await expect(hoje).toContainText("Nenhuma revisão prevista para hoje.");
  await expect(pratica.getByRole("link", { name: cartao.prompt })).toBeVisible();
  await historico.locator("summary").press("Enter");
  await expect(historico.getByText(cartao.prompt, { exact: true })).toBeVisible();

  await page.clock.setFixedTime(dia(10));
  await page.reload();
  await expect(hoje.getByRole("link", { name: cartao.prompt })).toBeVisible();
  await page.getByRole("button", { name: "Apagar progresso", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar exclusão", exact: true }).click();
  await page.reload();
  await expect(hoje).toContainText("Nenhuma revisão prevista para hoje.");
  await expect(historico).toContainText("O histórico aparece quando você registra sua lembrança.");
});

test("refaz uma questão e combina exercícios anteriores com cartões na sessão curta", async ({ page }) => {
  const aula = lessons[0];
  const primeira = aula.questions[0];
  const incorreta = primeira.options.find((opcao) => opcao.id !== primeira.correctOptionId)!;
  const correta = primeira.options.find((opcao) => opcao.id === primeira.correctOptionId)!;
  const rota = `/aulas/${aula.id}/`;
  await page.clock.setFixedTime(dia(9));
  await page.goto(rota);
  const exercicios = page.getByRole("region", { name: "Exercícios de fixação" });
  const conferir = exercicios.getByRole("button", { name: "Conferir resposta", exact: true });

  for (const [indice, pergunta] of aula.questions.entries()) {
    const opcao = indice === 0 ? incorreta : pergunta.options.find((item) => item.id === pergunta.correctOptionId)!;
    await exercicios.getByRole("radio", { name: getQuestionOptionLabel(pergunta.options.indexOf(opcao)), exact: true }).check();
    await conferir.click();
    if (indice === 0) {
      await expect(exercicios.getByText(primeira.supplement)).toBeVisible();
      await expect(exercicios.getByRole("link", { name: "Rever o trecho da aula", exact: true }))
        .toHaveAttribute("href", `${rota}#${primeira.sectionId}`);
    }
    const seguinte = indice === aula.questions.length - 1 ? "Ver resultado" : "Próxima pergunta";
    await exercicios.getByRole("button", { name: seguinte, exact: true }).click();
  }

  await expect(exercicios.getByRole("heading", { name: "Desempenho por conteúdo" })).toBeVisible();
  await expect(exercicios.getByRole("heading", { name: "Conceitos que vale praticar" })).toBeVisible();
  const refazer = exercicios.getByRole("button", { name: "Refazer pergunta 1", exact: true });
  await refazer.press("Enter");
  await expect(exercicios.getByRole("heading", { name: "Pergunta 1 de 5", exact: true })).toBeFocused();
  await expect(exercicios.getByRole("radio", { checked: true })).toHaveCount(0);
  await exercicios.getByRole("radio", { name: getQuestionOptionLabel(primeira.options.indexOf(incorreta)), exact: true }).check();
  await conferir.click();

  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/minhas-revisoes/");
  const iniciar = page.getByRole("button", { name: "Iniciar sessão curta", exact: true });
  await iniciar.press("Enter");
  const sessao = page.getByRole("region", { name: "Sessão curta de estudo" });
  await expect(sessao.getByRole("heading", { name: "Conceito 1 de 5" })).toBeFocused();
  await expect(sessao.getByText(primeira.prompt, { exact: true })).toBeVisible();
  await sessao.getByRole("radio", { name: getQuestionOptionLabel(primeira.options.indexOf(correta)), exact: true }).press("Space");
  await sessao.getByRole("button", { name: "Conferir resposta", exact: true }).press("Enter");
  await expect(sessao.locator(".quiz-feedback")).toBeFocused();
  await expect(sessao.locator(".quiz-feedback")).toContainText("Resposta correta.");
  expect(await page.locator("html").evaluate((elemento) => elemento.scrollWidth)).toBeLessThanOrEqual(320);
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(violations.map(({ id, nodes }) => ({ id, elementos: nodes.map(({ target }) => target) }))).toEqual([]);
  await sessao.getByRole("button", { name: "Lembrei com facilidade", exact: true }).press("Enter");

  await expect(sessao.getByRole("heading", { name: "Conceito 2 de 5" })).toBeFocused();
  await sessao.getByRole("button", { name: "Revelar resposta", exact: true }).press("Enter");
  await sessao.getByRole("button", { name: "Não consegui lembrar", exact: true }).press("Enter");
  await sessao.getByRole("button", { name: "Encerrar sessão", exact: true }).press("Enter");
  await expect(iniciar).toBeFocused();

  const historico = page.getByRole("region", { name: "Histórico de revisão" });
  await historico.locator("summary").press("Enter");
  await expect(historico.getByText(primeira.prompt, { exact: true })).toBeVisible();
  await expect(historico.getByText(/Não consegui lembrar/)).toBeVisible();
  await page.goto(rota);
  await expect(refazer).toBeVisible();
});
