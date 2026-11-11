# Auditoria da narração neural

Em 11 de novembro de 2026, o manifesto da Vercel tinha 172 faixas e era idêntico ao manifesto do projeto antes da correção. Quatro aulas já publicadas pediam arquivos cujas referências e MP3 ainda estavam ausentes. O modo Guiado usava os mesmos identificadores que o Completo. No Chrome para Windows, **Propriedades do músculo cardíaco** exibiu o aviso de áudio indisponível nos dois modos antes de solicitar qualquer MP3. [Aula publicada](https://projetofisiologia.vercel.app/aulas/musculo-cardiaco/) · [Etapa publicada](https://projetofisiologia.vercel.app/aulas/musculo-cardiaco/guiado/introducao/) · [Manifesto publicado](https://projetofisiologia.vercel.app/audio/manifest.json)

Nas duas aulas que já tinham narração, as 35 faixas passaram por `HEAD` com status `200` e tipo `audio/mpeg` e por `GET` com intervalo de bytes com status `206`. O Chrome iniciou a reprodução nativa das duas aulas no modo Completo. [Introdução ao Sistema Cardiovascular](https://projetofisiologia.vercel.app/aulas/introducao-ao-sistema-cardiovascular/) · [Mecânica Respiratória](https://projetofisiologia.vercel.app/aulas/mecanica-respiratoria/)

| Aula | Completo publicado | Guiado publicado | Completo local | Guiado local |
| --- | ---: | ---: | ---: | ---: |
| Introdução ao Sistema Cardiovascular | 18/18 | 16/16 | 18/18 | 16/16 |
| Propriedades do músculo cardíaco | 0/20 | 0/17 | 20/20 | 17/17 |
| Ciclo cardíaco | 0/19 | 0/16 | 19/19 | 16/16 |
| Regulação do bombeamento cardíaco | 0/23 | 0/20 | 23/23 | 20/20 |
| Débito cardíaco | 0/23 | 0/20 | 23/23 | 20/20 |
| Mecânica Respiratória | 17/17 | 15/15 | 17/17 | 15/15 |

As contagens do modo Guiado se referem aos trechos das etapas. O modo Completo usa essas mesmas faixas e acrescenta o título da aula e o glossário. A atualização usa a voz Cadu para as gravações novas e para as mensagens da interface que mudaram.

A exportação local passou na auditoria das 490 faixas, com 120 trechos de aulas e 370 mensagens de interface, exercícios e revisão. O FFmpeg decodificou todas as faixas e mediu duração entre 1,22 e 49,37 segundos por arquivo.

No Chrome 157 para Windows, as seis aulas chegaram a 100% no modo Completo e a etapa **Células cardíacas e discos intercalares** concluiu suas três faixas no modo Guiado. O teste iniciou os MP3 reais e adiantou a posição de cada faixa para verificar as transições pelo evento nativo de fim. Nenhuma requisição de MP3 falhou e nenhum trecho acionou a síntese do navegador.

Execute a auditoria no projeto e, após `npm run build`, também na pasta exportada.

```sh
npm run audio:audit
npm run audio:audit -- --export
npm run --silent audio:audit -- --export --json
npm run audio:audit -- --export --decode
```

O relatório mostra a cobertura por voz, aula, modo e seção. O JSON inclui todos os identificadores, caminhos e problemas encontrados. A auditoria confere a revisão SHA-256 do texto preparado, os caminhos do manifesto, os arquivos físicos e o cabeçalho MP3. `--decode` usa o FFmpeg do `PATH` ou o executável definido em `FISIO_FFMPEG` para decodificar cada faixa e informar sua duração. O comando retorna código `1` quando a cobertura está incompleta ou algum arquivo é inválido.
