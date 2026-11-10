import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { lessons } from "../src/data";
import { getLessonSteps, guidedLessonHref } from "../src/lib/lesson-steps";
import { getStepNarrationClips } from "../src/lib/narration-catalog";
import {
  arquivoDeTeste,
  clipesDaEtapa,
  concluirFaixaNativa,
  etapaDeTeste,
  lerReproducaoNativa,
  monitorarReproducaoNativa,
  rotaDaEtapa,
  servirManifestoSemClipes,
  servirNarracaoDeTeste,
  vozAlternativa,
  vozPrincipal,
} from "./fixtures/narracao";

test("decodifica MP3 da etapa no celular e oferece controles acessíveis sem síntese nativa", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await servirNarracaoDeTeste(page);
  await monitorarReproducaoNativa(page);
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, "speechSynthesis");
    Reflect.deleteProperty(window, "SpeechSynthesisUtterance");
  });
  await page.goto(rotaDaEtapa);

  const player = page.getByRole("region", { name: "Leitura da etapa em voz alta" });
  const ouvir = player.getByRole("button", { name: "Ouvir a etapa", exact: true });
  const voz = player.getByLabel("Voz da narração", { exact: true });
  const andamento = player.getByRole("progressbar", { name: "Andamento da leitura" });
  await expect(voz).toHaveValue(vozPrincipal);
  await expect(voz).toHaveAccessibleDescription(/geradas por inteligência artificial/);
  await expect(player.getByText(/As gravações com voz neural são geradas por inteligência artificial/)).toBeVisible();
  expect(await lerReproducaoNativa(page)).toEqual([]);

  await voz.selectOption(vozAlternativa);
  await player.getByLabel("Velocidade da leitura", { exact: true }).selectOption("1.25");
  await ouvir.press("Enter");
  await expect.poll(async () => (await lerReproducaoNativa(page)).at(-1)?.tempo ?? 0).toBeGreaterThan(0.3);
  const primeiraFaixa = (await lerReproducaoNativa(page)).at(-1)!;
  expect(primeiraFaixa).toMatchObject({ tocando: true, caminho: arquivoDeTeste(clipesDaEtapa[0].id, vozAlternativa), velocidade: 1.25 });
  expect(primeiraFaixa.duracao).toBeGreaterThan(9);
  await expect(andamento).toBeVisible();
  await expect(andamento).toHaveAttribute("aria-valuetext", /[1-9]\d*% concluído/);

  await player.getByRole("button", { name: "Pausar", exact: true }).press("Enter");
  const pausa = (await lerReproducaoNativa(page)).at(-1)!;
  expect(pausa.tocando).toBe(false);
  await expect(player.getByText("Leitura pausada.", { exact: true })).toBeVisible();
  expect(await page.locator("html").evaluate((elemento) => elemento.scrollWidth)).toBeLessThanOrEqual(360);
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(violations.map(({ id, nodes }) => ({ id, elementos: nodes.map(({ target }) => target) }))).toEqual([]);

  await player.getByRole("button", { name: "Continuar", exact: true }).press("Enter");
  await expect.poll(async () => (await lerReproducaoNativa(page)).at(-1)?.tempo ?? 0).toBeGreaterThan(pausa.tempo);
  await concluirFaixaNativa(page);
  await expect.poll(async () => (await lerReproducaoNativa(page)).at(-1)?.caminho)
    .toBe(arquivoDeTeste(clipesDaEtapa[1].id, vozAlternativa));

  await player.getByRole("button", { name: "Repetir explicação", exact: true }).press("Enter");
  await expect.poll(async () => (await lerReproducaoNativa(page)).at(-1)?.caminho)
    .toBe(arquivoDeTeste(clipesDaEtapa[0].id, vozAlternativa));
  await player.getByRole("button", { name: "Voltar ao começo", exact: true }).press("Enter");
  await expect(ouvir).toBeFocused();
  await expect(andamento).toHaveCount(0);
  expect((await lerReproducaoNativa(page)).some(({ tocando }) => tocando)).toBe(false);

  await ouvir.press("Enter");
  await player.getByRole("button", { name: "Interromper", exact: true }).press("Enter");
  await expect(player.getByText("Leitura interrompida.", { exact: true })).toBeVisible();
  expect((await lerReproducaoNativa(page)).some(({ tocando }) => tocando)).toBe(false);
  await expect(page.getByText(etapaDeTeste.paragraphs[0], { exact: true })).toBeVisible();
});

test("oferece voz do navegador quando a gravação falha e conserva a leitura em texto", async ({ page }) => {
  await servirNarracaoDeTeste(page, { falharArquivo: true });
  await page.addInitScript(() => {
    const chamadas: { idioma: string; velocidade: number; texto: string }[] = [];
    Reflect.set(window, "sinteseDepoisDoErro", chamadas);
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices: () => [],
        speak(fala: SpeechSynthesisUtterance) {
          chamadas.push({ idioma: fala.lang, velocidade: fala.rate, texto: fala.text });
        },
        cancel() {},
      },
    });
  });
  const chamadas = () => page.evaluate(() => Reflect.get(window, "sinteseDepoisDoErro") as {
    idioma: string; velocidade: number; texto: string;
  }[]);
  await page.goto(rotaDaEtapa);

  const player = page.getByRole("region", { name: "Leitura da etapa em voz alta" });
  const voz = player.getByLabel("Voz da narração", { exact: true });
  await expect(voz).toHaveValue(vozPrincipal);
  await player.getByLabel("Velocidade da leitura", { exact: true }).selectOption("1.25");
  await player.getByRole("button", { name: "Ouvir a etapa", exact: true }).press("Enter");
  await expect(player.getByRole("status")).toContainText("O áudio neural está indisponível.");
  await expect(page.getByText(etapaDeTeste.paragraphs[0], { exact: true })).toBeVisible();
  expect(await chamadas()).toEqual([]);

  await player.getByRole("button", { name: "Usar voz do navegador", exact: true }).press("Enter");
  await expect.poll(chamadas).toEqual([{ idioma: "pt-BR", velocidade: 1.25, texto: `${etapaDeTeste.title}.` }]);
  await expect(voz).toHaveValue("browser");
  await expect(player.getByText("Leitura em andamento.", { exact: true })).toBeVisible();
  await player.getByRole("button", { name: "Interromper", exact: true }).press("Enter");
  await expect(player.getByText("Leitura interrompida.", { exact: true })).toBeVisible();
});

test("atualiza as vozes nativas instaladas e permite escolher uma delas", async ({ page }) => {
  await servirManifestoSemClipes(page);
  await page.addInitScript(() => {
    let vozes: SpeechSynthesisVoice[] = [];
    const chamadas: string[] = [];
    const sintese = new EventTarget();
    class FalaSimulada {
      lang = "";
      rate = 1;
      voice: SpeechSynthesisVoice | null = null;
      onstart: (() => void) | null = null;
    }

    Object.defineProperty(window, "SpeechSynthesisUtterance", { value: FalaSimulada });
    Object.defineProperty(window, "speechSynthesis", {
      value: Object.assign(sintese, {
        getVoices: () => vozes,
        speak(fala: FalaSimulada) {
          chamadas.push(fala.voice?.voiceURI ?? "automática do dispositivo");
          queueMicrotask(() => fala.onstart?.());
        },
        cancel() {},
      }),
    });
    Reflect.set(window, "chamadasDasVozesNativas", chamadas);
    Reflect.set(window, "instalarVozesDeTeste", () => {
      vozes = [
        { name: "Voz local inicial", voiceURI: "local-br", lang: "pt-BR", localService: true, default: false },
        { name: "Voz Natural", voiceURI: "natural-br", lang: "pt-BR", localService: false, default: false },
        { name: "English test", voiceURI: "english", lang: "en-US", localService: true, default: true },
      ];
      sintese.dispatchEvent(new Event("voiceschanged"));
    });
  });
  const chamadas = () => page.evaluate(() => Reflect.get(window, "chamadasDasVozesNativas") as string[]);
  await page.goto(rotaDaEtapa);
  const player = page.getByRole("region", { name: "Leitura da etapa em voz alta" });
  const ouvir = player.getByRole("button", { name: "Ouvir a etapa", exact: true });
  const voz = player.getByLabel("Voz da narração", { exact: true });
  await expect(ouvir).toBeEnabled();
  await expect(voz).toHaveCount(0);
  await page.evaluate(() => (Reflect.get(window, "instalarVozesDeTeste") as () => void)());

  await expect(voz).toHaveValue("browser");
  await expect(voz.locator("option")).toHaveCount(3);
  await expect(voz.locator('option[value="browser:english"]')).toHaveCount(0);
  await ouvir.press("Enter");
  await expect.poll(chamadas).toEqual(["natural-br"]);

  await player.getByRole("button", { name: "Voltar ao começo", exact: true }).press("Enter");
  await voz.selectOption("browser:local-br");
  await ouvir.press("Enter");
  await expect.poll(chamadas).toEqual(["natural-br", "local-br"]);
});

test("exportação serve e decodifica as gravações incluídas nas duas aulas piloto", async ({ page, request }) => {
  type ManifestoPublicado = {
    version: number;
    voices: { id: string; language: string; kind: string }[];
    clips: Record<string, Record<string, { src: string }>>;
  };
  const resposta = await request.get("/audio/manifest.json");
  expect(resposta.status()).toBe(200);
  const manifesto = await resposta.json() as ManifestoPublicado;
  expect(manifesto.version).toBe(1);

  await monitorarReproducaoNativa(page);
  for (const aula of lessons) {
    const etapa = getLessonSteps(aula)[0];
    const clipes = getStepNarrationClips(aula, etapa);
    const voz = manifesto.voices.find(({ id, language, kind }) => language === "pt-BR" && kind === "neural"
      && clipes.every((clipe) => manifesto.clips[clipe.id]?.[id]?.src));
    expect(voz).toBeDefined();
    const faixa = manifesto.clips[clipes[0].id][voz!.id].src;
    expect(faixa).toMatch(/^\/audio\/[^?]+\.mp3$/);
    await page.goto(guidedLessonHref(aula.id, etapa.id));
    const player = page.getByRole("region", { name: "Leitura da etapa em voz alta" });
    await expect(player.getByText(/gravações com voz neural.*inteligência artificial/i)).toBeVisible();
    expect(await lerReproducaoNativa(page)).toEqual([]);

    await player.getByRole("button", { name: "Ouvir a etapa", exact: true }).press("Enter");
    await expect.poll(async () => (await lerReproducaoNativa(page)).at(-1)?.tempo ?? 0).toBeGreaterThan(0.1);
    expect((await lerReproducaoNativa(page)).at(-1)).toMatchObject({ caminho: faixa, tocando: true });
    await player.getByRole("button", { name: "Interromper", exact: true }).press("Enter");
  }
});
