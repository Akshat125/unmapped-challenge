import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const base = "rounded min-h-[44px] font-medium px-4 focus:outline-none focus:ring-2 focus:ring-wb-blue focus:ring-offset-2";
  const variants = {
    primary: "bg-wb-navy text-white hover:bg-wb-ink",
    secondary: "border border-wb-navy bg-white text-wb-navy hover:bg-wb-sand",
    danger: "border border-ys-coral bg-white text-ys-coral",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
