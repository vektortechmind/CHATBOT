import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-[0_10px_24px_-12px_rgba(79,70,229,0.85)] hover:from-blue-500 hover:to-violet-500 hover:shadow-[0_18px_32px_-16px_rgba(59,130,246,0.9)] focus:ring-blue-500",
        secondary:
          "border border-slate-200/80 bg-white/75 text-slate-800 backdrop-blur-xl hover:bg-white dark:border-slate-700/80 dark:bg-slate-800/65 dark:text-slate-100 dark:hover:bg-slate-700/70 focus:ring-slate-400",
        danger:
          "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-[0_10px_24px_-12px_rgba(225,29,72,0.85)] hover:from-rose-500 hover:to-red-500 focus:ring-rose-500",
        ghost:
          "text-slate-700 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:bg-slate-800/70 focus:ring-slate-400",
      },
      size: {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-2.5 text-sm",
        lg: "px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={loading || disabled}
        className={buttonVariants({ variant, size, className })}
        {...props}
      >
        {loading && (
          <span className="inline-block mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
