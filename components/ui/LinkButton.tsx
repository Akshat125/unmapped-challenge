import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

// Button primitive rendered as an anchor. Shares visual vocabulary with
// <Button> so nav links and action buttons look identical when placed
// next to each other (e.g., Profile page: "Download JSON" button +
// "See opportunities" link).

type LinkButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type LinkButtonSize = 'sm' | 'md' | 'lg';

interface LinkButtonProps extends Omit<ComponentProps<typeof Link>, 'className'> {
  variant?: LinkButtonVariant;
  size?: LinkButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  className = '',
  children,
  ...props
}: LinkButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-wb-blue focus-visible:ring-offset-2';
  const sizes: Record<LinkButtonSize, string> = {
    sm: 'min-h-[36px] px-3 text-sm',
    md: 'min-h-[44px] px-4 text-sm',
    lg: 'min-h-[52px] px-6 text-base',
  };
  const variants: Record<LinkButtonVariant, string> = {
    primary: 'bg-wb-navy text-white hover:bg-wb-ink',
    secondary: 'border border-wb-navy bg-white text-wb-navy hover:bg-wb-sand',
    danger: 'border border-ys-coral bg-white text-ys-coral hover:bg-ys-coral/10',
    ghost: 'text-wb-ink/70 hover:text-wb-navy hover:bg-wb-sand',
  };
  return (
    <Link className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {Icon && <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />}
      <span>{children}</span>
      {IconRight && <IconRight className="h-4 w-4" strokeWidth={2} aria-hidden />}
    </Link>
  );
}
