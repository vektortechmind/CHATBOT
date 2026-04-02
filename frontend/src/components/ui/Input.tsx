import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-xl border border-slate-200/80 bg-white/75 px-4 py-2.5 text-slate-900 placeholder-slate-400 backdrop-blur-xl
              dark:border-slate-700/80 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder-slate-500
              focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-blue-400/80 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]
              disabled:bg-slate-100/70 disabled:text-slate-500 dark:disabled:bg-slate-900 dark:disabled:text-slate-500
              transition-all duration-200
              ${icon ? "pl-10" : ""}
              ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]" : ""}
              ${className || ""}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

