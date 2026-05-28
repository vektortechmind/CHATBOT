# Story 019 - Instance Cards Dynamic Behavior And Pairing Cancel Safety

## Status

Implementada

## Objetivo

Como administrador do NexusZAP,
quero que a tela de instâncias trabalhe apenas com cards realmente dinâmicos e que o fluxo de conexão possa ser cancelado sem efeitos colaterais,
para evitar cards fixos indevidos, exclusões inconsistentes e estados falsos de pareamento após fechar o popup.

## Escopo

- remover da UI qualquer card fixo criado por padrão, incluindo `Agente Principal` e o card padrão de Telegram
- garantir que a tela de instâncias comece vazia quando não existirem instâncias reais criadas pelo usuário
- manter a criação apenas pelo card ou botão `+ Criar instância`
- corrigir a exclusão para que a instância apagada não reapareça automaticamente após refresh, polling ou reabertura da tela
- exibir ação de excluir também para cards/detalhes Telegram, respeitando as mesmas regras de bloqueio operacional das instâncias WhatsApp
- impedir exclusão de instância enquanto existir agente vinculado; nesse caso a ação deve permanecer visível, porém bloqueada, com orientação para excluir primeiro o agente
- impedir que o fechamento do modal/popup de conexão em `X` deixe a instância em estado operacional falso ou pendente
- ao fechar o popup de conexão do WhatsApp sem concluir o pareamento, limpar QR, estado local e qualquer marca visual de `aguardando conexão`
- garantir que a engrenagem reflita apenas o estado real salvo e não um estado transitório abandonado no modal
- remover da engrenagem qualquer bloco ou mensagem de QR/pareamento antes de o usuário clicar explicitamente em `Conectar`
- definir de forma objetiva quando um card Telegram passa a existir na grade, sem bootstrap implícito ou card reservado

## Critérios de aceitação

- não existem mais dois cards fixos padrão (`Agente Principal` e `Telegram`) quando o usuário ainda não criou instâncias
- a criação de instância começa exclusivamente por `+ Criar instância`
- toda instância exibida na grade corresponde a uma instância real persistida e criada pelo usuário
- o card Telegram só passa a existir depois que a instância Telegram for persistida com sucesso no fluxo de criação; abrir modal, iniciar preenchimento ou abrir popup não cria card por si só
- o card de Telegram, quando existir, também expõe ação de excluir instância
- uma instância com agente vinculado não pode ser excluída; a ação de excluir permanece visível, porém bloqueada, com mensagem orientando a excluir primeiro o agente responsável
- ao excluir uma instância, ela não reaparece sozinha após polling, refresh ou retorno à tela
- ao excluir uma instância sem agente vinculado, token Telegram, sessões, QR transitório, polling associado e estados temporários da instância também são removidos/encerrados
- fechar o popup de conexão do WhatsApp pelo `X` cancela o fluxo local sem manter `aguardando conexão`, QR aberto ou estado parcial
- se o usuário apenas clicar em `Conectar` e fechar o popup sem concluir o pareamento, a instância continua como desconectada/sem sessão operacional ativa
- a engrenagem e os detalhes operacionais mostram apenas estado real da instância
- antes de clicar em `Conectar`, a engrenagem não exibe `QR ainda não disponível`, nem qualquer copy que antecipe pareamento não iniciado

## Regras de negócio

- não deve existir instância operacional fixa criada apenas para ocupar espaço na UI
- Telegram continua singleton operacional no backend, mas só deve aparecer na grade quando existir como instância real persistida com sucesso no fluxo de criação
- excluir instância significa remover a instância do sistema; ela não pode ser recriada automaticamente sem ação explícita do usuário
- exclusão de instância só é permitida quando não existir agente vinculado a ela
- quando a instância estiver ocupada por agente, a ação de excluir continua visível apenas como bloqueio orientativo, sem efetivar remoção
- ao excluir uma instância elegível, o sistema deve limpar token Telegram, sessões, QR transitório, watchers/polling e quaisquer estados temporários ainda associados a ela
- estados transitórios de criação/conexão pertencem ao modal e devem ser descartados quando o usuário cancela o fluxo
- abrir QR ou iniciar conexão não equivale a instância conectada; o status só pode evoluir após confirmação operacional real
- a UI não pode promover estado `full`, `aguardando conexão` ou equivalente apenas porque o popup foi aberto em algum momento
- o conteúdo de QR e pareamento só pode existir após ação explícita do usuário para iniciar conexão

## Sugestão técnica

- revisar `frontend/src/pages/Instancia.tsx` para separar claramente instâncias persistidas de estados temporários do modal
- revisar o fluxo de criação para que nenhuma instância placeholder seja materializada antes da confirmação adequada do usuário
- revisar polling e hidratação inicial para evitar recriação automática de cards especiais
- revisar backend em `agent.routes.ts`, `instance.service.ts` e pontos de bootstrap para impedir recriação implícita de instâncias fixas pela tela de instâncias
- ao fechar o modal de conexão, executar limpeza explícita do estado local e interromper qualquer polling/espera vinculada ao QR atual
- validar que o mesmo contrato de exclusão funciona para cards WhatsApp e Telegram
- validar mensagem/bloqueio de exclusão quando a instância ainda estiver ocupada por um agente
- validar teardown completo de token/sessão/QR/runtime transitório quando a instância elegível for removida

## Arquivos prováveis

- `frontend/src/pages/Instancia.tsx`
- `backend/src/routes/agent.routes.ts`
- `backend/src/services/instance.service.ts`
- `backend/src/services/agent.service.ts`
- `backend/src/telegram/TelegramBotManager.ts`

## Checklist

- [x] cards fixos padrão removidos da tela de instâncias
- [x] criação inicia apenas por `+ Criar instância`
- [x] card Telegram só aparece após persistência bem-sucedida da instância no fluxo de criação
- [x] exclusão não permite reaparecimento automático da instância
- [x] ação de excluir disponível também para instâncias Telegram
- [x] exclusão de instância bloqueada quando houver agente vinculado, com orientação para excluir o agente antes
- [x] exclusão de instância elegível remove também token/sessões/QR e estado transitório associado
- [x] fechamento do popup cancela corretamente o fluxo de conexão
- [x] estado `aguardando conexão` não permanece após cancelamento do modal
- [x] engrenagem/detalhes exibem apenas estado operacional real
- [x] engrenagem não antecipa QR ou mensagens de pareamento antes de `Conectar`
