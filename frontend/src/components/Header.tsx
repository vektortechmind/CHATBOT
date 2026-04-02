import { Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { APP_VERSION } from "../version";

type HeaderProps = {
  onOpenMobileSidebar: () => void;
};

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  return (
    <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/55">
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Dashboard</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Painel de controle
              <span className="text-xs text-slate-400 dark:text-slate-500"> · v{APP_VERSION}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/75 text-slate-700 transition-all hover:bg-white dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300 lg:hidden"
            aria-label="Abrir menu lateral"
            title="Abrir menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
