import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { api, apiLong } from "../lib/axios";
import {
  KeyRound,
  Save,
  Wifi,
  WifiOff,
  Shield,
  AlertCircle,
  Layers,
  Loader2,
  BookOpen,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../contexts/ToastContext";
import { UpdateSection } from "../components/UpdateSection";

type ProviderHealth = {
  preferredChatProvider: string | null;
  results: {
    provider: "gemini" | "groq" | "openrouter";
    configured: boolean;
    ok: boolean;
    latencyMs?: number;
    /** Mensagem curta do provedor quando ok === false */
    error?: string;
  }[];
};

/** Resposta de GET /agent/config (campos usados no formulário). */
type AgentConfig = {
  id: string;
  name: string;
  agentName: string | null;
  status: string;
  typing: boolean;
  delayMin: number;
  delayMax: number;
  systemPrompt: string | null;
  chatProvider: string | null;
  groqKey: string | null;
  groqAudioKey: string | null;  // ← Chave separada para áudio/whisper
  geminiKey: string | null;
  openrouterKey: string | null;
  openrouterModel: string | null;
};

type ApiKeyField = "geminiKey" | "groqKey" | "groqAudioKey" | "openrouterKey";

function buildConfigSavePayload(cfg: AgentConfig) {
  const or = cfg.openrouterModel?.trim();
  const payload: Record<string, unknown> = {
    name: cfg.name,
    agentName: cfg.agentName,
    typing: cfg.typing,
    delayMin: cfg.delayMin,
    delayMax: cfg.delayMax,
    systemPrompt: cfg.systemPrompt,
    chatProvider: cfg.chatProvider,
    openrouterModel: or && or.length > 0 ? or : null,
  };
  const gk = cfg.groqKey?.trim();
  const gak = cfg.groqAudioKey?.trim();
  const gmk = cfg.geminiKey?.trim();
  const ork = cfg.openrouterKey?.trim();
  if (gk) payload.groqKey = gk;
  if (gak) payload.groqAudioKey = gak;
  if (gmk) payload.geminiKey = gmk;
  if (ork) payload.openrouterKey = ork;
  return payload;
}

type OpenRouterModelRow = {
  id: string;
  name: string;
  contextLength: number | null;
  tier: "free" | "paid";
  pricingPrompt: string | null;
  pricingCompletion: string | null;
};

type OpenRouterModelsResponse = {
  free: OpenRouterModelRow[];
  paid: OpenRouterModelRow[];
  totalFree: number;
  totalPaid: number;
};

function usdPerMillionTokens(perTokenUsd: string | null): string {
  if (perTokenUsd === null || perTokenUsd === "") return "—";
  const n = parseFloat(perTokenUsd);
  if (!Number.isFinite(n)) return perTokenUsd;
  if (n === 0) return "US$ 0";
  return `US$ ${(n * 1e6).toFixed(4)} / 1M`;
}

function openRouterModelIdSet(models: OpenRouterModelsResponse | null): Set<string> {
  if (!models) return new Set();
  return new Set([
    ...models.free.map((m) => m.id),
    ...models.paid.map((m) => m.id),
  ]);
}

export function Apis() {
  const [cfg, setCfg] = useState<AgentConfig | null>(null);
  const [health, setHealth] = useState<ProviderHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [orDebouncedKey, setOrDebouncedKey] = useState("");
  const [orModels, setOrModels] = useState<OpenRouterModelsResponse | null>(null);
  const [orLoading, setOrLoading] = useState(false);
  const [orError, setOrError] = useState<string | null>(null);
  const { addToast } = useToast();
  const orIdSet = useMemo(() => openRouterModelIdSet(orModels), [orModels]);

  useEffect(() => {
    const k = cfg?.openrouterKey?.trim() ?? "";
    const t = window.setTimeout(() => setOrDebouncedKey(k), 550);
    return () => window.clearTimeout(t);
  }, [cfg?.openrouterKey]);

  useEffect(() => {
    if (!orDebouncedKey || orDebouncedKey.length < 12) {
      setOrModels(null);
      setOrError(null);
      setOrLoading(false);
      return;
    }
    const ac = new AbortController();
    setOrLoading(true);
    setOrError(null);
    setOrModels(null);
    api
      .post<OpenRouterModelsResponse>(
        "/agent/openrouter-models",
        { openrouterKey: orDebouncedKey },
        { signal: ac.signal }
      )
      .then((res) => setOrModels(res.data))
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        if (axios.isAxiosError(err) && err.code === "ERR_CANCELED") return;
        const msg =
          axios.isAxiosError(err) && err.response?.data?.error
            ? String(err.response.data.error)
            : "Não foi possível listar os modelos OpenRouter";
        setOrError(msg);
        setOrModels(null);
      })
      .finally(() => {
        if (!ac.signal.aborted) setOrLoading(false);
      });
    return () => ac.abort();
  }, [orDebouncedKey]);

  const load = async () => {
    try {
      const res = await api.get<AgentConfig>("/agent/config");
      const d = res.data;
      setCfg({
        ...d,
        openrouterModel: d.openrouterModel ?? null,
      });
      setError(null);
    } catch (err) {
      setError("Não foi possível carregar a configuração");
      console.error(err);
    }
  };

  const test = async () => {
    setTesting(true);
    setHealthError(null);
    try {
      const res = await apiLong.get<ProviderHealth>("/agent/providers-health");
      setHealth(res.data);
    } catch (err) {
      setHealthError("Não foi possível testar os provedores (timeout ou rede)");
      console.error(err);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await load();
      } catch (err) {
        setError("Não foi possível carregar as configurações");
        console.error(err);
      } finally {
        setLoading(false);
      }
      void test();
    };
    init();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfg) return;
    setSaving(true);
    try {
      await api.put("/agent/config", buildConfigSavePayload(cfg));
      addToast("Configurações salvas com sucesso", "success");
      await load();
      await test();
    } catch (err) {
      let msg = "Erro ao salvar configurações";
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data as { error?: string; message?: string };
        msg = d.error || d.message || msg;
      }
      addToast(msg, "error");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-32 rounded-lg bg-gray-200 dark:bg-slate-700 animate-pulse" />
        <div className="h-96 rounded-lg bg-gray-200 dark:bg-slate-700 animate-pulse" />
      </div>
    );
  }

  if (error || !cfg) {
    return (
      <Card className="p-8">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
              Erro ao carregar configurações
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400 mb-4">
              {error || "Dados não disponíveis"}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setLoading(true);
                setError(null);
                load().finally(() => setLoading(false));
              }}
            >
              Tente novamente
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const statusFor = (p: "gemini" | "groq" | "groq-audio" | "openrouter") =>
    health?.results?.find((r) => r.provider === p) ?? null;

  const ProviderStatus = ({
    p,
  }: {
    p: "gemini" | "groq" | "groq-audio" | "openrouter";
  }) => {
    const s = statusFor(p);
    if (!s)
      return (
        <Badge variant="default">
          <span className="text-xs">Aguardando</span>
        </Badge>
      );
    if (!s.configured)
      return (
        <Badge variant="danger">
          <span className="text-xs">Offline</span>
        </Badge>
      );
    if (s.ok) {
      return (
        <Badge variant="success">
          <Wifi className="w-3 h-3 mr-1" />
          <span className="text-xs">
            Online {typeof s.latencyMs === "number" ? `(${s.latencyMs}ms)` : ""}
          </span>
        </Badge>
      );
    }
    const hint = s.error ? s.error.slice(0, 120) : "";
    return (
      <Badge variant="danger" title={hint || undefined}>
        <WifiOff className="w-3 h-3 mr-1" />
        <span className="text-xs max-w-[140px] truncate inline-block align-bottom">
          {hint ? `Erro: ${hint}` : "Erro"}
        </span>
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            Integração IA
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Chaves de API
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie tokens de acesso e monitore a saúde dos provedores
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => window.open("/guia-chaves-api.html", "_blank", "noopener,noreferrer")}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Abrir guia de APIs
          </Button>
        </div>
      </div>

      {healthError && (
        <div className="rounded-xl border border-amber-300/85 dark:border-amber-700 bg-amber-50/85 dark:bg-amber-950/40 px-4 py-3 flex items-start gap-3 backdrop-blur-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">{healthError}</p>
        </div>
      )}

      <Card>
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200 dark:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Configuração Global
          </h2>
        </div>

        <form onSubmit={save} className="space-y-8">
          {/* Preferred Provider */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Provedor Preferencial</label>
            <div className="grid grid-cols-3 gap-3">
              {["gemini", "groq", "openrouter"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() =>
                    setCfg({ ...cfg, chatProvider: p })
                  }
                  className={`py-3 px-4 rounded-xl font-semibold text-sm uppercase tracking-wide transition-all ${
                    cfg.chatProvider === p
                      ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-[0_10px_24px_-14px_rgba(59,130,246,0.9)]"
                      : "border border-slate-200/70 bg-white/75 text-slate-700 hover:bg-white dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-700/80"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* API Keys */}
          <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Deixe um campo de chave em branco para manter o valor já salvo no servidor (evita apagar a chave ao salvar só o modelo ou outras opções).
            </p>
            {[
              {
                id: "gemini",
                label: "Google Gemini Key",
                key: "geminiKey" as ApiKeyField,
                placeholder: "AIza...",
              },
              {
                id: "groq",
                label: "Groq Cloud Key (Chat)",
                key: "groqKey" as ApiKeyField,
                placeholder: "gsk_...",
              },
              {
                id: "groq-audio",
                label: "Groq Audio Key (Whisper)",
                key: "groqAudioKey" as ApiKeyField,
                placeholder: "gsk_... (opcional, usa Groq Key se vazio)",
              },
              {
                id: "openrouter",
                label: "OpenRouter Key",
                key: "openrouterKey" as ApiKeyField,
                placeholder: "sk-or-...",
              },
            ].map((item) => (
              <div key={item.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.label}</label>
                  <ProviderStatus
                    p={item.id as "gemini" | "groq" | "groq-audio" | "openrouter"}
                  />
                </div>
                <input
                  type="password"
                  value={cfg[item.key] ?? ""}
                  onChange={(e) =>
                    setCfg({ ...cfg, [item.key]: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-mono text-slate-900 outline-none backdrop-blur-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/80 focus:border-blue-400/80 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)] dark:border-slate-700/80 dark:bg-slate-900/50 dark:text-slate-100"
                  placeholder={item.placeholder}
                />

                {item.id === "openrouter" &&
                  (cfg.openrouterKey?.trim().length ?? 0) >= 12 && (
                    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/75 p-4 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-800/40">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                          <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                          <span className="text-sm font-semibold">Modelos OpenRouter</span>
                          {orModels && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {orModels.totalFree} grátis · {orModels.totalPaid} pagos
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={orLoading}
                          loading={orLoading}
                          onClick={() => {
                            const k = cfg.openrouterKey?.trim() ?? "";
                            if (k.length < 12) return;
                            setOrLoading(true);
                            setOrError(null);
                            api
                              .post<OpenRouterModelsResponse>("/agent/openrouter-models", {
                                openrouterKey: k
                              })
                              .then((res) => setOrModels(res.data))
                              .catch((err: unknown) => {
                                const msg =
                                  axios.isAxiosError(err) && err.response?.data?.error
                                    ? String(err.response.data.error)
                                    : "Não foi possível listar os modelos";
                                setOrError(msg);
                                setOrModels(null);
                              })
                              .finally(() => setOrLoading(false));
                          }}
                        >
                          Atualizar lista
                        </Button>
                      </div>

                      {orLoading && !orModels && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 py-2">
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          Carregando modelos…
                        </div>
                      )}

                      {orError && (
                        <p className="text-sm text-red-600 dark:text-red-400">{orError}</p>
                      )}

                      {orModels && (
                        <>
                          <div className="space-y-2">
                            <label
                              htmlFor="openrouter-model-select"
                              className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                            >
                              Modelo usado no chat (WhatsApp)
                            </label>
                            <select
                              id="openrouter-model-select"
                              value={cfg.openrouterModel ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setCfg({
                                  ...cfg,
                                  openrouterModel: v === "" ? null : v,
                                });
                              }}
                              className="w-full rounded-xl border border-slate-200/80 bg-white/85 px-4 py-2.5 text-sm text-slate-900 outline-none backdrop-blur-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/80 focus:border-blue-400/80 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)] dark:border-slate-700/80 dark:bg-slate-900/55 dark:text-slate-100"
                            >
                              <option value="">
                                Padrão interno (meta-llama/llama-3-8b-instruct:free)
                              </option>
                              {cfg.openrouterModel &&
                                !orIdSet.has(cfg.openrouterModel) && (
                                  <option value={cfg.openrouterModel}>
                                    {cfg.openrouterModel} (salvo — não listado agora)
                                  </option>
                                )}
                              <optgroup label="Grátis">
                                {orModels.free.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Pagos">
                                {orModels.paid.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Use Salvar configurações para aplicar o modelo ao agente.
                            </p>
                          </div>

                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Preços em USD por 1 milhão de tokens (aprox.), conforme retorno da API OpenRouter.
                            Modelos com sufixo <code className="font-mono">:free</code> ou preço zero entram em
                            grátis.
                          </p>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                                Grátis ({orModels.free.length})
                              </h4>
                              <div className="max-h-64 overflow-y-auto rounded-lg border border-emerald-200/80 dark:border-emerald-900/50 bg-white dark:bg-slate-900/60">
                                <table className="w-full text-left text-xs">
                                  <thead className="sticky top-0 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200">
                                    <tr>
                                      <th className="px-2 py-1.5 font-semibold">Modelo</th>
                                      <th className="px-2 py-1.5 font-semibold hidden sm:table-cell">ID</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {orModels.free.map((m) => (
                                      <tr key={m.id} className="text-gray-800 dark:text-gray-200">
                                        <td className="px-2 py-1.5 align-top">
                                          <span className="font-medium line-clamp-2">{m.name}</span>
                                        </td>
                                        <td className="px-2 py-1.5 align-top font-mono text-[10px] text-gray-500 dark:text-gray-400 hidden sm:table-cell break-all">
                                          {m.id}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-400">
                                Pagos ({orModels.paid.length})
                              </h4>
                              <div className="max-h-64 overflow-y-auto rounded-lg border border-amber-200/80 dark:border-amber-900/50 bg-white dark:bg-slate-900/60">
                                <table className="w-full text-left text-xs">
                                  <thead className="sticky top-0 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
                                    <tr>
                                      <th className="px-2 py-1.5 font-semibold">Modelo</th>
                                      <th className="px-2 py-1.5 font-semibold hidden md:table-cell">Prompt</th>
                                      <th className="px-2 py-1.5 font-semibold hidden md:table-cell">Conclusão</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {orModels.paid.map((m) => (
                                      <tr key={m.id} className="text-gray-800 dark:text-gray-200">
                                        <td className="px-2 py-1.5 align-top">
                                          <div className="font-medium line-clamp-2">{m.name}</div>
                                          <div className="font-mono text-[10px] text-gray-500 dark:text-gray-400 break-all sm:hidden mt-0.5">
                                            {m.id}
                                          </div>
                                        </td>
                                        <td className="px-2 py-1.5 align-top text-[10px] text-gray-600 dark:text-gray-300 hidden md:table-cell whitespace-nowrap">
                                          {usdPerMillionTokens(m.pricingPrompt)}
                                        </td>
                                        <td className="px-2 py-1.5 align-top text-[10px] text-gray-600 dark:text-gray-300 hidden md:table-cell whitespace-nowrap">
                                          {usdPerMillionTokens(m.pricingCompletion)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <Button
              type="submit"
              disabled={saving}
              loading={saving}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void test()}
              disabled={testing}
              loading={testing}
            >
              <Wifi className="w-4 h-4 mr-2" />
              Testar
            </Button>
          </div>
        </form>
      </Card>

      <UpdateSection />
    </div>
  );
}

