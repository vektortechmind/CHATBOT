# Story 018 - Settings Cleanup And Agent Audio Transcription Toggle

## Status

Fechada

## Objetivo

Como administrador do NexusZAP,
quero remover seções e fluxos legados que não representam mais o produto atual,
para simplificar a interface e deixar no agente apenas um controle objetivo de transcrição de áudio.

## Escopo

- remover a seção `Configuração global` da tela de configurações do sistema
- remover do projeto inteiro o fluxo de `voz por agente`
- remover provider, modelo, persona e textos associados a `voz por agente`
- remover qualquer referência ao comportamento `Quando desligado, o projeto continua no fluxo padrao de audio/transcricao da instancia`
- substituir tudo isso por um único controle no agente para `Habilitar transcrição de áudio`
- manter a transcrição usando o provedor já existente do sistema, sem introduzir agente de voz separado

## Critérios de aceitação

- a tela de configurações não exibe mais a seção `Configuração global`
- a tela de agente não exibe mais `Ativar voz por agente`
- não existem mais campos de provider de voz, modelo de voz ou persona de voz no agente
- o agente exibe apenas um botão ou toggle para `Habilitar transcrição de áudio`
- a transcrição de áudio usa a infraestrutura existente, sem conceito separado de agente de voz
- o código, a UI e os contratos deixam de carregar vestígios do fluxo antigo de voz por agente

## Regras de negócio

- transcrição de áudio é uma capacidade simples do agente, não um subsistema separado de voz
- não deve existir configuração de provider/modelo/persona específica para voz do agente
- a remoção deve ser completa, incluindo copy, campos, estados, payloads e contratos que só existiam para o fluxo antigo
- a nova UI deve comunicar apenas habilitado/desabilitado para transcrição de áudio

## Sugestão técnica

- limpar `frontend/src/pages/Apis.tsx` removendo a seção `Configuração global`
- limpar `frontend/src/pages/Agente.tsx` removendo todo o bloco e estados de voz
- revisar `backend/src/routes/agent.routes.ts`, `backend/src/services/agent.service.ts` e schema para remover campos e payloads ligados à voz por agente, se ainda existirem
- manter apenas uma flag simples de transcrição de áudio no agente
- validar que não restaram referências a `voiceProvider`, `voiceModel`, `voicePersona` e copies antigas

## Arquivos prováveis

- `frontend/src/pages/Apis.tsx`
- `frontend/src/pages/Agente.tsx`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260528230000_agent_audio_transcription_cleanup/migration.sql`
- `backend/src/ai/providerSelector.ts`
- `backend/src/routes/agent.routes.ts`
- `backend/src/services/agent.service.ts`
- `backend/src/telegram/TelegramBotManager.ts`
- `backend/src/whatsapp/messageHandler.ts`
- `CHANGELOG.md`

## File List

- `frontend/src/pages/Apis.tsx`
- `frontend/src/pages/Agente.tsx`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260528230000_agent_audio_transcription_cleanup/migration.sql`
- `backend/src/ai/providerSelector.ts`
- `backend/src/routes/agent.routes.ts`
- `backend/src/services/agent.service.ts`
- `backend/src/telegram/TelegramBotManager.ts`
- `backend/src/whatsapp/messageHandler.ts`
- `CHANGELOG.md`

## Checklist

- [x] seção `Configuração global` removida
- [x] fluxo `Ativar voz por agente` removido
- [x] campos de provider/modelo/persona de voz removidos
- [x] toggle único de transcrição de áudio implementado no agente
- [x] contratos e payloads antigos de voz removidos
- [x] copy antiga de voz/transcrição por instância removida
- [x] vestígios do fluxo antigo eliminados do projeto

## QA Results

- Revalidada em 28/05/2026.
- Sem findings.
- Confirmado que a UI expõe apenas o toggle `Habilitar transcrição de áudio` no agente e não exibe mais a seção `Configuração global` na tela de APIs.
- Confirmado que os contratos ativos removem `voiceProvider`, `voiceModel`, `voicePersona` e o endpoint legado de opções de voz.
- Confirmado que o runtime de WhatsApp e Telegram só tenta transcrever áudio quando `audioTranscriptionEnabled` está ativo no agente.
- Validações executadas com sucesso: `backend npm run db:generate`, `backend npm run build`, `backend npm test`, `frontend npm run build`.
- `frontend npm run lint` passou com 2 warnings preexistentes em `frontend/src/contexts/ThemeContext.tsx`.
