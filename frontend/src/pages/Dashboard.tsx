import { useEffect, useState } from "react";
import { api } from "../lib/axios";
import { MessageSquare, FileText, Calendar, Inbox } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useToast } from "../contexts/ToastContext";

type MessageStats = {
  date: string;
  channel: "WHATSAPP" | "TELEGRAM";
  count: number;
};

type FilterStats = {
  messages: MessageStats[];
  totalFiles: number;
};

export function Dashboard() {
  const [stats, setStats] = useState<FilterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [channel, setChannel] = useState<string>("all");
  const { addToast } = useToast();

  // Definir datas padrão (últimos 7 dias)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    
    setEndDate(end.toISOString().split("T")[0]);
    setStartDate(start.toISOString().split("T")[0]);
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (channel && channel !== "all") params.append("channel", channel);
      
      const res = await api.get<FilterStats>(`/dashboard/stats?${params.toString()}`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
      addToast("Erro ao carregar estatísticas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStats();
  }, []);

  const handleFilter = () => {
    void loadStats();
    addToast("Filtros aplicados", "success");
  };

  const totalMessages = stats?.messages.reduce((sum, m) => sum + m.count, 0) ?? 0;

  // Agrupar mensagens por canal
  const whatsappMessages = stats?.messages.filter(m => m.channel === "WHATSAPP").reduce((sum, m) => sum + m.count, 0) ?? 0;
  const telegramMessages = stats?.messages.filter(m => m.channel === "TELEGRAM").reduce((sum, m) => sum + m.count, 0) ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Visão geral das mensagens e arquivos</p>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm text-slate-900 outline-none backdrop-blur-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/80 dark:border-slate-700/80 dark:bg-slate-900/50 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm text-slate-900 outline-none backdrop-blur-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/80 dark:border-slate-700/80 dark:bg-slate-900/50 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Canal
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm text-slate-900 outline-none backdrop-blur-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/80 dark:border-slate-700/80 dark:bg-slate-900/50 dark:text-slate-100"
            >
              <option value="all">Todos os canais</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="TELEGRAM">Telegram</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleFilter}
              disabled={loading}
              loading={loading}
              className="w-full"
            >
              Filtrar
            </Button>
          </div>
        </div>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-200 dark:bg-slate-700 animate-pulse" />
          ))
        ) : (
          <>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total de Mensagens</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalMessages}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                  <Inbox className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">WhatsApp</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{whatsappMessages}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center">
                  <Inbox className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Telegram</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{telegramMessages}</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Card de Arquivos */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center">
            <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total de Arquivos</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalFiles ?? 0}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
