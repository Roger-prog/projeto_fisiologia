import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { lessons } from "../src/data";
import { getStepSpeechText } from "../src/lib/lesson-speech";
import { getLessonSteps, guidedLessonHref } from "../src/lib/lesson-steps";
import { getLessonNarrationClips, getNarrationCatalog, getStepNarrationClips } from "../src/lib/narration-catalog";
import {
  aguardarFaixaNativa,
  arquivoDeTeste,
  clipesDaEtapa,
  concluirFaixaNativa,
  concluirSinteseDoNavegador,
  etapaDeTeste,
  lerReproducaoNativa,
  lerSinteseDoNavegador,
  monitorarReproducaoNativa,
  monitorarSinteseDoNavegador,
  rotaDaEtapa,
  servirManifestoSemClipes,
  servirNarracaoDeTeste,
  vozAlternativa,
  vozPrincipal,
} from "./fixtures/narracao";

test("o catálogo preserva parágrafos inteiros e inclui todas as alternativas e explicações", () => {
  const catalogo = new Map(getNarrationCatalog().map(({ id, text }) => [id, text]));
  for (const aula of lessons) {
    for (const etapa of getLessonSteps(aula)) {
      const paragrafos = getStepSpeechText(aula, etapa).split("\n").map((linha) => linha.trim()).filter(Boolean);
      expect(getStepNarrationClips(aula, etapa).flatMap(({ text }) => text.split("\n")), etapa.id).toEqual(paragrafos);
    }
    for (const pergunta of aula.questions) {
      const leitura = catalogo.get(`interface/pergunta/${pergunta.id}/leitura`);
      expect(leitura).toContain(pergunta.prompt);
      for (const [index, alternativa] of pergunta.options.entries()) {
        expect(leitura).toContain(`Alternativa ${"ABCD"[index]}. ${alternativa.text}`);
      }
      expect(catalogo.get(`interface/pergunta/${pergunta.id}/explicacao`)).toBe(pergunta.explanation);
    }
  }
});

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

test("uma faixa ausente impede a leitura parcial e a voz do navegador é uma escolha temporária", async ({ page }) => {
  let arquivoIndisponivel = true;
  const arquivoAusente = arquivoDeTeste(clipesDaEtapa[1].id, vozAlternativa);
  const requisicoes = await servirNarracaoDeTeste(page, {
    falha: ({ caminho }) => arquivoIndisponivel && caminho === arquivoAusente ? 404 : undefined,
  });
  await monitorarReproducaoNativa(page);
  await monitorarSinteseDoNavegador(page);
  await page.goto(rotaDaEtapa);

  const player = page.getByRole("region", { name: "Leitura da etapa em voz alta" });
  const voz = player.getByLabel("Voz da narração", { exact: true });
  const ouvir = player.getByRole("button", { name: "Ouvir a etapa", exact: true });
  await voz.selectOption(vozAlternativa);
  await player.getByLabel("Velocidade da leitura", { exact: true }).selectOption("1.25");
  await ouvir.press("Enter");
  await expect(player.getByRole("status")).toContainText("O áudio neural está indisponível.");
  await expect(page.getByText(etapaDeTeste.paragraphs[0], { exact: true })).toBeVisible();
  expect(requisicoes).toContainEqual({ caminho: arquivoAusente, metodo: "HEAD", status: 404 });
  expect(await lerReproducaoNativa(page)).toEqual([]);
  expect(await lerSinteseDoNavegador(page)).toEqual([]);
  await expect(voz).toHaveValue(vozAlternativa);

  await player.getByRole("button", { name: "Usar voz do navegador", exact: true }).press("Enter");
  await expect.poll(async () => (await lerSinteseDoNavegador(page))[0]).toMatchObject({
    idioma: "pt-BR", velocidade: 1.25, texto: expect.stringMatching(/voz do navegador usada temporariamente/i),
  });
  await concluirSinteseDoNavegador(page);
  await expect(player.getByText("Leitura concluída.", { exact: true })).toBeVisible();
  const chamadasTemporarias = await lerSinteseDoNavegador(page);
  expect(chamadasTemporarias.some(({ texto }) => texto.includes(etapaDeTeste.title))).toBe(true);
  await expect(voz).toHaveValue(vozAlternativa);

  arquivoIndisponivel = false;
  await player.getByRole("button", { name: "Repetir explicação", exact: true }).press("Enter");
  await aguardarFaixaNativa(page, arquivoDeTeste(clipesDaEtapa[0].id, vozAlternativa));
  expect(await lerSinteseDoNavegador(page)).toEqual(chamadasTemporarias);
});

test("repete a verificação após erro transitório e inicia a gravação da voz selecionada", async ({ page }) => {
  const primeiroArquivo = arquivoDeTeste(clipesDaEtapa[0].id, vozAlternativa);
  let falhou = false;
  const requisicoes = await servirNarracaoDeTeste(page, {
    falha: ({ caminho, metodo }) => {
      if (falhou || caminho !== primeiroArquivo || metodo !== "HEAD") return;
      falhou = true;
      return 503;
    },
  });
  await monitorarReproducaoNativa(page);
  await monitorarSinteseDoNavegador(page);
  await page.goto(rotaDaEtapa);

  const player = page.getByRole("region", { name: "Leitura da etapa em voz alta" });
  const voz = player.getByLabel("Voz da narração", { exact: true });
  await voz.selectOption(vozAlternativa);
  await player.getByRole("button", { name: "Ouvir a etapa", exact: true }).press("Enter");
  await aguardarFaixaNativa(page, primeiroArquivo);
  expect(requisicoes.filter(({ caminho, metodo }) => caminho === primeiroArquivo && metodo === "HEAD")
    .map(({ status }) => status)).toEqual([503, 200]);
  await expect(voz).toHaveValue(vozAlternativa);
  expect(await lerSinteseDoNavegador(page)).toEqual([]);
});

test("mantém a voz ao abrir o modo completo e lê toda a aula sem síntese do navegador", async ({ page }) => {
  const aula = lessons.find(({ id }) => id === "mecanica-respiratoria")!;
  await servirNarracaoDeTeste(page, { catalogoCompleto: true, faixasCurtas: true });
  await monitorarReproducaoNativa(page);
  await monitorarSinteseDoNavegador(page);
  await page.goto(rotaDaEtapa);

  await page.getByLabel("Voz da narração", { exact: true }).selectOption(vozAlternativa);
  await page.getByRole("link", { name: "Modo completo", exact: true }).press("Enter");
  await expect(page).toHaveURL(`/aulas/${aula.id}/#${etapaDeTeste.id}`);
  const player = page.getByRole("region", { name: "Leitura em voz alta", exact: true });
  await expect(player.getByLabel("Voz da narração", { exact: true })).toHaveValue(vozAlternativa);
  expect(await lerReproducaoNativa(page)).toEqual([]);

  await player.getByRole("button", { name: "Ouvir a aula", exact: true }).press("Enter");
  for (const { id } of getLessonNarrationClips(aula)) {
    await aguardarFaixaNativa(page, arquivoDeTeste(id, vozAlternativa));
    await concluirFaixaNativa(page);
  }
  await expect(player.getByText("Leitura concluída.", { exact: true })).toBeVisible();
  await expect(player.getByRole("progressbar", { name: "Andamento da leitura" })).toHaveAttribute("aria-valuetext", "100% concluído");
  expect(await lerSinteseDoNavegador(page)).toEqual([]);

  await page.reload();
  await expect(player.getByLabel("Voz da narração", { exact: true })).toHaveValue(vozAlternativa);
  expect(await lerReproducaoNativa(page)).toEqual([]);
  expect(await lerSinteseDoNavegador(page)).toEqual([]);
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
