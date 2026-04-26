import { HTMLAttributes } from 'react';

export function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-lg border border-wb-line bg-white p-5 shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}
