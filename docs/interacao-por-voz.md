# Interação por voz

No painel **Interação por voz**, leia o aviso de microfone e acione **Ativar interação por voz**. Use mouse, toque, teclado, leitor de tela ou um acionador que execute a ação padrão do botão. O atalho **Ir para a interação por voz** leva ao painel pelo teclado. Se o navegador pedir permissão, escolha se deseja concedê-la. Use HTTPS ou o endereço local de desenvolvimento. Depois que o painel indicar **Escutando**, fale um comando curto em português brasileiro.

Se o controle por voz do sistema já estiver configurado, peça a ele para acionar **Ativar interação por voz** pelo rótulo ou pelo número sobreposto, conforme o idioma e o recurso do dispositivo. Essa primeira ação vem do sistema operacional. Depois dela, os comandos de estudo são reconhecidos pelo navegador. **Lembrar preferência por interação por voz** destaca o botão em visitas futuras. Um novo carregamento completo da página exige ativação explícita do microfone. [Voice Access no Android](https://support.google.com/accessibility/android/answer/6151854?hl=pt-BR) · [Acesso por voz no Windows](https://support.microsoft.com/en-us/accessibility/windows/voice-access/use-voice-to-interact-with-items-on-the-screen) · [Controle por Voz da Apple](https://support.apple.com/111778)

| Onde | Exemplos de comandos |
| --- | --- |
| Qualquer tela | **Ajuda**, **ouvir minhas opções**, **continuar de onde parei**, **listar aulas**, **abrir aula Mecânica Respiratória**, **Minhas Revisões**, **encerrar voz** |
| Etapa guiada | **Próxima etapa**, **avançar**, **etapa anterior**, **ouvir a etapa**, **repetir explicação**, **fazer exercícios** |
| Intervalo entre trechos da narração | **Continuar leitura** ou **parar leitura** |
| Exercícios | **Ouvir pergunta**, **letra B**, **confirmar resposta**, **próxima pergunta** e **pergunta anterior** |
| Sessão de revisão já aberta em uma pergunta | **Ouvir pergunta**, **alternativa B** e **confirmar resposta** |

Diga a letra e aguarde o retorno da seleção antes de dizer **confirmar resposta** em um novo turno. Frases negativas ou com vários comandos juntos não são tratadas como confirmação. A confirmação por voz só aceita uma escolha feita por voz na pergunta atual. Também é possível selecionar com os controles da página e usar **Conferir resposta**.

A narração iniciada por voz lê um trecho e devolve o turno ao microfone. Durante a fala, use **Parar áudio** no painel para interromper imediatamente. O comando **parar leitura** funciona quando a escuta é retomada entre trechos. O player convencional continua disponível com sua leitura integral. **Encerrar interação por voz** finaliza a sessão pelo teclado, toque ou acionador.

As aulas piloto oferecem gravações neurais e voz do navegador. A escolha no reprodutor se aplica às mensagens de voz da aba quando houver gravações correspondentes. Alguns navegadores podem exigir tocar ou clicar em **Ouvir a etapa** para autorizar a reprodução de mídia. [Narração, alternativas e validação](narracao-neural.md)

## Sessão e privacidade

O painel indica autorização, escuta, processamento, narração, suspensão e recuperação. O silêncio por si só mantém a sessão ativa, inclusive além de dez minutos. Ao ocultar a página, a captura é suspensa. Ao voltar à mesma página, o site tenta retomar uma sessão já autorizada. A navegação interna mantém a sessão e um novo carregamento completo começa com o microfone desativado.

O reconhecimento permanece organizado em turnos, com `continuous = false`. A opção contínua permite vários resultados finais numa chamada, mas o site precisa liberar a escuta antes de cada resposta narrada. A retomada usa o evento de encerramento da API para separar os turnos e aguarda a narração terminar. Interrupções inesperadas e erros temporários de rede têm até quatro novas tentativas, após 0,5, 1, 2 e 4 segundos. O silêncio usa a espera progressiva sem esse limite de tentativas. Se a recuperação se esgotar ou o navegador exigir outro gesto, o painel orienta a reativação. Permissão negada ou revogada encerra a captura e exige uma nova ação do usuário. [Turnos e eventos de reconhecimento na Web Speech API](https://webaudio.github.io/web-speech-api/#speechreco-section)

O reconhecedor usa a Web Speech API do navegador. O processamento pode ocorrer no dispositivo ou depender do serviço de voz escolhido pelo navegador. Nesse segundo caso, o navegador pode enviar áudio captado ao serviço para transcrição. O FisioAcessível usa o texto retornado para interpretar o comando em memória, sem gravar áudio ou transcrições no armazenamento do site e sem anexar progresso ou identificadores de conta à solicitação de reconhecimento. Evite falar dados pessoais durante a escuta. O painel pausa a escuta antes de reproduzir áudio da plataforma e oferece encerramento explícito da sessão. [Especificação da Web Speech API](https://webaudio.github.io/web-speech-api/) · [Implementação de reconhecimento no Chrome](https://developer.chrome.com/blog/voice-driven-web-apps-introduction-to-the-web-speech-api)

## O que verificar em cada dispositivo

Os testes automatizados usam Chromium em computador, com eventos de reconhecimento e síntese simulados. Verificam comandos consecutivos após uma ativação, silêncio e sessões longas com relógio virtual, separação entre narração e escuta, navegação interna, recuperação, suspensão, bloqueios de permissão e encerramento. A API exposta pelo navegador não garante que o microfone e o serviço estejam disponíveis naquele dispositivo.

No Windows, Chrome 157 e Edge 157 foram verificados na exportação estática quanto à detecção da API, à ativação por teclado e à resposta do painel quando o navegador bloqueia o microfone. A concessão de permissão e o reconhecimento com um microfone real ainda precisam ser verificados nesses navegadores.

Faça a verificação manual com um microfone real no Chrome em computador e Android e no Safari em iPhone, iPad ou macOS. Anote navegador, versão, sistema, idioma, resultado do pedido de permissão e quais comandos funcionaram após a primeira ativação. Em Safari, confira a configuração da Siri quando o reconhecimento estiver indisponível. [Reconhecimento de fala no WebKit](https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/)

1. Ative pelo teclado ou pelo recurso assistivo do estudante. Teste permissão concedida, negada e revogada durante a sessão. Confirme que os controles convencionais continuam utilizáveis.
2. Abra uma aula pelo nome, avance com **próxima** ou **avançar** e volte uma etapa. Inicie a narração, verifique que a escuta pausa e tente **continuar leitura** e **parar leitura** no intervalo.
3. Abra os exercícios, ouça uma pergunta, selecione uma letra e confira que nada foi registrado. Confirme em outro turno e confira o comentário. Experimente **não confirmar resposta** e uma frase desconhecida.
4. Diga dez comandos com uma só ativação. Aguarde dois minutos em silêncio e diga outro comando. Mantenha uma sessão por mais de dez minutos e registre qualquer solicitação de nova ativação.
5. Alterne de aplicativo e volte. Verifique a pausa e a tentativa de retomada. Teste uma falha temporária de rede e o encerramento explícito. Após fechar e reabrir o navegador, ative por uma ação autorizada e confira a etapa e a resposta salvas.
6. Repita com TalkBack, VoiceOver ou NVDA e com o controle por voz do sistema ou acionador, conforme o dispositivo. Observe a leitura do estado de escuta, a possibilidade de localizar **Parar áudio** e a convivência da síntese do site com o leitor de tela.

## Diagnóstico opcional

Abra a página com `?diagnostico-voz=1` na URL, reproduza a falha e consulte **Diagnóstico de voz** no painel. Compare a ordem de início e fim do reconhecimento, recebimento de resultado, início e fim de áudio e tentativas de recuperação. Para relatar um problema, inclua navegador e versão, sistema, idioma, sequência de ações e os eventos próximos da falha. Os últimos 40 eventos ficam na memória da aba até recarregar. A lista contém somente eventos, horários, tentativas e códigos técnicos. Áudio e transcrições ficam fora do diagnóstico.

- `retry-scheduled` mostra que a página ainda tenta recuperar a escuta. O código do evento distingue silêncio, falha de rede e encerramento inesperado.
- `permission-denied` indica que é preciso conferir a permissão do site e ativar por uma ação explícita.
- `release-timeout` indica que o navegador não confirmou a liberação do turno anterior. Aguarde e tente ativar novamente. Se o bloqueio persistir, recarregue a página.

## Possível segundo reconhecedor

`VoiceRecognizer`, em `src/lib/voice-recognition.ts`, separa a captura e transcrição do interpretador de comandos e do gerenciador de sessão. Um reconhecedor local poderia captar áudio com consentimento explícito, transcrever em um worker com um modelo que suporte português brasileiro e liberar o microfone ao fim de cada turno. Seria preciso validar tamanho do modelo, memória, latência em celulares e qualidade da transcrição antes de oferecer a opção.

Uma alternativa remota com credenciais próprias exigiria um backend separado da exportação estática, com autenticação do serviço, limites de duração e taxa, descarte de áudio, ausência de registros com voz e uma explicação específica sobre dados e retenção. O site precisaria de uma opção explícita para escolher esse modo e um caminho de volta aos controles convencionais em caso de falha.
