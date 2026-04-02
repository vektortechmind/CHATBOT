import type { Label } from "@whiskeysockets/baileys/lib/Types/Label.js";

/** Etiquetas sincronizadas via evento `labels.edit` do Baileys (por instância). */
const byInstance = new Map<string, Map<string, Label>>();

export function onInstanceLabelEdit(instanceId: string, label: Label) {
  if (!byInstance.has(instanceId)) {
    byInstance.set(instanceId, new Map());
  }
  const m = byInstance.get(instanceId)!;
  if (label.deleted) {
    m.delete(label.id);
  } else {
    m.set(label.id, label);
  }
}

export function getLabelsForInstance(instanceId: string): Label[] {
  return Array.from(byInstance.get(instanceId)?.values() ?? []).filter((l) => !l.deleted);
}
