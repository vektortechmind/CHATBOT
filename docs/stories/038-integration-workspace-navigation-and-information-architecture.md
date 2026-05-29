# Story 038 - Integration Workspace Navigation And Information Architecture

## Status

Fechada

## Objetivo

Como operador do NexusZAP,
quero uma área própria de integrações no painel,
para separar credenciais, operação e documentação técnica sem misturar isso com o dashboard geral.

## Problema atual

A entrega atual de integrações ficou acoplada ao `Dashboard` principal.

Isso gera três problemas operacionais:

1. mistura métricas gerais do produto com observabilidade de integrações
2. não deixa claro onde o operador deve configurar credenciais por instância
3. coloca contrato técnico e operação no mesmo bloco visual, com navegação fraca

## Dependências explícitas desta fase

- esta story consolida a direção de UX para a story 031 já planejada localmente
- esta story depende da existência do endpoint operacional `GET /api/dashboard/integrations` já implementado na story 037
- esta story deve preservar o contrato funcional já implementado nas stories 032 a 037, sem alterar endpoint, auth ou dispatch

## Escopo

- criar uma entrada própria de menu para `Integrações`
- mover a seção `Integrações operacionais` para uma página dedicada
- definir uma arquitetura de informação clara para três superfícies:
  - `Credenciais`
  - `Operação`
  - `Documentação`
- manter o `Dashboard` principal focado em métricas gerais, canais e atividade agregada
- preservar o overview operacional já implementado, apenas reposicionando a experiência

## Fora de escopo

- alterar o contrato do endpoint `/api/integrations/events`
- alterar o catálogo de eventos suportados
- alterar templates ou regras de dispatch
- emitir token novo nesta story
- transformar documentação em CMS ou markdown público remoto

## Critérios de aceitação

- o painel possui uma navegação explícita para `Integrações`
- o `Dashboard` principal deixa de exibir o bloco operacional de integrações
- a nova área de integrações organiza a experiência em seções ou abas equivalentes para `Credenciais`, `Operação` e `Documentação`
- a seção `Operação` reutiliza dados persistidos já expostos pelo backend, sem regressão funcional
- a navegação deixa claro ao operador onde observar status e onde configurar credenciais
- `npm run build --prefix frontend` continua passando

## Regras de negócio

- `Dashboard` principal deve permanecer orientado a visão geral do produto
- `Integrações` é uma área operacional própria e não deve depender de leitura de arquivo local bruto
- a separação entre `Credenciais`, `Operação` e `Documentação` deve ser explícita para reduzir erro humano
- a mudança é de arquitetura de UX; não deve alterar regras já consolidadas de auth, replay, dedup ou dispatch

## Sugestão técnica

- adicionar uma rota dedicada, por exemplo `frontend/src/pages/Integracoes.tsx`
- extrair do `Dashboard.tsx` a composição visual do overview operacional
- criar um pequeno container ou feature dedicada em `frontend/src/features/integrations/`
- atualizar `Sidebar.tsx`, `App.tsx` e eventuais helpers de navegação

## Qualidade e testes obrigatórios

- adicionar teste focado de navegação/renderização da nova página de integrações
- validar que o dashboard principal não renderiza mais o bloco de integrações
- executar pelo menos:
  - `npm run build --prefix frontend`
  - `npm run lint`

## Referências técnicas desta fase

- UI atual em `frontend/src/pages/Dashboard.tsx`
- navegação atual em `frontend/src/App.tsx` e `frontend/src/components/Sidebar.tsx`
- overview operacional já exposto em `backend/src/routes/dashboard.routes.ts`

## Arquivos prováveis

- `frontend/src/App.tsx`
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Integracoes.tsx`
- `frontend/src/features/integrations/**`

## Checklist

- [x] menu dedicado de integrações criado
- [x] overview operacional removido do dashboard principal
- [x] arquitetura de informação separada em `Credenciais`, `Operação` e `Documentação`
- [x] experiência de navegação de integrações consolidada
- [x] testes focados adicionados

## Dev Agent Record

### Agent Model Used

- GPT-5 Codex

### Debug Log References

- `npm run lint`
- `npm run typecheck`
- `npm run build --prefix frontend`
- `npm run test:integration-dashboard --prefix frontend`
- `npm run test:integration-workspace --prefix frontend`

### Completion Notes List

- Criada a rota dedicada `/integracoes` com entrada explícita no menu lateral e resolução centralizada de títulos de navegação.
- O bloco `Integrações operacionais` foi removido do `Dashboard` principal e reposicionado em uma área operacional própria.
- A nova experiência separa explicitamente `Credenciais`, `Operação` e `Documentação`, preservando o overview operacional persistido já implementado na story 037.
- O overview operacional voltou a incluir visão resumida por instância, últimos registros e listas de `Ingressos recentes` e `Dispatches recentes`.
- Adicionado teste focado de navegação/renderização real da área de integrações com `MemoryRouter`, além da verificação de que o dashboard não incorpora mais a workspace.

### File List

- `frontend/package.json`
- `frontend/scripts/integration-workspace-state.test.tsx`
- `frontend/src/App.tsx`
- `frontend/src/components/Header.tsx`
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/features/integrations/IntegrationOperationsOverview.tsx`
- `frontend/src/features/integrations/IntegrationWorkspacePage.tsx`
- `frontend/src/features/integrations/workspace.ts`
- `frontend/src/features/navigation/appNavigation.ts`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Integracoes.tsx`

### Change Log

- 2026-05-29: story 038 implementada, validada e encerrada com workspace dedicada de integrações, overview operacional reposicionado e testes focados de navegação/renderização.
