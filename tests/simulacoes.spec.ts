import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { breathingPhases, simulations } from "../src/data/simulations";

async function checkAxe(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations.map(({ id, nodes }) => ({ id, elements: nodes.map(({ target }) => target) }))).toEqual([]);
}

test("abre as duas simulações pelo catálogo e oferece retorno às aulas", async ({ page }) => {
  const response = await page.goto("/simulacoes/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Simulações", level: 1 })).toBeVisible();
  await checkAxe(page);

  for (const simulation of Object.values(simulations)) {
    await page.getByRole("link", { name: `Abrir simulação de ${simulation.title.toLowerCase()}` }).press("Enter");
    await expect(page.getByRole("heading", { name: simulation.title, level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: `Voltar à aula ${simulation.lessonTitle}` })).toHaveAttribute("href", `/aulas/${simulation.lessonId}/`);
    await page.getByRole("link", { name: "Todas as simulações" }).press("Enter");
    await expect(page.getByRole("heading", { name: "Simulações", level: 1 })).toBeVisible();
  }
});

test("compara frequências e revela interpretação pelo teclado, com áudio indisponível", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "AudioContext", { value: undefined });
  });
  await page.goto(simulations.heartRate.href);

  const result = page.getByRole("status").filter({ hasText: "entre batimentos" });
  const rateA = page.getByRole("combobox", { name: "Frequência do ritmo A" });
  const rateB = page.getByRole("combobox", { name: "Frequência do ritmo B" });
  await expect(result).toContainText("60 bpm · 1,00 segundo");
  await expect(result).toContainText("120 bpm · 0,50 segundos");

  await rateA.press("ArrowDown");
  await expect(rateA).toHaveValue("80");
  await expect(result).toContainText("80 bpm · 0,75 segundos");
  await expect(result).toContainText("O ritmo B tem 40 batimentos a mais por minuto");
  await rateB.press("ArrowUp");
  await expect(result).toContainText("100 bpm · 0,60 segundos");
  await rateB.press("ArrowUp");
  await expect(result).toContainText("mesma frequência e o mesmo intervalo");

  await page.getByRole("button", { name: "Ouvir ritmo A" }).press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "O som sintético está indisponível" })).toBeVisible();
  await expect(result).toContainText("80 bpm · 0,75 segundos");
  const question = page.locator("summary").filter({ hasText: "Qual é o menor intervalo" });
  await question.press("Space");
  await expect(page.getByText("Ao dobrar a frequência de um ritmo regular", { exact: false })).toBeVisible();
  await checkAxe(page);
});

test("o som só começa por solicitação e para ao trocar ritmo, ocultar a página ou interromper", async ({ page }) => {
  await page.addInitScript(() => {
    const calls: string[] = [];
    Reflect.set(window, "heartbeatCalls", calls);

    class TestAudioContext {
      sampleRate = 1000;
      state = "suspended";
      destination = {};

      constructor() { calls.push("create"); }
      async resume() { this.state = "running"; }
      async close() { this.state = "closed"; calls.push("close"); }
      createBuffer(_channels: number, frames: number) {
        return { frames, getChannelData: () => new Float32Array(frames) };
      }
      createBufferSource() {
        return {
          buffer: { frames: 0 },
          connect() {},
          disconnect() { calls.push("disconnect"); },
          start() { calls.push(`play ${this.buffer.frames}`); },
        };
      }
    }
    Object.defineProperty(window, "AudioContext", { value: TestAudioContext });
  });

  await page.goto(simulations.heartRate.href);
  const calls = () => page.evaluate(() => Reflect.get(window, "heartbeatCalls") as string[]);
  const playA = page.getByRole("button", { name: "Ouvir ritmo A" });
  const playB = page.getByRole("button", { name: "Ouvir ritmo B" });
  const stop = page.getByRole("button", { name: "Parar som" });
  expect(await calls()).toEqual([]);
  await expect(stop).toBeDisabled();

  await playA.press("Enter");
  await expect(page.getByText("Som do ritmo A em reprodução, a 60 bpm.")).toBeVisible();
  await playB.press("Space");
  await expect(page.getByText("Som do ritmo B em reprodução, a 120 bpm.")).toBeVisible();
  expect(await calls()).toEqual(["create", "play 1000", "disconnect", "close", "create", "play 500"]);

  await page.getByRole("combobox", { name: "Frequência do ritmo B" }).selectOption("100");
  await expect(stop).toBeDisabled();
  expect((await calls()).slice(-2)).toEqual(["disconnect", "close"]);

  await playB.press("Enter");
  await expect(page.getByText("Som do ritmo B em reprodução, a 100 bpm.")).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect(stop).toBeDisabled();
  expect((await calls()).slice(-3)).toEqual(["play 600", "disconnect", "close"]);

  await playA.press("Enter");
  await stop.press("Enter");
  await expect(page.getByText("Som interrompido.")).toBeVisible();
  expect((await calls()).slice(-2)).toEqual(["disconnect", "close"]);
});

test("informa bloqueio da reprodução e mantém a comparação disponível", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "AudioContext", {
      value: class {
        resume() { return Promise.reject(new DOMException("Blocked", "NotAllowedError")); }
        async close() {}
      },
    });
  });
  await page.goto(simulations.heartRate.href);
  await page.getByRole("button", { name: "Ouvir ritmo A" }).click();
  await expect(page.getByRole("status").filter({ hasText: "O navegador não conseguiu reproduzir o som" })).toBeVisible();
  await page.getByRole("combobox", { name: "Frequência do ritmo A" }).selectOption("100");
  await expect(page.getByRole("status").filter({ hasText: "100 bpm · 0,60 segundos" })).toBeVisible();
});

test("as fases respiratórias funcionam sem imagem nem áudio a 320 px e respeitam movimento reduzido", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Object.defineProperty(window, "AudioContext", { value: undefined });
  });
  await page.goto(simulations.breathing.href);
  const root = page.locator("html");
  await root.evaluate((element) => {
    element.dataset.contrast = "high";
    element.dataset.textSize = "extra-large";
  });
  const diagram = page.locator("svg[data-phase]");
  await expect(diagram.locator("g")).toHaveCSS("transition-property", "none");
  await expect(diagram).toHaveAttribute("aria-hidden", "true");
  await page.addStyleTag({ content: "svg[data-phase] { display: none !important; }" });

  const previous = page.getByRole("button", { name: "Fase anterior" });
  const next = page.getByRole("button", { name: "Próxima fase" });
  await expect(previous).toBeDisabled();
  for (const [index, phase] of breathingPhases.entries()) {
    await expect(page.getByRole("heading", { name: phase.title, exact: true })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: `Fase ${index + 1} de ${breathingPhases.length}` })).toBeVisible();
    for (const fact of [phase.diaphragm, phase.volume, phase.pressure, phase.airflow]) {
      await expect(page.locator("dd").filter({ hasText: fact })).toBeVisible();
    }
    if (index < breathingPhases.length - 1) await next.press("Enter");
  }
  await previous.press("Space");
  await expect(page.getByRole("heading", { name: "Expiração", exact: true })).toBeVisible();
  await next.press("Enter");
  await page.getByRole("button", { name: "Reiniciar ciclo" }).press("Enter");
  await expect(page.getByRole("heading", { name: "Inspiração", exact: true })).toBeVisible();
  expect(await root.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(320);
  await checkAxe(page);
});
