# Story 017 - Unified Agent Cards And Compact Settings Workspace

## Status

Fechada

## Objetivo

Como administrador do NexusZAP,
quero uma única função de agentes com card `Criar agente`, grid de agentes criados e configuração compacta por canal,
para eliminar telas separadas de Telegram e WhatsApp e concentrar toda a inteligência em um único workspace.

## Escopo

- remover a separação de telas de agente por canal, incluindo a tela dedicada de Telegram
- transformar a função `Agente` em uma grade de cards com um card inicial `Criar agente`
- listar todos os agentes já criados em forma de cards clicáveis
- ao clicar em um card de agente, abrir as configurações do agente selecionado
- no fluxo de criação, abrir popup com carrossel de escolha de canal
- se o canal escolhido for WhatsApp, solicitar nome do agente e instância WhatsApp disponível
- se o canal escolhido for Telegram, solicitar nome do agente, mostrar a instância Telegram conectada e exibir botão `Continuar`
- quando não existir instância Telegram operacional conectada, manter a opção `Telegram` visível no popup de criação, porém desabilitada
- mover `Runtime de IA` da tela de instâncias para a configuração do agente
- reorganizar a configuração do agente em painel compacto com cabeçalho único, abas e rodapé fixo
- incluir transcrição de áudio como controle simples do agente, sem fluxo separado de voz por agente
- permitir excluir agente

## Critérios de aceitação

- não existe mais tela separada de Telegram IA e WhatsApp IA
- a função `Agente` exibe um card `Criar agente`
- a função `Agente` exibe todos os agentes criados em forma de cards
- ao clicar em um card de agente, o usuário abre a configuração desse agente
- o popup de criação permite escolher o canal por carrossel ou seletor equivalente
- para WhatsApp, o fluxo exige nome do agente e instância disponível
- para Telegram, o fluxo não pede escolha manual de instância; mostra a instância Telegram conectada e permite continuar
- quando não existir instância Telegram operacional conectada, a opção `Telegram` continua visível, mas aparece desabilitada com mensagem curta de indisponibilidade
- provider, modelo, fallback e memória passam a ser configurados no contexto do agente
- a configuração do agente expõe transcrição de áudio como controle simples
- o agente pode ser excluído
- a configuração do agente usa cabeçalho único, abas e rodapé fixo com `Fechar` e `Salvar`

## Regras de negócio

- configuração de IA pertence ao agente, não à instância
- instância continua sendo apenas canal conectado/vinculado
- agentes são exibidos como cards; instâncias continuam exibidas na sua própria função do sistema
- no fluxo de WhatsApp, o usuário só pode selecionar instâncias disponíveis e não utilizadas
- no fluxo de Telegram, a criação depende da existência de uma instância Telegram operacional já conectada
- quando Telegram não estiver disponível, a UI deve informar a indisponibilidade sem esconder a opção do usuário
- transcrição de áudio é uma capacidade simples do agente e não deve introduzir subsistema separado de voz
- `Zona de perigo` fica dentro da aba `Agente`, não em página separada
- o botão `Fechar` deve sair do agente atual e voltar ao estado de lista/seleção de cards do workspace
- a exclusão do agente deve remover o vínculo operacional sem apagar automaticamente a instância do sistema

## Sugestão técnica

- remodelar `frontend/src/pages/Agente.tsx` para duas camadas: grid de cards e painel de configuração do agente selecionado
- criar modal de criação de agente com escolha de canal e passos contextuais
- remover dependência da página dedicada `Telegram.tsx` na navegação principal
- migrar as APIs de runtime hoje usadas por instância para persistência no agente ou em seu vínculo operacional
- separar os grupos funcionais em componentes menores para manter legibilidade
- preservar upload/lista de arquivos como aba própria com ações locais
- alinhar o controle de transcrição de áudio com a story `018`, sem reintroduzir campos de voz por agente

## Arquivos prováveis

- `frontend/src/pages/Agente.tsx`
- `frontend/src/pages/Telegram.tsx`
- `frontend/src/pages/Instancia.tsx`
- `frontend/src/App.tsx`
- `backend/prisma/schema.prisma`
- `backend/src/routes/agent.routes.ts`
- `backend/src/services/agent.service.ts`
- `backend/src/services/agentPrompt.ts`

## Checklist

- [x] função `Agente` unificada sem tela separada por canal
- [x] card `Criar agente` implementado
- [x] cards de agentes criados implementados
- [x] clique no card abre configuração do agente
- [x] popup de criação com escolha de canal implementado
- [x] fluxo WhatsApp com nome + instância disponível implementado
- [x] fluxo Telegram com instância conectada + `Continuar` implementado
- [x] opção `Telegram` visível porém desabilitada quando não houver instância operacional conectada
- [x] runtime de IA migrado para o agente
- [x] cabeçalho único de configuração implementado
- [x] navegação por abas implementada
- [x] grupos compactos com grid de 2 colunas implementados
- [x] controle simples de transcrição de áudio incluído no agente
- [x] aba `Arquivos` isolada do restante do formulário
- [x] `Zona de perigo` incluída na aba `Agente`
- [x] exclusão de agente implementada
- [x] rodapé fixo com status, `Fechar` e `Salvar` implementado

## File List

- `frontend/src/pages/Agente.tsx`
- `frontend/src/App.tsx`
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/components/Header.tsx`
- `backend/src/routes/agent.routes.ts`
- `backend/src/services/agent.service.ts`

## QA Results

- Revalidada em 28/05/2026.
- Sem findings.
- Confirmado que a transcricao de audio pode ser salva sem exigir provider de voz legado.
- Confirmado que provider, modelo e memoria passam a ser persistidos no agente e lidos no runtime com precedencia sobre a instancia.
- Confirmado que a exclusao do agente vinculado ao Telegram nao recria automaticamente o workspace primario; endpoints sensiveis agora retornam `404` quando o agente nao existe.
- Validacoes executadas com sucesso: `backend npm run build`, `backend npm test`, `frontend npm run build`.
- `frontend npm run lint` passou com 2 warnings pre-existentes em `frontend/src/contexts/ThemeContext.tsx`.
