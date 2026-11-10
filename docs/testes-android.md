# Roteiro de avaliação no Android

O objetivo é observar se a pessoa consegue retomar uma etapa, ouvir, avançar e confirmar um exercício no Chrome sem ajuda física. Comece com Voice Access e TalkBack já configurados quando previstos para a rodada. Registre separadamente qualquer ajuda necessária para ativar esses serviços no Android.

## Preparar a sessão

1. Abra uma prévia HTTPS da versão que será avaliada. Use um perfil normal de teste no Chrome e mantenha o mesmo endereço durante toda a sessão, inclusive após fechar o aplicativo.
2. Use o aparelho em retrato. Repita em dois tamanhos de tela, incluindo um aparelho estreito. Em uma rodada, aumente a fonte do Android e o tamanho do texto da plataforma.
3. Configure o idioma do Android e do reconhecimento para português brasileiro, quando disponível. Anote as versões do Android, do Chrome, do Voice Access e do TalkBack, além da voz de síntese instalada.
4. Faça rodadas separadas com **Voice Access**, **TalkBack com o método de acionamento do estudante** e **Voice Access e TalkBack juntos**. Para testar um percurso sem gestos na tela, use a voz, o teclado ou o acionador em cada rodada, conforme o recurso avaliado.

O Google documenta um conjunto reduzido de comandos em português. Teste primeiro pelo rótulo visível, por exemplo **Tocar em Continuar estudando**. Se houver ambiguidade, teste **Mostrar números** e registre se a pessoa conseguiu identificar o destino pelo método assistivo que usa. [Voice Access em português](https://support.google.com/accessibility/android/answer/6151854?hl=pt-BR) · [Ativar o TalkBack](https://support.google.com/accessibility/android/answer/6007100?hl=pt-BR)

## Tarefas

| Tarefa | O que observar |
| --- | --- |
| Abrir o Chrome e entrar no site. Acionar **Estudar com acessibilidade por voz**. | O título e os controles principais são localizáveis. A abertura não inicia a síntese de fala. |
| Escolher uma aula em um perfil novo. Em outro perfil, partir de uma etapa já visitada e acionar **Continuar estudando**. | A aula e a etapa correspondem ao progresso local. O modo convencional continua acessível. |
| Acionar **Ouvir minhas opções** e consultar a versão em texto. | A orientação identifica a aula, a etapa, as ações e como continuar. Verificar se a fala do TalkBack interfere na compreensão ou no uso de comandos. |
| Acionar **Ouvir a etapa**, **Repetir explicação** e **Parar leitura**. Em seguida, usar **Próxima etapa** e **Etapa anterior**. | A repetição reinicia o trecho. A leitura anterior para ao mudar de etapa. A pessoa consegue ouvir novamente a etapa anterior e consultar seu resumo. Abrir ou ouvir uma etapa não a conclui. |
| Na última etapa, abrir **Fazer exercícios**. Usar **Ouvir pergunta e alternativas**, selecionar **Alternativa B**, usar **Repetir pergunta** e trocar a escolha antes de **Conferir resposta**. | As letras e os textos das alternativas podem ser consultados. A repetição mantém a escolha, e só a confirmação registra a resposta. O feedback explica o resultado e é alcançável com o recurso assistivo. |
| Consultar **Minhas Revisões** e retornar ao estudo. | O botão ou link correto é distinguível e o progresso da aula continua disponível. |
| Fechar o Chrome e reabri-lo pelo mesmo perfil e endereço. Entrar no modo de autonomia e acionar **Continuar estudando**. | O estudante volta à etapa registrada. As respostas confirmadas permanecem. A leitura precisa ser iniciada novamente pela pessoa. |

Para cada tarefa, anote se foi concluída de forma independente, concluída com ajuda ou ficou bloqueada. Registre o rótulo tentado, o retorno do sistema, a necessidade de repetir comandos e qualquer sobreposição de vozes. Peça à pessoa que descreva os momentos em que perdeu a referência da aula ou precisou de ajuda para tocar na tela. Repita uma rodada com a síntese indisponível para avaliar o percurso em texto e com leitor de tela.

## Cobertura automatizada

A suíte Playwright verifica a exportação estática no Chromium, com emulação de tela móvel em retrato. Ela cobre os nomes acessíveis, o percurso por teclado, a retomada em um perfil persistente reaberto, a confirmação dos exercícios, a ausência de fala automática e a troca entre narrações com APIs simuladas. O axe cobre regras verificáveis no navegador, incluindo telas estreitas.

Os resultados automatizados medem o comportamento da página. O reconhecimento das palavras em português, a ordem real de leitura do TalkBack, a convivência com a síntese de fala e o uso com acionadores e estudantes precisam das rodadas em aparelho real.
