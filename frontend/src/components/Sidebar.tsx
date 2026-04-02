import { Link, useLocation } from "react-router-dom";
import { Bot, Boxes, KeyRound, LayoutDashboard, LogOut, Send, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { APP_VERSION } from "../version";

type SidebarProps = {
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { pathname } = useLocation();
  const { logout } = useAuth();

  const navs = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Instâncias", path: "/", icon: <Boxes size={20} /> },
    { name: "Agente IA", path: "/agente", icon: <Bot size={20} /> },
    { name: "Telegram IA", path: "/telegram", icon: <Send size={20} /> },
    { name: "Configurações", path: "/settings", icon: <KeyRound size={20} /> },
  ];

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/45 backdrop-blur-[2px] lg:hidden"
          onClick={onCloseMobile}
          aria-label="Fechar menu lateral"
        />
      )}
      <aside
        className={`group fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200/70 bg-white/72 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/55 flex flex-col transition-all duration-300 lg:static lg:translate-x-0 lg:w-20 lg:hover:w-64 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      {/* Logo */}
      <div className="border-b border-slate-200/70 p-4 dark:border-slate-800/80 lg:px-3 lg:group-hover:p-6">
        <div className="flex items-center gap-3 lg:justify-center lg:group-hover:justify-start">
          <button
            type="button"
            onClick={onCloseMobile}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/70 text-slate-600 dark:border-slate-700/70 dark:text-slate-300 lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={16} />
          </button>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-[0_14px_30px_-16px_rgba(79,70,229,0.95)]">
            <Bot className="text-white" size={24} />
          </div>
          <div className="overflow-hidden transition-all duration-300 lg:max-w-0 lg:opacity-0 lg:group-hover:max-w-[140px] lg:group-hover:opacity-100">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Nexus<span className="text-blue-500 dark:text-blue-400">ZAP</span>
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">IA Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2 lg:px-2 lg:group-hover:px-4 transition-all duration-300">
        {navs.map((nav) => {
          const isActive = nav.path === "/" ? pathname === "/" : pathname.startsWith(nav.path);
          return (
            <Link
              key={nav.path}
              to={nav.path}
              onClick={onCloseMobile}
              title={nav.name}
              className={`
                relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 lg:justify-center lg:group-hover:justify-start
                ${
                  isActive
                    ? "bg-blue-50/85 text-blue-700 border border-blue-200/80 shadow-[0_10px_24px_-20px_rgba(59,130,246,0.9)] dark:bg-blue-950/35 dark:text-blue-300 dark:border-blue-800/60"
                    : "text-slate-700 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/70"
                }
              `}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-px -translate-y-1/2 rounded-r-full bg-gradient-to-b from-blue-500 to-violet-500 shadow-[0_0_10px_1px_rgba(99,102,241,0.42)]" />
              )}
              <span className={`shrink-0 ${isActive ? "text-blue-600 dark:text-blue-300" : ""}`}>
                {nav.icon}
              </span>
              <span className="font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 lg:max-w-0 lg:opacity-0 lg:translate-x-1 lg:group-hover:max-w-[170px] lg:group-hover:opacity-100 lg:group-hover:translate-x-0">
                {nav.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200/70 dark:border-slate-800/80 space-y-3">
        <p
          className="text-[10px] text-center text-slate-400 dark:text-slate-500 tabular-nums"
          title={`Versão ${APP_VERSION}`}
        >
          v{APP_VERSION}
        </p>
        <button
          onClick={() => {
            onCloseMobile();
            logout();
          }}
          title="Sair"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50/85 dark:hover:bg-red-950/40 dark:text-red-400 transition-all lg:justify-center lg:group-hover:justify-start"
        >
          <LogOut size={18} className="shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 lg:max-w-0 lg:opacity-0 lg:translate-x-1 lg:group-hover:max-w-[90px] lg:group-hover:opacity-100 lg:group-hover:translate-x-0">
            Sair
          </span>
        </button>
      </div>
      </aside>
    </>
  );
}
