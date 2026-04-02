import { useEffect, useState } from "react";
import { api } from "../lib/axios";
import { QrCode, Smartphone, Play, Square, AlertCircle, Bot, MessageCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../contexts/ToastContext";

type Status = {
  id: string;
  name: string;
  status: string;
  qr: string | null;
  active: boolean;
  aiWhatsappEnabled: boolean;
  aiTelegramEnabled: boolean;
  telegram?: {
    online: boolean;
    label: string | null;
  };
};

export function Instancia() {
  const [data, setData] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const { addToast } = useToast();

  const loadStatus = async () => {
    try {
      const res = await api.get<Status>("/agent/status");
      setData(res.data);
      setError(null);
    } catch (err) {
      setError("Não foi possível carregar o status da instância");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();

    const interval = setInterval(() => {
      loadStatus().catch(() => {});
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleToggle = async () => {
    if (!data) return;

    setWorking(true);
    try {
      if (data.status === "CONNECTED") {
        await api.post("/agent/stop");
        addToast("Conexão encerrada", "success");
      } else {
        await api.post("/agent/start");
        addToast("Iniciando conexão...", "info");
      }
      await loadStatus();
    } catch {
      addToast("Erro ao alterar status", "error");
    } finally {
      setWorking(false);
    }
  };

  const handleAiToggle = async (channel: "whatsapp" | "telegram") => {
    if (!data) return;
    setWorking(true);
    try {
      const key = channel === "whatsapp" ? "aiWhatsappEnabled" : "aiTelegramEnabled";
      const nextValue = !data[key];
      await api.put("/agent/config", { [key]: nextValue });
      addToast(
        nextValue
          ? `Atendimento com IA ativado no ${channel === "whatsapp" ? "WhatsApp" : "Telegram"}`
          : `Atendimento com IA desativado no ${channel === "whatsapp" ? "WhatsApp" : "Telegram"}`,
        "success"
      );
      await loadStatus();
    } catch {
      addToast("Erro ao alterar atendimento com IA", "error");
    } finally {
      setWorking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONNECTED":
        return "success";
      case "DISCONNECTED":
        return "danger";
      case "RECONNECTING":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "CONNECTED":
        return "Conectado";
      case "DISCONNECTED":
        return "Desconectado";
      case "RECONNECTING":
        return "Reconectando...";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-32 rounded-lg bg-gray-200 dark:bg-slate-700 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 rounded-lg bg-gray-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-64 rounded-lg bg-gray-200 dark:bg-slate-700 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-8">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
              Erro ao carregar status
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400 mb-4">
              {error || "Dados não disponíveis"}
            </p>
            <Button variant="secondary" size="sm" onClick={loadStatus}>
              Tente novamente
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const isOnline = data.status === "CONNECTED";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {data.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie sua conexão WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={getStatusColor(data.status)}>
            <span
              className={`inline-block w-2 h-2 rounded-full mr-2 ${
                isOnline ? "bg-current animate-pulse" : ""
              }`}
            />
            {getStatusText(data.status)}
          </Badge>
          <Button
            onClick={() => void handleToggle()}
            disabled={working}
            loading={working}
            variant={isOnline ? "danger" : "primary"}
          >
            {isOnline ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Desconectar
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Conectar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section */}
        <Card className="lg:col-span-2">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Informações da Instância
              </h2>
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-800/50">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    ID
                  </p>
                  <p className="text-sm font-mono text-gray-900 dark:text-gray-100">{data.id}</p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-800/50">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Status
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                        isOnline
                          ? "bg-green-400 shadow-[0_0_14px_2px_rgba(74,222,128,0.7)] animate-pulse"
                          : "bg-gray-400 dark:bg-gray-500"
                      }`}
                    />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {getStatusText(data.status)}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-800/50">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Telegram
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      BOT ({data.telegram?.label ?? "Telegram"})
                    </span>
                    <Badge variant={data.telegram?.online ? "success" : "danger"}>
                      {data.telegram?.online ? "ONLINE" : "OFFLINE"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3 rounded-xl border border-slate-200/70 bg-white/70 p-4 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-800/50">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Atendimento com IA por canal
                  </p>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">WhatsApp</span>
                    </div>
                    <Button
                      size="sm"
                      variant={data.aiWhatsappEnabled ? "danger" : "secondary"}
                      onClick={() => void handleAiToggle("whatsapp")}
                      disabled={working}
                    >
                      {data.aiWhatsappEnabled ? "Desativar IA" : "Ativar IA"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Telegram</span>
                    </div>
                    <Button
                      size="sm"
                      variant={data.aiTelegramEnabled ? "danger" : "secondary"}
                      onClick={() => void handleAiToggle("telegram")}
                      disabled={working}
                    >
                      {data.aiTelegramEnabled ? "Desativar IA" : "Ativar IA"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* QR Code Section */}
        <Card
          header={
            <h3 className="font-semibold text-gray-900 dark:text-white">Conexão WhatsApp</h3>
          }
        >
          {isOnline ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center mb-3">
                <Smartphone className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Dispositivo Conectado
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sua instância está pronta para uso
              </p>
            </div>
          ) : data.qr ? (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-[0_14px_26px_-20px_rgba(15,23,42,0.6)] dark:border-slate-700/70 dark:bg-white">
                <QRCodeSVG
                  value={data.qr}
                  level="M"
                  includeMargin
                  size={256}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Escaneie este código com seu WhatsApp
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <QrCode className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Clique em &quot;Conectar&quot; para gerar o QR code
              </p>
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}


