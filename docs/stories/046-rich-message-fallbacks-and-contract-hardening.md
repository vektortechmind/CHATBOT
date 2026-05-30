# Story 046 - Rich Message Fallbacks And Contract Hardening

## Status

Ready for Review

## Objetivo

Como operação do NexusZAP,
quero endurecer os fallbacks e os testes do fluxo de mensagens ricas,
para garantir que imagem, contexto e renderização não deixem a integração inconsistente em produção.

## Dependências explícitas desta fase

- esta story depende das stories 043 a 045

## Como esta story se encaixa no fluxo geral

- esta story fecha o subciclo iniciado na 043 com a política operacional final de fallback
- ela transforma as decisões de produto já fechadas em comportamento endurecido e cobertura de regressão
- sem esta story, imagem e contexto rico podem funcionar em casos felizes mas ainda falhar em produção nos cenários degradados mais prováveis

## Escopo

- endurecer o fallback quando a imagem estiver ausente, inválida ou indisponível
- garantir comportamento previsível quando campos ricos do payload faltarem
- validar que a documentação continua compatível com o backend após ajustes de fallback
- ampliar cobertura de regressão para render, imagem e dispatch

## Direção técnica obrigatória

- concentrar a política final de fallback no backend, evitando regras duplicadas entre documentação, rota e runtime
- o fallback precisa preservar o tipo de saída operacional correto quando a imagem cair, sem perder o texto principal do evento
- a cobertura desta story deve validar tanto o renderer quanto o runtime, porque o problema pode surgir em qualquer uma das camadas
- se a imagem falhar antes do `sendMessage`, o dispatch deve continuar por caminho alternativo sem marcar erro de envio apenas por causa da mídia

## Fora de escopo

- customização no frontend
- histórico de edição de template
- editor de preview no painel

## Critérios de aceitação

- existe política explícita e testada para imagem ausente
- existe política explícita e testada para imagem inválida
- o dispatch não fica quebrado por campos ricos faltantes quando houver fallback previsto
- a documentação permanece coerente com o comportamento endurecido
- `npm test --prefix backend` continua passando

## Regra oficial desta fase

A política de fallback de imagem está fechada assim:

1. se houver imagem válida do produto, a mensagem é enviada com imagem
2. se o produto não tiver imagem, a mensagem deve ser enviada sem imagem
3. se a imagem vier inválida, quebrada ou falhar no carregamento, a mensagem deve ser enviada sem imagem
4. falha de imagem não pode impedir o dispatch principal do evento
5. quando houver fallback para mensagem sem imagem, o texto operacional e o link ou documento aplicável devem permanecer íntegros

Casos mínimos que devem ficar explicitamente endurecidos:

- evento com imagem e produto sem qualquer campo de imagem
- evento com imagem e URL de imagem inválida
- evento com imagem e falha de download da mídia
- evento com imagem e `externalAdReply` impossibilitado por ausência de URL aplicável
- evento com placeholders ricos ausentes, mas ainda com texto principal enviável

## Regras de negócio

- imagem do produto é enriquecimento visual, não pré-requisito absoluto para entrega da mensagem
- a ausência de imagem não pode bloquear venda, acesso, recuperação de carrinho, assinatura ou cobrança
- a política oficial de fallback precisa ser única, testada e documentada
- backend e documentação devem descrever a mesma regra de fallback

## Qualidade e testes obrigatórios

- teste de fallback para produto sem imagem
- teste de fallback para imagem inválida
- teste de fallback para falha de carregamento da imagem
- teste de regressão dos eventos com imagem
- teste de regressão dos eventos sem imagem
- teste para garantir que o dispatch não retorna falha operacional apenas porque a mídia não pôde ser usada
- teste para garantir que link ou documento aplicável continuam íntegros no fallback sem imagem
- executar `npm test --prefix backend`

## Referências técnicas desta fase

- `checkout/plano-integracao-nexuszap.md` - referência de intenção para eventos ricos e imagem do produto
- `docs/integrations/nexuszap-plugin-api.md` - documentação que precisa permanecer coerente após endurecimento
- `backend/src/services/integrations/integrationDispatchRuntime.service.ts` - ponto principal para fallback operacional no dispatch
- `backend/src/services/integrations/integrationDispatchTemplate.service.ts` - ponto principal para fallback de render
- `backend/src/services/integrations/integrationEventCatalog.service.ts` - origem do contexto rico que pode chegar incompleto ou degradado

## Arquivos prováveis

- `backend/src/services/integrations/integrationDispatchRuntime.service.ts`
- `backend/src/services/integrations/integrationDispatchTemplate.service.ts`
- `backend/src/services/integrations/integrationEventCatalog.service.ts`
- `docs/integrations/nexuszap-plugin-api.md`
- `backend/src/services/integrations/**`
- `backend/scripts/**`
- `docs/integrations/**`

## Assunções explícitas

- a política funcional de fallback já está decidida no handoff e não deve ser rediscutida nesta story
- esta story não muda a autoridade do endpoint nem adiciona edição de template
- qualquer ajuste documental desta fase é para manter consistência com o backend, não para redefinir produto

## CodeRabbit Integration

Disabled

## Checklist

- [x] política final de fallback de imagem registrada
- [x] regressão de mensagens ricas prevista
- [x] consistência backend versus documentação prevista
- [x] testes focados previstos

## Dev Agent Record

### Agent Model Used

- GPT-5 Codex

### Debug Log References

- `npm run typecheck --prefix backend`
- `node scripts/integration-dispatch-runtime-api.cjs`
- `npm test --prefix backend`
- `Get-Content docs/integrations/nexuszap-plugin-api.md`

### Completion Notes List

- O runtime de dispatch passou a preservar também o link aplicável no fallback textual dos eventos ricos, em vez de depender apenas do `externalAdReply`.
- O resumo persistido do dispatch agora registra `imageFallbackReason`, distinguindo ausência de imagem, URL inválida e falha de download da mídia.
- A cobertura automatizada foi ampliada para produto sem imagem, URL inválida sintética, falha de download, ausência de URL para `externalAdReply` e preservação do link no fallback sem imagem.
- A documentação pública foi ajustada para declarar explicitamente que o fallback sem imagem preserva o texto principal e o link aplicável no corpo textual.

### File List

- `docs/stories/046-rich-message-fallbacks-and-contract-hardening.md`
- `backend/src/services/integrations/integrationDispatchRuntime.service.ts`
- `backend/scripts/integration-dispatch-runtime-api.cjs`
- `docs/integrations/nexuszap-plugin-api.md`

### Change Log

- 2026-05-29: story 046 implementada com endurecimento final do fallback de imagem, preservação explícita de link no fallback textual e cobertura adicional de regressão.
## QA Results

### 2026-05-29 - Quinn

Gate: PASS

Resumo:
- A story 046 endureceu corretamente a política final de fallback sem findings funcionais bloqueantes.
- O runtime agora preserva o texto principal e o link aplicável no fallback sem imagem, além de registrar o motivo da degradação em `imageFallbackReason`.
- A regressão automatizada cobre produto sem imagem, URL inválida sintética, falha de download e ausência de URL para `externalAdReply`, mantendo o dispatch operacional verde.

Evidências verificadas:
- `npm run typecheck --prefix backend`
- `node scripts/integration-dispatch-runtime-api.cjs`
- `npm test --prefix backend`
- `Get-Content docs/integrations/nexuszap-plugin-api.md`

Cobertura vs critérios de aceitação:
- PASS: existe política explícita e testada para imagem ausente.
- PASS: existe política explícita e testada para imagem inválida.
- PASS: o dispatch não falha operacionalmente por ausência ou erro de mídia quando há fallback previsto.
- PASS: o link aplicável permanece íntegro no fallback textual dos eventos ricos.
- PASS: a documentação principal permaneceu coerente com o comportamento endurecido do backend.

Riscos residuais:
- Baixo: o renderer ainda não diferencia semanticamente "imagem ausente" de "imagem inválida"; essa distinção final acontece no runtime, o que é aceitável para o contrato atual.
- Baixo: `docs/` continua exigindo `git add -f` no fluxo de commit por estar ignorado no repositório.
