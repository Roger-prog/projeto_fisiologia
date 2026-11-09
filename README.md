# FisioAcessível

Plataforma de estudos de Fisiologia Humana para monitoria universitária, com foco inicial em Engenharia Biomédica. As aulas combinam explicações em português brasileiro, diagramas descritos, leitura em voz alta, exercícios comentados e cartões de revisão.

O catálogo reúne 13 tópicos de dois sistemas. Nesta versão, estão disponíveis **Introdução ao Sistema Cardiovascular** e **Mecânica Respiratória**. Os demais tópicos aparecem como “Em desenvolvimento”.

## Executar no computador

Use Node.js 24, indicado no arquivo `.node-version`, e npm.

```sh
npm ci
npm run dev
```

Abra [localhost:3000](http://localhost:3000). Os comandos abaixo geram e abrem uma prévia da exportação de produção.

```sh
npm run build
npm run preview
```

A prévia serve o diretório `out/` em [127.0.0.1:4173](http://127.0.0.1:4173).

## Usar os recursos de estudo

- No menu **Acessibilidade**, ajuste o tamanho do texto ou ative o alto contraste. O site também respeita a preferência de movimento reduzido do dispositivo.
- Em cada aula, **Leitura em voz alta** usa a síntese do navegador sob demanda. Escolha a velocidade antes de começar. A voz, a disponibilidade da leitura e o funcionamento da pausa variam conforme o navegador e o dispositivo. O texto e as descrições das figuras ficam na própria página.
- Em **Exercícios de fixação**, confira a resposta para ver a explicação. Ao concluir, consulte o resultado, volte às questões ou refaça a atividade. O **Resumo** inclui o controle para marcar a aula como concluída.
- Na **Revisão rápida**, tente responder de memória antes de abrir cada cartão. Em **Seu progresso**, use **Apagar progresso** e confirme a exclusão das respostas, das conclusões e da última aula aberta.

As preferências, as respostas, a conclusão das aulas e a última aula visitada são armazenadas por origem no `localStorage`, sem dados pessoais. Se o armazenamento estiver bloqueado, os controles funcionam em memória durante a sessão da página. A síntese pode depender do serviço de voz que o navegador escolher.

## Testar

```sh
npm run typecheck
npx playwright install chromium
npm run build
npm run test:e2e
```

O Playwright inicia e encerra a prévia estática na porta 4173. Encerre uma prévia iniciada manualmente antes de rodar a suíte. Os testes verificam as rotas e a página 404, a leitura com JavaScript e imagens indisponíveis, os dois questionários, a retomada e exclusão do progresso, as preferências, a navegação por teclado e a síntese de voz simulada. Os testes de axe usam as regras disponíveis de nível A e AA até WCAG 2.2 e incluem tela de 320 px com alto contraste e texto ampliado.

### Validação manual pendente

WCAG 2.2 AA é a meta de desenvolvimento. Os testes automatizados cobrem critérios verificáveis no navegador. [WCAG 2.2 — W3C](https://www.w3.org/TR/WCAG22/)

- **NVDA no Windows, com Chrome ou Firefox.** Percorrer as regiões e os títulos, testar o link de salto, abrir as preferências e verificar os anúncios de pergunta, feedback, resultado e exclusão. Ler o texto alternativo e a descrição do diagrama.
- **VoiceOver no iOS e TalkBack no Android.** Percorrer o catálogo e uma aula, revelar as respostas dos cartões e completar um exercício com os gestos do leitor de tela e os ajustes de texto do dispositivo.
- **Voz real em português brasileiro.** Ouvir uma aula completa, testar pausa, retomada, interrupção e troca de página e observar o comportamento com o leitor de tela ativo.
- **Uso com estudantes.** Observar uma sessão de estudo com pessoas cegas ou com baixa visão, pessoas com mobilidade reduzida e pessoas com dificuldades de memória. Verificar legibilidade com ampliação do navegador, visibilidade de foco e facilidade para retomar uma tarefa com os recursos assistivos usados por cada participante.

## Publicar no Cloudflare Pages

1. Importe o repositório no Cloudflare Pages e selecione **Next.js (Static HTML Export)**.
2. Use `npm run build` como comando de compilação e `out` como diretório de saída. A versão de Node fica em `.node-version`.
3. Confirme a página inicial e o acesso direto às URLs das duas aulas após a publicação.

Também é possível enviar o conteúdo de `out/` pelo Direct Upload do Pages. O App Router gera HTML estático por rota com `output: "export"` e diretórios com `index.html`. [Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/) · [Exportação estática do Next.js](https://nextjs.org/docs/app/guides/static-exports)

## Adicionar conteúdo

| Local | Responsabilidade |
| --- | --- |
| `src/app/` | Páginas, rotas, metadados e estilos |
| `src/components/` | Navegação, elementos de página e recursos de estudo |
| `src/data/types.ts` | Tipos de módulo, aula, questões, cartões e créditos |
| `src/data/modules.ts` | Catálogo, títulos e ordem dos tópicos |
| `src/data/lessons/` e `src/data/questions/` | Texto das aulas, cartões e exercícios |
| `src/data/references.ts` e `src/data/credits.ts` | Bibliografia e origem das figuras |
| `src/lib/` | Persistência e síntese de voz |
| `public/diagrams/` e `public/licencas/` | Diagramas das aulas e avisos de licenças |
| `tests/` | Suíte Playwright |

Para disponibilizar uma aula, crie os dados tipados, adicione a aula à lista em `src/data/index.ts` e associe o `lessonId` ao tópico correspondente em `src/data/modules.ts`. A exportação gera a rota e a navegação entre as aulas disponíveis segue a ordem da lista. Preserve os IDs das aulas, questões e opções já usadas, pois o progresso usa esses identificadores.

Os IDs de cartão e os horários de resposta permitem acrescentar revisões espaçadas posteriormente. O componente de áudio usa o contrato `AudioPlayback` em `src/lib/speech-playback.ts`, que permite implementar controles equivalentes para gravações revisadas.

Os diagramas do piloto foram desenhados para acompanhar a sequência das aulas em português. As alternativas abertas avaliadas não traziam o mesmo recorte didático. As descrições, a autoria e a situação de licença estão na página **Referências e créditos**. [Esquema circulatório avaliado](https://commons.wikimedia.org/wiki/File:Circulatory_System_pt.svg) · [Esquema respiratório avaliado](https://commons.wikimedia.org/wiki/File:Mouvement_diaphragme_respiration.svg)
