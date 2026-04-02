import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { Login } from "./pages/Login";
import { Instancia } from "./pages/Instancia";
import { Agente } from "./pages/Agente";
import { Telegram } from "./pages/Telegram";
import { Apis } from "./pages/Apis";
import { Dashboard } from "./pages/Dashboard";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { ThemeProvider } from "./contexts/ThemeContext";

/** Layout único para rotas autenticadas — evita remontar Sidebar/Header a cada troca de página. */
const PrivateRoute = () => {
  const { user, loading, error } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Validando... espere</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50 dark:bg-slate-950">
        <div className="max-w-md p-6 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-red-700 dark:text-red-400">Erro de Conexão</h2>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <p><strong>Solução:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Verifique se o backend está rodando</li>
              <li>Execute: <code className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">npm run dev</code> na raiz</li>
              <li>Ou: <code className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">cd backend && npm run dev</code></li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-transparent">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/agent" element={<Navigate to="/agente" replace />} />
      <Route element={<PrivateRoute />}>
        <Route index element={<Instancia />} />
        <Route path="agente" element={<Agente />} />
        <Route path="telegram" element={<Telegram />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="settings" element={<Apis />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
