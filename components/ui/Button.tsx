import type { ButtonHTMLAttributes, ReactNode } from "react";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};
export default function Button({ children, variant = "primary", className = "", ...props }: Props) {
  const styles = {
    primary: "btn-festive",
    secondary: "bg-gold text-on-primary hover:bg-accent",
    ghost: "border border-primary/25 text-ink hover:bg-[var(--background-warm)]",
  };
  return (
    <button
      className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
