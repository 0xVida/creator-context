import { ReactNode } from "react";

interface PillBadgeProps {
  children: ReactNode;
  variant?: "default" | "primary" | "muted";
  className?: string;
}

const PillBadge = ({ children, variant = "default", className = "" }: PillBadgeProps) => {
  const variants = {
    default: "pill-badge",
    primary: "pill-badge pill-badge-primary",
    muted: "pill-badge opacity-60",
  };

  return (
    <span className={`${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default PillBadge;
