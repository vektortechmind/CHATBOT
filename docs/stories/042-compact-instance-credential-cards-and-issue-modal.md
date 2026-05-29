# Story 042 - Compact Instance Credential Cards And Issue Modal

## Status

Ready for Review

## Objetivo

Como operador do NexusZAP,
quero gerenciar credenciais de integração em cards compactos por instância,
para emitir, visualizar e copiar dados essenciais de forma mais organizada e parecida com a experiência de `Instâncias`.

## Problema atual

A seção `Credenciais` ainda está mais próxima de uma surface expandida de formulário do que de um painel operacional compacto:

1. a seleção de instância ocupa espaço demais para uma tarefa recorrente
2. o fluxo de criação de credencial não usa modal/popup dedicado
3. as informações da credencial não estão agrupadas em cards compactos por instância
4. a leitura de `instanceId`, `endpointUrl`, `secretToken`, emissão, replay e dedup ainda pode parecer longa e pouco escaneável
5. a ausência de credencial precisa aparecer no contexto do card da instância, não como elemento dominante da página

## Dependências explícitas desta fase

- esta story depende da surface administrativa criada na story 039
- esta story pode se apoiar na compactação geral da área `Integrações` definida na story 041
- esta story não deve alterar as regras de auth, replay, deduplicação ou rotação do backend
- esta story deve preservar a emissão e rotação real já implementadas

## Escopo

- redesenhar `Credenciais` para modelo de cards compactos por instância
- adicionar ação `Criar credencial` que abra modal/popup para escolher a instância
- manter cards com identidade visual próxima à área `Instâncias`
- exibir no card os dados essenciais por instância com detalhamento compacto e carregamento sob demanda
- incluir ícone visual operacional, por exemplo engrenagem, no card
- exibir `instanceId`, `endpointUrl`, estado do `secretToken`, emissão, último uso, replay window e dedup window dentro do card
- manter ações de cópia organizadas e objetivas
- definir estratégia explícita de carregamento para evitar N+1 desnecessário ou renderização pesada inicial
- permitir rotação de `secretToken` a partir do card ou do detalhamento compacto
- tratar estado sem credencial de forma discreta dentro do card da instância

## Fora de escopo

- alteração do endpoint `/api/integrations/events`
- mudança na política de replay window ou deduplicação
- criação de analytics históricos novos
- multi-seleção em massa de credenciais

## Critérios de aceitação

- a seção `Credenciais` deixa de depender de fluxo principal centrado em seletor expandido
- existe ação `Criar credencial` que abre modal/popup para escolha da instância
- após emissão, a credencial passa a aparecer em card compacto por instância
- o card exibe `instanceId`, `endpointUrl`, estado da credencial, emissão, último uso, replay window e dedup window
- o valor completo de `secretToken` só aparece após ação explícita do operador, preservando a regra de segurança já adotada na story 039
- o card não depende de pré-carregamento completo de detalhes para todas as instâncias ao abrir a página
- as ações de cópia continuam disponíveis de forma objetiva
- a rotação do `secretToken` continua possível sem regressão funcional
- o estado sem credencial é apresentado no card da instância sem dominar o layout
- a experiência fica visualmente mais compacta e organizada em desktop e mobile
- `npm run build --prefix frontend` e `npm test --prefix backend` continuam passando

## Regras de negócio

- a credencial continua pertencendo à instância
- o fluxo principal deve ser curto: abrir modal, escolher instância, emitir credencial e operar pelo card
- o token anterior continua inválido após rotação
- `secretToken` não deve aparecer fora da surface própria de credenciais
- o valor completo de `secretToken` não deve ser revelado automaticamente apenas pela leitura da página ou pela listagem inicial dos cards
- o redesign deve preservar a regra existente: o segredo completo aparece somente após emissão, rotação ou outra ação explícita definida nesta fase
- a compactação da UI não pode ocultar informações operacionais essenciais

## Contrato mínimo da UX desta fase

A seção `Credenciais` deve permitir no mínimo:

1. abrir modal para criar credencial
2. escolher instância elegível no popup
3. emitir credencial por ação explícita
4. visualizar credencial em card compacto por instância
5. copiar `instanceId`, `endpointUrl` e `secretToken`
6. rotacionar a credencial quando necessário

Estratégia de carregamento desta fase:

- a listagem principal deve usar dados resumidos por instância para manter a página compacta e rápida
- o detalhamento completo do card pode ser carregado sob demanda ao abrir, expandir, criar ou operar a credencial da instância
- não é obrigatório pré-carregar o detalhe completo de todas as instâncias no primeiro render

Decisões desta fase:

- `instanceId` e `endpointUrl` devem ficar dentro do card da instância
- o card deve mostrar o estado do segredo sempre, mas o valor completo do `secretToken` apenas após ação explícita do operador
- emissão e rotação devem continuar exigindo ação explícita do operador
- o layout deve usar densidade visual maior, com menos blocos longos e mais organização em card

## Sugestão técnica

- concentrar o redesign em `frontend/src/features/integrations/credentials/**`
- reaproveitar serviços e endpoints já existentes da story 039
- criar componente de modal para seleção de instância e emissão
- criar componente de card compacto de credencial por instância
- usar padrões visuais próximos aos cards da área `Instâncias`

## Qualidade e testes obrigatórios

- adicionar teste focado de frontend para abertura do modal de criação
- adicionar teste focado para renderização do card compacto resumido por instância
- adicionar teste para carregamento sob demanda do detalhamento do card
- adicionar teste para manutenção das ações de cópia e rotação
- adicionar teste para garantir que o valor completo do `secretToken` não aparece automaticamente no carregamento inicial da lista
- validar que o backend continua sem regressão no fluxo de emissão e rotação
- executar pelo menos:
  - `npm run build --prefix frontend`
  - `npm test --prefix backend`
  - `npm run lint`

## Referências técnicas desta fase

- `frontend/src/features/integrations/IntegrationCredentialsSection.tsx`
- `frontend/src/features/integrations/credentials.ts`
- `frontend/src/pages/Instancia.tsx`
- `backend/src/routes/dashboard.routes.ts`
- `backend/src/services/integrations/integrationCredentialsSurface.service.ts`

## Arquivos prováveis

- `frontend/src/features/integrations/IntegrationCredentialsSection.tsx`
- `frontend/src/features/integrations/credentials.ts`
- `frontend/src/features/integrations/**`
- `frontend/src/pages/Integracoes.tsx`
- `frontend/scripts/integration-credentials-state.test.tsx`
- `backend/scripts/integration-credentials-api.cjs`

## Checklist

- [x] cards compactos de credenciais por instância definidos
- [x] modal/popup de criação de credencial definido
- [x] fluxo de escolha de instância no popup definido
- [x] informações operacionais essenciais consolidadas no card
- [x] ações de cópia e rotação preservadas
- [x] testes focados previstos

## Dev Agent Record

### Agent Model Used

- GPT-5 Codex

### Debug Log References

- `npm run test:integration-credentials --prefix frontend`
- `npm run test:integration-workspace --prefix frontend`
- `npm run lint`
- `npm run typecheck`
- `npm run build --prefix frontend`
- `npm test --prefix backend`

### Completion Notes List

- A seção `Credenciais` foi refeita em cards compactos por instância, com botão superior `Criar credencial`, ícone operacional e detalhamento carregado sob demanda apenas no card expandido.
- O fluxo de emissão agora usa modal dedicado para escolher a instância elegível antes de chamar `issue`, enquanto a rotação continua disponível diretamente no card expandido.
- O `secretToken` completo permanece oculto na leitura inicial e no fetch comum de detalhe; ele só aparece quando a resposta explícita de emissão ou rotação retorna o valor.
- O estado sem credencial foi mantido de forma discreta dentro do card, sem dominar o layout, preservando ações objetivas de cópia e operação.
- Os testes focados do frontend foram reescritos para proteger o novo contrato de cards, modal, lazy load e segurança do `secretToken`.

### File List

- `docs/stories/042-compact-instance-credential-cards-and-issue-modal.md`
- `frontend/scripts/integration-credentials-state.test.tsx`
- `frontend/src/features/integrations/IntegrationCredentialsSection.tsx`
- `frontend/src/features/integrations/IntegrationWorkspacePage.tsx`
- `frontend/src/features/integrations/credentials.ts`
- `frontend/src/pages/Integracoes.tsx`

### Change Log

- 2026-05-29: story 042 implementada e movida para `Ready for Review` com cards compactos por instância, modal de emissão guiada, detalhamento sob demanda e testes atualizados.

## QA Results

### 2026-05-29 - Quinn

Gate: PASS

Resumo:
- Validação da story 042 sem findings funcionais ou de segurança no escopo revisado.
- O redesign cumpre a troca do seletor expandido por cards compactos por instância, com modal dedicado para emissão e detalhamento sob demanda.
- A regra crítica de segurança foi preservada: `secretToken` não aparece no carregamento inicial nem no fetch comum de detalhe; só aparece após emissão ou rotação explícita.

Evidências verificadas:
- `npm run test:integration-credentials --prefix frontend`
- `npm run typecheck --prefix frontend`
- Evidência de execução anterior revisada no Dev Agent Record para `npm run lint`, `npm run build --prefix frontend` e `npm test --prefix backend`

Cobertura vs critérios de aceitação:
- PASS: cards compactos por instância substituem o fluxo centrado em seletor.
- PASS: ação `Criar credencial` abre modal/popup para escolha da instância.
- PASS: detalhamento do card é carregado sob demanda por expansão.
- PASS: cópia de `instanceId`, `endpointUrl` e `secretToken` continua disponível.
- PASS: rotação continua possível sem regressão aparente.
- PASS: estado sem credencial permanece discreto dentro do card.
- PASS: proteção contra exposição automática do `secretToken` está coberta por testes focados.

Riscos residuais:
- Baixo: não houve validação interativa em navegador nesta rodada; o parecer se apoia em revisão de código, contrato de estado e testes automatizados.
- Baixo: CodeRabbit não foi executado nesta máquina porque o fluxo configurado depende de WSL indisponível no ambiente atual.
