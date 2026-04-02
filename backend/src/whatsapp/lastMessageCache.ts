import type { proto, WAMessage } from "@whiskeysockets/baileys";

/**
 * Última mensagem conhecida por (instância + JID), para operações do WhatsApp que exigem
 * `lastMessages` (ex.: arquivar conversa) — exigência do protocolo Baileys.
 */
const cache = new Map<string, { key: proto.IMessageKey; messageTimestamp: number }>();

function key(instanceId: string, remoteJid: string) {
  return `${instanceId}\0${remoteJid}`;
}

function toTimestamp(v: proto.IWebMessageInfo["messageTimestamp"] | unknown): number {
  if (v == null) return Math.floor(Date.now() / 1000);
  if (typeof v === "number") return v;
  if (typeof v === "object" && v !== null && "toNumber" in v && typeof (v as { toNumber: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return Math.floor(Date.now() / 1000);
}

export function recordLastMessageForChat(
  instanceId: string,
  remoteJid: string,
  msg: WAMessage | proto.IWebMessageInfo
) {
  const k = msg.key;
  if (!k?.id || !remoteJid) return;
  cache.set(key(instanceId, remoteJid), {
    key: k,
    messageTimestamp: toTimestamp((msg as proto.IWebMessageInfo).messageTimestamp)
  });
}

export function getLastMessagesForChatModify(
  instanceId: string,
  remoteJid: string
): { key: proto.IMessageKey; messageTimestamp: number }[] | null {
  const v = cache.get(key(instanceId, remoteJid));
  if (!v?.key?.id) return null;
  return [
    {
      key: v.key,
      messageTimestamp: toTimestamp(v.messageTimestamp)
    }
  ];
}
