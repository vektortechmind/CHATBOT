import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Usar tema claro" : "Usar tema escuro"}
      title={isDark ? "Tema claro" : "Tema escuro"}
      className={`
        inline-flex items-center justify-center rounded-xl border border-slate-200/70 bg-white/75 p-2 text-slate-600
        hover:bg-white hover:text-slate-900 hover:shadow-[0_10px_30px_-20px_rgba(59,130,246,0.8)]
        dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100
        transition-all duration-200
        ${className}
      `}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
