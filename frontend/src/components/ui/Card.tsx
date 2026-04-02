import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, header, footer, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_14px_40px_-24px_rgba(15,23,42,0.45)] transition-all duration-300
          hover:shadow-[0_20px_56px_-30px_rgba(59,130,246,0.5)] dark:border-white/10 dark:bg-slate-900/65 dark:shadow-[0_24px_64px_-36px_rgba(2,6,23,0.95)]
          overflow-hidden
          ${className || ""}
        `}
        {...props}
      >
        {header && (
          <div className="px-6 py-4 border-b border-slate-200/70 dark:border-slate-700/70">
            {header}
          </div>
        )}
        <div className="px-6 py-4">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-200/70 bg-white/55 dark:border-slate-700/70 dark:bg-slate-800/30">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = "Card";

