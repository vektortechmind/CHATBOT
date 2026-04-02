import { useCallback, useState } from "react";
import { api } from "../lib/axios";
import {
  GitFork,
  Download,
  RefreshCw,
  Check,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useToast } from "../contexts/ToastContext";

type UpdateStatus = {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseUrl: string;
  changelog: string;
  githubRepo: string;
};

export function UpdateSection() {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const checkUpdate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<UpdateStatus>("/update/status");
      setStatus(res.data);
    } catch (err) {
      setError("Não foi possível verificar atualizações");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyUpdate = async () => {
    if (!status?.latestVersion) return;
    if (
      !confirm(
        `Atualizar para ${status.latestVersion}? Será feito um backup antes.`
      )
    )
      return;

    setApplying(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>(
        "/update/apply",
        { version: status.latestVersion }
      );
      addToast(res.data.message, "success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Erro ao aplicar update";
      addToast(msg, "error");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-slate-700">
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <GitFork className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Atualização
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Verificar novas versões
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void checkUpdate()}
          disabled={loading}
          loading={loading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Verificar
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3 flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {!status ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <GitFork className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Clique em "Verificar" para buscar atualizações</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Versão atual
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {status.currentVersion}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Última versão
              </p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {status.latestVersion}
              </p>
            </div>
          </div>

          {status.hasUpdate ? (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                  Nova versão disponível!
                </span>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Changelog:
                </p>
                <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg max-h-32 overflow-y-auto">
                  {status.changelog}
                </pre>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => void applyUpdate()}
                  disabled={applying}
                  loading={applying}
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(status.releaseUrl, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver no GitHub
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 text-center">
              <Check className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Você já está na versão mais recente
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
