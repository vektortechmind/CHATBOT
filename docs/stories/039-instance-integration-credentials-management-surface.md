# Story 039 - Instance Integration Credentials Management Surface

## Status

Fechada

## Objetivo

Como operador do NexusZAP,
quero uma superfície própria para selecionar a instância, ver seu `instanceId` e emitir ou rotacionar o `secretToken`,
para configurar integrações externas de forma segura e sem depender de suposição documental.

## Problema atual

O backend já possui o endpoint de integração e o modelo de credenciais por instância, mas o produto ainda não entrega uma superfície operacional clara para:

1. descobrir qual `instanceId` usar
2. obter o `endpointUrl` final correto
3. gerar ou regenerar o `secretToken`
4. copiar as credenciais necessárias sem erro manual

## Dependências explícitas desta fase

- esta story depende do modelo de autenticação por instância da story 032
- esta story depende do contrato final do endpoint `/api/integrations/events` já consolidado nas stories 033 a 036
- esta story depende da arquitetura de navegação da story 038
- esta story substitui a lacuna funcional deixada pela intenção original da story 031, alinhando a UX final ao estado real do produto

## Escopo

- exibir uma lista ou seletor de instâncias elegíveis dentro da área `Integrações`
- exibir `instanceId` da instância selecionada em modo somente leitura
- exibir `endpointUrl` final da integração em modo somente leitura
- exibir o estado da credencial ativa da instância
- permitir gerar credencial quando inexistente
- permitir regenerar `secretToken` quando já existir credencial ativa
- permitir copiar `instanceId`, `endpointUrl` e `secretToken`
- deixar claro quando a credencial foi rotacionada, está ativa, desativada ou ausente

## Fora de escopo

- analytics históricos aprofundados
- configuração de eventos por instância
- editor de templates
- documentação longa do contrato técnico

## Critérios de aceitação

- o usuário consegue selecionar uma instância a partir da área `Integrações`
- a UI mostra `instanceId` e `endpointUrl` final sem concatenação manual
- a UI permite gerar `secretToken` quando não existir credencial ativa
- a UI permite regenerar `secretToken`, invalidando o segredo anterior
- o `secretToken` é exibido de maneira segura, com comportamento explícito de cópia
- a UI comunica estado da credencial: ativa, desativada ou ausente
- o backend continua impedindo uso cruzado de token com instância divergente
- `npm run build --prefix frontend` e `npm test --prefix backend` continuam passando

## Regras de negócio

- a credencial pertence à instância, não ao plugin externo
- o operador não deve montar manualmente a URL final do endpoint
- o token anterior precisa ser invalidado após rotação
- a UI não deve expor `tokenHash`, `encryptedToken` nem outros detalhes internos de persistência
- o fluxo de credenciais deve ser operacional e curto: selecionar instância, obter credenciais, copiar e integrar

## Contrato mínimo da UX desta fase

A seção `Credenciais` deve permitir no mínimo:

1. identificar a instância
2. ver o `instanceId`
3. ver o `endpointUrl`
4. gerar ou regenerar `secretToken`
5. copiar cada valor necessário individualmente

Decisões desta fase:

- `instanceId` e `endpointUrl` devem ser visíveis sempre que houver instância selecionada
- `secretToken` deve aparecer apenas na superfície própria de credenciais e com tratamento seguro de exibição
- o fluxo de geração ou rotação deve exigir ação explícita do operador

## Sugestão técnica

- criar endpoints administrativos dedicados para leitura e rotação de credenciais por instância, se ainda não existirem
- concentrar a UI em `frontend/src/features/integrations/credentials/**`
- reaproveitar o serviço de auth de integração já existente em `backend/src/services/integrations/integrationAuth.service.ts`
- manter a resolução de `endpointUrl` baseada em `APP_URL` ou host atual, sem reintroduzir `baseUrl`

## Qualidade e testes obrigatórios

- adicionar testes backend para emissão e rotação de credencial por instância
- adicionar testes focados de frontend para seleção da instância, visibilidade dos campos e ações de cópia
- executar pelo menos:
  - `npm run build --prefix frontend`
  - `npm test --prefix backend`
  - `npm run lint`

## Referências técnicas desta fase

- `backend/src/services/integrations/integrationAuth.service.ts`
- `backend/src/routes/dashboard.routes.ts`
- `frontend/src/pages/Instancia.tsx` como referência de padrão operacional por instância
- decisão de produto registrada no handoff: usar apenas `endpointUrl`, `instanceId` e `secretToken`

## Arquivos prováveis

- `frontend/src/pages/Integracoes.tsx`
- `frontend/src/features/integrations/**`
- `backend/src/routes/**`
- `backend/src/services/integrations/integrationAuth.service.ts`
- `backend/prisma/schema.prisma`

## Checklist

- [x] seleção de instância disponível na área de integrações
- [x] `instanceId` exposto em modo somente leitura
- [x] `endpointUrl` final exposto sem concatenação manual
- [x] geração de credencial ativa suportada
- [x] rotação de `secretToken` com invalidação do anterior
- [x] ações de cópia implementadas
- [x] testes focados adicionados

## Dev Agent Record

### Agent Model Used

- GPT-5 Codex

### Debug Log References

- `npm run typecheck`
- `npm run lint`
- `npm test --prefix backend`
- `npm run test:integration-credentials --prefix frontend`
- `npm run test:integration-workspace --prefix frontend`
- `npm run build --prefix frontend`

### Completion Notes List

- Adicionada surface administrativa para credenciais de integração por instância com endpoints autenticados em `/api/dashboard/integrations/credentials` para listagem, leitura, emissão e rotação.
- A seção `Credenciais` da área `Integrações` agora permite selecionar a instância, visualizar `instanceId`, `endpointUrl`, estado da credencial e executar geração ou rotação com feedback operacional curto.
- O `secretToken` não é mais revelado automaticamente ao abrir a área ou apenas selecionar a instância; ele aparece apenas após ação explícita de emissão ou rotação, preservando o tratamento seguro exigido pela story.
- As ações de cópia foram implementadas para `instanceId`, `endpointUrl` e `secretToken`, com toasts explícitos de sucesso ou falha.
- Foram adicionados testes focados de backend para a surface de credenciais e testes de frontend para helpers, renderização segura do bloco e exibição do token somente após ação explícita.

### File List

- `backend/package.json`
- `backend/scripts/integration-credentials-api.cjs`
- `backend/src/routes/dashboard.routes.ts`
- `backend/src/services/integrations/integrationCredentialsSurface.service.ts`
- `frontend/package.json`
- `frontend/scripts/integration-credentials-state.test.tsx`
- `frontend/scripts/integration-workspace-state.test.tsx`
- `frontend/src/features/integrations/credentials.ts`
- `frontend/src/features/integrations/IntegrationCredentialsSection.tsx`
- `frontend/src/features/integrations/IntegrationWorkspacePage.tsx`
- `frontend/src/pages/Integracoes.tsx`

### Change Log

- 2026-05-29: story 039 implementada, validada e encerrada com gestão operacional de credenciais por instância, rotação segura e exibição explícita do `secretToken` apenas após ação do operador.
