import { useState } from "react";
import { isAxiosError } from "axios";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock } from "lucide-react";
import { Navigate } from "react-router-dom";
import { APP_VERSION } from "../version";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { ThemeToggle } from "../components/ThemeToggle";

function loginErrorMessage(err: unknown): string {
  if (!isAxiosError(err)) {
    return "Erro inesperado ao entrar. Tente de novo.";
  }
  const status = err.response?.status;
  const serverMsg = err.response?.data as { error?: string } | undefined;

  if (status === 401) {
    return "Email ou senha incorretos.";
  }
  if (status === 400) {
    return "Dados inválidos. Verifique o formato do email.";
  }
  if (status === 429) {
    return "Muitas tentativas. Aguarde 1 minuto.";
  }

  if (!err.response) {
    const code = err.code;
    if (code === "ECONNREFUSED" || code === "ERR_NETWORK") {
      return "Não conseguiu conectar ao servidor. Verifique se o backend está rodando.";
    }
  }

  return serverMsg?.error ?? "Erro ao fazer login. Tente novamente.";
}

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(loginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/60 to-violet-50/70 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={"absolute top-0 left-1/4 w-96 h-96 bg-blue-400 opacity-20 dark:opacity-10 blur-3xl rounded-full"} />
        <div className={"absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400 opacity-20 dark:opacity-10 blur-3xl rounded-full"} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-[0_16px_34px_-18px_rgba(59,130,246,0.9)]">
              <span className="text-2xl font-bold text-white">🤖</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Nexus<span className="text-blue-600 dark:text-blue-400">ZAP</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Plataforma de Inteligência Artificial
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50/90 p-4 backdrop-blur-xl dark:border-red-900 dark:bg-red-950/40">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 border-t border-slate-200/70 pt-6 text-center dark:border-slate-700/70">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Acesso protegido por autenticação segura
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-6">
          © 2026 NexusZAP · v{APP_VERSION} — Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

