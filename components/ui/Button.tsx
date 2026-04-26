import { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-wb-blue focus:ring-offset-2';
  const sizes: Record<ButtonSize, string> = {
    sm: 'min-h-[36px] px-3 text-sm',
    md: 'min-h-[44px] px-4 text-sm',
    lg: 'min-h-[52px] px-6 text-base',
  };
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-wb-navy text-white hover:bg-wb-ink',
    secondary: 'border border-wb-navy bg-white text-wb-navy hover:bg-wb-sand',
    danger: 'border border-ys-coral bg-white text-ys-coral hover:bg-ys-coral/10',
    ghost: 'text-wb-ink/70 hover:text-wb-navy hover:bg-wb-sand',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {Icon && <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />}
      <span>{children}</span>
      {IconRight && <IconRight className="h-4 w-4" strokeWidth={2} aria-hidden />}
    </button>
  );
}
